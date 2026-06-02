"""Sitemap collector for the Content Trend Data Hub.

Where :class:`RSSCollector` can only reach the most recent ~20-50 items a
feed exposes, XML sitemaps list *every* article URL a site has ever
published -- often with a ``<lastmod>`` date -- so they let the historical
backfill reach YEARS back instead of ~1 month.

This collector handles both shapes of the standard sitemap protocol
(https://www.sitemaps.org/protocol.html):

* a **sitemap index** (``<sitemapindex>``) listing child sitemaps, and
* a **urlset** (``<urlset>``) listing article URLs directly.

Given an index, it filters child sitemaps to the ones that look like article
sitemaps (``child_pattern`` or the default post/article heuristic), skips
children whose ``<lastmod>`` is already older than the date window, sorts the
rest newest-first, and recurses one level into up to ``max_child_sitemaps`` of
them. Article titles are derived from the URL slug since sitemaps carry no
text -- the downstream categorizer works on titles, so an empty excerpt is
fine.

Confirmed live (2026-06-02):
  * The Spirits Business -- sitemap_index.xml -> post-sitemap*.xml (back to 2011)
  * Punch -- sitemap_index.xml -> article-sitemap*.xml (2013->2026)
  * Decanter -- sitemap_index.xml (327 child sitemaps)

Sitemaps are crawled ONLY by the backfill pipeline, never the daily ingest.

Uses only the Python stdlib ``xml.etree.ElementTree`` for parsing (matching
by local-name so the sitemap XML namespace is handled transparently) and
``requests`` for fetching. Fail-soft throughout: a bad child sitemap is
skipped, never crashes the run.
"""

from __future__ import annotations

import datetime
import logging
import re
from typing import Dict, List, Optional
from urllib.parse import urlparse
from xml.etree import ElementTree as ET

import requests
from dateutil import parser as date_parser

from collectors.base_collector import BaseCollector
from collectors.retry import retry_call

logger = logging.getLogger("collectors.sitemap")

# Average days per month -> cutoff date (matches BackfillPipeline's math).
_DAYS_PER_MONTH = 30.44

# Path prefixes that mark a non-article listing/index page to skip.
_NONARTICLE_SEGMENTS = frozenset(
    {"category", "tag", "author", "page", "tags", "categories", "authors"}
)


