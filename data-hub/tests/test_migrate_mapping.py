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
from scripts.migrate_sheet_to_db import row_to_article


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
        "FALSE",                          # Thailand Focus -> thailand_focus
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
    # The AEO Value header maps to the aeo_citation_opportunity field.
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


def test_row_to_article_thailand_focus_truthy():
    """A "TRUE" Thailand Focus cell maps to a truthy value the store accepts."""
    row = _full_row()
    row[15] = "TRUE"
    article = row_to_article(row)
    assert bool(article["thailand_focus"]) is True

    row[15] = "FALSE"
    assert bool(row_to_article(row)["thailand_focus"]) is False


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
        "thailand_focus": False,
    }
    row = exporter.format_article_row(original)
    article = row_to_article(row)

    assert article["source_name"] == original["source_name"]
    assert article["title"] == original["title"]
    assert article["article_url"] == original["article_url"]
    assert article["trend_signals"] == original["trend_signals"]
    assert article["aeo_citation_opportunity"] == "high"
