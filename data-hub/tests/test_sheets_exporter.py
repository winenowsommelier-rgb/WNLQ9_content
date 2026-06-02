"""Tests for SheetsExporter (Task 6, TDD).

Written BEFORE the implementation. The exporter pushes processed articles
into Google Sheets, the chosen storage hub. The Google Sheets API is
mocked entirely: ``_get_service`` is the seam, so no real credentials or
network access are ever required.
"""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from exporters.sheets_exporter import SheetsExporter


SHEET_ID = "test-sheet-id-123"


@pytest.fixture
def exporter():
    # Construct without real credentials -- __init__ must NOT connect.
    return SheetsExporter(sheet_id=SHEET_ID, credentials_path="config/does-not-exist.json")


@pytest.fixture
def full_article():
    return {
        "source_name": "Decanter",
        "title": "Bordeaux 2024: A Buying Guide",
        "article_url": "https://www.decanter.com/articles/bordeaux-2024",
        "published_date": "2024-05-15T09:30:00Z",
        "author": "Jane Anson",
        "content_excerpt": "A guide to the 2024 Bordeaux en primeur campaign.",
        "content_type": "guide",
        "topic_region": "France",
        "spirits_type": None,
        "trend_signals": ["emerging_region", "award_winning"],
        "primary_category": "wine",
        "buyer_persona": "enthusiast",
        "aeo_citation_opportunity": "high",
        "collected_date": "2024-05-16T14:22:00Z",
        "source_language": "en",
    }


def _make_mock_service(existing_tabs=("Articles",), tab_rows=1, empty_shape="real"):
    """Build a mock googleapiclient service whose API calls are tracked.

    - ``existing_tabs``: tab titles reported by spreadsheets().get() metadata.
    - ``tab_rows``: number of existing data rows the target tab reports via
      values().get() (0 => empty tab => auto-header expected).
    - ``empty_shape``: how an empty tab (tab_rows == 0) is modelled by the
      values().get() probe. ``"real"`` reproduces the REAL Sheets API, which
      OMITS the ``values`` key entirely for an empty range; ``"values_list"``
      uses the synthetic ``{"values": []}`` shape the real API never returns.

    Returns ``(service, calls)`` where ``calls`` exposes append/get/batchUpdate.
    """
    service = MagicMock()
    spreadsheets = service.spreadsheets.return_value

    # values().append(...).execute()
    append = spreadsheets.values.return_value.append
    append.return_value.execute.return_value = {"updates": {"updatedRows": 1}}

    # spreadsheets().get(...).execute() -> metadata with sheet titles
    meta_get = spreadsheets.get
    meta_get.return_value.execute.return_value = {
        "sheets": [
            {"properties": {"title": title}} for title in existing_tabs
        ]
    }

    # values().get(...).execute() -> emptiness probe of the target tab.
    # The REAL Sheets API omits the 'values' key entirely for an empty range,
    # so model that by default; only populated ranges carry a 'values' list.
    values_get = spreadsheets.values.return_value.get
    if tab_rows == 0 and empty_shape == "real":
        probe = {"range": "Articles!A1", "majorDimension": "ROWS"}
    else:
        probe = {
            "range": "Articles!A1",
            "majorDimension": "ROWS",
            "values": [["x"]] * tab_rows,
        }
    values_get.return_value.execute.return_value = probe

    # spreadsheets().batchUpdate(...).execute()
    batch_update = spreadsheets.batchUpdate
    batch_update.return_value.execute.return_value = {}

    calls = SimpleNamespace(
        append=append,
        meta_get=meta_get,
        values_get=values_get,
        batch_update=batch_update,
    )
    return service, calls


def _make_legacy_mock_service():
    """Back-compat shim returning (service, append) like the original helper."""
    service, calls = _make_mock_service()
    return service, calls.append


