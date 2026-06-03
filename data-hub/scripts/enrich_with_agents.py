"""Repeatable "agent enrichment" helper for the Content Trend Data Hub.

Upgrades the LLM-quality tagging of stored articles using Claude *agents*
(no API key, no paid endpoint) instead of the keyword categorizer. The proven
flow is three steps; this script packages the bookends (prep + merge) so each
is one command, and a saved named workflow (.claude/workflows/enrich-articles.js)
does the agent fan-out in the middle:

    1. prep   -> dump un-enriched DB rows to data/enrich/input.jsonl + manifest,
                 print the exact workflow args to run.
    2. (agents) run the `enrich-articles` workflow -- Claude fans out agents
                 that classify each line and write data/enrich/out_<batch>.jsonl.
    3. merge  -> read every out_*.jsonl, write the classifications back to the
                 DB (enriched=1), and (optionally) re-mirror the DB to Sheets.

Idempotent: ``prep --scope unenriched`` (the default) only dumps rows still
missing the enriched flag, so a re-run after a partial merge picks up only the
remainder.

This script talks to the LIVE DB (and, on ``merge --remirror``, the live Sheets
API) and is therefore NOT part of the mocked pytest suite -- same convention as
scripts/verify_sheets_setup.py and scripts/remirror_to_sheets.py. The PURE
helpers (``build_input_record`` / ``out_line_to_update_fields`` /
``select_where``) ARE unit-tested in tests/test_enrich_with_agents.py.

Usage:
    cd data-hub
    source venv/bin/activate
    ./scripts/enrich_with_agents.sh status
    ./scripts/enrich_with_agents.sh prep                 # scope=unenriched
    ./scripts/enrich_with_agents.sh prep --scope recent --months 6
    # ...run the printed Workflow(name="enrich-articles", ...) in Claude...
    ./scripts/enrich_with_agents.sh merge --remirror
"""

from __future__ import annotations

import argparse
import glob
import json
import math
import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

# Make the data-hub package importable when run as `python scripts/...`.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from collectors.url_utils import normalize_url  # noqa: E402
from storage.article_store import SqliteArticleStore  # noqa: E402

DEFAULT_DB_PATH = "data/content_hub.db"
ENRICH_DIR = "data/enrich"
INPUT_FILE = os.path.join(ENRICH_DIR, "input.jsonl")
MANIFEST_FILE = os.path.join(ENRICH_DIR, "manifest.json")
OUT_GLOB = os.path.join(ENRICH_DIR, "out_*.jsonl")
DEFAULT_BATCH_SIZE = 50
DEFAULT_MONTHS = 6
WORKFLOW_NAME = "enrich-articles"

# The classification fields an agent out-line may carry (besides ``url``).
# ``trend_signals`` is the only list-valued one; the rest are plain strings.
_OUT_FIELDS = (
    "content_excerpt",
    "topic_region",
    "spirits_type",
    "primary_category",
    "buyer_persona",
    "aeo_citation_opportunity",
    "thailand_focus",
)


# === PURE helpers (unit-tested; no DB / network / filesystem / clock) =======


def build_input_record(row: Dict, n: int) -> Dict:
    """Map a stored article row dict to one input.jsonl record.

    Shape: ``{n, url, title, excerpt, source, vertical}``. ``n`` is the 0-based
    line index (the workflow addresses batches by line range). Missing columns
    default to "". Extra columns on the row are dropped.
    """
    return {
        "n": int(n),
        "url": row.get("article_url") or "",
        "title": row.get("title") or "",
        "excerpt": row.get("content_excerpt") or "",
        "source": row.get("source_name") or "",
        "vertical": row.get("primary_category") or "",
    }


def _coerce_trend_signals(value) -> List[str]:
    """Coerce a trend_signals value to a clean list of strings.

    Accepts an actual list, a JSON-array string (``'["a","b"]'``), a
    pipe-joined string (``"a | b"``), or empty/None -> ``[]``.
    """
    if value is None:
        return []
    if isinstance(value, (list, tuple)):
        return [str(v).strip() for v in value if str(v).strip()]
    text = str(value).strip()
    if not text:
        return []
    # Try a JSON array first.
    if text.startswith("["):
        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                return [str(v).strip() for v in parsed if str(v).strip()]
        except (ValueError, TypeError):
            pass
    # Fall back to pipe-separated.
    return [part.strip() for part in text.split("|") if part.strip()]