class SitemapCollector(BaseCollector):
    """Collect article URLs from an XML sitemap (index or urlset).

    Parameters
    ----------
    name:
        Source name (used for ``source_name`` enrichment).
    sitemap_url:
        A sitemap index OR a direct urlset sitemap.
    months_back:
        Trailing date window to keep, in months (default 12).
    reference_date:
        Fixed "now" for deterministic date windowing. ``None`` -> real now.
    child_pattern:
        Optional substring/regex selecting which child sitemaps to crawl
        (e.g. ``"post-sitemap"`` / ``"article-sitemap"``). When ``None``,
        children whose loc contains "post" or "article" are crawled.
    max_child_sitemaps:
        Safety cap on how many child sitemaps to fetch (default 12). Capping
        is logged.
    """

    DEFAULT_CONTENT_TYPE = "news"
    REQUEST_TIMEOUT = 20
    # Fetch retry policy (overridable per instance); injectable sleep keeps
    # tests fast.
    RETRY_ATTEMPTS = 3
    RETRY_BACKOFF_SECONDS = 2.0
    USER_AGENT = (
        "Mozilla/5.0 (compatible; ContentTrendDataHub/1.0; "
        "+https://www.wine-now.com/bot)"
    )

    def __init__(
        self,
        name: str,
        sitemap_url: str,
        months_back: int = 12,
        reference_date: Optional[datetime.datetime] = None,
        child_pattern: Optional[str] = None,
        max_child_sitemaps: int = 12,
        vertical: Optional[str] = None,
        geo_focus: Optional[str] = None,
    ) -> None:
        super().__init__(
            name=name,
            source_config={"sitemap_url": sitemap_url},
            vertical=vertical,
            geo_focus=geo_focus,
        )
        self.sitemap_url = sitemap_url
        self.months_back = months_back
        self.reference_date = reference_date
        self.child_pattern = child_pattern
        self.max_child_sitemaps = max_child_sitemaps

    # -- main entry point -----------------------------------------------

    def collect(self) -> List[Dict]:
        """Crawl the sitemap (index or urlset) into validated articles."""
        cutoff = self._cutoff()

        text = self._fetch(self.sitemap_url)
        if not text:
            # Network failure / empty response -- fail soft.
            return []

        root = self._parse(text)
        if root is None:
            return []

        tag = self._localname(root.tag)

        if tag == "sitemapindex":
            url_entries = self._collect_from_index(root, cutoff)
        elif tag == "urlset":
            url_entries = self._extract_url_entries(root)
        else:
            logger.warning(
                "Sitemap %r has unexpected root <%s>; skipping",
                self.sitemap_url, tag,
            )
            return []

        return self._build_articles(url_entries, cutoff)

    # -- index handling -------------------------------------------------

    def _collect_from_index(self, root, cutoff) -> List[Dict]:
        """Select, sort, cap, and recurse into child sitemaps of an index."""
        children = []  # list of (loc, parsed_lastmod_or_None)
        for sitemap_el in self._iter_local(root, "sitemap"):
            loc = self._child_text(sitemap_el, "loc")
            if not loc:
                continue
            if not self._matches_child_pattern(loc):
                continue
            lastmod_raw = self._child_text(sitemap_el, "lastmod")
            parsed = self._parse_iso(lastmod_raw)
            # Skip children whose lastmod is already outside the window.
            if parsed is not None and parsed < cutoff:
                logger.info(
                    "Skipping child sitemap %r: lastmod %s older than cutoff %s",
                    loc, parsed.date().isoformat(), cutoff.date().isoformat(),
                )
                continue
            children.append((loc, parsed))

        # Newest-first so the most recent are crawled within the cap.
        # Undated children (None) sort last but are still kept.
        _min = datetime.datetime.min.replace(tzinfo=datetime.timezone.utc)
        children.sort(key=lambda c: c[1] or _min, reverse=True)

        if len(children) > self.max_child_sitemaps:
            logger.info(
                "Index %r has %d matching child sitemaps; capping to %d",
                self.sitemap_url, len(children), self.max_child_sitemaps,
            )
            children = children[: self.max_child_sitemaps]

        entries: List[Dict] = []
        for loc, _ in children:
            child_text = self._fetch(loc)
            if not child_text:
                continue
            child_root = self._parse(child_text)
            if child_root is None:
                continue
            # One level only: only recurse into child urlsets.
            if self._localname(child_root.tag) != "urlset":
                logger.info("Child sitemap %r is not a urlset; skipping", loc)
                continue
            entries.extend(self._extract_url_entries(child_root))

        return entries

    def _matches_child_pattern(self, loc: str) -> bool:
        """Whether a child sitemap loc should be crawled."""
        if self.child_pattern:
            try:
                return re.search(self.child_pattern, loc) is not None
            except re.error:
                # Treat an invalid regex as a plain substring match.
                return self.child_pattern in loc
        lowered = loc.lower()
        return "post" in lowered or "article" in lowered

    # -- urlset handling ------------------------------------------------

    def _extract_url_entries(self, root) -> List[Dict]:
        """Pull (loc, lastmod) dicts out of a <urlset> root."""
        entries: List[Dict] = []
        for url_el in self._iter_local(root, "url"):
            loc = self._child_text(url_el, "loc")
            if not loc:
                continue
            entries.append({
                "loc": loc,
                "lastmod": self._child_text(url_el, "lastmod"),
            })
        return entries

    # -- article building -----------------------------------------------

    def _build_articles(self, entries: List[Dict], cutoff) -> List[Dict]:
        """Filter by date window + article-shape, then build/validate dicts."""
        articles: List[Dict] = []
        undated = 0
        skipped_nonarticle = 0

        for entry in entries:
            loc = entry["loc"]

            if not self._is_article_url(loc):
                skipped_nonarticle += 1
                continue

            lastmod_raw = entry.get("lastmod")
            parsed = self._parse_iso(lastmod_raw)

            if parsed is None:
                # No usable date -- keep (downstream filter keeps undated too).
                undated += 1
            elif parsed < cutoff:
                # Dated and outside the window -- drop.
                continue

            article = {
                "article_url": loc,
                "title": self._title_from_url(loc),
                "published_date": self._parse_date(lastmod_raw),
                "content_excerpt": "",
                "content_type": self.DEFAULT_CONTENT_TYPE,
            }
            article = self.enrich_article(article)

            if self._validate_article(article):
                articles.append(article)

        if undated:
            logger.info(
                "Sitemap %r: kept %d undated URL(s) (no lastmod)",
                self.sitemap_url, undated,
            )
        if skipped_nonarticle:
            logger.info(
                "Sitemap %r: skipped %d non-article URL(s)",
                self.sitemap_url, skipped_nonarticle,
            )
        return articles

    def _validate_article(self, article: Dict) -> bool:
        """Validate a sitemap article, allowing an empty ``content_excerpt``.

        Sitemaps carry no article text, so ``content_excerpt`` is legitimately
        empty here (the downstream categorizer works on the title). Every other
        required field must still be present and non-empty -- the slug-derived
        title guarantees that.
        """
        if not isinstance(article, dict):
            return False
        for field in self.REQUIRED_FIELDS:
            if field == "content_excerpt":
                # Excerpt is allowed to be an empty string for sitemaps; it
                # just must be present (and a string).
                if not isinstance(article.get(field), str):
                    return False
                continue
            value = article.get(field)
            if value is None:
                return False
            if isinstance(value, str) and value.strip() == "":
                return False
        return True

    # -- url helpers ----------------------------------------------------

    @staticmethod
    def _is_article_url(url: str) -> bool:
        """Reject category/tag/author/page indexes and slugless URLs."""
        try:
            path = urlparse(url).path
        except (ValueError, TypeError):
            return False
        segments = [s for s in path.split("/") if s]
        if not segments:
            # Bare domain / empty slug.
            return False
        for seg in segments:
            if seg.lower() in _NONARTICLE_SEGMENTS:
                return False
        return True

    @classmethod
    def _title_from_url(cls, url: str) -> str:
        """Derive a human title from the URL slug (last meaningful segment).

        ``/2011/03/rum-masters-2011/`` -> "Rum Masters 2011". Hyphens and
        underscores become spaces; purely numeric segments (date parts) are
        skipped when choosing the slug; the result is title-cased.
        """
        try:
            path = urlparse(url).path
        except (ValueError, TypeError):
            return ""
        segments = [s for s in path.split("/") if s]
        # Pick the last segment that is not purely digits (skip /2011/03/).
        slug = ""
        for seg in reversed(segments):
            if not seg.isdigit():
                slug = seg
                break
        if not slug:
            return ""
        words = re.sub(r"[-_]+", " ", slug)
        words = re.sub(r"\s+", " ", words).strip()
        return words.title()

    # -- date helpers ---------------------------------------------------

    def _cutoff(self) -> datetime.datetime:
        """The oldest allowed published date, given months_back/reference."""
        ref = self.reference_date or datetime.datetime.now(datetime.timezone.utc)
        ref = self._ensure_aware(ref)
        return ref - datetime.timedelta(days=_DAYS_PER_MONTH * self.months_back)

    def _parse_date(self, date_str) -> str:
        """Parse a lastmod string to ISO 8601 (UTC, 'Z'-suffixed).

        Falls back to the current collection time on empty/unparseable input
        so downstream code always receives a usable string.
        """
        parsed = self._parse_iso(date_str)
        if parsed is not None:
            return parsed.strftime("%Y-%m-%dT%H:%M:%SZ")
        return self._utc_now_iso()

    @classmethod
    def _parse_iso(cls, value) -> Optional[datetime.datetime]:
        """Parse a date string into an aware UTC datetime, or None."""
        if not value or not isinstance(value, str):
            return None
        try:
            dt = date_parser.parse(value)
        except (ValueError, OverflowError, TypeError):
            return None
        return cls._ensure_aware(dt)

    @staticmethod
    def _ensure_aware(dt: datetime.datetime) -> datetime.datetime:
        """Normalize a datetime to timezone-aware UTC (assume UTC if naive)."""
        if dt.tzinfo is None:
            return dt.replace(tzinfo=datetime.timezone.utc)
        return dt.astimezone(datetime.timezone.utc)

    # -- xml / fetch helpers --------------------------------------------

    def _fetch(self, url: str) -> str:
        """GET ``url`` with a sane User-Agent and timeout.

        Retries transient failures with backoff, then returns the response
        body, or '' once retries are exhausted so the caller can fail soft.
        """
        def _do_fetch() -> str:
            response = requests.get(
                url,
                headers={"User-Agent": self.USER_AGENT},
                timeout=self.REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            return response.text or ""

        text = retry_call(
            _do_fetch,
            attempts=self.RETRY_ATTEMPTS,
            backoff_seconds=self.RETRY_BACKOFF_SECONDS,
            fallback="",
        )
        if not text:
            logger.warning("Failed to fetch sitemap %r after retries", url)
        return text

    @staticmethod
    def _parse(text: str):
        """Parse XML text into an Element root, or None on malformed XML."""
        try:
            return ET.fromstring(text)
        except ET.ParseError as exc:
            logger.warning("Failed to parse sitemap XML: %s", exc)
            return None

    @staticmethod
    def _localname(tag: str) -> str:
        """Strip any ``{namespace}`` prefix from an element tag."""
        if "}" in tag:
            return tag.rsplit("}", 1)[1]
        return tag

    @classmethod
    def _iter_local(cls, parent, local: str):
        """Yield direct children of ``parent`` whose local-name == ``local``."""
        for child in parent:
            if cls._localname(child.tag) == local:
                yield child

    @classmethod
    def _child_text(cls, parent, local: str) -> str:
        """Return stripped text of the first child with local-name ``local``."""
        for child in parent:
            if cls._localname(child.tag) == local:
                return (child.text or "").strip()
        return ""