def test_format_article_row_orders_fields(exporter, full_article):
    row = exporter.format_article_row(full_article)
    assert row == [
        "Decanter",
        "Bordeaux 2024: A Buying Guide",
        "https://www.decanter.com/articles/bordeaux-2024",
        "2024-05-15 09:30:00",  # Gap C: ISO datetime -> Sheets-native
        "Jane Anson",
        "A guide to the 2024 Bordeaux en primeur campaign.",
        "guide",
        "France",
        "",  # spirits_type was None
        "emerging_region | award_winning",
        "wine",
        "enthusiast",
        "high",
        "2024-05-16 14:22:00",  # Gap C: ISO datetime -> Sheets-native
        "en",
    ]
    assert len(row) == len(SheetsExporter.COLUMNS)


def test_format_article_row_joins_trend_signals(exporter):
    article = {"trend_signals": ["a", "b"]}
    row = exporter.format_article_row(article)
    idx = SheetsExporter.COLUMNS.index("Trend Signals")
    assert row[idx] == "a | b"


def test_format_article_row_handles_missing_fields(exporter):
    article = {"title": "Sparse Article"}
    row = exporter.format_article_row(article)
    # Correct length, no crash, missing fields become empty strings.
    assert len(row) == len(SheetsExporter.COLUMNS)
    title_idx = SheetsExporter.COLUMNS.index("Title")
    assert row[title_idx] == "Sparse Article"
    # Every other column is an empty string.
    for i, value in enumerate(row):
        if i != title_idx:
            assert value == ""


def test_header_row_matches_columns(exporter):
    assert exporter.header_row() == SheetsExporter.COLUMNS


def test_export_articles_calls_api(exporter, full_article):
    # Tab already exists and already has data -> append only, no header.
    service, append = _make_legacy_mock_service()
    with patch.object(exporter, "_get_service", return_value=service):
        result = exporter.export_articles([full_article])

    assert result["exported"] == 1
    assert result["sheet"] == "Articles"

    append.assert_called_once()
    _, kwargs = append.call_args
    assert kwargs["body"]["values"] == [exporter.format_article_row(full_article)]
    assert kwargs["valueInputOption"] == "USER_ENTERED"
    assert kwargs["spreadsheetId"] == SHEET_ID
    assert "Articles!A:O" in kwargs["range"]


def test_export_articles_with_header(exporter, full_article):
    service, append = _make_legacy_mock_service()
    with patch.object(exporter, "_get_service", return_value=service):
        result = exporter.export_articles([full_article], include_header=True)

    _, kwargs = append.call_args
    rows = kwargs["body"]["values"]
    assert rows[0] == exporter.header_row()
    assert rows[1] == exporter.format_article_row(full_article)
    # exported count reflects articles, not the header row.
    assert result["exported"] == 1


def test_export_handles_api_error(exporter, full_article):
    service = MagicMock()
    service.spreadsheets.return_value.values.return_value.append.side_effect = RuntimeError(
        "boom"
    )
    with patch.object(exporter, "_get_service", return_value=service):
        result = exporter.export_articles([full_article])

    assert result["exported"] == 0
    assert "error" in result
    assert "boom" in result["error"]


def test_export_empty_list_no_api_call(exporter):
    service, append = _make_legacy_mock_service()
    with patch.object(exporter, "_get_service", return_value=service):
        result = exporter.export_articles([])
    assert result["exported"] == 0
    append.assert_not_called()


# -- Gap C: ISO date -> Sheets-native datetime ------------------------------


def test_format_converts_iso_dates_to_sheets_format(exporter):
    article = {
        "title": "Dated Article",
        "published_date": "2026-06-01T09:27:45Z",
        "collected_date": "2026-05-31T10:00:00Z",
    }
    row = exporter.format_article_row(article)
    pub_idx = SheetsExporter.COLUMNS.index("Published Date")
    col_idx = SheetsExporter.COLUMNS.index("Collected Date")
    assert row[pub_idx] == "2026-06-01 09:27:45"
    assert row[col_idx] == "2026-05-31 10:00:00"


