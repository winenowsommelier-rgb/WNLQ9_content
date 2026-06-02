"""Tests for the SitemapCollector (TDD).

Written BEFORE the implementation. Every test mocks ``_fetch`` (or
``requests.get``) so NO test touches the live network. Date-window tests
inject a fixed ``reference_date`` for full determinism.

The sitemap XML fixtures intentionally use the standard sitemap namespace
(``http://www.sitemaps.org/schemas/sitemap/0.9``) so the collector's
namespace handling is exercised.
"""

from __future__ import annotations

import datetime

import pytest

from collectors.sitemap_collector import SitemapCollector


# A fixed reference "today" so date-window tests are fully deterministic.
REFERENCE_DATE = datetime.datetime(2026, 6, 1, tzinfo=datetime.timezone.utc)

SM_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"


def _urlset(entries):
    """Build a namespaced <urlset> XML string from (loc, lastmod) tuples.

    A ``lastmod`` of ``None`` omits the element entirely.
    """
    parts = [f'<urlset xmlns="{SM_NS}">']
    for loc, lastmod in entries:
        parts.append("  <url>")
        parts.append(f"    <loc>{loc}</loc>")
        if lastmod is not None:
            parts.append(f"    <lastmod>{lastmod}</lastmod>")
        parts.append("  </url>")
    parts.append("</urlset>")
    return "\n".join(parts)


def _sitemapindex(children):
    """Build a namespaced <sitemapindex> XML string from (loc, lastmod)."""
    parts = [f'<sitemapindex xmlns="{SM_NS}">']
    for loc, lastmod in children:
        parts.append("  <sitemap>")
        parts.append(f"    <loc>{loc}</loc>")
        if lastmod is not None:
            parts.append(f"    <lastmod>{lastmod}</lastmod>")
        parts.append("  </sitemap>")
    parts.append("</sitemapindex>")
    return "\n".join(parts)


def _collector(**kwargs):
    """Build a SitemapCollector with sane defaults and a fixed reference."""
    defaults = dict(
        name="Test Sitemap",
        sitemap_url="https://example.com/sitemap_index.xml",
        months_back=12,
        reference_date=REFERENCE_DATE,
    )
    defaults.update(kwargs)
    return SitemapCollector(**defaults)


# -- _title_from_url ---------------------------------------------------------


def test_title_from_url_derives_slug():
    """The last meaningful path segment becomes a title-cased title."""
    c = _collector()
    assert (
        c._title_from_url("https://www.thespiritsbusiness.com/2011/03/rum-masters-2011/")
        == "Rum Masters 2011"
    )
    assert (
        c._title_from_url("https://punchdrink.com/articles/all-of-the-wine-and-always/")
        == "All Of The Wine And Always"
    )


# -- urlset parsing ----------------------------------------------------------


def test_parse_urlset_extracts_entries(monkeypatch):
    """A direct urlset with 3 <url> entries yields 3 articles."""
    xml = _urlset([
        ("https://example.com/articles/first-story/", "2026-05-20T10:00:00Z"),
        ("https://example.com/articles/second-story/", "2026-05-10T10:00:00Z"),
        ("https://example.com/articles/third-story/", "2026-04-30T10:00:00Z"),
    ])
    c = _collector(sitemap_url="https://example.com/article-sitemap.xml")
    monkeypatch.setattr(c, "_fetch", lambda url: xml)

    articles = c.collect()

    assert len(articles) == 3
    urls = {a["article_url"] for a in articles}
    assert urls == {
        "https://example.com/articles/first-story/",
        "https://example.com/articles/second-story/",
        "https://example.com/articles/third-story/",
    }
    by_url = {a["article_url"]: a for a in articles}
    first = by_url["https://example.com/articles/first-story/"]
    assert first["title"] == "First Story"
    assert first["published_date"] == "2026-05-20T10:00:00Z"
    assert first["content_excerpt"] == ""
    assert first["content_type"] == "news"
    assert first["source_name"] == "Test Sitemap"


# -- index recursion ---------------------------------------------------------


def test_index_recurses_into_children(monkeypatch):
    """A sitemapindex with 2 child sitemaps aggregates URLs from both."""
    index = _sitemapindex([
        ("https://example.com/article-sitemap.xml", "2026-05-25T00:00:00Z"),
        ("https://example.com/article-sitemap2.xml", "2026-05-20T00:00:00Z"),
    ])
    child1 = _urlset([
        ("https://example.com/articles/a/", "2026-05-25T00:00:00Z"),
    ])
    child2 = _urlset([
        ("https://example.com/articles/b/", "2026-05-20T00:00:00Z"),
    ])

    responses = {
        "https://example.com/sitemap_index.xml": index,
        "https://example.com/article-sitemap.xml": child1,
        "https://example.com/article-sitemap2.xml": child2,
    }
    c = _collector(child_pattern="article-sitemap")
    monkeypatch.setattr(c, "_fetch", lambda url: responses.get(url, ""))

    articles = c.collect()

    urls = {a["article_url"] for a in articles}
    assert urls == {
        "https://example.com/articles/a/",
        "https://example.com/articles/b/",
    }


