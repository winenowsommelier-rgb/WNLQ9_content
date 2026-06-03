"""Rebuild the Google Sheet tabs FROM the SQLite DB (the system-of-record).

The DB is the source of truth; Sheets is a read-only mirror for the existing
dashboards. After an enrichment pass (``scripts/enrich_excerpts.py``) the DB
rows have fresh excerpts + recomputed categories, but the Sheet still shows the
stale values. This operator script clears each mirror tab and rewrites it from
the DB so the dashboards reflect the enriched data:

  * ``Articles``            <- store.query(kind="live")
  * ``Historical_Backfill`` <- store.query(kind="backfill")

Each tab is cleared then rewritten with a header + one row per article via the
existing :class:`SheetsExporter` (same column order / formatting as the live
pipeline). Idempotent: re-running produces the same Sheet. Reads the target
Sheet from ``DATA_HUB_SHEET_ID``.

This script talks to the LIVE Google Sheets API and is therefore NOT part of
the mocked pytest suite (same convention as scripts/verify_sheets_setup.py and
scripts/migrate_sheet_to_db.py).

Usage:
    cd data-hub
    source venv/bin/activate
    export DATA_HUB_SHEET_ID="your-sheet-id"
    python scripts/remirror_to_sheets.py
    python scripts/remirror_to_sheets.py --db-path data/content_hub.db
"""

from __future__ import annotations

import argparse
import os
import sys
from typing import Dict

# Make the data-hub package importable when run as `python scripts/...`.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from exporters.sheets_exporter import SheetsExporter  # noqa: E402
from storage.article_store import SqliteArticleStore  # noqa: E402

DEFAULT_CREDENTIALS_PATH = "config/google-credentials.json"
DEFAULT_DB_PATH = "data/content_hub.db"

# (tab name, DB provenance kind) pairs to rebuild.
TABS = (
    ("Articles", "live"),
    ("Historical_Backfill", "backfill"),
)


def _clear_tab(service, sheet_id: str, tab: str) -> None:
    """Clear all values from ``tab`` (leaves the tab itself in place)."""
    last_col = SheetsExporter._last_column_letter()
    service.spreadsheets().values().clear(
        spreadsheetId=sheet_id,
        range=f"{tab}!A:{last_col}",
        body={},
    ).execute()


def remirror_tab(
    service, exporter: SheetsExporter, store: SqliteArticleStore,
    sheet_id: str, tab: str, kind: str,
) -> Dict:
    """Rebuild one tab from the DB. Returns ``{"tab", "rows"}``.

    Ensures the tab exists, clears it, then writes a header + one row per stored
    article of the given ``kind``. Fail-soft per tab: a failure is reported and
    other tabs still rebuild.
    """
    try:
        articles = store.query(kind=kind)
        exporter._ensure_tab_exists(service, tab)
        _clear_tab(service, sheet_id, tab)
        result = exporter.export_articles(
            articles, sheet_name=tab, include_header=True
        )
        rows = int(result.get("exported", 0))
        if "error" in result:
            print(f"  WARN  {tab}: export reported error: {result['error']}")
        print(f"  {tab} (kind={kind}): wrote {rows} rows")
        return {"tab": tab, "rows": rows}
    except Exception as exc:  # noqa: BLE001 -- report, don't crash other tabs
        print(f"  WARN  could not rebuild tab {tab!r}: {exc}")
        return {"tab": tab, "rows": 0}


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Rebuild the Google Sheet mirror tabs from the SQLite DB "
                    "(idempotent; run after an enrichment pass)."
    )
    parser.add_argument(
        "--sheet-id", default=os.environ.get("DATA_HUB_SHEET_ID"),
        help="Target Google Sheet id (defaults to $DATA_HUB_SHEET_ID).",
    )
    parser.add_argument(
        "--credentials", default=DEFAULT_CREDENTIALS_PATH,
        help="Path to the service-account JSON key.",
    )
    parser.add_argument(
        "--db-path", default=DEFAULT_DB_PATH,
        help="Path to the SQLite DB (default data/content_hub.db).",
    )
    args = parser.parse_args(argv)

    print("DB -> Sheets re-mirror")
    print("=" * 40)

    if not args.sheet_id:
        print("ERROR: no sheet id (set DATA_HUB_SHEET_ID or --sheet-id).",
              file=sys.stderr)
        return 1

    store = SqliteArticleStore(db_path=args.db_path)
    store.init_schema()

    exporter = SheetsExporter(sheet_id=args.sheet_id,
                              credentials_path=args.credentials)
    try:
        service = exporter._get_service()
    except Exception as exc:  # noqa: BLE001 -- diagnose & report
        print(f"ERROR: could not connect to Google Sheets: {exc}",
              file=sys.stderr)
        return 1

    total = 0
    for tab, kind in TABS:
        counts = remirror_tab(service, exporter, store, args.sheet_id, tab, kind)
        total += counts["rows"]

    print("-" * 40)
    print(f"TOTAL rows written: {total}  (DB total: {store.count()})")
    print(f"DB: {args.db_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
