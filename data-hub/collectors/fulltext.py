"""Full-text excerpt extraction for the Content Trend Data Hub.

87% of stored articles (mainly the sitemap-backfilled rows) arrive with only a
slug-derived title and an EMPTY ``content_excerpt``. With no body text the
keyword categorizer can't detect region / spirits_type / trend_signals, so
``topic_region`` is ~85% "Other". This module fetches each article's REAL page
text -- the publisher's own meta description or first substantial paragraph --
so the existing categorizer has something to classify. There is NO LLM here:
pure HTTP + BeautifulSoup.

Two functions:

* :func:`extract_excerpt` -- PURE: given page HTML, return the best excerpt,
  preferring og:description > name=description > twitter:description, then the
  first substantial ``<p>`` in ``<article>``/``<main>``/body. Fail-soft: "".
* :func:`fetch_excerpt` -- fetch a URL (requests + sane UA + timeout, wrapped
  in :func:`collectors.retry.retry_call`, fail-soft) then extract. The
  ``fetcher`` is injectable so tests never touch the network.

Heavy per-article page fetching belongs HERE (driven by
``scripts/enrich_excerpts.py``), NOT in the live daily ingest, which must stay
fast.
"""

from __future__ import annotations

import re
from typing import Callable, Optional

import requests
from bs4 import BeautifulSoup

from collectors.retry import retry_call

# Cap stored excerpts so one verbose page can't bloat a row (matches the
# collectors' EXCERPT_MAX_CHARS convention).
EXCERPT_MAX_CHARS = 500

# A meta description shorter than this is treated as too thin to be useful as
# the article excerpt; ditto the minimum length for a "substantial" paragraph.
_MIN_PARAGRAPH_CHARS = 40

# Polite, identifiable UA + timeout (mirrors WebScraper).
REQUEST_TIMEOUT = 15
USER_AGENT = (
    "Mozilla/5.0 (compatible; ContentTrendDataHub/1.0; "
    "+https://www.wine-now.com/bot)"
)

# Retry policy for the fetch (small backoff; retry_call's sleep is injectable
# elsewhere, but here failures simply fall soft to "").
RETRY_ATTEMPTS = 2
RETRY_BACKOFF_SECONDS = 1.0

# Meta tags to try, in priority order: (attribute, value).
_META_SOURCES = (
    ("property", "og:description"),
    ("name", "description"),
    ("name", "twitter:description"),
)

# Containers (and their descendants) that are boilerplate, never body text.
_BOILERPLATE_TAGS = ("nav", "header", "footer", "aside", "form")


def _clean_text(text: Optional[str]) -> str:
    """Trim whitespace and collapse internal runs of whitespace ('' if empty)."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def _truncate(text: str) -> str:
    """Truncate to EXCERPT_MAX_CHARS (already-clean text)."""
    if len(text) > EXCERPT_MAX_CHARS:
        return text[:EXCERPT_MAX_CHARS]
    return text


def _meta_excerpt(soup: BeautifulSoup) -> str:
    """Return the best meta-description excerpt, or '' if none usable."""
    for attr, value in _META_SOURCES:
        tag = soup.find("meta", attrs={attr: value})
        if tag is None:
            continue
        content = _clean_text(tag.get("content"))
        if content:
            return content
    return ""


def _first_paragraph_excerpt(soup: BeautifulSoup) -> str:
    """Return the first substantial <p> in article/main/body, skipping chrome."""
    # Prefer the semantic article/main region; fall back to the whole body.
    root = soup.find("article") or soup.find("main") or soup.body or soup
    for paragraph in root.find_all("p"):
        # Skip paragraphs that live inside nav/header/footer/aside/form.
        if paragraph.find_parent(_BOILERPLATE_TAGS) is not None:
            continue
        text = _clean_text(paragraph.get_text())
        if len(text) >= _MIN_PARAGRAPH_CHARS:
            return text
    return ""


def extract_excerpt(html: str) -> str:
    """Return the best plain-text excerpt from page ``html`` (pure, fail-soft).

    Preference order:
      1. ``<meta property="og:description">``
      2. ``<meta name="description">``
      3. ``<meta name="twitter:description">``
      4. the first substantial ``<p>`` (>= ~40 chars) inside ``<article>`` /
         ``<main>`` / ``<body>``, skipping nav/header/footer/aside/form chrome.

    The result is HTML-stripped, whitespace-collapsed and truncated to
    ``EXCERPT_MAX_CHARS``. Returns "" when nothing usable is found, on empty
    input, or on any parse error (never raises).
    """
    if not html:
        return ""
    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception:  # noqa: BLE001 -- malformed markup must never crash a batch
        return ""

    excerpt = _meta_excerpt(soup) or _first_paragraph_excerpt(soup)
    return _truncate(excerpt)


def _http_get(url: str) -> str:
    """GET ``url`` with a sane User-Agent and timeout; return the body text."""
    response = requests.get(
        url,
        headers={"User-Agent": USER_AGENT},
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.text or ""


def fetch_excerpt(
    url: str,
    fetcher: Optional[Callable[[str], str]] = None,
) -> str:
    """Fetch ``url`` and return its extracted excerpt (fail-soft -> "").

    ``fetcher`` is an injectable single-arg callable returning page HTML; it
    defaults to a real HTTP GET wrapped in :func:`retry_call`. Tests pass a
    fetcher that returns canned HTML (or raises) so the network is never hit.

    Any fetch failure (timeout, HTTP error, raising fetcher) returns "" rather
    than propagating, so a dead URL never crashes the enrichment pass.
    """
    if not url:
        return ""
    fetch = fetcher or _http_get
    html = retry_call(
        lambda: fetch(url),
        attempts=RETRY_ATTEMPTS,
        backoff_seconds=RETRY_BACKOFF_SECONDS,
        fallback="",
    )
    if not html:
        return ""
    return extract_excerpt(html)
