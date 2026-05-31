"""Deduplicator for the Content Trend Data Hub.

Removes duplicate articles produced by the collectors. ``article_url`` is
the canonical natural key (per data-schema.md), so URL deduplication is the
primary path. A separate, looser pass collapses near-duplicates that share
a normalized title but were published under different URLs (e.g. syndicated
or mirrored content).

Both passes keep the first occurrence and preserve input order.
"""

from __future__ import annotations

import re
from typing import Dict, List


class Deduplicator:
    """Remove duplicate articles by URL or by normalized title."""

    def deduplicate(self, articles: List[Dict]) -> List[Dict]:
        """Remove articles sharing an ``article_url``, keeping the first.

        Order is preserved. Articles missing (or with an empty)
        ``article_url`` are left untouched and never collapsed together,
        since the URL is the only reliable identity signal here.
        """
        seen_urls = set()
        result: List[Dict] = []

        for article in articles:
            url = self._get_url(article)
            if not url:
                # No usable key -> cannot judge duplication; keep it.
                result.append(article)
                continue
            if url in seen_urls:
                continue
            seen_urls.add(url)
            result.append(article)

        return result

    def deduplicate_by_title(self, articles: List[Dict]) -> List[Dict]:
        """Remove articles sharing a normalized title, keeping the first.

        Intended for near-duplicate detection across sources/URLs. Articles
        with no usable title are left untouched. Order is preserved.
        """
        seen_titles = set()
        result: List[Dict] = []

        for article in articles:
            title = self._normalize_title(article.get("title"))
            if not title:
                result.append(article)
                continue
            if title in seen_titles:
                continue
            seen_titles.add(title)
            result.append(article)

        return result

    # -- helpers --------------------------------------------------------

    @staticmethod
    def _get_url(article: Dict) -> str:
        """Read and trim ``article_url`` from an article, '' if absent."""
        url = article.get("article_url") if isinstance(article, dict) else None
        if not url or not isinstance(url, str):
            return ""
        return url.strip()

    @staticmethod
    def _normalize_title(title) -> str:
        """Lowercase, strip, and collapse whitespace for title comparison."""
        if not title or not isinstance(title, str):
            return ""
        return re.sub(r"\s+", " ", title).strip().lower()
