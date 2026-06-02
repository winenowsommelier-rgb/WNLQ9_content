"""Health monitoring for the Content Trend Data Hub pipeline.

The daily ingestion pipeline (``pipeline/ingest.py``) runs unattended from
cron. ``HealthCheck`` answers the question an operator asks every morning:
*did last night's run actually work, and is the data still trustworthy?*

It performs three independent, fail-soft checks:

1. :meth:`check_recent_articles` -- are new articles landing in the Articles
   worksheet? Reads the sheet via the exporter's Sheets service and counts
   rows whose ``Collected Date`` falls inside the last ``hours_back`` hours.
2. :meth:`check_log_freshness` -- did the pipeline run recently? Inspects the
   modification time of ``logs/ingest.log``.
3. :meth:`check_data_quality` -- are recent rows well-formed? Flags rows
   missing required fields (Title, URL) or categorization (Region, AEO Value).

:meth:`run_all_checks` aggregates the three into an overall verdict
(``healthy`` / ``warning`` / ``critical``).

Design (matching the rest of the codebase):

* **Dependency injection / testability.** The exporter is injectable, and
  every "now" is an injectable ``reference_time``, so all time-based logic is
  deterministic under test. The Sheets API is reached only through the
  exporter's ``_get_service`` seam, which tests patch -- no credentials or
  network access are ever required.
* **Fail-soft.** A check that errors reports ``status="error"`` for itself
  instead of crashing the whole run; one broken check never hides the others.
* **Observability + cron-friendliness.** :func:`main` prints a readable
  report and exits non-zero only when the overall verdict is ``critical``,
  so a cron wrapper can alert on a genuine outage but stay quiet on a soft
  warning.

Entry point: ``python -m monitoring.health_check`` (see :func:`main`), which
reads the target sheet id from ``DATA_HUB_SHEET_ID``.
"""

from __future__ import annotations

import logging
import os
import sys
from datetime import datetime, timezone
from typing import Dict, List, Optional

from exporters.sheets_exporter import SheetsExporter

logger = logging.getLogger("monitoring.health_check")

# Default location for run logs (mirrors pipeline.ingest).
_DEFAULT_LOG_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs"
)

# Minimum number of recent articles before we consider ingestion "healthy".
# A normal daily run lands well above this; below it usually means a feed
# changed, a source went down, or the run did not happen at all.
_RECENT_ARTICLES_THRESHOLD = 5

# How stale logs/ingest.log may be before it's a warning. The daily run is
# scheduled at 2 AM; allowing ~26h tolerates a slightly late or skipped run
# without false-alarming the moment the clock rolls past 24h.
_LOG_STALE_HOURS = 26

# The Articles worksheet column order is owned by SheetsExporter.COLUMNS.
# We resolve the indices we need from it so the two stay in lockstep.
_COLS = SheetsExporter.COLUMNS
_IDX_TITLE = _COLS.index("Title")
_IDX_URL = _COLS.index("URL")
_IDX_REGION = _COLS.index("Region")
_IDX_AEO = _COLS.index("AEO Value")
_IDX_COLLECTED = _COLS.index("Collected Date")

# Range covering all Articles columns, derived from the exporter's COLUMNS so
# it stays in lockstep when columns are appended (e.g. A:P with 16 columns).
_ARTICLES_RANGE = f"Articles!A:{SheetsExporter._last_column_letter()}"


