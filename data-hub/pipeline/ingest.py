"""Daily ingestion orchestration for the Content Trend Data Hub.

This module ties the whole pipeline together: it reads the source registry
(``config/sources.yaml``), instantiates the right collector for each source,
runs them, deduplicates and categorizes the results, and exports the final
articles to the Google Sheet storage hub.

Design goals (matching the rest of the codebase):

* **Dependency injection / testability.** The exporter and the list of
  collectors can be injected, so the orchestration logic is fully testable
  without touching the network or the Google Sheets API. Tests pass in
  ``MagicMock`` collectors and a ``MagicMock`` exporter.
* **Fail-soft.** A single misbehaving source (raising during ``collect()``)
  is logged and recorded, but never aborts the run -- the remaining sources
  still contribute their articles.
* **Observability.** Every stage logs its counts via the ``logging`` module
  to both a rotating-friendly file handler (``logs/ingest.log``) and the
  console. ``run()`` returns a structured summary dict for the caller.

Entry point: ``python -m pipeline.ingest`` (see ``main``), which reads the
target sheet id from ``DATA_HUB_SHEET_ID`` or a ``--sheet-id`` argument.
"""

from __future__ import annotations

import argparse
import logging
import logging.handlers
import os
import sys
from typing import Dict, List, Optional

import yaml

from collectors.rss_collector import RSSCollector
from collectors.url_utils import normalize_url
from collectors.web_scraper import WebScraper
from exporters.sheets_exporter import SheetsExporter
from processors.categorizer import Categorizer
from processors.deduplicator import Deduplicator

logger = logging.getLogger("pipeline.ingest")

# Selector keys WebScraper needs at minimum to produce a valid article.
# sources.yaml currently only carries a single ``scrape_selector`` (the
# article container), so most entries cannot yet be scraped and are skipped.
_REQUIRED_SCRAPER_SELECTORS = ("article", "title", "link")

# The six selectable content verticals. Used as the default when
# ``collection_config.enabled_verticals`` is absent (backward compatible:
# nothing is filtered out by vertical when the key is missing).
ALL_VERTICALS = ("wine", "spirits", "food", "lifestyle", "travel", "hospitality")

# Default location for run logs.
_DEFAULT_LOG_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs"
)


