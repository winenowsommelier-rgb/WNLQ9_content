"""Backfill ``beverage_relevance`` on existing DB rows (keyword pass, no network).

A cross-vertical topical flag added after the corpus was already collected.
This operator script walks EVERY stored article, recomputes its
``beverage_relevance`` level from the stored title + excerpt + primary_category
using the pure keyword path (:meth:`Categorizer._detect_beverage_relevance`),
and writes it back via ``store.update_article``. It is:

  * non-destructive -- it only sets the flag, never deletes a row;
  * pure keyword -- no LLM, no network, no Sheets; fast even on the full corpus;
  * idempotent -- re-running recomputes the same levels and re-writes them.

A row that already carries a valid agent-set level keeps it (the categorizer's
preset is authoritative), so running this AFTER an agent enrichment pass never
clobbers the better LLM values.

This script talks to the LIVE DB and is therefore NOT part of the mocked pytest
suite (same convention as scripts/remirror_to_sheets.py / enrich_with_agents.py).

Usage:
    cd data-hub
    source venv/bin/activate
    python scripts/backfill_beverage_relevance.py
    python scripts/backfill_beverage_relevance.py --db-path data/content_hub.db
    python scripts/backfill_beverage_relevance.py --dry-run

After backfilling, re-mirror the DB to Sheets so the dashboards pick up column Q:
    DATA_HUB_SHEET_ID=... ./scripts/remirror_to_sheets.sh
"""

from __future__ import annotations

import argparse
import os
import sys
from collections import Counter

# Make the data-hub package importable when run as `python scripts/...`.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from processors.categorizer import Categorizer  # noqa: E402
from storage.article_store import SqliteArticleStore  # noqa: E402

DEFAULT_DB_PATH = "data/content_hub.db"


def backfill(db_path: str = DEFAULT_DB_PATH, dry_run: bool = False) -> Counter:
    """Recompute + write ``beverage_relevance`` for every stored row.

    Returns a ``Counter`` of the resulting level distribution. On ``dry_run``
    nothing is written; the distribution is still computed and returned.
    """
    store = SqliteArticleStore(db_path=db_path)
    store.init_schema()  # guarded ALTER adds the column on an older DB.
    categorizer = Categorizer()

    conn = store._connect()
    rows = conn.execute(
        "SELECT url_normalized, title, content_excerpt, primary_category, "
        "beverage_relevance FROM articles"
    ).fetchall()

    dist: Counter = Counter()
    updated = 0
    for row in rows:
        article = {
            "title": row["title"] or "",
            "content_excerpt": row["content_excerpt"] or "",
            "primary_category": row["primary_category"] or "",
            # A valid stored level is treated as a preset and kept (agent wins).
            "beverage_relevance": row["beverage_relevance"] or "",
        }
        level = categorizer._detect_beverage_relevance(article)
        dist[level] += 1
        if not dry_run:
            store.update_article(row["url_normalized"], {"beverage_relevance": level})
            updated += 1

    total = sum(dist.values())
    print(f"Scanned {total} articles ({db_path}).")
    for level in ("high", "medium", "low"):
        n = dist.get(level, 0)
        pct = (100 * n / total) if total else 0
        print(f"  {level:<6} {n:>6}  ({pct:5.1f}%)")
    if dry_run:
        print("Dry run: no rows written.")
    else:
        print(f"Updated beverage_relevance on {updated} rows.")
    return dist


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db-path", default=DEFAULT_DB_PATH)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Compute + print the distribution without writing.",
    )
    ns = parser.parse_args()
    backfill(db_path=ns.db_path, dry_run=ns.dry_run)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
