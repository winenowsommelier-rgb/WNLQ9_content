"""RSS feed collector for the Content Trend Data Hub.

Fetches and parses RSS/Atom feeds via feedparser, mapping each entry into a
dict that conforms to the Content Hub schema (data-schema.md). Tier-1 targets
include Decanter (https://www.decanter.com/feed/) and The Spirits Business
(https://www.thespiritsbusiness.com/feed/).

Most RSS entries already carry a summary/description, so the excerpt is
extracted inline here and the live daily ingest stays fast -- it deliberately
does NOT fetch each article's full page. Bulk excerpt backfill for rows that
arrived without text (e.g. sitemap-collected) is handled out-of-band by
``scripts/enrich_excerpts.py``.
"""

from __future__ import annotations

import datetime
import logging
import re
from typing import Dict, List

import feedparser
from dateutil import parser as date_parser

from collectors.base_collector import BaseCollector
from collectors.retry import retry_call

logger = logging.getLogger("collectors.rss")


class RSSCollector(BaseCollector):
    """Collect articles from a single RSS/Atom feed.

    Each produced article has the schema's required fields plus ``author``
    and ``collected_date``. Entries missing required fields are validated
    and skipped. Network/parse failures are caught and yield an empty list
    rather than crashing the pipeline.
    """

    DEFAULT_CONTENT_TYPE = "news"
    EXCERPT_MAX_CHARS = 500
    # Fetch retry policy (overridable per instance); injectable sleep keeps
    # tests fast. feedparser itself does not raise on HTTP errors, but a hard
    # network/DNS failure inside it does -- those are what we retry.
    RETRY_ATTEMPTS = 3
    RETRY_BACKOFF_SECONDS = 2.0

    def __init__(self, name: str, feed_url: str, vertical=None, geo_focus=None) -> None:
        super().__init__(
            name=name,
            source_config={"feed_url": feed_url},
            vertical=vertical,
            geo_focus=geo_focus,
        )
        self.feed_url = feed_url

    def collect(self) -> List[Dict]:
        """Fetch & parse the feed, returning validated, enriched articles.

        feedparser does NOT raise on a 404/timeout -- it returns a result with
        ``bozo=1`` and/or an HTTP ``status`` >= 400 and (usually) no entries.
        We retry hard network failures, then inspect ``bozo``/``status`` and
        log a clear WARNING so a silently-dead feed is visible instead of
        looking like an empty-but-healthy source.
        """
        feed = retry_call(
            lambda: feedparser.parse(self.feed_url),
            attempts=self.RETRY_ATTEMPTS,
            backoff_seconds=self.RETRY_BACKOFF_SECONDS,
            fallback=None,
        )
        if feed is None:
            # Hard network/parse failure across all retries -- fail soft.
            logger.warning("Feed %r failed to fetch after retries", self.feed_url)
            return []

        entries = getattr(feed, "entries", None) or []

        # Detect feedparser's silent-failure signals (404/timeout/malformed).
        status = None
        if hasattr(feed, "get"):
            status = feed.get("status")
        else:
            status = getattr(feed, "status", None)
        bozo = getattr(feed, "bozo", 0)
        if (bozo and not entries) or (isinstance(status, int) and status >= 400):
            reason = getattr(feed, "bozo_exception", None)
            logger.warning(
                "Feed %r looks broken (bozo=%s status=%s entries=%d reason=%s)",
                self.feed_url, bozo, status, len(entries), reason,
            )
            return []

        articles: List[Dict] = []

        for entry in entries:
            try:
                article = self._build_article(entry)
            except Exception:
                # A single malformed entry must not abort the whole feed.
                continue

            if self.validate_article(article):
                articles.append(article)

        return articles

    def _build_article(self, entry) -> Dict:
        """Map a feedparser entry into a schema-conforming article dict."""
        article = {
            "article_url": self._get(entry, "link"),
            "title": self._clean_text(self._get(entry, "title")),
            "published_date": self._parse_date(self._get(entry, "published")
                                               or self._get(entry, "updated")),
            "author": self._clean_text(self._get(entry, "author")),
            "content_excerpt": self._extract_excerpt(entry),
            "content_type": self.DEFAULT_CONTENT_TYPE,
        }
        # Adds source_name and collected_date.
        return self.enrich_article(article)

    def _parse_date(self, date_str) -> str:
        """Parse an RSS date string to ISO 8601 (UTC, 'Z'-suffixed).

        Falls back to the current collection time on any parse failure or
        empty input so downstream code always receives a usable string.
        """
        if date_str:
            try:
                dt = date_parser.parse(date_str)
                # Normalize timezone-aware datetimes to UTC; assume UTC for naive.
                if dt.tzinfo is not None:
                    dt = dt.astimezone(datetime.timezone.utc)
                return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            except (ValueError, OverflowError, TypeError):
                pass
        return self._utc_now_iso()

    def _extract_excerpt(self, entry) -> str:
        """Extract up to EXCERPT_MAX_CHARS of plain text from the entry summary."""
        raw = self._get(entry, "summary") or self._get(entry, "description") or ""
        text = self._strip_html(raw)
        text = self._clean_text(text)
        if len(text) > self.EXCERPT_MAX_CHARS:
            text = text[: self.EXCERPT_MAX_CHARS]
        return text

    # -- helpers --------------------------------------------------------

    @staticmethod
    def _get(entry, key: str) -> str:
        """Read a field from a feedparser entry (attr or dict access)."""
        if hasattr(entry, "get"):
            try:
                value = entry.get(key)
                if value is not None:
                    return value
            except Exception:
                pass
        return getattr(entry, key, "") or ""

    @staticmethod
    def _strip_html(text: str) -> str:
        """Remove HTML tags from a string."""
        if not text:
            return ""
        return re.sub(r"<[^>]+>", "", text)

    @staticmethod
    def _clean_text(text: str) -> str:
        """Trim whitespace and collapse internal runs of whitespace."""
        if not text:
            return ""
        return re.sub(r"\s+", " ", text).strip()
