"""Historical backfill orchestration for the Content Trend Data Hub.

Where :mod:`pipeline.ingest` runs *daily* and captures whatever is fresh in
each source's feed, this module seeds the hub with *past* content so trend
analysis has history to work against. It reuses the same building blocks --
the collectors, :class:`Deduplicator`, :class:`Categorizer`, and
:class:`SheetsExporter` -- and adds two backfill-specific capabilities:

1. **Date-window filtering.** Whatever the collectors return is filtered to a
   trailing window (default the last 12 months) via :meth:`filter_by_date`.
   The reference "now" is injectable (``reference_date``) so the windowing is
   fully deterministic in tests.
2. **Pagination / archive traversal.** Many WordPress feeds expose older items
   behind ``?paged=2``, ``?paged=3`` ... so :meth:`build_paginated_urls` and
   :meth:`collect_with_pagination` walk those pages, stopping as soon as a page
   comes back empty.

Results are written to a SEPARATE worksheet -- ``Historical_Backfill`` -- so
the one-off historical seed never mixes with the daily ``Articles`` tab.

----------------------------------------------------------------------------
IMPORTANT LIMITATION (honest by design)
----------------------------------------------------------------------------
Standard RSS feeds only expose the most recent ~20-50 items, so RSS alone
*cannot* truly reach back 12 months. WordPress ``?paged=`` pagination helps,
but many sites cap how far it goes (or disable it entirely). Genuine 12-month
historical depth requires one of:

* archive-page scraping (year/month archive listings),
* sitemap crawling, or
* a paid content/news API.

This engine collects as much as each source actually exposes and then filters
by date. The same caveat is surfaced in the run summary's ``limitations`` key
so callers are never misled about how deep the backfill really went.

Entry point: ``python -m pipeline.backfill`` (see :func:`main`). This is a
*manual / quarterly* job, NOT a daily cron task (see scripts/cron_setup.md).
"""

from __future__ import annotations

import argparse
import datetime
import logging
import logging.handlers
import os
import sys
from typing import Callable, Dict, List, Optional

import yaml
from dateutil import parser as date_parser

from collectors.rss_collector import RSSCollector
from collectors.sitemap_collector import SitemapCollector
from collectors.web_scraper import WebScraper
from exporters.sheets_exporter import SheetsExporter
from processors.categorizer import Categorizer
from processors.deduplicator import Deduplicator
from storage import get_store

logger = logging.getLogger("pipeline.backfill")

# The worksheet/tab historical content is written to, kept separate from the
# daily "Articles" tab so the one-off seed never contaminates daily data.
BACKFILL_SHEET_NAME = "Historical_Backfill"

# Average days per month, used to convert a months-back window to a cutoff
# date. Approximate by design -- a backfill window does not need calendar
# precision, and this keeps the math dependency-free.
_DAYS_PER_MONTH = 30.44

# The honest caveat surfaced in the run summary (see module docstring).
LIMITATIONS_NOTE = (
    "RSS feeds typically expose only the most recent ~20-50 items, so "
    "RSS-only sources cannot truly reach back the full window. WordPress "
    "?paged= pagination extends this where supported, but many sites cap or "
    "disable it. True multi-month historical depth requires archive-page "
    "scraping, sitemap crawling, or a paid content/news API. This run "
    "collected as much as each source exposed, then filtered by date."
)

# Selectors the WebScraper needs at minimum (mirrors pipeline.ingest).
_REQUIRED_SCRAPER_SELECTORS = ("article", "title", "link")

# Default per-source backfill volume cap. A single sitemap source once dumped
# 4,000+ rows and drowned every other source; capping each source's
# contribution keeps the corpus balanced. Overridable via
# collection_config.max_backfill_per_source.
_DEFAULT_MAX_PER_SOURCE = 800

# The six selectable content verticals (mirrors pipeline.ingest). Used as the
# default when ``collection_config.enabled_verticals`` is absent.
ALL_VERTICALS = ("wine", "spirits", "food", "lifestyle", "travel", "hospitality")

_DEFAULT_LOG_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs"
)