def out_line_to_update_fields(obj: Dict) -> Optional[Dict]:
    """Map one out.jsonl object to ``store.update_article`` fields.

    * Keeps only the known classification keys (unknown keys are ignored).
    * ``trend_signals`` is always normalized to a list (accepts list /
      JSON-array string / pipe string / empty).
    * ``enriched`` is ALWAYS set to 1.
    * Returns ``None`` when the object has no usable ``url`` (the routing key),
      so the caller can count it as a bad/unroutable line.
    """
    if not isinstance(obj, dict):
        return None
    url = obj.get("url")
    if not url or not str(url).strip():
        return None

    fields: Dict = {}
    for key in _OUT_FIELDS:
        if key in obj:
            fields[key] = obj[key]
    # trend_signals always present as a list, even if the agent omitted it.
    fields["trend_signals"] = _coerce_trend_signals(obj.get("trend_signals"))
    fields["enriched"] = 1
    return fields


def select_where(scope: str, months: int = DEFAULT_MONTHS) -> Tuple[str, List]:
    """Return ``(where_clause, params)`` for a prep ``--scope``.

    Scopes:
      * ``unenriched`` (default) -- rows whose ``enriched`` flag is unset
        (NULL / '' / 0). The idempotency lever.
      * ``live``   -- kind='live' rows only.
      * ``recent`` -- kind='live' OR (kind='backfill' published within the last
        ``months`` months). The cutoff is a bound ISO-date param.
      * ``all``    -- every row (empty clause).

    Unknown scope names fall back to ``unenriched``. NOTE: ``recent`` is the
    only scope that computes a date; it is invoked from the operator path, and
    the unit tests assert only the *shape* (a single string param), never the
    clock value -- so this remains test-stable.
    """
    if scope == "all":
        return "", []
    if scope == "live":
        return " WHERE kind = 'live'", []
    if scope == "recent":
        cutoff = (
            datetime.now(timezone.utc) - timedelta(days=30 * int(months))
        ).strftime("%Y-%m-%d")
        where = (
            " WHERE kind = 'live' "
            "OR (kind = 'backfill' AND published_date >= ?)"
        )
        return where, [cutoff]
    # Default + unknown -> unenriched. Treat NULL / '' / 0 as un-enriched.
    return (
        " WHERE enriched IS NULL OR enriched = '' OR enriched = 0",
        [],
    )


# === DB / filesystem operations (operator path; not unit-tested) ============


def _clear_stale_outputs() -> int:
    """Delete any stale ``out_*.jsonl`` so a prep starts from a clean slate."""
    removed = 0
    for path in glob.glob(OUT_GLOB):
        try:
            os.remove(path)
            removed += 1
        except OSError:
            pass
    return removed


def _select_rows(store: SqliteArticleStore, scope: str, months: int) -> List[Dict]:
    """Fetch the rows for ``scope`` from the DB (raw column dicts)."""
    conn = store._connect()  # the store's lazy connection (same module)
    where, params = select_where(scope, months)
    sql = f"SELECT * FROM articles{where} ORDER BY id ASC"
    rows = conn.execute(sql, params).fetchall()
    return [dict(row) for row in rows]


def cmd_prep(args) -> int:
    """Dump rows to input.jsonl + manifest.json and print the workflow args."""
    store = SqliteArticleStore(db_path=args.db_path)
    store.init_schema()

    os.makedirs(ENRICH_DIR, exist_ok=True)
    removed = _clear_stale_outputs()
    if removed:
        print(f"Cleared {removed} stale out_*.jsonl file(s).")

    rows = _select_rows(store, args.scope, args.months)
    total = len(rows)
    batch_size = max(1, int(args.batch_size))
    n_batches = math.ceil(total / batch_size) if total else 0

    with open(INPUT_FILE, "w", encoding="utf-8") as fh:
        for n, row in enumerate(rows):
            fh.write(json.dumps(build_input_record(row, n), ensure_ascii=False))
            fh.write("\n")

    input_abs = os.path.abspath(INPUT_FILE)
    out_abs = os.path.abspath(ENRICH_DIR)
    manifest = {
        "total": total,
        "batch_size": batch_size,
        "n_batches": n_batches,
        "input_file": input_abs,
        "out_dir": out_abs,
        "scope": args.scope,
        "created_hint": datetime.now(timezone.utc).isoformat(),
    }
    with open(MANIFEST_FILE, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)

    print("Agent enrichment -- prep")
    print("=" * 60)
    print(f"DB:        {args.db_path}")
    print(f"Scope:     {args.scope}" + (
        f" (months={args.months})" if args.scope == "recent" else ""))
    print(f"Rows:      {total}")
    print(f"Batches:   {n_batches} (batch-size {batch_size})")
    print(f"Input:     {input_abs}")
    print(f"Out dir:   {out_abs}")
    print("-" * 60)

    if total == 0:
        print("Nothing to enrich for this scope. (All caught up?)")
        print("Tip: check ./scripts/enrich_with_agents.sh status")
        return 0

    args_json = json.dumps(
        {
            "inputFile": input_abs,
            "outDir": out_abs,
            "total": total,
            "batchSize": batch_size,
            "model": "sonnet",
        },
        ensure_ascii=False,
    )
    print(
        f'Run the workflow:  Workflow(name="{WORKFLOW_NAME}", args={args_json})'
    )
    print("Then merge:  ./scripts/enrich_with_agents.sh merge --remirror")
    return 0


