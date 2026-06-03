"""Tests for the PURE row->article mapping used by the Sheets->SQLite migration.

The migration script itself hits the live Google Sheets API and is therefore
NOT part of the mocked suite. But the row->article reversal of
``SheetsExporter.format_article_row`` is pure (no network) and is the riskiest
part of the migration, so it is factored out and unit-tested here.

The function under test, ``row_to_article``, takes a COLUMNS-ordered row (the
list of cell values for one sheet row, exactly as returned by
``values.get(valueRenderOption="UNFORMATTED_VALUE")``) and returns an article
dict shaped like what the collectors/categorizer produce and the store stores.
"""

from __future__ import annotations

from exporters.sheets_exporter import SheetsExporter
from scripts.migrate_sheet_to_db import row_to_article, sheets_date_to_iso


def _full_row():
    """A COLUMNS-ordered row covering every field, with a 2-signal list."""
    # Order must match SheetsExporter.COLUMNS exactly.
    return [
        "Decanter",                       # Source -> source_name
        "Barolo 2021 vintage report",     # Title -> title
        "https://decanter.com/barolo",    # URL -> article_url
        "2026-05-30 09:00:00",            # Published Date -> published_date
        "Jane Doe",                       # Author -> author
        "A deep dive into Barolo.",       # Excerpt -> content_excerpt
        "news",                           # Content Type -> content_type
        "Italy",                          # Region -> topic_region
        "",                               # Spirits Type -> spirits_type
        "vintage report | premiumization",  # Trend Signals -> trend_signals
        "wine",                           # Primary Category -> primary_category
        "collector",                      # Buyer Persona -> buyer_persona
        "high",                           # AEO Value -> aeo_citation_opportunity
        "2026-05-31 00:00:00",            # Collected Date -> collected_date
        "en",                             # Source Language -> source_language
        "",                               # Thailand Focus -> thailand_focus (level)
    ]


def test_row_to_article_maps_all_columns():
    """A full COLUMNS-ordered row maps to the correct article dict fields."""
    article = row_to_article(_full_row())

    assert article["source_name"] == "Decanter"
    assert article["title"] == "Barolo 2021 vintage report"
    assert article["article_url"] == "https://decanter.com/barolo"
    assert article["published_date"] == "2026-05-30 09:00:00"
    assert article["author"] == "Jane Doe"
    assert article["content_excerpt"] == "A deep dive into Barolo."
    assert article["content_type"] == "news"
    assert article["topic_region"] == "Italy"
    assert article["spirits_type"] == ""
    assert article["primary_category"] == "wine"
    assert article["buyer_persona"] == "collector"
    # The AEO Value header maps to the aeo_citation_opportunity field --
    # a LEVEL string (high/medium/low), passed through as-is (NOT bool-coerced).
    assert article["aeo_citation_opportunity"] == "high"
    assert article["collected_date"] == "2026-05-31 00:00:00"
    assert article["source_language"] == "en"


def test_row_to_article_splits_trend_signals_into_list():
    """A " | "-joined Trend Signals cell becomes a list of strings."""
    article = row_to_article(_full_row())
    assert article["trend_signals"] == ["vintage report", "premiumization"]


def test_row_to_article_single_trend_signal():
    """A single (un-separated) trend signal becomes a 1-element list."""
    row = _full_row()
    row[9] = "premiumization"
    article = row_to_article(row)
    assert article["trend_signals"] == ["premiumization"]


def test_row_to_article_empty_trend_signals():
    """A blank Trend Signals cell becomes an empty list (not [''])."""
    row = _full_row()
    row[9] = ""
    article = row_to_article(row)
    assert article["trend_signals"] == []


def test_row_to_article_blank_cells_become_empty_string():
    """Blank cells map to empty strings, never None."""
    row = _full_row()
    row[4] = ""   # author
    row[8] = ""   # spirits_type
    article = row_to_article(row)
    assert article["author"] == ""
    assert article["spirits_type"] == ""
    assert all(v is not None for v in article.values())


def test_row_to_article_short_row_is_padded():
    """A row shorter than COLUMNS (trailing empty cells omitted by Sheets) is
    handled: missing trailing fields default to "" / []."""
    # Sheets omits trailing empty cells, so a row may be shorter than COLUMNS.
    row = ["Decanter", "Title", "https://x.com/1"]
    article = row_to_article(row)
    assert article["source_name"] == "Decanter"
    assert article["title"] == "Title"
    assert article["article_url"] == "https://x.com/1"
    # Everything after URL was omitted -> defaults.
    assert article["author"] == ""
    assert article["trend_signals"] == []
    assert article["source_language"] == ""


