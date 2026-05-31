"""Tests for the daily ingestion pipeline orchestration (Task 7, TDD).

Written BEFORE the implementation. Collectors and the exporter are fully
mocked (MagicMock), so no test touches the network or the Google Sheets API.
The whole point of the IngestPipeline design is dependency injection: an
exporter and/or collectors can be supplied so the orchestration logic is
testable in complete isolation.
"""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from pipeline.ingest import IngestPipeline


SOURCES_CONFIG_PATH = "config/sources.yaml"


def _article(url, title="A wine story", excerpt="Bordeaux vintage report"):
    """Build a minimal schema-conforming collected article dict."""
    return {
        "source_name": "Test Source",
        "article_url": url,
        "title": title,
        "published_date": "2026-05-30T09:00:00Z",
        "content_type": "news",
        "content_excerpt": excerpt,
        "collected_date": "2026-05-31T00:00:00Z",
    }


@pytest.fixture
def pipeline():
    """A pipeline backed by the real sources.yaml and a mock exporter."""
    exporter = MagicMock()
    exporter.export_articles.return_value = {"exported": 0, "sheet": "Articles"}
    return IngestPipeline(
        sources_config_path=SOURCES_CONFIG_PATH,
        exporter=exporter,
    )


# -- load_sources ------------------------------------------------------------


def test_load_sources_parses_yaml(pipeline):
    """sources.yaml parses into a dict with the expected category groups."""
    sources = pipeline.load_sources()

    assert isinstance(sources, dict)
    assert "sources" in sources
    categories = sources["sources"]
    # The known top-level category groups from config/sources.yaml.
    assert "wine" in categories
    assert "spirits" in categories
    assert isinstance(categories["wine"], list)
    assert len(categories["wine"]) > 0


# -- build_collectors --------------------------------------------------------


def test_build_collectors_creates_rss(pipeline):
    """RSS-typed sources become RSSCollector instances wired to their feed."""
    from collectors.rss_collector import RSSCollector

    collectors = pipeline.build_collectors()

    rss = [c for c in collectors if isinstance(c, RSSCollector)]
    assert len(rss) > 0
    # Every RSS collector should carry a feed_url drawn from the config.
    assert all(getattr(c, "feed_url", None) for c in rss)
    # Wine Spectator is an rss source in the registry.
    assert any(c.name == "Wine Spectator" for c in rss)


def test_build_collectors_skips_unconfigured(pipeline):
    """api / keyword_monitor types are skipped; no collector is built for them."""
    collectors = pipeline.build_collectors()

    built_names = {c.name for c in collectors}
    # Vivino is api_type 'api' -- not yet implemented, must be skipped.
    assert "Vivino Community" not in built_names
    # TikTok is api_type 'keyword_monitor' -- must be skipped.
    assert "TikTok Wine & Spirits Trends" not in built_names
    # web_scrape sources in sources.yaml lack a full selectors dict
    # (only scrape_selector), so they are skipped gracefully too.
    assert "Robert Parker Wine Advocate" not in built_names


# -- collect_all -------------------------------------------------------------


def test_collect_all_aggregates(pipeline):
    """Two collectors each returning articles -> a single combined list."""
    c1 = MagicMock()
    c1.name = "Source One"
    c1.collect.return_value = [_article("https://a.com/1"), _article("https://a.com/2")]

    c2 = MagicMock()
    c2.name = "Source Two"
    c2.collect.return_value = [_article("https://b.com/1")]

    articles = pipeline.collect_all([c1, c2])

    assert len(articles) == 3
    urls = {a["article_url"] for a in articles}
    assert urls == {"https://a.com/1", "https://a.com/2", "https://b.com/1"}


def test_collect_all_continues_on_error(pipeline):
    """If one collector raises, the others are still collected (fail-soft)."""
    bad = MagicMock()
    bad.name = "Broken Source"
    bad.collect.side_effect = RuntimeError("network exploded")

    good = MagicMock()
    good.name = "Good Source"
    good.collect.return_value = [_article("https://good.com/1")]

    articles = pipeline.collect_all([bad, good])

    # The good collector's article survives; the bad one is logged, not fatal.
    assert len(articles) == 1
    assert articles[0]["article_url"] == "https://good.com/1"
    # The error is recorded on the pipeline for the run summary.
    assert any("Broken Source" in e for e in pipeline.errors)


# -- process -----------------------------------------------------------------


def test_process_dedups_and_categorizes(pipeline):
    """Duplicate URLs are removed, then classification fields are added."""
    articles = [
        _article("https://dup.com/1", title="Napa Cabernet review"),
        _article("https://dup.com/1", title="Napa Cabernet review"),  # dup
        _article("https://uniq.com/2", title="Islay Scotch whisky tasting"),
    ]

    processed = pipeline.process(articles)

    # Deduplicated down to two distinct URLs.
    assert len(processed) == 2
    # Categorizer added classification fields to every article.
    for article in processed:
        assert "primary_category" in article
        assert "topic_region" in article
        assert "trend_signals" in article
        assert "aeo_citation_opportunity" in article


# -- run (full pipeline) -----------------------------------------------------


def test_run_full_pipeline_with_mocks():
    """Inject mock collectors + exporter; run() returns a correct summary."""
    exporter = MagicMock()
    exporter.export_articles.return_value = {"exported": 2, "sheet": "Articles"}

    c1 = MagicMock()
    c1.name = "Mock RSS One"
    c1.collect.return_value = [
        _article("https://x.com/1", title="Barolo wine review"),
        _article("https://x.com/2", title="Bourbon whiskey news"),
    ]

    c2 = MagicMock()
    c2.name = "Mock RSS Two"
    # Returns a duplicate of x.com/1 -> should be collapsed by dedup.
    c2.collect.return_value = [_article("https://x.com/1", title="Barolo wine review")]

    pipeline = IngestPipeline(
        sources_config_path=SOURCES_CONFIG_PATH,
        exporter=exporter,
    )
    # Inject collectors directly, bypassing build_collectors / the network.
    pipeline.collectors = [c1, c2]

    summary = pipeline.run()

    assert summary["collected"] == 3
    assert summary["after_dedup"] == 2
    assert summary["exported"] == 2
    assert set(summary["sources_run"]) == {"Mock RSS One", "Mock RSS Two"}
    assert summary["errors"] == []
    # The exporter was actually invoked with the processed articles.
    exporter.export_articles.assert_called_once()
    exported_articles = exporter.export_articles.call_args[0][0]
    assert len(exported_articles) == 2


def test_run_records_collector_errors_in_summary():
    """A failing collector surfaces in the summary's errors list."""
    exporter = MagicMock()
    exporter.export_articles.return_value = {"exported": 1, "sheet": "Articles"}

    bad = MagicMock()
    bad.name = "Exploding Source"
    bad.collect.side_effect = ValueError("boom")

    good = MagicMock()
    good.name = "Working Source"
    good.collect.return_value = [_article("https://ok.com/1")]

    pipeline = IngestPipeline(
        sources_config_path=SOURCES_CONFIG_PATH,
        exporter=exporter,
    )
    pipeline.collectors = [bad, good]

    summary = pipeline.run()

    assert summary["collected"] == 1
    assert summary["after_dedup"] == 1
    assert len(summary["errors"]) == 1
    assert "Exploding Source" in summary["errors"][0]
