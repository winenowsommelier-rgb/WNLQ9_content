"""Tests for the pipeline health monitoring (Task 10, TDD).

Written BEFORE the implementation. ``HealthCheck`` inspects the live state
of the pipeline -- the Articles worksheet (via the injected exporter's
Sheets service) and the ``logs/ingest.log`` file -- and reports whether the
system is healthy, in a warning state, or critical.

Everything that touches the outside world is mocked:

* The Google Sheets API is reached through the exporter's ``_get_service``
  seam, exactly as in :mod:`exporters.sheets_exporter`. Tests inject a fake
  exporter whose service returns canned rows, so no credentials or network
  access are ever required.
* The filesystem (log file mtime / existence) is monkeypatched.
* ``reference_time`` is injected everywhere a "now" is needed, so the
  time-based checks are fully deterministic.
"""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest

import monitoring.health_check as health_module
from exporters.sheets_exporter import SheetsExporter
from monitoring.health_check import HealthCheck


SHEET_ID = "test-sheet-id-123"

# Fixed "now" used by every time-based test. UTC, matches the ISO 8601
# Collected Date values the exporter writes.
NOW = datetime(2026, 6, 1, 12, 0, 0, tzinfo=timezone.utc)


# -- helpers ---------------------------------------------------------------


def _iso(dt: datetime) -> str:
    """Render a datetime exactly like the exporter stores Collected Date."""
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _make_exporter_with_rows(rows):
    """Build a HealthCheck-ready exporter whose Sheets ``get`` returns rows.

    ``rows`` is the full values block returned by the API, including the
    header row as row 0 (mirroring how the real sheet is laid out).
    """
    exporter = SheetsExporter(
        sheet_id=SHEET_ID, credentials_path="config/does-not-exist.json"
    )
    service = MagicMock()
    get = service.spreadsheets.return_value.values.return_value.get
    get.return_value.execute.return_value = {"values": rows}
    # Patch the seam so no real credentials are ever needed.
    exporter._get_service = MagicMock(return_value=service)
    return exporter, get


def _header():
    return list(SheetsExporter.COLUMNS)


def _row(*, title="A Title", url="https://example.com/a", region="France",
         aeo="high", collected=None):
    """Build one Articles row in COLUMNS order with sensible defaults."""
    if collected is None:
        collected = _iso(NOW)
    row = [""] * len(SheetsExporter.COLUMNS)
    cols = SheetsExporter.COLUMNS
    row[cols.index("Title")] = title
    row[cols.index("URL")] = url
    row[cols.index("Region")] = region
    row[cols.index("AEO Value")] = aeo
    row[cols.index("Collected Date")] = collected
    return row


# -- date parsing (FIX 3: serials + ISO) -----------------------------------


def test_parse_date_serial_number():
    """A numeric Sheets date serial converts to the correct UTC datetime."""
    # 46174.5 -> 2026-06-01 12:00 UTC (epoch 1899-12-30 + 46174.5 days).
    dt = HealthCheck._parse_iso(46174.5)
    assert dt is not None
    assert dt.year == 2026
    assert dt.month == 6
    assert dt.day == 1
    assert dt.hour == 12
    assert dt.tzinfo is not None


def test_parse_date_integer_serial():
    dt = HealthCheck._parse_iso(46174)
    assert dt is not None
    assert (dt.year, dt.month, dt.day) == (2026, 6, 1)


def test_parse_date_iso_string_still_works():
    dt = HealthCheck._parse_iso("2026-06-01T12:00:00Z")
    assert dt is not None
    assert dt.year == 2026 and dt.hour == 12


def test_parse_date_garbage_returns_none():
    assert HealthCheck._parse_iso("not a date") is None
    assert HealthCheck._parse_iso("") is None
    assert HealthCheck._parse_iso(None) is None


def test_check_recent_articles_uses_unformatted_value():
    """The Articles read requests UNFORMATTED_VALUE so serials come through."""
    rows = [_header()] + [_row() for _ in range(6)]
    exporter, get = _make_exporter_with_rows(rows)
    hc = HealthCheck(exporter=exporter)
    hc.check_recent_articles(reference_time=NOW)
    _, kwargs = get.call_args
    assert kwargs.get("valueRenderOption") == "UNFORMATTED_VALUE"


def test_check_recent_articles_counts_serial_dated_row():
    """A row whose Collected Date is a numeric serial counts as recent."""
    # 46174.5 == NOW (2026-06-01 12:00 UTC); add enough to clear the threshold.
    serial_now = 46174.5
    rows = [_header()] + [_row(collected=serial_now) for _ in range(6)]
    exporter, _ = _make_exporter_with_rows(rows)
    hc = HealthCheck(exporter=exporter)

    result = hc.check_recent_articles(reference_time=NOW)

    assert result["status"] == "healthy"
    assert result["recent_count"] == 6


