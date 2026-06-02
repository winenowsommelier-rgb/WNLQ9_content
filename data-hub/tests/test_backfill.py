"""Tests for the historical backfill pipeline (Task 8, TDD).

Written BEFORE the implementation. Collectors and the exporter are fully
mocked, so no test touches the network or the Google Sheets API.

Date filtering is made deterministic by injecting a fixed ``reference_date``
into ``filter_by_date`` -- no test relies on ``datetime.now()``.
"""

from __future__ import annotations

import datetime
from unittest.mock import MagicMock

import pytest

import textwrap

from collectors.sitemap_collector import SitemapCollector
from pipeline.backfill import BackfillPipeline


SOURCES_CONFIG_PATH = "config/sources.yaml"

# A fixed reference "today" so date-window tests are fully deterministic.
REFERENCE_DATE = datetime.datetime(2026, 6, 1, tzinfo=datetime.timezone.utc)


def _article(url, published_date="2026-05-01T09:00:00Z", title="A wine story"):
    """Build a minimal collected article dict with a published_date."""
    return {
        "source_name": "Test Source",
        "article_url": url,
        "title": title,
        "published_date": published_date,
        "content_type": "news",
        "content_excerpt": "Bordeaux vintage report",
        "collected_date": "2026-06-01T00:00:00Z",
    }


@pytest.fixture
def pipeline():
    """A backfill pipeline backed by real sources.yaml and a mock exporter."""
    exporter = MagicMock()
    exporter.export_articles.return_value = {
        "exported": 0,
        "sheet": "Historical_Backfill",
    }
    return BackfillPipeline(
        sources_config_path=SOURCES_CONFIG_PATH,
        exporter=exporter,
        months_back=12,
    )


# -- filter_by_date ----------------------------------------------------------


def test_filter_by_date_keeps_recent(pipeline):
    """An article dated ~1 month before the reference date is kept."""
    one_month_ago = "2026-05-01T09:00:00Z"
    articles = [_article("https://a.com/1", published_date=one_month_ago)]

    kept = pipeline.filter_by_date(
        articles, months_back=12, reference_date=REFERENCE_DATE
    )

    assert len(kept) == 1
    assert kept[0]["article_url"] == "https://a.com/1"


def test_filter_by_date_drops_old(pipeline):
    """An article dated ~18 months before the reference date is dropped."""
    eighteen_months_ago = "2024-12-01T09:00:00Z"
    articles = [_article("https://old.com/1", published_date=eighteen_months_ago)]

    kept = pipeline.filter_by_date(
        articles, months_back=12, reference_date=REFERENCE_DATE
    )

    assert kept == []


def test_filter_by_date_keeps_undated(pipeline):
    """An article with a missing/unparseable date is KEPT (not dropped)."""
    no_date = _article("https://nodate.com/1", published_date="")
    bad_date = _article("https://baddate.com/2", published_date="not-a-date")
    missing_key = {"article_url": "https://missing.com/3", "title": "x"}

    kept = pipeline.filter_by_date(
        [no_date, bad_date, missing_key],
        months_back=12,
        reference_date=REFERENCE_DATE,
    )

    kept_urls = {a["article_url"] for a in kept}
    assert kept_urls == {
        "https://nodate.com/1",
        "https://baddate.com/2",
        "https://missing.com/3",
    }


# -- build_paginated_urls ----------------------------------------------------


def test_build_paginated_urls_simple(pipeline):
    """Base feed URL + 3 pages -> [base, base?paged=2, base?paged=3]."""
    base = "https://example.com/feed/"

    urls = pipeline.build_paginated_urls(base, max_pages=3)

    assert urls == [
        "https://example.com/feed/",
        "https://example.com/feed/?paged=2",
        "https://example.com/feed/?paged=3",
    ]


def test_build_paginated_urls_existing_query(pipeline):
    """A URL with an existing query string uses '&' for the paged param."""
    base = "https://example.com/feed/?cat=wine"

    urls = pipeline.build_paginated_urls(base, max_pages=2)

    assert urls == [
        "https://example.com/feed/?cat=wine",
        "https://example.com/feed/?cat=wine&paged=2",
    ]


# -- collect_with_pagination -------------------------------------------------


def test_collect_with_pagination_stops_on_empty(pipeline):
    """Page 1 returns articles, page 2 returns [] -> stop, keep page 1 only."""
    page1 = [_article("https://p.com/1"), _article("https://p.com/2")]

    def factory(url):
        collector = MagicMock()
        collector.name = "Paginated Source"
        if url.endswith("?paged=2"):
            collector.collect.return_value = []
        else:
            collector.collect.return_value = page1
        return collector

    articles = pipeline.collect_with_pagination(
        factory, "https://p.com/feed/", max_pages=5
    )

    assert len(articles) == 2
    urls = {a["article_url"] for a in articles}
    assert urls == {"https://p.com/1", "https://p.com/2"}


def test_collect_with_pagination_aggregates(pipeline):
    """Pages 1 and 2 both return articles -> combined into one list."""
    def factory(url):
        collector = MagicMock()
        collector.name = "Paginated Source"
        if url.endswith("?paged=2"):
            collector.collect.return_value = [_article("https://p.com/3")]
        else:
            collector.collect.return_value = [
                _article("https://p.com/1"),
                _article("https://p.com/2"),
            ]
        return collector

    articles = pipeline.collect_with_pagination(
        factory, "https://p.com/feed/", max_pages=2
    )

    assert len(articles) == 3
    urls = {a["article_url"] for a in articles}
    assert urls == {"https://p.com/1", "https://p.com/2", "https://p.com/3"}


