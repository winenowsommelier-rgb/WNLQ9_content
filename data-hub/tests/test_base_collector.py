"""Tests for BaseCollector (Task 3, TDD).

Written BEFORE the implementation. These tests define the contract for the
abstract base collector: field validation and metadata enrichment.
"""

import datetime
import re

import pytest

from collectors.base_collector import BaseCollector


# A concrete subclass so we can instantiate the abstract BaseCollector in tests.
class DummyCollector(BaseCollector):
    def collect(self):
        return []


def _complete_article():
    """Return an article dict with every REQUIRED_FIELD populated."""
    return {
        "source_name": "Decanter",
        "article_url": "https://www.decanter.com/news/example-article",
        "title": "2024 Bordeaux En Primeur Report",
        "published_date": "2024-05-15T09:30:00Z",
        "content_type": "news",
        "content_excerpt": "A summary of the 2024 Bordeaux en primeur campaign.",
    }


def test_validate_article_accepts_complete_article():
    collector = DummyCollector(name="Decanter")
    assert collector.validate_article(_complete_article()) is True


def test_validate_article_rejects_missing_fields():
    collector = DummyCollector(name="Decanter")
    article = _complete_article()
    del article["title"]
    assert collector.validate_article(article) is False


def test_validate_article_rejects_empty_fields():
    collector = DummyCollector(name="Decanter")
    article = _complete_article()
    article["content_excerpt"] = ""
    assert collector.validate_article(article) is False


def test_enrich_article_adds_metadata():
    collector = DummyCollector(name="Decanter")
    # Start from an article missing source_name to confirm enrichment fills it.
    article = {
        "article_url": "https://www.decanter.com/news/example-article",
        "title": "2024 Bordeaux En Primeur Report",
        "published_date": "2024-05-15T09:30:00Z",
        "content_type": "news",
        "content_excerpt": "A summary.",
    }
    enriched = collector.enrich_article(article)

    assert enriched["source_name"] == "Decanter"
    assert "collected_date" in enriched
    # collected_date must be an ISO 8601 string parseable by datetime.
    iso = enriched["collected_date"]
    assert isinstance(iso, str)
    # Should be parseable as an ISO timestamp.
    parsed = datetime.datetime.fromisoformat(iso.replace("Z", "+00:00"))
    assert isinstance(parsed, datetime.datetime)


# -- vertical stamping -------------------------------------------------------


def test_enrich_stamps_vertical_as_primary_category():
    """A collector configured with a vertical stamps it onto primary_category."""
    collector = DummyCollector(name="Robb Report", vertical="lifestyle")
    article = _complete_article()
    enriched = collector.enrich_article(article)
    assert enriched["primary_category"] == "lifestyle"


def test_enrich_no_vertical_leaves_primary_category():
    """With no vertical, enrich_article does not force primary_category."""
    collector = DummyCollector(name="Decanter")  # vertical defaults to None
    article = _complete_article()
    assert "primary_category" not in article
    enriched = collector.enrich_article(article)
    assert "primary_category" not in enriched
