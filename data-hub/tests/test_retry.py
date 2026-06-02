"""Tests for the fetch retry helper (FIX 4, TDD).

The helper retries a callable up to N attempts with backoff. The backoff
``sleep`` is injectable so tests never sleep real seconds.
"""

from __future__ import annotations

from unittest import mock

from collectors.retry import retry_call


def test_succeeds_first_try():
    fn = mock.Mock(return_value="ok")
    sleeps = []
    result = retry_call(fn, attempts=3, backoff_seconds=0, sleep=sleeps.append)
    assert result == "ok"
    assert fn.call_count == 1
    assert sleeps == []  # no retry, no sleep


def test_retries_then_succeeds():
    """Fails N-1 times then succeeds -> returns the success value."""
    fn = mock.Mock(side_effect=[RuntimeError("x"), RuntimeError("y"), "ok"])
    sleeps = []
    result = retry_call(fn, attempts=3, backoff_seconds=2, sleep=sleeps.append)
    assert result == "ok"
    assert fn.call_count == 3
    # Slept between the two failures (2 sleeps), never a real time.sleep.
    assert len(sleeps) == 2


def test_gives_up_returns_fallback():
    """Always fails -> returns the configured fallback, does not raise."""
    fn = mock.Mock(side_effect=RuntimeError("always"))
    sleeps = []
    result = retry_call(
        fn, attempts=3, backoff_seconds=1, sleep=sleeps.append,
        fallback="FALLBACK",
    )
    assert result == "FALLBACK"
    assert fn.call_count == 3


def test_default_fallback_is_none():
    fn = mock.Mock(side_effect=ValueError("boom"))
    result = retry_call(fn, attempts=2, backoff_seconds=0, sleep=lambda s: None)
    assert result is None
    assert fn.call_count == 2


def test_backoff_grows_each_attempt():
    """Backoff is multiplied per retry (exponential-ish), all via injected sleep."""
    fn = mock.Mock(side_effect=[RuntimeError(), RuntimeError(), "ok"])
    sleeps = []
    retry_call(fn, attempts=3, backoff_seconds=1, sleep=sleeps.append)
    # First retry waits base, second waits more.
    assert sleeps[0] < sleeps[1]
