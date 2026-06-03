"""Tests for the per-article enrichment step, written TDD-first.

``scripts/enrich_excerpts.py`` itself talks to the live network + DB and is NOT
in the mocked suite (same convention as verify_sheets_setup.py / migrate_*).
The PURE-ish core -- :func:`enrich_one` -- IS unit-tested here with an injected
fake ``fetch_excerpt`` (no network) and a REAL :class:`Categorizer`, so we
assert the real keyword categorizer recomputes fields from the fetched text.
"""

from __future__ import annotations

import os
import sys

# Make the data-hub package + scripts importable.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from processors.categorizer import Categorizer
from scripts.enrich_excerpts import enrich_one


def _empty_article(**overrides):
    """A backfilled-style article: real URL/title but EMPTY excerpt + 'Other'."""
    article = {
        "source_name": "Backfill",
        "article_url": "https://example.com/napa-cabernet",
        "title": "tasting-notes",  # slug-derived, low signal
        "content_excerpt": "",
        "content_type": "news",
        "topic_region": "Other",
        "spirits_type": None,
        "trend_signals": [],
        # Backfilled rows arrive UN-categorized (empty), so the categorizer is
        # free to infer the vertical from the freshly fetched excerpt rather
        # than keeping a stale authoritative preset.
        "primary_category": "",
        "buyer_persona": "enthusiast",
        "aeo_citation_opportunity": "low",
        "thailand_focus": "",
    }
    article.update(overrides)
    return article


def test_enrich_one_populates_excerpt_and_recategorizes():
    """A fetched excerpt is stored AND the categorizer recomputes fields."""
    article = _empty_article()
    html_excerpt = (
        "An in-depth look at Napa Valley Cabernet Sauvignon from California, "
        "including an award-winning vineyard vertical tasting."
    )

    result = enrich_one(
        article,
        fetch_excerpt=lambda url: html_excerpt,
        categorizer=Categorizer(),
    )

    # Excerpt populated from the fetched text.
    assert result["content_excerpt"] == html_excerpt
    # Re-categorization picked up the new text: region now detected, not 'Other'.
    assert result["topic_region"] == "USA (California)"
    assert result["primary_category"] == "wine"
    # Marked enriched so it won't be refetched.
    assert result["enriched"] == 1


def test_enrich_one_empty_fetch_marks_enriched_only():
    """A fetch that yields '' leaves the excerpt empty but marks enriched=1."""
    article = _empty_article()
    before_region = article["topic_region"]

    result = enrich_one(
        article,
        fetch_excerpt=lambda url: "",
        categorizer=Categorizer(),
    )

    # No text found -> excerpt stays empty, category fields unchanged...
    assert result["content_excerpt"] == ""
    assert result["topic_region"] == before_region
    # ...but enriched=1 so a dead URL is never refetched next run.
    assert result["enriched"] == 1


def test_enrich_one_reports_whether_excerpt_was_found():
    """enrich_one signals (via excerpt_found) so the caller can tally."""
    found = enrich_one(
        _empty_article(),
        fetch_excerpt=lambda url: "Some real Bordeaux wine text here please.",
        categorizer=Categorizer(),
    )
    miss = enrich_one(
        _empty_article(),
        fetch_excerpt=lambda url: "",
        categorizer=Categorizer(),
    )
    assert found["excerpt_found"] is True
    assert miss["excerpt_found"] is False


def test_enrich_one_does_not_mutate_input():
    """enrich_one returns a fresh dict; the caller's article is untouched."""
    article = _empty_article()
    enrich_one(
        article,
        fetch_excerpt=lambda url: "Napa California Cabernet.",
        categorizer=Categorizer(),
    )
    assert article["content_excerpt"] == ""
    assert article["topic_region"] == "Other"
