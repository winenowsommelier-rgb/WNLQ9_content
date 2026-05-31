"""Tests for SheetsExporter (Task 6, TDD).

Written BEFORE the implementation. The exporter pushes processed articles
into Google Sheets, the chosen storage hub. The Google Sheets API is
mocked entirely: ``_get_service`` is the seam, so no real credentials or
network access are ever required.
"""

from __future__ import annotations

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


def _make_mock_service():
    """Build a mock googleapiclient service whose append().execute() is tracked."""
    service = MagicMock()
    append = service.spreadsheets.return_value.values.return_value.append
    append.return_value.execute.return_value = {
        "updates": {"updatedRows": 1}
    }
    return service, append


def test_format_article_row_orders_fields(exporter, full_article):
    row = exporter.format_article_row(full_article)
    assert row == [
        "Decanter",
        "Bordeaux 2024: A Buying Guide",
        "https://www.decanter.com/articles/bordeaux-2024",
        "2024-05-15T09:30:00Z",
        "Jane Anson",
        "A guide to the 2024 Bordeaux en primeur campaign.",
        "guide",
        "France",
        "",  # spirits_type was None
        "emerging_region | award_winning",
        "wine",
        "enthusiast",
        "high",
        "2024-05-16T14:22:00Z",
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
    service, append = _make_mock_service()
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
    service, append = _make_mock_service()
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
    service, append = _make_mock_service()
    with patch.object(exporter, "_get_service", return_value=service):
        result = exporter.export_articles([])
    assert result["exported"] == 0
    append.assert_not_called()
