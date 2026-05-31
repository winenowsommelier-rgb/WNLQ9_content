"""Tests for RSSCollector (Task 3, TDD).

Written BEFORE the implementation. feedparser.parse is mocked so no test
touches the network.
"""

import datetime
from types import SimpleNamespace
from unittest import mock

import pytest

from collectors.rss_collector import RSSCollector


FEED_URL = "https://www.decanter.com/feed/"


def _make_entry(**overrides):
    """Build a feedparser-style entry (attribute access + .get)."""
    base = {
        "title": "2024 Bordeaux En Primeur Report",
        "link": "https://www.decanter.com/news/example-article",
        "published": "Wed, 15 May 2024 09:30:00 +0000",
        "author": "Decanter Staff",
        "summary": "A summary of the 2024 Bordeaux en primeur campaign.",
    }
    base.update(overrides)

    class Entry(dict):
        # feedparser entries support both attribute and dict access.
        def __getattr__(self, item):
            try:
                return self[item]
            except KeyError as exc:
                raise AttributeError(item) from exc

    return Entry(base)


def test_parse_date_converts_to_iso():
    collector = RSSCollector(name="Decanter", feed_url=FEED_URL)
    iso = collector._parse_date("Wed, 15 May 2024 09:30:00 +0000")
    # Must be a valid ISO 8601 string for that instant.
    parsed = datetime.datetime.fromisoformat(iso.replace("Z", "+00:00"))
    assert parsed.year == 2024
    assert parsed.month == 5
    assert parsed.day == 15


def test_parse_date_fallback_on_invalid():
    collector = RSSCollector(name="Decanter", feed_url=FEED_URL)
    iso = collector._parse_date("not a real date at all")
    # Falls back gracefully to a usable ISO string (collection time).
    assert isinstance(iso, str)
    assert iso != ""
    parsed = datetime.datetime.fromisoformat(iso.replace("Z", "+00:00"))
    assert isinstance(parsed, datetime.datetime)


def test_extract_excerpt_truncates_long_text():
    collector = RSSCollector(name="Decanter", feed_url=FEED_URL)
    long_summary = "x" * 1200
    entry = _make_entry(summary=long_summary)
    excerpt = collector._extract_excerpt(entry)
    assert len(excerpt) <= 500


def test_collect_returns_validated_articles():
    collector = RSSCollector(name="Decanter", feed_url=FEED_URL)

    good_entry = _make_entry()
    # Missing title -> should be skipped by validation.
    bad_entry = _make_entry(title="")
    # Missing link -> should be skipped by validation.
    bad_entry2 = _make_entry()
    del bad_entry2["link"]

    fake_feed = SimpleNamespace(
        entries=[good_entry, bad_entry, bad_entry2],
        bozo=0,
    )

    with mock.patch("collectors.rss_collector.feedparser.parse", return_value=fake_feed) as mocked:
        articles = collector.collect()
        mocked.assert_called_once_with(FEED_URL)

    # Only the one valid entry survives.
    assert len(articles) == 1
    article = articles[0]

    # All required schema fields present and non-empty.
    for field in RSSCollector.REQUIRED_FIELDS:
        assert field in article
        assert article[field]

    assert article["source_name"] == "Decanter"
    assert article["article_url"] == "https://www.decanter.com/news/example-article"
    assert article["content_type"] == "news"
    assert article["author"] == "Decanter Staff"
    assert "collected_date" in article
    assert len(article["content_excerpt"]) <= 500


def test_collect_handles_parse_failure_gracefully():
    """A network/parse exception should not crash collect()."""
    collector = RSSCollector(name="Decanter", feed_url=FEED_URL)
    with mock.patch(
        "collectors.rss_collector.feedparser.parse",
        side_effect=Exception("network down"),
    ):
        articles = collector.collect()
    assert articles == []
