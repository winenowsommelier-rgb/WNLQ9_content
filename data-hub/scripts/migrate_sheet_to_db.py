"""One-time migration: import existing Google Sheets data into the SQLite DB.

The Content Hub used to keep everything in a Google Sheet. The system-of-record
is now a local SQLite database (``data/content_hub.db``); Sheets is demoted to
a mirror. This script reads the historical rows already in the ``Articles`` and
``Historical_Backfill`` tabs and upserts them into the DB so nothing is lost in
the cutover.

Idempotent: re-running is safe -- the store dedups by normalized URL, so rows
already imported are skipped. Run it once after deploying the DB-backed
pipelines; a second run should report 0 inserted.

Usage:
    cd data-hub
    source venv/bin/activate
    export DATA_HUB_SHEET_ID="your-sheet-id"
    python scripts/migrate_sheet_to_db.py                 # both tabs
    python scripts/migrate_sheet_to_db.py --sheet-id ...  # explicit id
    python scripts/migrate_sheet_to_db.py --db-path data/content_hub.db

This script talks to the LIVE Google Sheets API and is therefore NOT part of
the mocked pytest suite (same convention as scripts/verify_sheets_setup.py).
The PURE row->article mapping (:func:`row_to_article`) IS unit-tested in
tests/test_migrate_mapping.py.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List

# Make the data-hub package importable when run as `python scripts/...`.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from exporters.sheets_exporter import SheetsExporter  # noqa: E402
from storage.article_store import SqliteArticleStore  # noqa: E402

DEFAULT_CREDENTIALS_PATH = "config/google-credentials.json"
DEFAULT_DB_PATH = "data/content_hub.db"

# The tabs to migrate, in order.
TABS = ("Articles", "Historical_Backfill")


# -- PURE mapping (no network; unit-tested) ----------------------------------

# COLUMNS-ordered fields that hold datetimes. When the Sheet was read with
# valueRenderOption="UNFORMATTED_VALUE", these come back as Sheets SERIAL
# NUMBERS (floats), not ISO strings -- so they need conversion before storage.
_DATE_FIELDS = ("published_date", "collected_date")

# Google Sheets' serial-date epoch: serial 0 == 1899-12-30 00:00:00.
_SHEETS_EPOCH = datetime(1899, 12, 30)


def sheets_date_to_iso(value) -> str:
    """Convert a date cell value to an ISO-8601 UTC string -- PURE, no network.

    The exporter writes Published/Collected Date with ``USER_ENTERED`` so Sheets
    stores them as real datetimes; an ``UNFORMATTED_VALUE`` readback returns them
    as floats (serial numbers, e.g. ``46172.375``), NOT ISO strings.

    Rules:
    * Numeric value (int/float, or a purely-numeric string) -> treated as a
      Sheets serial and converted to ``YYYY-MM-DDTHH:MM:SSZ``. The serial epoch
      is 1899-12-30, so ``iso = epoch + timedelta(days=serial)``.
    * An already-ISO / parseable date string -> returned unchanged.
    * Empty / None -> ``""``.
    * Any other (junk) string -> returned unchanged.
    """
    if value is None:
        return ""

    # Real numeric (Sheets serial) -> convert.
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return (_SHEETS_EPOCH + timedelta(days=float(value))).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        )

    text = str(value).strip()
    if not text:
        return ""

    # Numeric STRING (e.g. "46172" or "46172.375") -> serial -> convert.
    try:
        serial = float(text)
    except ValueError:
        # Not numeric: already an ISO/date string (or junk) -> pass through.
        return text
    return (_SHEETS_EPOCH + timedelta(days=serial)).strftime("%Y-%m-%dT%H:%M:%SZ")


def row_to_article(row: List) -> Dict:
    """Reverse of :meth:`SheetsExporter.format_article_row` -- pure, no network.

    Takes a COLUMNS-ordered list of cell values (exactly the shape one row from
    ``values.get(valueRenderOption="UNFORMATTED_VALUE")`` has) and returns an
    article dict keyed by the schema field names.

    * Driven by ``SheetsExporter.COLUMNS`` + ``_FIELD_BY_COLUMN`` so the column
      order / header->field mapping (including ``AEO Value`` ->
      ``aeo_citation_opportunity``) can never drift from the exporter.
    * ``trend_signals`` is split back into a list on the exporter's separator;
      a blank cell becomes ``[]``.
    * Missing trailing cells (Sheets omits trailing empties) and blank cells
      become ``""`` -- never ``None``.
    """
    columns = SheetsExporter.COLUMNS
    field_by_column = SheetsExporter._FIELD_BY_COLUMN
    separator = SheetsExporter.TREND_SIGNAL_SEPARATOR

    article: Dict = {}
    for index, column in enumerate(columns):
        field = field_by_column[column]
        # Sheets omits trailing empty cells, so a row may be shorter than
        # COLUMNS -- default any missing cell to "".
        raw = row[index] if index < len(row) else ""
        value = "" if raw is None else str(raw)

        if field == "trend_signals":
            value = value.strip()
            if not value:
                article[field] = []
            else:
                article[field] = [
                    part.strip() for part in value.split(separator.strip())
                    if part.strip()
                ]
        elif field in _DATE_FIELDS:
            # UNFORMATTED_VALUE returns datetimes as Sheets serial numbers
            # (floats). Convert them to ISO so filters/sorts work and a
            # Sheet->DB->Sheet round-trip can't corrupt the date. Pass the raw
            # cell (not str(raw)) so a numeric serial is detected.
            article[field] = sheets_date_to_iso(raw)
        elif field == "thailand_focus":
            # thailand_focus is a 3-LEVEL string ("high"/"medium"/""), NOT a
            # boolean. Pass the cell straight through, normalized: keep only
            # "high"/"medium" (case/whitespace-insensitive); anything else
            # (blank, legacy "TRUE"/"FALSE", unknown) collapses to "".
            level = value.strip().lower()
            article[field] = level if level in ("high", "medium") else ""
        else:
            # All other fields (including the AEO Value level high/medium/low)
            # pass through as the raw string -- no bool coercion.
            article[field] = value

    return article


# -- live migration (network; not in the mocked suite) -----------------------


def _read_tab_rows(service, sheet_id: str, tab: str) -> List[List]:
    """Read all rows of ``tab`` as UNFORMATTED values, dropping the header.

    Returns an empty list if the tab is absent/empty. Fail-soft: a read error
    is reported by the caller; here we let it raise so the caller records it.
    """
    last_col = SheetsExporter._last_column_letter()
    result = (
        service.spreadsheets()
        .values()
        .get(
            spreadsheetId=sheet_id,
            range=f"{tab}!A:{last_col}",
            valueRenderOption="UNFORMATTED_VALUE",
        )
        .execute()
    )
    rows = result.get("values") or []
    if not rows:
        return []

    # Drop the header row if present (first cell equals the first column name).
    header = SheetsExporter.COLUMNS[0]
    if rows and rows[0] and str(rows[0][0]).strip() == header:
        rows = rows[1:]
    return rows


def migrate_tab(service, store: SqliteArticleStore, sheet_id: str,
                tab: str) -> Dict:
    """Read one tab and upsert its rows into the DB. Returns per-tab counts.

    Fail-soft per row: a row that can't be mapped is counted as failed and
    skipped, never aborting the tab. Returns
    ``{"read": R, "inserted": I, "skipped": S, "failed": F}``.
    """
    try:
        rows = _read_tab_rows(service, sheet_id, tab)
    except Exception as exc:  # noqa: BLE001 -- report, don't crash other tabs
        print(f"  WARN  could not read tab {tab!r}: {exc}")
        return {"read": 0, "inserted": 0, "skipped": 0, "failed": 0}

    articles: List[Dict] = []
    failed = 0
    for row in rows:
        try:
            article = row_to_article(row)
        except Exception as exc:  # noqa: BLE001 -- fail soft per row
            failed += 1
            print(f"  WARN  skipping unmappable row in {tab!r}: {exc}")
            continue
        # A row with no URL can't be deduped/stored -- skip it.
        if not article.get("article_url"):
            failed += 1
            continue
        articles.append(article)

    result = store.upsert_articles(articles)
    inserted = len(result.get("inserted", []))
    skipped = int(result.get("skipped", 0))

    print(f"  {tab}: read={len(rows)} inserted={inserted} "
          f"skipped(dupe)={skipped} failed={failed}")
    return {
        "read": len(rows),
        "inserted": inserted,
        "skipped": skipped,
        "failed": failed,
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Import existing Google Sheets data into the SQLite DB "
                    "(one-time, idempotent)."
    )
    parser.add_argument(
        "--sheet-id",
        default=os.environ.get("DATA_HUB_SHEET_ID"),
        help="Source Google Sheet id (defaults to $DATA_HUB_SHEET_ID).",
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

    print("Sheets -> SQLite migration")
    print("=" * 40)

    if not args.sheet_id:
        print("ERROR: no sheet id (set DATA_HUB_SHEET_ID or --sheet-id).",
              file=sys.stderr)
        return 1

    # Ensure the DB directory exists (e.g. data/).
    db_dir = os.path.dirname(args.db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

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

    totals = {"read": 0, "inserted": 0, "skipped": 0, "failed": 0}
    for tab in TABS:
        counts = migrate_tab(service, store, args.sheet_id, tab)
        for key in totals:
            totals[key] += counts[key]

    print("-" * 40)
    print(f"TOTAL: read={totals['read']} inserted={totals['inserted']} "
          f"skipped(dupe)={totals['skipped']} failed={totals['failed']} "
          f"db_total={store.count()}")
    print(f"DB: {args.db_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