def test_format_leaves_nondate_fields_untouched(exporter, full_article):
    row = exporter.format_article_row(full_article)
    assert row[SheetsExporter.COLUMNS.index("Title")] == "Bordeaux 2024: A Buying Guide"
    assert (
        row[SheetsExporter.COLUMNS.index("Excerpt")]
        == "A guide to the 2024 Bordeaux en primeur campaign."
    )
    assert row[SheetsExporter.COLUMNS.index("Source")] == "Decanter"
    assert row[SheetsExporter.COLUMNS.index("URL")] == (
        "https://www.decanter.com/articles/bordeaux-2024"
    )
    # But the date columns WERE converted (T -> space, no Z).
    assert row[SheetsExporter.COLUMNS.index("Published Date")] == "2024-05-15 09:30:00"
    assert row[SheetsExporter.COLUMNS.index("Collected Date")] == "2024-05-16 14:22:00"
    assert len(row) == len(SheetsExporter.COLUMNS)


def test_format_handles_empty_or_bad_date(exporter):
    article = {
        "published_date": "",            # empty -> ""
        "collected_date": "not a date",  # garbage -> unchanged, no crash
    }
    row = exporter.format_article_row(article)
    assert row[SheetsExporter.COLUMNS.index("Published Date")] == ""
    assert row[SheetsExporter.COLUMNS.index("Collected Date")] == "not a date"
    assert len(row) == len(SheetsExporter.COLUMNS)


# -- Gap A: auto-create missing tab -----------------------------------------


def test_ensure_tab_creates_missing(exporter, full_article):
    # Metadata reports only "Sheet1"; exporting to "Articles" must addSheet it.
    service, calls = _make_mock_service(existing_tabs=("Sheet1",), tab_rows=0)
    with patch.object(exporter, "_get_service", return_value=service):
        exporter.export_articles([full_article], sheet_name="Articles")

    calls.batch_update.assert_called_once()
    _, kwargs = calls.batch_update.call_args
    requests = kwargs["body"]["requests"]
    titles = [r["addSheet"]["properties"]["title"] for r in requests]
    assert "Articles" in titles


def test_ensure_tab_skips_existing(exporter, full_article):
    # "Articles" already present -> no addSheet batchUpdate.
    service, calls = _make_mock_service(existing_tabs=("Articles",), tab_rows=1)
    with patch.object(exporter, "_get_service", return_value=service):
        exporter.export_articles([full_article], sheet_name="Articles")

    calls.batch_update.assert_not_called()


def test_ensure_tab_failsoft(exporter, full_article):
    # Metadata get raises -> export still attempts append, doesn't crash.
    service, calls = _make_mock_service(existing_tabs=("Articles",), tab_rows=1)
    calls.meta_get.return_value.execute.side_effect = RuntimeError("meta boom")
    with patch.object(exporter, "_get_service", return_value=service):
        result = exporter.export_articles([full_article], sheet_name="Articles")

    calls.append.assert_called_once()
    assert result["exported"] == 1


# -- _tab_is_empty: real Sheets API contract --------------------------------


def test_tab_is_empty_when_no_values_key(exporter):
    # The REAL Sheets API omits 'values' entirely for a genuinely empty range.
    service = MagicMock()
    probe = service.spreadsheets.return_value.values.return_value.get
    probe.return_value.execute.return_value = {
        "range": "Articles!A1",
        "majorDimension": "ROWS",
    }
    assert exporter._tab_is_empty(service, "Articles") is True


def test_tab_is_empty_when_empty_values_list(exporter):
    # Synthetic empty shape (the real API doesn't emit this, but be tolerant).
    service = MagicMock()
    probe = service.spreadsheets.return_value.values.return_value.get
    probe.return_value.execute.return_value = {"values": []}
    assert exporter._tab_is_empty(service, "Articles") is True


def test_tab_not_empty_when_has_row(exporter):
    service = MagicMock()
    probe = service.spreadsheets.return_value.values.return_value.get
    probe.return_value.execute.return_value = {"values": [["Source"]]}
    assert exporter._tab_is_empty(service, "Articles") is False