def test_collect_with_pagination_fail_soft(pipeline):
    """A page that raises is skipped; later pages still contribute."""
    def factory(url):
        collector = MagicMock()
        collector.name = "Flaky Source"
        if url == "https://p.com/feed/":
            collector.collect.side_effect = RuntimeError("boom")
        else:
            collector.collect.return_value = [_article("https://p.com/2")]
        return collector

    articles = pipeline.collect_with_pagination(
        factory, "https://p.com/feed/", max_pages=2
    )

    # Page 1 failed but did not abort; page 2 still returned its article.
    assert len(articles) == 1
    assert articles[0]["article_url"] == "https://p.com/2"


# -- process -----------------------------------------------------------------


def test_process_dedups_and_categorizes(pipeline):
    """Duplicate URLs removed across batches, classification fields added."""
    articles = [
        _article("https://dup.com/1", title="Napa Cabernet review"),
        _article("https://dup.com/1", title="Napa Cabernet review"),  # dup
        _article("https://uniq.com/2", title="Islay Scotch whisky tasting"),
    ]

    processed = pipeline.process(articles)

    assert len(processed) == 2
    for article in processed:
        assert "primary_category" in article
        assert "topic_region" in article
        assert "trend_signals" in article
        assert "aeo_citation_opportunity" in article


# -- run (full pipeline) -----------------------------------------------------


def test_run_exports_to_backfill_sheet():
    """run() exports to the separate Historical_Backfill sheet and reports
    the date-window stats plus a limitations note."""
    exporter = MagicMock()
    exporter.export_articles.return_value = {
        "exported": 1,
        "sheet": "Historical_Backfill",
    }

    # One recent (kept) and one ancient (filtered out) article.
    recent = _article("https://x.com/1", published_date="2026-05-15T00:00:00Z",
                       title="Barolo wine review")
    ancient = _article("https://x.com/old", published_date="2023-01-01T00:00:00Z",
                        title="Old bourbon news")

    collector = MagicMock()
    collector.name = "Mock RSS"
    collector.collect.return_value = [recent, ancient]

    pipeline = BackfillPipeline(
        sources_config_path=SOURCES_CONFIG_PATH,
        exporter=exporter,
        months_back=12,
    )
    # Inject collectors directly, bypassing build_collectors / the network.
    pipeline.collectors = [collector]
    # Fixed reference date so the date filter is deterministic.
    pipeline.reference_date = REFERENCE_DATE

    summary = pipeline.run(max_pages=1)

    # Export went to the dedicated historical sheet, not "Articles".
    exporter.export_articles.assert_called_once()
    _, kwargs = exporter.export_articles.call_args
    assert kwargs.get("sheet_name") == "Historical_Backfill"

    # Summary reports the funnel and includes a limitations note about RSS.
    assert summary["collected"] == 2
    assert summary["after_date_filter"] == 1
    assert summary["after_dedup"] == 1
    assert summary["exported"] == 1
    assert summary["months_back"] == 12
    assert "Mock RSS" in summary["sources_run"]
    assert isinstance(summary["limitations"], str)
    assert "RSS" in summary["limitations"]
    assert summary["errors"] == []


# -- build_collectors / backfill_sources -------------------------------------


def test_build_collectors_includes_sitemap_sources(tmp_path):
    """A config with a backfill_sources sitemap entry builds a SitemapCollector."""
    config = textwrap.dedent(
        """
        sources:
          wine:
            - name: "Decanter RSS"
              api_type: "rss"
              rss_feed: "https://www.decanter.com/feed/"
        backfill_sources:
          - name: "The Spirits Business"
            api_type: "sitemap"
            sitemap_url: "https://www.thespiritsbusiness.com/sitemap_index.xml"
            sitemap_child_pattern: "post-sitemap"
            language: "en"
        """
    )
    config_path = tmp_path / "sources.yaml"
    config_path.write_text(config, encoding="utf-8")

    pipeline = BackfillPipeline(
        sources_config_path=str(config_path),
        exporter=MagicMock(),
        months_back=12,
    )
    pipeline.reference_date = REFERENCE_DATE

    collectors = pipeline.build_collectors()

    sitemap_collectors = [c for c in collectors if isinstance(c, SitemapCollector)]
    assert len(sitemap_collectors) == 1
    sc = sitemap_collectors[0]
    assert sc.name == "The Spirits Business"
    assert sc.sitemap_url == (
        "https://www.thespiritsbusiness.com/sitemap_index.xml"
    )
    assert sc.child_pattern == "post-sitemap"
    # Date window / reference flow through from the pipeline.
    assert sc.months_back == 12
    assert sc.reference_date == REFERENCE_DATE


def test_build_collectors_backward_compatible(tmp_path):
    """A config WITHOUT backfill_sources still builds (no crash, RSS only)."""
    config = textwrap.dedent(
        """
        sources:
          wine:
            - name: "Decanter RSS"
              api_type: "rss"
              rss_feed: "https://www.decanter.com/feed/"
        """
    )
    config_path = tmp_path / "sources.yaml"
    config_path.write_text(config, encoding="utf-8")

    pipeline = BackfillPipeline(
        sources_config_path=str(config_path),
        exporter=MagicMock(),
        months_back=12,
    )

    collectors = pipeline.build_collectors()

    assert len(collectors) == 1
    assert not any(isinstance(c, SitemapCollector) for c in collectors)