class BackfillPipeline:
    """Orchestrate paginated collect -> date filter -> dedup/categorize ->
    export-to-Historical_Backfill.

    Parameters
    ----------
    sources_config_path:
        Path to the source registry YAML (``config/sources.yaml``).
    sheet_id:
        Target Google Sheet id. Used to build a :class:`SheetsExporter` when
        one is not injected via ``exporter``.
    exporter:
        Pre-built exporter (or any object exposing
        ``export_articles(articles, sheet_name) -> dict``). Injected by tests
        so no real Google API access is required.
    months_back:
        Size of the trailing date window to keep, in months (default 12).
    store:
        The :class:`~storage.article_store.ArticleStore` system-of-record --
        the SAME db/articles table the daily ingest writes to. Global dedup by
        normalized URL across ingest + backfill is correct and desired. The DB
        upsert is the authoritative dedup; Sheets (the Historical_Backfill tab)
        is just a mirror. Injected by tests; defaults to a file-backed
        :class:`SqliteArticleStore`.
    """

    def __init__(
        self,
        sources_config_path: str = "config/sources.yaml",
        sheet_id: Optional[str] = None,
        exporter=None,
        months_back: int = 12,
        store=None,
        max_articles_per_source: Optional[int] = None,
    ) -> None:
        self.sources_config_path = sources_config_path
        self.sheet_id = sheet_id
        self.months_back = months_back
        # Per-source volume cap so one prolific source (e.g. a 4,000-row
        # sitemap) can't dominate the corpus. None here means "read it from
        # config (or the default) when the run starts".
        self.max_articles_per_source = max_articles_per_source

        if exporter is not None:
            self.exporter = exporter
        elif sheet_id is not None:
            self.exporter = SheetsExporter(sheet_id=sheet_id)
        else:
            # Defer the failure to export() so collect/filter/process can
            # still be exercised without a sheet.
            self.exporter = None

        # The DB is the system-of-record + cross-run dedup index, shared with
        # the daily ingest (same articles table). When no store is injected the
        # env-based factory picks the backend (SQLite default, or Supabase when
        # DATA_HUB_DB_BACKEND=supabase + creds). Both backends are
        # lazy-connecting. Injection still wins (for tests).
        self.store = store if store is not None else get_store()

        self.deduplicator = Deduplicator()
        self.categorizer = Categorizer()

        # Optional fixed "now" for deterministic date filtering. When None,
        # filter_by_date defaults to the real current time.
        self.reference_date: Optional[datetime.datetime] = None

        # Populated by build_collectors(); may be injected directly by tests.
        self.collectors: List = []
        self.errors: List[str] = []

    # -- config ---------------------------------------------------------

    def load_sources(self) -> Dict:
        """Parse the sources YAML registry into a dict."""
        with open(self.sources_config_path, "r", encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
        return data or {}

    # -- date windowing -------------------------------------------------

    def filter_by_date(
        self,
        articles: List[Dict],
        months_back: int,
        reference_date: Optional[datetime.datetime] = None,
    ) -> List[Dict]:
        """Keep only articles published within ``months_back`` of the reference.

        ``reference_date`` is injectable purely for deterministic tests; when
        ``None`` it falls back to ``self.reference_date`` and then to the real
        current UTC time.

        Articles whose ``published_date`` is missing or unparseable are KEPT
        (with a warning) rather than silently dropped -- we never throw away
        data just because a date is messy.
        """
        ref = reference_date or self.reference_date or datetime.datetime.now(
            datetime.timezone.utc
        )
        ref = self._ensure_aware(ref)
        cutoff = ref - datetime.timedelta(days=_DAYS_PER_MONTH * months_back)

        kept: List[Dict] = []
        dropped = 0
        undated = 0

        for article in articles:
            raw = article.get("published_date") if isinstance(article, dict) else None
            parsed = self._parse_iso(raw)

            if parsed is None:
                # Unparseable / missing date -> keep, don't drop data.
                undated += 1
                logger.warning(
                    "Article has missing/unparseable published_date %r; "
                    "keeping it (url=%s)",
                    raw,
                    article.get("article_url") if isinstance(article, dict) else "?",
                )
                kept.append(article)
                continue

            if parsed >= cutoff:
                kept.append(article)
            else:
                dropped += 1

        logger.info(
            "Date filter (last %d months, cutoff=%s): kept %d, dropped %d, "
            "undated-kept %d",
            months_back,
            cutoff.date().isoformat(),
            len(kept),
            dropped,
            undated,
        )
        return kept

    @staticmethod
    def _parse_iso(value) -> Optional[datetime.datetime]:
        """Parse an ISO published_date to an aware UTC datetime, or None."""
        if not value or not isinstance(value, str):
            return None
        try:
            dt = date_parser.parse(value)
        except (ValueError, OverflowError, TypeError):
            return None
        return BackfillPipeline._ensure_aware(dt)

    @staticmethod
    def _ensure_aware(dt: datetime.datetime) -> datetime.datetime:
        """Normalize a datetime to timezone-aware UTC (assume UTC if naive)."""
        if dt.tzinfo is None:
            return dt.replace(tzinfo=datetime.timezone.utc)
        return dt.astimezone(datetime.timezone.utc)

    # -- pagination -----------------------------------------------------

    def build_paginated_urls(
        self, base_feed_url: str, max_pages: int
    ) -> List[str]:
        """Generate WordPress-style paginated feed URLs.

        Page 1 is the base URL untouched; subsequent pages append a
        ``paged=N`` query parameter. URLs that already carry a query string
        get ``&paged=N`` instead of ``?paged=N``.
        """
        if max_pages < 1:
            return []

        urls = [base_feed_url]
        separator = "&" if "?" in base_feed_url else "?"
        for page in range(2, max_pages + 1):
            urls.append(f"{base_feed_url}{separator}paged={page}")
        return urls

    def collect_with_pagination(
        self,
        collector_factory: Callable[[str], object],
        base_url: str,
        max_pages: int,
    ) -> List[Dict]:
        """Collect across paginated URLs, aggregating results.

        ``collector_factory(url)`` builds a fresh collector pointed at each
        page URL. Collection stops early as soon as a page returns zero
        articles (the conventional signal there are no more pages). Each page
        is collected fail-soft: a page that raises is logged/recorded and
        skipped without aborting the remaining pages.
        """
        urls = self.build_paginated_urls(base_url, max_pages)
        articles: List[Dict] = []

        for url in urls:
            try:
                collector = collector_factory(url)
                page_articles = collector.collect() or []
            except Exception as exc:  # noqa: BLE001 -- fail soft per page
                message = f"Pagination page {url!r} failed: {exc}"
                logger.error(message)
                self.errors.append(message)
                continue

            if not page_articles:
                logger.info("Page %r returned 0 articles; stopping pagination", url)
                break

            logger.info("Page %r returned %d article(s)", url, len(page_articles))
            articles.extend(page_articles)

        return articles

    # -- collector construction -----------------------------------------

    def build_collectors(self) -> List:
        """Instantiate collectors for supported sources (mirrors ingest).

        Returns a list of ``(collector, source_dict)`` is intentionally NOT
        used -- to keep pagination simple, RSS sources are returned as plain
        :class:`RSSCollector` instances and their feed URL is read back off
        the instance in :meth:`run`.
        """
        config = self.load_sources()
        categories = config.get("sources", {}) or {}
        enabled_verticals = self._enabled_verticals(config)

        collectors: List = []
        for sources in categories.values():
            for source in sources or []:
                if not self._source_selected(source, enabled_verticals):
                    continue
                collector = self._build_one(source)
                if collector is not None:
                    collectors.append(collector)

        # Sitemap sources live in a separate top-level ``backfill_sources``
        # block so they never affect the daily ingest. Backward-compatible:
        # if the key is absent, this is simply a no-op. The same
        # vertical/enabled filtering applies here too.
        for source in config.get("backfill_sources", []) or []:
            if not self._source_selected(source, enabled_verticals):
                continue
            collector = self._build_one(source)
            if collector is not None:
                collectors.append(collector)

        logger.info(
            "Built %d collector(s) from %s",
            len(collectors),
            self.sources_config_path,
        )
        self.collectors = collectors
        return collectors

    @staticmethod
    def _enabled_verticals(config: Dict) -> set:
        """Return the set of enabled verticals from config (default: all six)."""
        cc = config.get("collection_config") or {}
        configured = cc.get("enabled_verticals")
        if not configured:
            return set(ALL_VERTICALS)
        return set(configured)

    @staticmethod
    def _max_per_source(config: Dict) -> int:
        """Return the per-source backfill cap from config (default: 800).

        Read from ``collection_config.max_backfill_per_source``; falls back to
        :data:`_DEFAULT_MAX_PER_SOURCE` when the key is absent or unusable.
        """
        cc = (config or {}).get("collection_config") or {}
        configured = cc.get("max_backfill_per_source")
        try:
            value = int(configured)
        except (TypeError, ValueError):
            return _DEFAULT_MAX_PER_SOURCE
        return value if value > 0 else _DEFAULT_MAX_PER_SOURCE

    def _resolve_max_per_source(self) -> int:
        """The effective per-source cap: explicit override, else config/default."""
        if self.max_articles_per_source is not None:
            return int(self.max_articles_per_source)
        try:
            config = self.load_sources()
        except Exception:  # noqa: BLE001 -- fall back to default, never crash
            return _DEFAULT_MAX_PER_SOURCE
        return self._max_per_source(config)

    def cap_per_source(self, articles: List[Dict], max_articles: int) -> List[Dict]:
        """Truncate one source's articles to ``max_articles``, newest first.

        Articles are sorted by ``published_date`` descending (undated/unparseable
        dates sort last so genuinely-dated recent items are preferred) and the
        top ``max_articles`` are kept. A non-positive cap disables truncation.
        """
        if max_articles is None or max_articles <= 0:
            return list(articles)
        if len(articles) <= max_articles:
            return list(articles)

        def _sort_key(article):
            raw = article.get("published_date") if isinstance(article, dict) else None
            parsed = self._parse_iso(raw)
            # Undated -> sort to the very bottom (oldest) so dated items win.
            return parsed or datetime.datetime.min.replace(
                tzinfo=datetime.timezone.utc
            )

        ordered = sorted(articles, key=_sort_key, reverse=True)
        return ordered[:max_articles]

    @staticmethod
    def _source_selected(source: Dict, enabled_verticals: set) -> bool:
        """True if a source should be built (enabled + vertical selected)."""
        name = source.get("name", "<unnamed>")
        if source.get("enabled") is False:
            logger.info("Skipping source %r: enabled is false", name)
            return False
        vertical = source.get("vertical")
        if vertical is not None and vertical not in enabled_verticals:
            logger.info(
                "Skipping source %r: vertical %r not in enabled_verticals %s",
                name, vertical, sorted(enabled_verticals),
            )
            return False
        return True

    def _build_one(self, source: Dict):
        """Build a single collector from one source config entry (or None)."""
        name = source.get("name", "<unnamed>")
        api_type = source.get("api_type")
        vertical = source.get("vertical")
        geo_focus = source.get("geo_focus")

        if api_type == "rss":
            feed = source.get("rss_feed")
            if not feed:
                logger.warning(
                    "Skipping RSS source %r: no rss_feed configured", name
                )
                return None
            return RSSCollector(name=name, feed_url=feed, vertical=vertical,
                                geo_focus=geo_focus)

        if api_type == "web_scrape":
            selectors = source.get("selectors")
            if not self._has_required_selectors(selectors):
                logger.info(
                    "Skipping web_scrape source %r: no full selectors yet", name
                )
                return None
            listing_url = source.get("scrape_endpoint") or source.get("url")
            return WebScraper(
                name=name, listing_url=listing_url, selectors=selectors,
                vertical=vertical, geo_focus=geo_focus,
            )

        if api_type == "sitemap":
            sitemap_url = source.get("sitemap_url")
            if not sitemap_url:
                logger.warning(
                    "Skipping sitemap source %r: no sitemap_url configured", name
                )
                return None
            return SitemapCollector(
                name=name,
                sitemap_url=sitemap_url,
                months_back=self.months_back,
                reference_date=self.reference_date,
                child_pattern=source.get("sitemap_child_pattern"),
                max_child_sitemaps=source.get("max_child_sitemaps", 12),
                vertical=vertical,
                geo_focus=geo_focus,
            )

        if api_type in ("api", "keyword_monitor"):
            logger.info(
                "Skipping source %r (api_type=%r): not yet implemented",
                name,
                api_type,
            )
            return None

        logger.warning("Skipping source %r: unknown api_type %r", name, api_type)
        return None

    @staticmethod
    def _has_required_selectors(selectors) -> bool:
        if not isinstance(selectors, dict):
            return False
        return all(selectors.get(key) for key in _REQUIRED_SCRAPER_SELECTORS)

    # -- stages ---------------------------------------------------------

    def collect_all(self, collectors: List, max_pages: int) -> List[Dict]:
        """Collect from every collector, paginating RSS feeds where possible.

        RSS collectors expose a ``feed_url`` we can paginate over; for those
        we walk ``?paged=`` pages. Any other collector (or one without a
        ``feed_url``) is collected once. All collection is fail-soft.

        Each source's contribution is then capped (newest kept) so one prolific
        source -- a sitemap that exposes thousands of URLs -- can't dominate the
        corpus the way a single source once accounted for 85% of all rows.
        """
        articles: List[Dict] = []
        cap = self._resolve_max_per_source()

        for collector in collectors:
            name = getattr(collector, "name", repr(collector))
            feed_url = getattr(collector, "feed_url", None)

            if isinstance(collector, RSSCollector) and feed_url:
                # Paginate this RSS feed; rebuild a fresh collector per page,
                # preserving the source's vertical so paginated articles are
                # stamped the same way.
                _vertical = getattr(collector, "vertical", None)
                _geo = getattr(collector, "geo_focus", None)
                collected = self.collect_with_pagination(
                    lambda url, _name=name, _v=_vertical, _g=_geo: RSSCollector(
                        name=_name, feed_url=url, vertical=_v, geo_focus=_g
                    ),
                    feed_url,
                    max_pages,
                )
            else:
                try:
                    collected = collector.collect() or []
                except Exception as exc:  # noqa: BLE001 -- fail soft per source
                    message = f"Collector {name!r} failed: {exc}"
                    logger.error(message)
                    self.errors.append(message)
                    continue

            logger.info("Collected %d article(s) from %r", len(collected), name)

            # Cap this source's contribution (newest kept) to keep the corpus
            # balanced. Log when a source is actually capped.
            before = len(collected)
            collected = self.cap_per_source(collected, cap)
            if len(collected) < before:
                logger.info(
                    "Capped source %r: %d -> %d article(s) (max_per_source=%d)",
                    name, before, len(collected), cap,
                )

            articles.extend(collected)

        logger.info(
            "Collected %d article(s) total from %d collector(s)",
            len(articles),
            len(collectors),
        )
        return articles

    def process(self, articles: List[Dict]) -> List[Dict]:
        """Deduplicate (across all batches) then categorize."""
        deduped = self.deduplicator.deduplicate(articles)
        logger.info("Deduplicated %d -> %d article(s)", len(articles), len(deduped))
        categorized = self.categorizer.categorize(deduped)
        logger.info("Categorized %d article(s)", len(categorized))
        return categorized

    def export(self, articles: List[Dict]) -> Dict:
        """Export processed articles to the Historical_Backfill worksheet."""
        if self.exporter is None:
            message = "No exporter configured (set sheet_id or inject exporter)"
            logger.error(message)
            self.errors.append(message)
            return {"exported": 0, "error": message}

        result = self.exporter.export_articles(
            articles, sheet_name=BACKFILL_SHEET_NAME
        )
        logger.info(
            "Exported %s article(s) to sheet %r",
            result.get("exported"),
            result.get("sheet", BACKFILL_SHEET_NAME),
        )
        if result.get("error"):
            self.errors.append(f"Export error: {result['error']}")
        return result

    # -- orchestration --------------------------------------------------

    def run(self, max_pages: int = 5) -> Dict:
        """Run the full backfill and return a structured summary dict.

        Stages: build_collectors (if none injected) -> collect_all (with
        pagination) -> filter_by_date -> process (within-run dedup +
        categorize) -> upsert to the DB (authoritative, global cross-run dedup)
        -> mirror ONLY the newly-inserted rows to the Historical_Backfill tab
        -> record the run.

        The DB upsert happens BEFORE the Sheets mirror so a Sheets/API failure
        never loses data; a mirror exception is recorded and the run continues.
        """
        logger.info("=== Content Hub historical backfill starting ===")

        # Ensure the backing tables/indexes exist (idempotent, shared schema).
        self.store.init_schema()

        collectors = self.collectors or self.build_collectors()

        collected = self.collect_all(collectors, max_pages=max_pages)
        filtered = self.filter_by_date(
            collected, months_back=self.months_back,
            reference_date=self.reference_date,
        )
        processed = self.process(filtered)

        # Upsert into the SAME articles table as the daily ingest: global dedup
        # by normalized URL across ingest + backfill is correct and desired.
        # ``inserted`` is exactly the new rows. Happens BEFORE the Sheets mirror.
        result = self.store.upsert_articles(processed, kind="backfill")
        inserted = result.get("inserted", [])
        logger.info(
            "DB upsert: %d inserted, %d skipped (already stored)",
            len(inserted), result.get("skipped", 0),
        )

        # Mirror ONLY the newly-inserted rows to the Historical_Backfill tab.
        exported = self._mirror_to_sheets(inserted)

        summary = {
            "collected": len(collected),
            "after_date_filter": len(filtered),
            "after_dedup": len(processed),
            "exported": exported,
            "db_inserted": len(inserted),
            "db_total": self.store.count(),
            "months_back": self.months_back,
            "sources_run": [getattr(c, "name", repr(c)) for c in collectors],
            "errors": list(self.errors),
            "limitations": LIMITATIONS_NOTE,
        }

        # Append to the runs ledger for observability (fail-soft in the store).
        self.store.record_run({**summary, "kind": "backfill"})

        logger.info(
            "=== Backfill complete: collected=%d after_date_filter=%d "
            "after_dedup=%d db_inserted=%d exported=%s db_total=%d "
            "sources=%d errors=%d ===",
            summary["collected"],
            summary["after_date_filter"],
            summary["after_dedup"],
            summary["db_inserted"],
            summary["exported"],
            summary["db_total"],
            len(summary["sources_run"]),
            len(summary["errors"]),
        )
        return summary

    def _mirror_to_sheets(self, inserted: List[Dict]) -> int:
        """Mirror the newly-inserted rows to the Historical_Backfill tab.

        Guarded and fail-soft: with no exporter the mirror is skipped (the DB
        still has the data); any exporter exception is caught and recorded so a
        Sheets outage never crashes the run or loses the durable DB rows.
        """
        if self.exporter is None:
            logger.info("No exporter configured; skipping Sheets mirror "
                        "(DB still has the data).")
            return 0

        if not inserted:
            return 0

        try:
            result = self.exporter.export_articles(
                inserted, sheet_name=BACKFILL_SHEET_NAME
            )
        except Exception as exc:  # noqa: BLE001 -- a mirror failure must not lose DB data
            message = f"Sheets mirror failed: {exc}"
            logger.error(message)
            self.errors.append(message)
            return 0

        if isinstance(result, dict) and result.get("error"):
            self.errors.append(f"Sheets mirror error: {result['error']}")
        exported = result.get("exported", 0) if isinstance(result, dict) else 0
        logger.info(
            "Mirrored %s newly-inserted row(s) to sheet %r",
            exported, BACKFILL_SHEET_NAME,
        )
        return exported


# -- logging setup -----------------------------------------------------------


def configure_logging(
    log_dir: str = _DEFAULT_LOG_DIR, level: int = logging.INFO
) -> None:
    """Configure root logging to logs/backfill.log and the console.

    Idempotent: repeated calls do not stack duplicate handlers.
    """
    root = logging.getLogger()
    root.setLevel(level)

    if getattr(configure_logging, "_configured", False):
        return

    formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")

    console = logging.StreamHandler()
    console.setFormatter(formatter)
    root.addHandler(console)

    try:
        os.makedirs(log_dir, exist_ok=True)
        # RotatingFileHandler caps disk use (5 MB x 5 backups) so the backfill
        # log can't grow unbounded across repeated runs.
        file_handler = logging.handlers.RotatingFileHandler(
            os.path.join(log_dir, "backfill.log"),
            maxBytes=5_000_000,
            backupCount=5,
        )
        file_handler.setFormatter(formatter)
        root.addHandler(file_handler)
    except OSError as exc:  # noqa: BLE001 -- logging must never crash the run
        root.warning("Could not create log file in %s: %s", log_dir, exc)

    configure_logging._configured = True  # type: ignore[attr-defined]


# -- CLI entry point ---------------------------------------------------------


def main(argv: Optional[List[str]] = None) -> int:
    """CLI entry point: run the historical backfill pipeline.

    Reads the target sheet id from ``--sheet-id`` or ``DATA_HUB_SHEET_ID``,
    plus optional ``--months-back`` and ``--max-pages``. Prints the run
    summary including the limitations note. Returns 0 on success, 1 on
    failure.
    """
    parser = argparse.ArgumentParser(
        description="Seed the Content Hub with historical content (backfill)."
    )
    parser.add_argument(
        "--sheet-id",
        default=os.environ.get("DATA_HUB_SHEET_ID"),
        help="Target Google Sheet id (defaults to $DATA_HUB_SHEET_ID).",
    )
    parser.add_argument(
        "--sources-config",
        default="config/sources.yaml",
        help="Path to the sources registry YAML.",
    )
    parser.add_argument(
        "--months-back",
        type=int,
        default=12,
        help="Trailing window to keep, in months (default 12).",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=5,
        help="Max paginated feed pages to walk per RSS source (default 5).",
    )
    args = parser.parse_args(argv)

    configure_logging()

    if not args.sheet_id:
        logger.error(
            "No sheet id provided. Set DATA_HUB_SHEET_ID or pass --sheet-id."
        )
        print(
            "ERROR: no sheet id (set DATA_HUB_SHEET_ID or --sheet-id).",
            file=sys.stderr,
        )
        return 1

    try:
        pipeline = BackfillPipeline(
            sources_config_path=args.sources_config,
            sheet_id=args.sheet_id,
            months_back=args.months_back,
        )
        summary = pipeline.run(max_pages=args.max_pages)
    except Exception as exc:  # noqa: BLE001 -- top-level guard for a clean exit
        logger.exception("Backfill pipeline crashed: %s", exc)
        print(f"ERROR: backfill pipeline failed: {exc}", file=sys.stderr)
        return 1

    print("Content Hub historical backfill summary:")
    print(f"  months_back        : {summary['months_back']}")
    print(f"  collected          : {summary['collected']}")
    print(f"  after_date_filter  : {summary['after_date_filter']}")
    print(f"  after_dedup        : {summary['after_dedup']}")
    print(f"  exported           : {summary['exported']} -> {BACKFILL_SHEET_NAME}")
    print(f"  sources_run        : {len(summary['sources_run'])}")
    print(f"  errors             : {len(summary['errors'])}")
    for error in summary["errors"]:
        print(f"    - {error}")
    print()
    print("  LIMITATIONS:")
    print(f"    {summary['limitations']}")

    # Surface failures: a non-empty errors list means at least one source/page
    # or the export failed. Alert (best-effort) and exit non-zero so a
    # scheduler sees the failure instead of a silent "success".
    errors = summary.get("errors") or []
    if errors:
        from monitoring.notifier import send_alert

        send_alert(
            "Content Hub backfill finished with %d error(s): %s"
            % (len(errors), "; ".join(errors)),
            level="critical",
        )
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