class IngestPipeline:
    """Orchestrate collect -> dedup -> categorize -> export.

    Parameters
    ----------
    sources_config_path:
        Path to the source registry YAML (``config/sources.yaml``).
    sheet_id:
        Target Google Sheet id. Used to build a :class:`SheetsExporter`
        when one is not injected via ``exporter``.
    exporter:
        Pre-built exporter (or any object exposing
        ``export_articles(articles, sheet_name) -> dict``). Injected by
        tests so no real Google API access is required. When omitted, a
        :class:`SheetsExporter` is built from ``sheet_id``.
    """

    def __init__(
        self,
        sources_config_path: str = "config/sources.yaml",
        sheet_id: Optional[str] = None,
        exporter=None,
    ) -> None:
        self.sources_config_path = sources_config_path
        self.sheet_id = sheet_id

        if exporter is not None:
            self.exporter = exporter
        elif sheet_id is not None:
            self.exporter = SheetsExporter(sheet_id=sheet_id)
        else:
            # Defer the failure to export() so the rest of the pipeline
            # (collect/process) can still be exercised without a sheet.
            self.exporter = None

        self.deduplicator = Deduplicator()
        self.categorizer = Categorizer()

        # Populated by build_collectors(); may be injected directly by tests.
        self.collectors: List = []
        # Per-run error messages, surfaced in the run() summary.
        self.errors: List[str] = []

    # -- config ---------------------------------------------------------

    def load_sources(self) -> Dict:
        """Parse the sources YAML registry into a dict."""
        with open(self.sources_config_path, "r", encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
        return data or {}

    # -- collector construction -----------------------------------------

    def build_collectors(self) -> List:
        """Instantiate a collector for each supported source in the registry.

        * ``rss`` -> :class:`RSSCollector` wired to the source's ``rss_feed``.
        * ``web_scrape`` -> :class:`WebScraper` *only* when the source carries
          a full ``selectors`` mapping (article/title/link at minimum).
          sources.yaml entries that only have ``scrape_selector`` are skipped
          gracefully and logged.
        * ``api`` / ``keyword_monitor`` -> skipped (not yet implemented),
          logged so the gap is visible.

        The built collectors are stored on ``self.collectors`` and returned.
        """
        config = self.load_sources()
        categories = config.get("sources", {}) or {}
        enabled_verticals = self._enabled_verticals(config)

        collectors: List = []
        for category, sources in categories.items():
            for source in sources or []:
                if not self._source_selected(source, enabled_verticals):
                    continue
                collector = self._build_one(category, source)
                if collector is not None:
                    collectors.append(collector)

        logger.info("Built %d collector(s) from %s", len(collectors),
                    self.sources_config_path)
        self.collectors = collectors
        return collectors

    @staticmethod
    def _enabled_verticals(config: Dict) -> set:
        """Return the set of enabled verticals from config (default: all six)."""
        cc = config.get("collection_config") or {}
        configured = cc.get("enabled_verticals")
        if not configured:
            # Absent / empty -> no vertical filtering (backward compatible).
            return set(ALL_VERTICALS)
        return set(configured)

    @staticmethod
    def _source_selected(source: Dict, enabled_verticals: set) -> bool:
        """True if a source should be built (enabled + vertical selected)."""
        name = source.get("name", "<unnamed>")
        if source.get("enabled") is False:
            logger.info("Skipping source %r: enabled is false", name)
            return False
        vertical = source.get("vertical")
        # Untagged sources (no vertical) are not filtered out by vertical --
        # they pass through so legacy/social/thai sources still build.
        if vertical is not None and vertical not in enabled_verticals:
            logger.info(
                "Skipping source %r: vertical %r not in enabled_verticals %s",
                name, vertical, sorted(enabled_verticals),
            )
            return False
        return True

    def _build_one(self, category: str, source: Dict):
        """Build a single collector from one source config entry (or None)."""
        name = source.get("name", "<unnamed>")
        api_type = source.get("api_type")
        vertical = source.get("vertical")
        geo_focus = source.get("geo_focus")

        if api_type == "rss":
            feed = source.get("rss_feed")
            if not feed:
                logger.warning("Skipping RSS source %r: no rss_feed configured",
                               name)
                return None
            return RSSCollector(name=name, feed_url=feed, vertical=vertical,
                                geo_focus=geo_focus)

        if api_type == "web_scrape":
            selectors = source.get("selectors")
            if not self._has_required_selectors(selectors):
                logger.info(
                    "Skipping web_scrape source %r: no full selectors "
                    "configured yet (needs %s)",
                    name, ", ".join(_REQUIRED_SCRAPER_SELECTORS),
                )
                return None
            listing_url = source.get("scrape_endpoint") or source.get("url")
            return WebScraper(name=name, listing_url=listing_url,
                              selectors=selectors, vertical=vertical,
                              geo_focus=geo_focus)

        if api_type == "sitemap":
            # Sitemap crawling is deep-history work reserved for the backfill
            # pipeline; the daily ingest must never crawl sitemaps.
            logger.info(
                "Skipping source %r: sitemap sources are backfill-only", name
            )
            return None

        if api_type in ("api", "keyword_monitor"):
            logger.info("Skipping source %r (api_type=%r): not yet implemented",
                        name, api_type)
            return None

        logger.warning("Skipping source %r: unknown api_type %r", name, api_type)
        return None

    @staticmethod
    def _has_required_selectors(selectors) -> bool:
        """True only if a selectors mapping has all required keys."""
        if not isinstance(selectors, dict):
            return False
        return all(selectors.get(key) for key in _REQUIRED_SCRAPER_SELECTORS)

    # -- stages ---------------------------------------------------------

    def collect_all(self, collectors: List) -> List[Dict]:
        """Run every collector, aggregating their articles. Fail-soft.

        A collector that raises during ``collect()`` is logged, recorded in
        ``self.errors``, and skipped; the remaining collectors still run.
        """
        articles: List[Dict] = []
        for collector in collectors:
            name = getattr(collector, "name", repr(collector))
            try:
                collected = collector.collect() or []
            except Exception as exc:  # noqa: BLE001 -- fail soft per source
                message = f"Collector {name!r} failed: {exc}"
                logger.error(message)
                self.errors.append(message)
                continue
            logger.info("Collected %d article(s) from %r", len(collected), name)
            articles.extend(collected)

        logger.info("Collected %d article(s) total from %d collector(s)",
                    len(articles), len(collectors))
        return articles

    def process(self, articles: List[Dict]) -> List[Dict]:
        """Deduplicate then categorize the collected articles."""
        deduped = self.deduplicator.deduplicate(articles)
        logger.info("Deduplicated %d -> %d article(s)",
                    len(articles), len(deduped))
        categorized = self.categorizer.categorize(deduped)
        logger.info("Categorized %d article(s)", len(categorized))
        return categorized

    def filter_already_exported(
        self, articles: List[Dict], sheet_name: str = "Articles"
    ) -> List[Dict]:
        """Drop articles whose URL is already present in the target sheet.

        Cross-run deduplication: the in-run Deduplicator only collapses
        duplicates *within* a single run, but RSS feeds keep the same recent
        items for days, so a daily cron would otherwise re-append them every
        run. This reads the URLs already in the sheet (via
        ``exporter.existing_urls``) and keeps only articles whose
        ``article_url`` is not among them.

        With no exporter configured the articles pass through unchanged (the
        missing-exporter failure is surfaced later by ``export``). The read is
        itself fail-soft (``existing_urls`` returns an empty set on error), so
        a read failure never drops new articles.
        """
        if self.exporter is None:
            return articles

        # Normalize both sides so a trailing slash / utm param doesn't make an
        # already-exported article look new (and get re-appended every run).
        existing = {
            normalize_url(u) for u in self.exporter.existing_urls(sheet_name)
        }
        new_articles = [
            article
            for article in articles
            if normalize_url(article.get("article_url")) not in existing
        ]
        skipped = len(articles) - len(new_articles)
        logger.info(
            "Cross-run dedup: %d already in sheet, %d new article(s) remain",
            skipped, len(new_articles),
        )
        return new_articles

    def export(self, articles: List[Dict], sheet_name: str = "Articles") -> Dict:
        """Export processed articles via the configured exporter."""
        if self.exporter is None:
            message = "No exporter configured (set sheet_id or inject exporter)"
            logger.error(message)
            self.errors.append(message)
            return {"exported": 0, "error": message}

        result = self.exporter.export_articles(articles, sheet_name=sheet_name)
        logger.info("Exported %s article(s) to sheet %r",
                    result.get("exported"), result.get("sheet", sheet_name))
        if result.get("error"):
            self.errors.append(f"Export error: {result['error']}")
        return result

    # -- orchestration --------------------------------------------------

    def run(self, sheet_name: str = "Articles") -> Dict:
        """Run the full pipeline and return a structured summary dict.

        Stages: build_collectors (if none injected) -> collect_all ->
        process -> filter_already_exported (cross-run dedup) -> export.

        Returns
        -------
        dict
            ``{"collected": N, "after_dedup": M, "after_cross_run_dedup": P,
            "exported": K, "sources_run": [...], "errors": [...]}``
        """
        logger.info("=== Content Hub ingestion run starting ===")

        collectors = self.collectors or self.build_collectors()

        collected = self.collect_all(collectors)
        processed = self.process(collected)
        # Cross-run dedup: skip anything already in the sheet from a prior run.
        new_articles = self.filter_already_exported(processed, sheet_name=sheet_name)
        export_result = self.export(new_articles, sheet_name=sheet_name)

        summary = {
            "collected": len(collected),
            "after_dedup": len(processed),
            "after_cross_run_dedup": len(new_articles),
            "exported": export_result.get("exported", 0),
            "sources_run": [getattr(c, "name", repr(c)) for c in collectors],
            "errors": list(self.errors),
        }

        logger.info(
            "=== Run complete: collected=%d after_dedup=%d "
            "after_cross_run_dedup=%d exported=%s sources=%d errors=%d ===",
            summary["collected"], summary["after_dedup"],
            summary["after_cross_run_dedup"], summary["exported"],
            len(summary["sources_run"]), len(summary["errors"]),
        )
        return summary


# -- logging setup -----------------------------------------------------------


def configure_logging(log_dir: str = _DEFAULT_LOG_DIR,
                       level: int = logging.INFO) -> None:
    """Configure root logging to a file (logs/ingest.log) and the console.

    Idempotent: repeated calls do not stack duplicate handlers.
    """
    root = logging.getLogger()
    root.setLevel(level)

    # Avoid duplicate handlers if called more than once (e.g. tests + main).
    if getattr(configure_logging, "_configured", False):
        return

    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s %(name)s: %(message)s"
    )

    console = logging.StreamHandler()
    console.setFormatter(formatter)
    root.addHandler(console)

    try:
        os.makedirs(log_dir, exist_ok=True)
        # RotatingFileHandler caps disk use: 5 MB per file, 5 backups kept
        # (~30 MB max) so an unattended daily cron can't grow logs unbounded.
        file_handler = logging.handlers.RotatingFileHandler(
            os.path.join(log_dir, "ingest.log"),
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
    """CLI entry point: run the daily ingestion pipeline.

    Reads the target sheet id from ``--sheet-id`` or the
    ``DATA_HUB_SHEET_ID`` environment variable. Prints the run summary and
    returns 0 on success, 1 on failure.
    """
    parser = argparse.ArgumentParser(
        description="Run the Content Hub daily ingestion pipeline."
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
        "--sheet-name",
        default="Articles",
        help="Worksheet/tab name to append articles to.",
    )
    args = parser.parse_args(argv)

    configure_logging()

    if not args.sheet_id:
        logger.error(
            "No sheet id provided. Set DATA_HUB_SHEET_ID or pass --sheet-id."
        )
        print("ERROR: no sheet id (set DATA_HUB_SHEET_ID or --sheet-id).",
              file=sys.stderr)
        return 1

    try:
        pipeline = IngestPipeline(
            sources_config_path=args.sources_config,
            sheet_id=args.sheet_id,
        )
        summary = pipeline.run(sheet_name=args.sheet_name)
    except Exception as exc:  # noqa: BLE001 -- top-level guard for a clean exit
        logger.exception("Ingestion pipeline crashed: %s", exc)
        print(f"ERROR: ingestion pipeline failed: {exc}", file=sys.stderr)
        return 1

    print("Content Hub ingestion summary:")
    print(f"  collected            : {summary['collected']}")
    print(f"  after_dedup          : {summary['after_dedup']}")
    print(f"  after_cross_run_dedup: {summary['after_cross_run_dedup']}")
    print(f"  exported             : {summary['exported']}")
    print(f"  sources_run          : {len(summary['sources_run'])}")
    print(f"  errors               : {len(summary['errors'])}")
    for error in summary["errors"]:
        print(f"    - {error}")

    # Surface failures: a non-empty errors list means at least one source or
    # the export failed. Alert (best-effort) and exit non-zero so launchd /
    # cloud schedulers see the failure instead of a silent "success".
    errors = summary.get("errors") or []
    if errors:
        from monitoring.notifier import send_alert

        send_alert(
            "Content Hub ingest finished with %d error(s): %s"
            % (len(errors), "; ".join(errors)),
            level="critical",
        )
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
