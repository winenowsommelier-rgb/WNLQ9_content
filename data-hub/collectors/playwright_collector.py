"""Headless-browser collector using Playwright for JS-rendered sources.

Drop-in replacement for WebScraper when a source renders content with
JavaScript. Uses Playwright's synchronous API (chromium, headless) so it
integrates with the existing synchronous pipeline without async changes.

Targets (per research/source-audit.md):
  * Difford's Guide — /en/spirits/reviews/ (sets session cookies, JS-rendered)
  * Wongnai — wongnai.com (React SPA)
  * Wine Spectator — article listing (broken RSS, JS rendering suspected)

NOTE: Playwright must be installed in the venv:
  pip install playwright==1.44.0
  python -m playwright install chromium
If Playwright is unavailable at import time this module raises ImportError
with a clear install message rather than a silent failure.
"""

from __future__ import annotations

import re
from typing import Dict, List, Optional
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from collectors.base_collector import BaseCollector


class PlaywrightCollector(BaseCollector):
    """Scrape articles from a JS-rendered listing page using Playwright.

    Each produced article has the schema's required fields plus
    ``collected_date``. Containers missing required fields are validated and
    skipped. Browser/parse failures are caught and yield an empty list rather
    than crashing the pipeline.

    Raises ``ImportError`` at instantiation (not at import time) when
    Playwright is not installed in the environment, so the pipeline can
    degrade gracefully — the ``ImportError`` is caught by :meth:`_build_one`
    in ``pipeline.ingest`` and the source is simply skipped.
    """

    DEFAULT_CONTENT_TYPE = "news"
    EXCERPT_MAX_CHARS = 500
    USER_AGENT = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )

    def __init__(
        self,
        name: str,
        listing_url: str,
        selectors: Dict,
        vertical: Optional[str] = None,
        geo_focus: Optional[str] = None,
        thailand_focus_override: Optional[str] = None,
        wait_until: str = "networkidle",
        timeout_ms: int = 30000,
    ) -> None:
        # Guard: raise early with a clear message so ingest._build_one can
        # catch ImportError and skip the source rather than crash the pipeline.
        try:
            import playwright.sync_api  # noqa: F401  -- availability check only
        except ImportError as exc:
            raise ImportError(
                "Playwright is not installed. "
                "Run: pip install playwright==1.44.0 "
                "&& python -m playwright install chromium"
            ) from exc

        super().__init__(
            name=name,
            source_config={"listing_url": listing_url, "selectors": selectors},
            vertical=vertical,
            geo_focus=geo_focus,
        )
        self.listing_url = listing_url
        self.selectors = selectors
        # When set (from sources.yaml ``thailand_focus_override``), every
        # article produced by this collector gets ``thailand_focus_preset``
        # stamped to that value so the categorizer can short-circuit keyword
        # matching and use the source-level override directly.
        self.thailand_focus_override = thailand_focus_override
        self.wait_until = wait_until
        self.timeout_ms = timeout_ms

    def collect(self) -> List[Dict]:
        """Render & parse the listing page, returning validated articles."""
        html = self._fetch_html(self.listing_url)
        if not html:
            # Browser failure (or empty rendered DOM) -- fail soft.
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
                if self.thailand_focus_override:
                    article["thailand_focus_preset"] = self.thailand_focus_override
                articles.append(article)

        return articles

    def _fetch_html(self, url: str) -> str:
        """Launch a headless Chromium instance, navigate to ``url``, and
        return the fully-rendered ``innerHTML`` of the page body.

        Waits for ``wait_until`` (default ``"networkidle"``) so that
        JS-rendered content is present in the DOM before parsing begins.
        Returns ``''`` on any browser/navigation failure so the caller can
        fail soft.
        """
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            return ""

        try:
            with sync_playwright() as pw:
                browser = pw.chromium.launch(headless=True)
                try:
                    context = browser.new_context(user_agent=self.USER_AGENT)
                    page = context.new_page()
                    page.goto(
                        url,
                        wait_until=self.wait_until,
                        timeout=self.timeout_ms,
                    )
                    html = page.content()
                finally:
                    browser.close()
            return html or ""
        except Exception:
            # Any Playwright / navigation error -> fail soft.
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

    # -- helpers ----------------------------------------------------------------

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
