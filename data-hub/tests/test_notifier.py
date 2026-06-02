"""Tests for the alert notifier (FIX 1, TDD).

Written BEFORE the implementation. ``send_alert`` must be fully fail-soft:
it always logs, optionally POSTs to a Slack-compatible webhook when
``DATA_HUB_ALERT_WEBHOOK`` is set, and best-effort fires a macOS
notification -- but a failure in any of those must never raise to the caller.

Everything that touches the outside world (``requests`` + ``subprocess``) is
mocked, so no test performs real HTTP or spawns a real process.
"""

from __future__ import annotations

from unittest import mock

from monitoring import notifier


def test_no_webhook_does_not_post(monkeypatch):
    """With no DATA_HUB_ALERT_WEBHOOK set, requests.post is never called."""
    monkeypatch.delenv("DATA_HUB_ALERT_WEBHOOK", raising=False)
    with mock.patch("monitoring.notifier.requests.post") as post, \
            mock.patch("monitoring.notifier.subprocess.run"):
        notifier.send_alert("something happened")
    post.assert_not_called()


def test_webhook_set_posts_json(monkeypatch):
    """With the webhook env set, a Slack-compatible JSON payload is POSTed."""
    monkeypatch.setenv("DATA_HUB_ALERT_WEBHOOK", "https://hooks.example/abc")
    with mock.patch("monitoring.notifier.requests.post") as post, \
            mock.patch("monitoring.notifier.subprocess.run"):
        notifier.send_alert("ingest failed", level="critical")

    post.assert_called_once()
    args, kwargs = post.call_args
    assert args[0] == "https://hooks.example/abc"
    assert kwargs["json"] == {"text": "ingest failed"}


def test_post_error_never_raises(monkeypatch):
    """A requests error is swallowed -- send_alert must never raise."""
    monkeypatch.setenv("DATA_HUB_ALERT_WEBHOOK", "https://hooks.example/abc")
    with mock.patch(
        "monitoring.notifier.requests.post",
        side_effect=RuntimeError("network down"),
    ), mock.patch("monitoring.notifier.subprocess.run"):
        # Must not raise.
        notifier.send_alert("boom")


def test_subprocess_error_never_raises(monkeypatch):
    """A subprocess (osascript) error is swallowed too."""
    monkeypatch.delenv("DATA_HUB_ALERT_WEBHOOK", raising=False)
    with mock.patch(
        "monitoring.notifier.subprocess.run",
        side_effect=OSError("osascript missing"),
    ):
        notifier.send_alert("boom")


def test_logs_error_for_critical(monkeypatch, caplog):
    """Critical alerts log at ERROR; other levels at WARNING."""
    monkeypatch.delenv("DATA_HUB_ALERT_WEBHOOK", raising=False)
    with mock.patch("monitoring.notifier.subprocess.run"):
        with caplog.at_level("WARNING"):
            notifier.send_alert("critical message", level="critical")
        assert any(
            rec.levelname == "ERROR" and "critical message" in rec.getMessage()
            for rec in caplog.records
        )