def test_tab_is_empty_failsoft_on_error(exporter):
    # A read error must fail soft to NON-empty so no header is injected blindly.
    service = MagicMock()
    probe = service.spreadsheets.return_value.values.return_value.get
    probe.return_value.execute.side_effect = RuntimeError("read boom")
    assert exporter._tab_is_empty(service, "Articles") is False


# -- Gap B: auto-header on an empty tab -------------------------------------


def test_export_empty_tab_auto_prepends_header(exporter, full_article):
    # Real empty tab (probe omits 'values' key) -> appended rows start w/ header.
    service, calls = _make_mock_service(
        existing_tabs=("Articles",), tab_rows=0, empty_shape="real"
    )
    with patch.object(exporter, "_get_service", return_value=service):
        exporter.export_articles([full_article], sheet_name="Articles")

    _, kwargs = calls.append.call_args
    rows = kwargs["body"]["values"]
    assert rows[0] == exporter.header_row()
    assert rows[1] == exporter.format_article_row(full_article)


def test_export_empty_tab_auto_prepends_header_values_list_shape(exporter, full_article):
    # Synthetic empty shape ({"values": []}) must also trigger the auto-header.
    service, calls = _make_mock_service(
        existing_tabs=("Articles",), tab_rows=0, empty_shape="values_list"
    )
    with patch.object(exporter, "_get_service", return_value=service):
        exporter.export_articles([full_article], sheet_name="Articles")

    _, kwargs = calls.append.call_args
    rows = kwargs["body"]["values"]
    assert rows[0] == exporter.header_row()
    assert rows[1] == exporter.format_article_row(full_article)


def test_export_nonempty_tab_no_header(exporter, full_article):
    # Tab already has rows -> header NOT prepended.
    service, calls = _make_mock_service(existing_tabs=("Articles",), tab_rows=3)
    with patch.object(exporter, "_get_service", return_value=service):
        exporter.export_articles([full_article], sheet_name="Articles")

    _, kwargs = calls.append.call_args
    rows = kwargs["body"]["values"]
    assert rows[0] == exporter.format_article_row(full_article)
    assert rows[0] != exporter.header_row()


# -- existing_urls: cross-run dedup read of column C ------------------------


def test_existing_urls_returns_set(exporter):
    # values().get on the URL column returns header + two URLs; the header
    # cell ("URL") is excluded and the two URLs come back as a set.
    service = MagicMock()
    probe = service.spreadsheets.return_value.values.return_value.get
    probe.return_value.execute.return_value = {
        "values": [["URL"], ["https://a"], ["https://b"]]
    }
    with patch.object(exporter, "_get_service", return_value=service):
        urls = exporter.existing_urls("Articles")

    assert urls == {"https://a", "https://b"}
    # Read the URL column (column C), derived from COLUMNS.index("URL").
    _, kwargs = probe.call_args
    assert kwargs["range"] == "Articles!C:C"


def test_existing_urls_empty_tab(exporter):
    # The REAL Sheets API omits the 'values' key entirely for an empty range.
    service = MagicMock()
    probe = service.spreadsheets.return_value.values.return_value.get
    probe.return_value.execute.return_value = {
        "range": "Articles!C:C",
        "majorDimension": "COLUMNS",
    }
    with patch.object(exporter, "_get_service", return_value=service):
        urls = exporter.existing_urls("Articles")

    assert urls == set()


def test_existing_urls_failsoft(exporter):
    # A read error must fail soft to an EMPTY set (never silently drop new
    # articles -- better to risk a duplicate than lose data).
    service = MagicMock()
    probe = service.spreadsheets.return_value.values.return_value.get
    probe.return_value.execute.side_effect = RuntimeError("read boom")
    with patch.object(exporter, "_get_service", return_value=service):
        urls = exporter.existing_urls("Articles")

    assert urls == set()