def test_row_to_article_thailand_focus_is_level_string():
    """The Thailand Focus cell is a LEVEL string (high/medium/""), not a bool.

    It maps straight through (normalized to {"high","medium",""}); anything
    else (including legacy "TRUE"/"FALSE") collapses to "".
    """
    row = _full_row()

    row[15] = "high"
    assert row_to_article(row)["thailand_focus"] == "high"

    row[15] = "medium"
    assert row_to_article(row)["thailand_focus"] == "medium"

    row[15] = "MEDIUM"  # case/whitespace normalized
    assert row_to_article(row)["thailand_focus"] == "medium"

    row[15] = ""
    assert row_to_article(row)["thailand_focus"] == ""

    # Legacy/unknown values are not levels -> "".
    row[15] = "FALSE"
    assert row_to_article(row)["thailand_focus"] == ""
    row[15] = "TRUE"
    assert row_to_article(row)["thailand_focus"] == ""


def test_row_to_article_aeo_value_is_level_string():
    """AEO Value is a LEVEL string (high/medium/low), passed through, not bool."""
    row = _full_row()
    for level in ("high", "medium", "low"):
        row[12] = level
        assert row_to_article(row)["aeo_citation_opportunity"] == level


# -- sheets_date_to_iso (Sheets serial -> ISO) -------------------------------


def test_sheets_date_to_iso_serial_float():
    """A Sheets serial float converts to the correct ISO-8601 UTC string.

    46172.375 days after the 1899-12-30 epoch == 2026-05-30 09:00:00 UTC
    (.375 of a day == 9 hours).
    """
    assert sheets_date_to_iso(46172.375) == "2026-05-30T09:00:00Z"


def test_sheets_date_to_iso_numeric_string():
    """A numeric STRING (e.g. "46172") is treated as a serial and converted."""
    assert sheets_date_to_iso("46172") == "2026-05-30T00:00:00Z"


def test_sheets_date_to_iso_integer_serial():
    """A bare integer serial (midnight) converts to a date at 00:00:00Z."""
    assert sheets_date_to_iso(46172) == "2026-05-30T00:00:00Z"


def test_sheets_date_to_iso_already_iso_passes_through():
    """An already-ISO/parseable string is returned unchanged (not re-encoded)."""
    assert sheets_date_to_iso("2026-05-30T09:00:00Z") == "2026-05-30T09:00:00Z"
    assert sheets_date_to_iso("2026-05-30 09:00:00") == "2026-05-30 09:00:00"


def test_sheets_date_to_iso_empty_stays_empty():
    """An empty / None value stays empty."""
    assert sheets_date_to_iso("") == ""
    assert sheets_date_to_iso(None) == ""


def test_sheets_date_to_iso_junk_passes_through():
    """A non-numeric, non-date junk string is left unchanged."""
    assert sheets_date_to_iso("not a date") == "not a date"


def test_row_to_article_serial_date_becomes_iso():
    """A Published Date stored as a Sheets serial float maps to an ISO string,
    NOT the raw "46172..." serial."""
    row = _full_row()
    row[3] = 46172.375          # Published Date as serial float
    row[13] = 46172.0           # Collected Date as serial float
    article = row_to_article(row)
    assert article["published_date"] == "2026-05-30T09:00:00Z"
    assert article["collected_date"] == "2026-05-30T00:00:00Z"
    # Must never store the bare serial.
    assert not article["published_date"].startswith("46172")


def test_mapping_is_inverse_of_format_article_row():
    """row_to_article should invert SheetsExporter.format_article_row for the
    fields that survive a round-trip (text fields + trend_signals list)."""
    exporter = SheetsExporter(sheet_id="dummy")
    original = {
        "source_name": "Decanter",
        "title": "Barolo report",
        "article_url": "https://decanter.com/barolo",
        "author": "Jane Doe",
        "content_excerpt": "A deep dive.",
        "content_type": "news",
        "topic_region": "Italy",
        "spirits_type": "",
        "trend_signals": ["vintage report", "premiumization"],
        "primary_category": "wine",
        "buyer_persona": "collector",
        "aeo_citation_opportunity": "high",
        "source_language": "en",
        "published_date": "2026-05-30T09:00:00Z",
        "collected_date": "2026-05-31T00:00:00Z",
        "thailand_focus": "high",
    }
    row = exporter.format_article_row(original)
    article = row_to_article(row)

    assert article["source_name"] == original["source_name"]
    assert article["title"] == original["title"]
    assert article["article_url"] == original["article_url"]
    assert article["trend_signals"] == original["trend_signals"]
    assert article["aeo_citation_opportunity"] == "high"
    # thailand_focus survives the round-trip as the level string.
    assert article["thailand_focus"] == "high"
