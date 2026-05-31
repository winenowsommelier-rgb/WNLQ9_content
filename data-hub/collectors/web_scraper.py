"""Static HTML web scraper for the Content Trend Data Hub.

Fetches an article-listing page via ``requests`` and parses it with
BeautifulSoup, mapping each article container into a dict that conforms to
the Content Hub schema (data-schema.md). This is the fallback collector for
sources without a usable RSS feed.

Targets (per research/source-audit.md):
  * Wongnai (Thai, high priority) -- needs scraping.
  * Wine Spectator, Wine Enthusiast, James Suckling -- broken RSS, fall back
    to scraping their article-listing pages.

NOTE: This collector handles *static* HTML only (requests + BeautifulSoup,
deliberately lightweight -- no Selenium). JS-rendered sources such as
Difford's Guide return an empty/skeleton DOM here and will need a headless
fallback later (e.g. a SeleniumWebScraper / PlaywrightWebScraper subclass
that overrides ``_fetch_html`` to render the page). That is intentionally
out of scope for now (YAGNI).
"""

from __future__ import annotations

import re
from typing import Dict, List, Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from collectors.base_collector import BaseCollector


class WebScraper(BaseCollector):
    """Scrape articles from a single static-HTML listing page.

    Each produced article has the schema's required fields plus
    ``collected_date``. Containers missing required fields are validated and
    skipped. Network/parse failures are caught and yield an empty list rather
    than crashing the pipeline.
    """

    DEFAULT_CONTENT_TYPE = "news"
    EXCERPT_MAX_CHARS = 500
    REQUEST_TIMEOUT = 15
    USER_AGENT = (
        "Mozilla/5.0 (compatible; ContentTrendDataHub/1.0; "
        "+https://www.wine-now.com/bot)"
    )

    def __init__(self, name: str, listing_url: str, selectors: Dict) -> None:
        super().__init__(
            name=name,
            source_config={"listing_url": listing_url, "selectors": selectors},
        )
        self.listing_url = listing_url
        self.selectors = selectors

    def collect(self) -> List[Dict]:
        """Fetch & parse the listing page, returning validated articles."""
        html = self._fetch_html(self.listing_url)
        if not html:
            # Network failure (or empty response) -- fail soft.
            return []

        try:
            soup = BeautifulSoup(html, "html.parser")
            containers = soup.select(self.selectors["article"])
        except Exception:
            # Malformed markup or a bad selector -- don't crash the pipeline.
            return []

        articles: List[Dict] = []
        for container in containers:
            try:
                article = self._build_article(container)
            except Exception:
                # A single malformed container must not abort the whole page.
                continue

            if self.validate_article(article):
                articles.append(article)

        return articles

    def _fetch_html(self, url: str) -> str:
        """GET ``url`` with a sane User-Agent and timeout.

        Returns the response body, or '' on any network/HTTP error so the
        caller can fail soft.
        """
        try:
            response = requests.get(
                url,
                headers={"User-Agent": self.USER_AGENT},
                timeout=self.REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            return response.text or ""
        except Exception:
            return ""

    def _build_article(self, container) -> Dict:
        """Map one article container into a schema-conforming article dict."""
        article = {
            "article_url": self._resolve_url(
                self._select_attr(container, "link", "href")
            ),
            "title": self._select_text(container, "title"),
            "published_date": self._parse_date(
                self._select_text(container, "date")
            ),
            "content_excerpt": self._extract_excerpt(container),
            "content_type": self.DEFAULT_CONTENT_TYPE,
        }
        # Adds source_name and collected_date.
        return self.enrich_article(article)

    def _resolve_url(self, href: str) -> str:
        """Resolve a (possibly relative) href to an absolute URL."""
        if not href:
            return ""
        return urljoin(self.listing_url, href)

    def _parse_date(self, date_str: str) -> str:
        """Normalize a listing date string to an ISO 8601 (UTC) string.

        Falls back to the current collection time on empty/unparseable input
        so downstream code always receives a usable string.
        """
        if date_str:
            try:
                from dateutil import parser as date_parser
                import datetime

                dt = date_parser.parse(date_str)
                if dt.tzinfo is not None:
                    dt = dt.astimezone(datetime.timezone.utc)
                return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            except (ValueError, OverflowError, TypeError):
                pass
        return self._utc_now_iso()

    def _extract_excerpt(self, container) -> str:
        """Extract up to EXCERPT_MAX_CHARS of plain text from the excerpt."""
        text = self._select_text(container, "excerpt")
        if len(text) > self.EXCERPT_MAX_CHARS:
            text = text[: self.EXCERPT_MAX_CHARS]
        return text

    # -- helpers --------------------------------------------------------

    def _select_one(self, container, selector_key: str):
        """Find the first element matching the selector named ``selector_key``.

        Returns ``None`` when the selector is not configured or not found.
        """
        selector = self.selectors.get(selector_key)
        if not selector:
            return None
        return container.select_one(selector)

    def _select_text(self, container, selector_key: str) -> str:
        """Return cleaned text for a configured selector ('' if missing)."""
        element = self._select_one(container, selector_key)
        if element is None:
            return ""
        return self._clean_text(element.get_text())

    def _select_attr(self, container, selector_key: str, attr: str) -> str:
        """Return an attribute value for a configured selector ('' if missing)."""
        element = self._select_one(container, selector_key)
        if element is None:
            return ""
        return self._clean_text(element.get(attr) or "")

    @staticmethod
    def _clean_text(text: Optional[str]) -> str:
        """Trim whitespace and collapse internal runs of whitespace."""
        if not text:
            return ""
        return re.sub(r"\s+", " ", text).strip()
