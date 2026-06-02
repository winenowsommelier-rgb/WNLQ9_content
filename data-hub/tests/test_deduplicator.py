"""Tests for Deduplicator (Task 5, TDD).

Written BEFORE the implementation. The Deduplicator removes duplicate
articles by canonical URL (and, separately, by normalized title).
"""

from processors.deduplicator import Deduplicator


def _article(url, title="Some Title"):
    """Minimal article dict for dedup tests."""
    return {"article_url": url, "title": title}


def test_removes_duplicate_urls():
    dedup = Deduplicator()
    articles = [
        _article("https://example.com/a", title="First"),
        _article("https://example.com/a", title="Duplicate of first"),
    ]
    result = dedup.deduplicate(articles)
    assert len(result) == 1
    # First occurrence is kept.
    assert result[0]["title"] == "First"


def test_preserves_order():
    dedup = Deduplicator()
    articles = [
        _article("https://example.com/a"),
        _article("https://example.com/b"),
        _article("https://example.com/c"),
        _article("https://example.com/b"),  # dup of b
    ]
    result = dedup.deduplicate(articles)
    urls = [a["article_url"] for a in result]
    assert urls == [
        "https://example.com/a",
        "https://example.com/b",
        "https://example.com/c",
    ]


def test_handles_empty_list():
    dedup = Deduplicator()
    assert dedup.deduplicate([]) == []


def test_handles_missing_url():
    """An article without article_url must not crash deduplicate()."""
    dedup = Deduplicator()
    articles = [
        {"title": "No URL here"},
        _article("https://example.com/a"),
        {"title": "Also no URL"},
    ]
    result = dedup.deduplicate(articles)
    # All three are kept (the two URL-less ones are not collapsed together).
    assert len(result) == 3


def test_trailing_slash_collapses():
    """https://x/ and https://x are the same article."""
    dedup = Deduplicator()
    result = dedup.deduplicate([
        _article("https://example.com/a/", title="First"),
        _article("https://example.com/a", title="Dup"),
    ])
    assert len(result) == 1
    # Original URL of the first occurrence is preserved untouched.
    assert result[0]["article_url"] == "https://example.com/a/"


def test_utm_variants_collapse():
    """Two articles differing only by a utm param collapse to one."""
    dedup = Deduplicator()
    result = dedup.deduplicate([
        _article("https://example.com/a?utm_source=rss", title="First"),
        _article("https://example.com/a", title="Dup"),
    ])
    assert len(result) == 1
    assert result[0]["article_url"] == "https://example.com/a?utm_source=rss"


def test_non_tracking_params_kept_distinct():
    """URLs differing by a meaningful param are NOT collapsed."""
    dedup = Deduplicator()
    result = dedup.deduplicate([
        _article("https://example.com/a?page=1"),
        _article("https://example.com/a?page=2"),
    ])
    assert len(result) == 2


def test_malformed_url_does_not_crash_dedup():
    dedup = Deduplicator()
    result = dedup.deduplicate([
        _article("not a url"),
        _article("https://example.com/a"),
    ])
    assert len(result) == 2


def test_deduplicate_by_title():
    """Same normalized title with different URLs collapses to the first."""
    dedup = Deduplicator()
    articles = [
        _article("https://example.com/a", title="2024 Bordeaux Report"),
        _article("https://other.com/x", title="2024 bordeaux report  "),
        _article("https://example.com/b", title="A Different Article"),
    ]
    result = dedup.deduplicate_by_title(articles)
    assert len(result) == 2
    assert result[0]["article_url"] == "https://example.com/a"
    assert result[1]["title"] == "A Different Article"