# -- construction ----------------------------------------------------------


def test_constructs_without_credentials():
    # __init__ must not touch credentials, the network, or the filesystem.
    hc = HealthCheck(sheet_id=SHEET_ID)
    assert hc.sheet_id == SHEET_ID
    # An exporter is available (lazily) but no service has been built.
    assert hc.exporter is not None


def test_constructs_with_injected_exporter():
    exporter, _ = _make_exporter_with_rows([_header()])
    hc = HealthCheck(exporter=exporter)
    assert hc.exporter is exporter


# -- check_recent_articles -------------------------------------------------


def test_check_recent_articles_healthy():
    # 8 rows all collected within the last few hours -> healthy.
    rows = [_header()]
    for i in range(8):
        rows.append(_row(collected=_iso(NOW.replace(hour=12 - i % 6))))
    exporter, get = _make_exporter_with_rows(rows)
    hc = HealthCheck(exporter=exporter)

    result = hc.check_recent_articles(reference_time=NOW)

    assert result["status"] == "healthy"
    assert result["recent_count"] == 8
    assert result["total_count"] == 8
    # Reads the Articles tab over the full column range (derived from the
    # exporter's COLUMNS, now A:P with the Thailand Focus column).
    _, kwargs = get.call_args
    assert "Articles!A:P" in kwargs["range"]


def test_check_recent_articles_warning():
    # Only 1 recent row; the rest are well outside the window -> warning.
    old = _iso(datetime(2026, 5, 1, tzinfo=timezone.utc))
    rows = [_header(), _row(collected=_iso(NOW)), _row(collected=old),
            _row(collected=old)]
    exporter, _ = _make_exporter_with_rows(rows)
    hc = HealthCheck(exporter=exporter)

    result = hc.check_recent_articles(hours_back=26, reference_time=NOW)

    assert result["status"] == "warning"
    assert result["recent_count"] == 1
    assert result["total_count"] == 3


def test_check_recent_articles_handles_api_error():
    # Service blows up -> the check reports an error, never raises.
    exporter = SheetsExporter(
        sheet_id=SHEET_ID, credentials_path="config/does-not-exist.json"
    )
    service = MagicMock()
    service.spreadsheets.return_value.values.return_value.get.side_effect = (
        RuntimeError("boom")
    )
    exporter._get_service = MagicMock(return_value=service)
    hc = HealthCheck(exporter=exporter)

    result = hc.check_recent_articles(reference_time=NOW)

    assert result["status"] == "error"
    assert "boom" in result["error"]


# -- check_log_freshness ---------------------------------------------------


def test_check_log_freshness_missing_file(tmp_path):
    hc = HealthCheck(sheet_id=SHEET_ID, log_dir=str(tmp_path))
    # tmp_path has no ingest.log.
    result = hc.check_log_freshness(reference_time=NOW)
    assert result["status"] == "warning"
    assert "not found" in result["reason"].lower()


def test_check_log_freshness_recent(tmp_path):
    log_path = tmp_path / "ingest.log"
    log_path.write_text("a log line\n")
    hc = HealthCheck(sheet_id=SHEET_ID, log_dir=str(tmp_path))

    # Modified one hour ago -> healthy. Monkeypatch mtime deterministically.
    recent = NOW.timestamp() - 3600
    with patch("os.path.getmtime", return_value=recent):
        result = hc.check_log_freshness(reference_time=NOW)

    assert result["status"] == "healthy"
    assert result["hours_since"] == pytest.approx(1.0, abs=0.01)


def test_check_log_freshness_stale(tmp_path):
    log_path = tmp_path / "ingest.log"
    log_path.write_text("a log line\n")
    hc = HealthCheck(sheet_id=SHEET_ID, log_dir=str(tmp_path))

    # Modified 48h ago -> stale -> warning.
    stale = NOW.timestamp() - 48 * 3600
    with patch("os.path.getmtime", return_value=stale):
        result = hc.check_log_freshness(reference_time=NOW)

    assert result["status"] == "warning"
    assert result["hours_since"] == pytest.approx(48.0, abs=0.01)


# -- check_data_quality ----------------------------------------------------


def test_check_data_quality_clean():
    rows = [_header(), _row(), _row(title="Another", url="https://ex.com/b")]
    exporter, _ = _make_exporter_with_rows(rows)
    hc = HealthCheck(exporter=exporter)

    result = hc.check_data_quality()

    assert result["status"] == "healthy"
    assert result["issues"] == []
    assert result["checked"] == 2


