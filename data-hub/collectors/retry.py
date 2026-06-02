"""Retry/backoff helper for collector HTTP fetches.

``sources.yaml`` advertises ``retry_attempts`` / ``retry_backoff_seconds`` but
nothing honoured them: a transient timeout or 5xx killed a source's whole run
for the day. :func:`retry_call` wraps a fetch so a flaky network gets a few
attempts with growing backoff before giving up.

Two design points matter for the rest of the codebase:

* **Fail-soft.** When every attempt fails it returns ``fallback`` (default
  ``None``) rather than raising, so a dead source never crashes the pipeline.
* **Testable backoff.** The ``sleep`` callable is injectable (and
  ``backoff_seconds=0`` skips waiting entirely), so tests exercise the retry
  loop without ever sleeping real seconds.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Callable, Optional

logger = logging.getLogger("collectors.retry")

# Conservative defaults: 3 attempts, a small base backoff. Real callers can
# override from sources.yaml's retry_attempts / retry_backoff_seconds.
DEFAULT_ATTEMPTS = 3
DEFAULT_BACKOFF_SECONDS = 2.0


def retry_call(
    func: Callable[[], Any],
    attempts: int = DEFAULT_ATTEMPTS,
    backoff_seconds: float = DEFAULT_BACKOFF_SECONDS,
    sleep: Optional[Callable[[float], None]] = None,
    exceptions: tuple = (Exception,),
    fallback: Optional[Any] = None,
) -> Any:
    """Call ``func`` with retry + backoff, returning ``fallback`` if it never
    succeeds.

    Parameters
    ----------
    func:
        Zero-argument callable to attempt (wrap args with a lambda).
    attempts:
        Maximum number of tries (>= 1).
    backoff_seconds:
        Base wait between tries. The wait grows each retry (attempt 1 -> base,
        attempt 2 -> 2*base, ...). ``0`` disables waiting.
    sleep:
        Sleep function, injected so tests don't wait real seconds.
    exceptions:
        Exception types that trigger a retry. Anything else propagates.
    fallback:
        Value returned when all attempts fail (default ``None``).
    """
    # Resolve the sleep function at call time (not as a default arg) so tests
    # can patch ``collectors.retry.time.sleep`` and never wait real seconds.
    if sleep is None:
        sleep = time.sleep

    attempts = max(1, attempts)
    last_exc: Optional[BaseException] = None

    for attempt in range(1, attempts + 1):
        try:
            return func()
        except exceptions as exc:  # noqa: BLE001 -- retry on configured errors
            last_exc = exc
            if attempt < attempts:
                wait = backoff_seconds * attempt
                logger.warning(
                    "Attempt %d/%d failed (%s); retrying in %.1fs",
                    attempt, attempts, exc, wait,
                )
                if wait > 0:
                    sleep(wait)
            else:
                logger.warning(
                    "All %d attempt(s) failed (%s); giving up",
                    attempts, exc,
                )

    logger.debug("retry_call exhausted; returning fallback (last error: %s)",
                 last_exc)
    return fallback