# -- date windowing ----------------------------------------------------------


def test_date_window_filters_old_urls(monkeypatch):
    """URLs lastmod ~18 months ago are dropped; ~1 month ago kept."""
    xml = _urlset([
        ("https://example.com/articles/recent/", "2026-05-01T00:00:00Z"),
        ("https://example.com/articles/ancient/", "2024-12-01T00:00:00Z"),
    ])
    c = _collector(sitemap_url="https://example.com/article-sitemap.xml")
    monkeypatch.setattr(c, "_fetch", lambda url: xml)

    articles = c.collect()

    urls = {a["article_url"] for a in articles}
    assert urls == {"https://example.com/articles/recent/"}


def test_child_sitemap_lastmod_skips_old(monkeypatch):
    """An index child whose lastmod is outside the window is NOT fetched."""
    index = _sitemapindex([
        ("https://example.com/article-sitemap.xml", "2026-05-25T00:00:00Z"),
        ("https://example.com/article-sitemap-old.xml", "2024-01-01T00:00:00Z"),
    ])
    child_recent = _urlset([
        ("https://example.com/articles/a/", "2026-05-25T00:00:00Z"),
    ])

    fetched = []

    def fake_fetch(url):
        fetched.append(url)
        if url == "https://example.com/sitemap_index.xml":
            return index
        if url == "https://example.com/article-sitemap.xml":
            return child_recent
        return ""

    c = _collector(child_pattern="article-sitemap")
    monkeypatch.setattr(c, "_fetch", fake_fetch)

    articles = c.collect()

    # The old child was never fetched.
    assert "https://example.com/article-sitemap-old.xml" not in fetched
    urls = {a["article_url"] for a in articles}
    assert urls == {"https://example.com/articles/a/"}


def test_max_child_sitemaps_cap(monkeypatch):
    """With 20 children and a cap of 3, only 3 children (+index) are fetched."""
    children = [
        (f"https://example.com/article-sitemap{i}.xml",
         "2026-05-20T00:00:00Z")
        for i in range(20)
    ]
    index = _sitemapindex(children)

    fetched = []

    def fake_fetch(url):
        fetched.append(url)
        if url == "https://example.com/sitemap_index.xml":
            return index
        # Each child returns one fresh URL.
        return _urlset([(url.replace(".xml", "/article/"),
                         "2026-05-20T00:00:00Z")])

    c = _collector(child_pattern="article-sitemap", max_child_sitemaps=3)
    monkeypatch.setattr(c, "_fetch", fake_fetch)

    c.collect()

    # index + 3 children = 4 total fetches.
    assert len(fetched) == 4
    child_fetches = [u for u in fetched if u != "https://example.com/sitemap_index.xml"]
    assert len(child_fetches) == 3


# -- non-article URL skipping ------------------------------------------------


def test_skips_nonarticle_urls(monkeypatch):
    """Category/tag/author/empty-slug URLs are skipped."""
    xml = _urlset([
        ("https://example.com/articles/real-story/", "2026-05-20T00:00:00Z"),
        ("https://example.com/category/wine/", "2026-05-20T00:00:00Z"),
        ("https://example.com/tag/whisky/", "2026-05-20T00:00:00Z"),
        ("https://example.com/author/jane-doe/", "2026-05-20T00:00:00Z"),
        ("https://example.com/", "2026-05-20T00:00:00Z"),
    ])
    c = _collector(sitemap_url="https://example.com/article-sitemap.xml")
    monkeypatch.setattr(c, "_fetch", lambda url: xml)

    articles = c.collect()

    urls = {a["article_url"] for a in articles}
    assert urls == {"https://example.com/articles/real-story/"}


# -- fail-soft ---------------------------------------------------------------


def test_fetch_failure_failsoft(monkeypatch):
    """When _fetch returns '' (network failure), collect() returns []."""
    c = _collector()
    monkeypatch.setattr(c, "_fetch", lambda url: "")

    assert c.collect() == []


# -- undated URLs ------------------------------------------------------------


def test_undated_urls_kept(monkeypatch):
    """A <url> with no <lastmod> is kept (cannot be date-filtered)."""
    xml = _urlset([
        ("https://example.com/articles/undated-story/", None),
        ("https://example.com/articles/dated-story/", "2026-05-20T00:00:00Z"),
    ])
    c = _collector(sitemap_url="https://example.com/article-sitemap.xml")
    monkeypatch.setattr(c, "_fetch", lambda url: xml)

    articles = c.collect()

    urls = {a["article_url"] for a in articles}
    assert "https://example.com/articles/undated-story/" in urls
    assert "https://example.com/articles/dated-story/" in urls