def test_check_data_quality_detects_missing_fields():
    # One row missing Title, one missing URL.
    rows = [
        _header(),
        _row(title=""),
        _row(url=""),
        _row(),
    ]
    exporter, _ = _make_exporter_with_rows(rows)
    hc = HealthCheck(exporter=exporter)

    result = hc.check_data_quality()

    assert result["status"] == "warning"
    blob = " ".join(result["issues"]).lower()
    assert "title" in blob
    assert "url" in blob
    assert result["checked"] == 3


def test_check_data_quality_detects_missing_categorization():
    # Rows present required fields but lack Region / AEO Value.
    rows = [
        _header(),
        _row(region=""),
        _row(aeo=""),
    ]
    exporter, _ = _make_exporter_with_rows(rows)
    hc = HealthCheck(exporter=exporter)

    result = hc.check_data_quality()

    assert result["status"] == "warning"
    blob = " ".join(result["issues"]).lower()
    assert "region" in blob
    assert "aeo" in blob


# -- run_all_checks --------------------------------------------------------


def test_run_all_checks_aggregates_healthy(tmp_path):
    rows = [_header()] + [_row() for _ in range(8)]
    exporter, _ = _make_exporter_with_rows(rows)
    log_path = tmp_path / "ingest.log"
    log_path.write_text("ok\n")
    hc = HealthCheck(exporter=exporter, log_dir=str(tmp_path))

    recent = NOW.timestamp() - 3600
    with patch("os.path.getmtime", return_value=recent):
        result = hc.run_all_checks(reference_time=NOW)

    assert result["overall"] == "healthy"
    assert set(result["checks"]) == {
        "recent_articles", "log_freshness", "data_quality"
    }
    assert result["timestamp"] == _iso(NOW)


def test_run_all_checks_one_warning_makes_overall_warning(tmp_path):
    # Plenty of recent articles + clean data, but the log is missing ->
    # one warning -> overall warning.
    rows = [_header()] + [_row() for _ in range(8)]
    exporter, _ = _make_exporter_with_rows(rows)
    hc = HealthCheck(exporter=exporter, log_dir=str(tmp_path))  # no log file

    result = hc.run_all_checks(reference_time=NOW)

    assert result["overall"] == "warning"
    assert result["checks"]["log_freshness"]["status"] == "warning"


def test_run_all_checks_error_makes_overall_critical(tmp_path):
    # The Sheets read errors -> recent_articles + data_quality error ->
    # overall critical.
    exporter = SheetsExporter(
        sheet_id=SHEET_ID, credentials_path="config/does-not-exist.json"
    )
    service = MagicMock()
    service.spreadsheets.return_value.values.return_value.get.side_effect = (
        RuntimeError("sheets down")
    )
    exporter._get_service = MagicMock(return_value=service)
    log_path = tmp_path / "ingest.log"
    log_path.write_text("ok\n")
    hc = HealthCheck(exporter=exporter, log_dir=str(tmp_path))

    recent = NOW.timestamp() - 3600
    with patch("os.path.getmtime", return_value=recent):
        result = hc.run_all_checks(reference_time=NOW)

    assert result["overall"] == "critical"


# -- main() alerting (FIX 1) -------------------------------------------------


def test_main_alerts_on_critical(monkeypatch):
    """main() sends a critical alert and exits 1 when overall is critical."""
    checker = MagicMock()
    checker.run_all_checks.return_value = {
        "overall": "critical", "checks": {}, "timestamp": _iso(NOW),
    }
    monkeypatch.setattr(health_module, "HealthCheck", lambda *a, **k: checker)
    monkeypatch.setenv("DATA_HUB_SHEET_ID", "abc")
    with patch("monitoring.notifier.send_alert") as alert:
        rc = health_module.main([])
    assert rc == 1
    alert.assert_called_once()
    assert alert.call_args.kwargs.get("level") == "critical"


def test_main_no_alert_when_healthy(monkeypatch):
    """main() does not alert and exits 0 when overall is healthy."""
    checker = MagicMock()
    checker.run_all_checks.return_value = {
        "overall": "healthy", "checks": {}, "timestamp": _iso(NOW),
    }
    monkeypatch.setattr(health_module, "HealthCheck", lambda *a, **k: checker)
    monkeypatch.setenv("DATA_HUB_SHEET_ID", "abc")
    with patch("monitoring.notifier.send_alert") as alert:
        rc = health_module.main([])
    assert rc == 0
    alert.assert_not_called()