def cmd_merge(args) -> int:
    """Read all out_*.jsonl, write classifications back to the DB, optionally re-mirror."""
    store = SqliteArticleStore(db_path=args.db_path)
    store.init_schema()

    out_files = sorted(glob.glob(OUT_GLOB))
    print("Agent enrichment -- merge")
    print("=" * 60)
    print(f"DB:        {args.db_path}")
    print(f"Out files: {len(out_files)}")
    print("-" * 60)

    updated = 0
    not_found = 0
    bad_lines = 0

    for path in out_files:
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except (ValueError, TypeError):
                    bad_lines += 1
                    continue
                fields = out_line_to_update_fields(obj)
                if fields is None:
                    bad_lines += 1
                    continue
                key = normalize_url(obj["url"])
                if not key:
                    bad_lines += 1
                    continue
                if store.update_article(key, fields):
                    updated += 1
                else:
                    not_found += 1

    print(f"SUMMARY: updated={updated} url_not_found={not_found} "
          f"bad_lines={bad_lines}")

    if args.remirror:
        print("-" * 60)
        print("Re-mirroring DB -> Sheets ...")
        rc = _remirror(args.db_path)
        if rc != 0:
            print("WARN: re-mirror reported a non-zero exit "
                  f"({rc}). The DB write-back still succeeded.")
        return rc
    else:
        print("(Skipped re-mirror. Pass --remirror to refresh the Sheet.)")
    return 0


def _remirror(db_path: str) -> int:
    """Invoke the existing DB->Sheets re-mirror (reuse, don't duplicate)."""
    from scripts import remirror_to_sheets
    return remirror_to_sheets.main(["--db-path", db_path])


def cmd_status(args) -> int:
    """Print enriched vs total counts + how many remain un-enriched."""
    store = SqliteArticleStore(db_path=args.db_path)
    store.init_schema()
    conn = store._connect()
    total = int(conn.execute("SELECT COUNT(*) FROM articles").fetchone()[0])
    enriched = int(
        conn.execute(
            "SELECT COUNT(*) FROM articles WHERE enriched = 1"
        ).fetchone()[0]
    )
    where, params = select_where("unenriched")
    unenriched = int(
        conn.execute(
            f"SELECT COUNT(*) FROM articles{where}", params
        ).fetchone()[0]
    )

    print("Agent enrichment -- status")
    print("=" * 40)
    print(f"DB:          {args.db_path}")
    print(f"Total:       {total}")
    print(f"Enriched:    {enriched}")
    print(f"Un-enriched: {unenriched}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Repeatable agent-enrichment helper (prep/merge/status)."
    )
    parser.add_argument(
        "--db-path", default=DEFAULT_DB_PATH,
        help="Path to the SQLite DB (default data/content_hub.db).",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_prep = sub.add_parser("prep", help="Dump rows + print workflow args.")
    p_prep.add_argument(
        "--scope", default="unenriched",
        choices=["unenriched", "live", "recent", "all"],
        help="Which rows to dump (default: unenriched).",
    )
    p_prep.add_argument(
        "--batch-size", type=int, default=DEFAULT_BATCH_SIZE,
        help=f"Lines per agent batch (default {DEFAULT_BATCH_SIZE}).",
    )
    p_prep.add_argument(
        "--months", type=int, default=DEFAULT_MONTHS,
        help=f"For --scope recent: backfill window in months (default {DEFAULT_MONTHS}).",
    )
    p_prep.set_defaults(func=cmd_prep)

    p_merge = sub.add_parser("merge", help="Write out_*.jsonl back to the DB.")
    p_merge.add_argument(
        "--remirror", action="store_true",
        help="After writing back, re-mirror the DB to Google Sheets.",
    )
    p_merge.set_defaults(func=cmd_merge)

    p_status = sub.add_parser("status", help="Show enriched vs total counts.")
    p_status.set_defaults(func=cmd_status)

    return parser


def main(argv=None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
