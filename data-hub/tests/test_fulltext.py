"""Tests for the full-text excerpt extractor, written TDD-first.

``collectors/fulltext.py`` fetches a published article's real page text so the
keyword categorizer has something to classify (87% of backfilled rows arrive
with only a slug-derived title and an EMPTY ``content_excerpt``). There is NO
LLM here -- just BeautifulSoup over the publisher's own meta description /
first paragraph.

These tests never hit the network: :func:`fetch_excerpt` takes an injectable
``fetcher`` so HTML is supplied directly, and the failure path is exercised by
a fetcher that raises. :func:`extract_excerpt` is a pure function over HTML.
"""

from __future__ import annotations

from collectors.fulltext import extract_excerpt, fetch_excerpt


# -- extract_excerpt: meta tags --------------------------------------------


def test_prefers_og_description():
    """og:description wins over name=description and twitter:description."""
    html = """
    <html><head>
      <meta property="og:description" content="A deep dive into Napa Cabernet.">
      <meta name="description" content="Generic site description.">
      <meta name="twitter:description" content="Twitter blurb.">
    </head><body><article><p>Body paragraph that is long enough to qualify.</p></article></body></html>
    """
    assert extract_excerpt(html) == "A deep dive into Napa Cabernet."


def test_falls_back_to_meta_description():
    """With no og:description, name=description is used."""
    html = """
    <html><head>
      <meta name="description" content="The standard meta description here.">
    </head><body><p>Some other text.</p></body></html>
    """
    assert extract_excerpt(html) == "The standard meta description here."


def test_falls_back_to_twitter_description():
    """With no og/name description, twitter:description is used."""
    html = """
    <html><head>
      <meta name="twitter:description" content="Only the twitter card blurb.">
    </head><body></body></html>
    """
    assert extract_excerpt(html) == "Only the twitter card blurb."


# -- extract_excerpt: first paragraph fallback ------------------------------


def test_falls_back_to_first_substantial_paragraph():
    """With no usable meta tags, the first substantial <p> is used."""
    html = """
    <html><head></head><body>
      <nav><p>Home</p></nav>
      <article>
        <p>Short.</p>
        <p>This is the first genuinely substantial paragraph of the article body.</p>
      </article>
    </body></html>
    """
    assert extract_excerpt(html) == (
        "This is the first genuinely substantial paragraph of the article body."
    )


def test_blank_meta_description_skipped_for_first_paragraph():
    """An empty description attribute does not block the paragraph fallback."""
    html = """
    <html><head>
      <meta name="description" content="">
    </head><body><main>
      <p>This substantial main paragraph should be picked up as the excerpt.</p>
    </main></body></html>
    """
    assert extract_excerpt(html) == (
        "This substantial main paragraph should be picked up as the excerpt."
    )


# -- extract_excerpt: nothing usable ----------------------------------------


def test_returns_empty_on_junk():
    """Boilerplate-only / no usable text -> ''."""
    html = "<html><head></head><body><nav><p>Menu</p></nav></body></html>"
    assert extract_excerpt(html) == ""


def test_returns_empty_on_empty_input():
    """Empty / None input -> '' (never raises)."""
    assert extract_excerpt("") == ""
    assert extract_excerpt(None) == ""  # type: ignore[arg-type]


# -- extract_excerpt: truncation + whitespace -------------------------------


def test_truncates_to_500_chars():
    """A very long excerpt is truncated to 500 characters."""
    long_text = "x " * 600  # ~1200 chars
    html = f'<html><head><meta property="og:description" content="{long_text}"></head><body></body></html>'
    result = extract_excerpt(html)
    assert len(result) <= 500


def test_collapses_whitespace():
    """Internal whitespace runs are collapsed and the text is stripped."""
    html = (
        '<html><head><meta property="og:description" '
        'content="  Spaced    out\n\ttext here.  "></head><body></body></html>'
    )
    assert extract_excerpt(html) == "Spaced out text here."


# -- fetch_excerpt: injectable fetcher, fail-soft ---------------------------


def test_fetch_excerpt_uses_injected_fetcher_no_network():
    """fetch_excerpt extracts from the injected fetcher's HTML (no network)."""
    html = (
        '<html><head><meta property="og:description" '
        'content="Fetched without touching the network."></head><body></body></html>'
    )
    calls = []

    def fake_fetcher(url):
        calls.append(url)
        return html

    result = fetch_excerpt("https://example.com/article", fetcher=fake_fetcher)
    assert result == "Fetched without touching the network."
    assert calls == ["https://example.com/article"]


def test_fetch_excerpt_fail_soft_on_fetch_error():
    """A fetcher that raises -> '' (never propagates)."""
    def boom(url):
        raise RuntimeError("network down")

    assert fetch_excerpt("https://example.com/x", fetcher=boom) == ""


def test_fetch_excerpt_empty_html_returns_empty():
    """A fetcher returning '' -> '' (nothing to extract)."""
    assert fetch_excerpt("https://example.com/x", fetcher=lambda u: "") == ""
