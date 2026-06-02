"""Alert notifier for the Content Trend Data Hub.

When the daily ingest, the backfill, or the health check detects a failure,
the operator needs to *know* -- a non-zero exit code alone is invisible if
nobody is watching the launchd logs. :func:`send_alert` makes failures
visible through up to three channels, all fully fail-soft:

1. **Logging** (always). ERROR for ``critical`` level, WARNING otherwise.
2. **Webhook** (if ``DATA_HUB_ALERT_WEBHOOK`` is set). POSTs a
   Slack-compatible JSON payload ``{"text": message}`` via ``requests``.
3. **macOS notification** (best effort). Fires ``osascript -e 'display
   notification ...'`` so a desktop operator sees a banner.

The cardinal rule: a notifier error must NEVER crash the caller. Every
outbound channel is wrapped so a missing ``osascript``, a dead webhook, or a
network blip is logged and swallowed, never re-raised. The pipeline's job is
to ingest content; alerting is strictly best-effort on top.
"""

from __future__ import annotations

import logging
import os
import subprocess

import requests

logger = logging.getLogger("monitoring.notifier")

# Environment variable holding a Slack-compatible incoming webhook URL.
_WEBHOOK_ENV = "DATA_HUB_ALERT_WEBHOOK"

# Timeout for the webhook POST so a hung endpoint can't stall the caller.
_WEBHOOK_TIMEOUT_SECONDS = 10


def send_alert(message: str, level: str = "warning") -> None:
    """Surface ``message`` through logging, an optional webhook, and macOS.

    Parameters
    ----------
    message:
        Human-readable alert text.
    level:
        ``"critical"`` logs at ERROR and titles the desktop banner
        accordingly; any other value logs at WARNING.

    Fully fail-soft: no channel error ever propagates to the caller.
    """
    # 1. Always log. This is the one channel that cannot fail.
    if level == "critical":
        logger.error("ALERT [critical]: %s", message)
    else:
        logger.warning("ALERT [%s]: %s", level, message)

    # 2. Webhook (Slack-compatible), only when configured.
    webhook = os.environ.get(_WEBHOOK_ENV)
    if webhook:
        try:
            requests.post(
                webhook,
                json={"text": message},
                timeout=_WEBHOOK_TIMEOUT_SECONDS,
            )
        except Exception as exc:  # noqa: BLE001 -- alerting must never crash
            logger.warning("Alert webhook POST failed (ignored): %s", exc)

    # 3. macOS desktop notification, best effort.
    try:
        title = "Content Hub" if level != "critical" else "Content Hub CRITICAL"
        # Escape embedded double quotes so the AppleScript string stays valid.
        safe_message = message.replace('"', '\\"')
        safe_title = title.replace('"', '\\"')
        script = f'display notification "{safe_message}" with title "{safe_title}"'
        subprocess.run(
            ["osascript", "-e", script],
            check=False,
            capture_output=True,
            timeout=_WEBHOOK_TIMEOUT_SECONDS,
        )
    except Exception as exc:  # noqa: BLE001 -- osascript may be unavailable
        logger.debug("macOS notification skipped (ignored): %s", exc)