class HealthCheck:
    """Inspect pipeline + data health and produce a structured verdict.

    Parameters
    ----------
    sheet_id:
        Target Google Sheet id. Used to build a :class:`SheetsExporter`
        when one is not injected via ``exporter``.
    exporter:
        Pre-built exporter (or any object exposing ``sheet_id`` and a
        ``_get_service()`` returning a Sheets service). Injected by tests so
        no real Google API access is required.
    log_dir:
        Directory containing ``ingest.log``. Defaults to ``logs/``.
    """

    def __init__(
        self,
        sheet_id: Optional[str] = None,
        exporter=None,
        log_dir: str = _DEFAULT_LOG_DIR,
    ) -> None:
        self.log_dir = log_dir

        if exporter is not None:
            self.exporter = exporter
            # Prefer an explicit sheet_id, else borrow the exporter's.
            self.sheet_id = sheet_id or getattr(exporter, "sheet_id", None)
        else:
            self.sheet_id = sheet_id
            # Lazy: building a SheetsExporter never touches credentials or the
            # network, so this is safe even with no real sheet configured.
            self.exporter = (
                SheetsExporter(sheet_id=sheet_id) if sheet_id is not None
                else None
            )

    # -- helpers --------------------------------------------------------

    @staticmethod
    def _now(reference_time: Optional[datetime]) -> datetime:
        """Return the reference time, defaulting to a timezone-aware now()."""
        if reference_time is not None:
            return reference_time
        return datetime.now(timezone.utc)

    @staticmethod
    def _parse_iso(value: str) -> Optional[datetime]:
        """Parse a Collected Date cell into a tz-aware datetime, or None.

        The exporter writes ``YYYY-MM-DDTHH:MM:SSZ``; we also accept plain
        ISO 8601 with offsets. Anything unparseable yields ``None`` so a
        single malformed cell never aborts the count.
        """
        if not value:
            return None
        text = value.strip()
        if not text:
            return None
        # Normalise a trailing Z to an explicit UTC offset for fromisoformat.
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        try:
            dt = datetime.fromisoformat(text)
        except ValueError:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt

    def _read_rows(self) -> List[List[str]]:
        """Read the Articles worksheet (full column range), returning data rows.

        The header row (row 0) is dropped. Raises on API/credential errors;
        callers wrap this so a failure surfaces as a per-check error.
        """
        if self.exporter is None:
            raise RuntimeError(
                "No exporter configured (set sheet_id or inject exporter)"
            )
        service = self.exporter._get_service()
        sheet_id = getattr(self.exporter, "sheet_id", self.sheet_id)
        response = (
            service.spreadsheets()
            .values()
            .get(spreadsheetId=sheet_id, range=_ARTICLES_RANGE)
            .execute()
        )
        values = response.get("values", []) or []
        # Drop the header row if present.
        return values[1:] if values else []

    @staticmethod
    def _cell(row: List[str], idx: int) -> str:
        """Return a row's cell at idx, tolerating short (truncated) rows."""
        return row[idx].strip() if idx < len(row) and row[idx] else ""

    # -- checks ---------------------------------------------------------

    def check_recent_articles(
        self,
        hours_back: int = _LOG_STALE_HOURS,
        reference_time: Optional[datetime] = None,
    ) -> Dict:
        """Count articles collected within the last ``hours_back`` hours.

        Returns ``{"status", "recent_count", "total_count", "threshold"}``.
        ``healthy`` when ``recent_count`` meets ``threshold``, else
        ``warning``. Fail-soft: an API error yields ``status="error"``.
        """
        now = self._now(reference_time)
        try:
            rows = self._read_rows()
        except Exception as exc:  # noqa: BLE001 -- fail soft per check
            logger.error("check_recent_articles failed reading sheet: %s", exc)
            return {
                "status": "error",
                "recent_count": 0,
                "total_count": 0,
                "threshold": _RECENT_ARTICLES_THRESHOLD,
                "error": str(exc),
            }

        recent = 0
        for row in rows:
            collected = self._parse_iso(self._cell(row, _IDX_COLLECTED))
            if collected is None:
                continue
            age_hours = (now - collected).total_seconds() / 3600.0
            if 0 <= age_hours <= hours_back:
                recent += 1

        status = "healthy" if recent >= _RECENT_ARTICLES_THRESHOLD else "warning"
        result = {
            "status": status,
            "recent_count": recent,
            "total_count": len(rows),
            "threshold": _RECENT_ARTICLES_THRESHOLD,
        }
        logger.info(
            "check_recent_articles: %s (recent=%d total=%d window=%dh)",
            status, recent, len(rows), hours_back,
        )
        return result

    def check_log_freshness(
        self, reference_time: Optional[datetime] = None
    ) -> Dict:
        """Check that ``logs/ingest.log`` was modified recently.

        Returns ``{"status", "last_modified", "hours_since", "reason"?}``.
        ``healthy`` if modified within ~26h; ``warning`` if stale or missing.
        """
        now = self._now(reference_time)
        log_path = os.path.join(self.log_dir, "ingest.log")

        if not os.path.exists(log_path):
            logger.warning("check_log_freshness: %s not found", log_path)
            return {
                "status": "warning",
                "last_modified": None,
                "hours_since": None,
                "reason": "log not found",
            }

        try:
            mtime = os.path.getmtime(log_path)
        except OSError as exc:  # noqa: BLE001 -- fail soft per check
            logger.error("check_log_freshness failed: %s", exc)
            return {
                "status": "error",
                "last_modified": None,
                "hours_since": None,
                "error": str(exc),
            }

        last_modified = datetime.fromtimestamp(mtime, tz=timezone.utc)
        hours_since = (now - last_modified).total_seconds() / 3600.0
        status = "healthy" if hours_since <= _LOG_STALE_HOURS else "warning"
        result = {
            "status": status,
            "last_modified": last_modified.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "hours_since": round(hours_since, 2),
        }
        if status == "warning":
            result["reason"] = f"log stale ({hours_since:.1f}h old)"
        logger.info(
            "check_log_freshness: %s (%.1fh since last write)",
            status, hours_since,
        )
        return result

    def check_data_quality(self, sample_size: int = 100) -> Dict:
        """Inspect the most recent ``sample_size`` rows for data problems.

        Flags rows missing required fields (Title, URL) and rows missing
        categorization (Region, AEO Value). Returns
        ``{"status", "issues", "checked"}``. Fail-soft on API errors.
        """
        try:
            rows = self._read_rows()
        except Exception as exc:  # noqa: BLE001 -- fail soft per check
            logger.error("check_data_quality failed reading sheet: %s", exc)
            return {"status": "error", "issues": [], "checked": 0,
                    "error": str(exc)}

        # Most recent rows are appended last; sample the tail.
        sample = rows[-sample_size:] if sample_size else rows

        missing_title = 0
        missing_url = 0
        missing_region = 0
        missing_aeo = 0
        for row in sample:
            if not self._cell(row, _IDX_TITLE):
                missing_title += 1
            if not self._cell(row, _IDX_URL):
                missing_url += 1
            if not self._cell(row, _IDX_REGION):
                missing_region += 1
            if not self._cell(row, _IDX_AEO):
                missing_aeo += 1

        issues: List[str] = []
        if missing_title:
            issues.append(f"{missing_title} row(s) missing Title")
        if missing_url:
            issues.append(f"{missing_url} row(s) missing URL")
        if missing_region:
            issues.append(f"{missing_region} row(s) missing Region")
        if missing_aeo:
            issues.append(f"{missing_aeo} row(s) missing AEO Value")

        status = "healthy" if not issues else "warning"
        logger.info(
            "check_data_quality: %s (%d issue type(s) over %d row(s))",
            status, len(issues), len(sample),
        )
        return {"status": status, "issues": issues, "checked": len(sample)}

    # -- aggregate ------------------------------------------------------

    def run_all_checks(
        self, reference_time: Optional[datetime] = None
    ) -> Dict:
        """Run all three checks and return an aggregate verdict.

        Returns ``{"overall", "checks", "timestamp"}`` where ``overall`` is:
        ``critical`` if any check errored, ``warning`` if any warned, else
        ``healthy``.
        """
        now = self._now(reference_time)
        checks = {
            "recent_articles": self.check_recent_articles(
                reference_time=now
            ),
            "log_freshness": self.check_log_freshness(reference_time=now),
            "data_quality": self.check_data_quality(),
        }

        statuses = {c["status"] for c in checks.values()}
        if "error" in statuses:
            overall = "critical"
        elif "warning" in statuses:
            overall = "warning"
        else:
            overall = "healthy"

        logger.info("run_all_checks: overall=%s", overall)
        return {
            "overall": overall,
            "checks": checks,
            "timestamp": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }


# -- report rendering --------------------------------------------------------


def format_report(result: Dict) -> str:
    """Render a run_all_checks() result as a human-readable report."""
    lines: List[str] = []
    lines.append("Content Hub health check")
    lines.append(f"  timestamp : {result.get('timestamp')}")
    lines.append(f"  OVERALL   : {result.get('overall', '?').upper()}")
    lines.append("")

    checks = result.get("checks", {})

    ra = checks.get("recent_articles", {})
    lines.append(f"  recent_articles : {ra.get('status', '?').upper()}")
    if "error" in ra:
        lines.append(f"      error: {ra['error']}")
    else:
        lines.append(
            f"      {ra.get('recent_count')} recent / "
            f"{ra.get('total_count')} total "
            f"(threshold {ra.get('threshold')})"
        )

    lf = checks.get("log_freshness", {})
    lines.append(f"  log_freshness   : {lf.get('status', '?').upper()}")
    if "error" in lf:
        lines.append(f"      error: {lf['error']}")
    elif lf.get("last_modified"):
        lines.append(
            f"      last write {lf.get('hours_since')}h ago "
            f"({lf.get('last_modified')})"
        )
    else:
        lines.append(f"      {lf.get('reason', 'no log')}")

    dq = checks.get("data_quality", {})
    lines.append(f"  data_quality    : {dq.get('status', '?').upper()}")
    if "error" in dq:
        lines.append(f"      error: {dq['error']}")
    else:
        lines.append(f"      checked {dq.get('checked')} row(s)")
        for issue in dq.get("issues", []):
            lines.append(f"      - {issue}")

    return "\n".join(lines)


# -- CLI entry point ---------------------------------------------------------


def main(argv: Optional[List[str]] = None) -> int:
    """CLI entry point: run all health checks and print a report.

    Reads the sheet id from ``DATA_HUB_SHEET_ID``. Exits 0 when the overall
    verdict is ``healthy`` or ``warning`` (soft -- nothing to page about),
    and 1 when ``critical`` so a cron wrapper can alert.
    """
    # Reuse the pipeline's logging setup so health checks land in ingest.log.
    try:
        from pipeline.ingest import configure_logging

        configure_logging()
    except Exception:  # noqa: BLE001 -- logging setup must never block a check
        logging.basicConfig(level=logging.INFO)

    sheet_id = os.environ.get("DATA_HUB_SHEET_ID")
    if not sheet_id:
        logger.error(
            "No sheet id provided. Set DATA_HUB_SHEET_ID before running."
        )
        print("ERROR: no sheet id (set DATA_HUB_SHEET_ID).", file=sys.stderr)
        return 1

    try:
        checker = HealthCheck(sheet_id=sheet_id)
        result = checker.run_all_checks()
    except Exception as exc:  # noqa: BLE001 -- top-level guard for clean exit
        logger.exception("Health check crashed: %s", exc)
        print(f"ERROR: health check failed: {exc}", file=sys.stderr)
        return 1

    print(format_report(result))

    return 1 if result["overall"] == "critical" else 0


if __name__ == "__main__":
    sys.exit(main())
