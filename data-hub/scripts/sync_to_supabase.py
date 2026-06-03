"""One-time / repeatable sync of the local SQLite DB into Supabase.

Streams every row from the local `data/content_hub.db` into the Supabase
`content_hub_articles` table via the SupabaseArticleStore — no giant SQL,
no token cost. Idempotent: existing rows (by normalized URL) are skipped on
insert, then refreshed in place so enriched fields stay faithful.

Requires (Supabase dashboard -> Settings -> API):
    export SUPABASE_URL="https://asnarjokyedupsjipzkl.supabase.co"
    export SUPABASE_SERVICE_KEY="<service_role secret>"

Usage:
    cd data-hub && source venv/bin/activate
    python scripts/sync_to_supabase.py            # full sync
    python scripts/sync_to_supabase.py --limit 50 # smoke test

Operator script — talks to live Supabase, NOT part of the mocked test suite.
"""

from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from storage.article_store import SqliteArticleStore  # noqa: E402
from storage.supabase_store import SupabaseArticleStore  # noqa: E402

# Fields whose values must survive the sync verbatim (enrichment + tags).
_FIDELITY_FIELDS = [
    "content_excerpt", "content_type", "topic_region", "spirits_type",
    "trend_signals", "primary_category", "buyer_persona",
    "aeo_citation_opportunity", "source_language", "thailand_focus",
    "beverage_relevance", "enriched", "author", "published_date",
    "collected_date", "title", "source_name",
]


def main() -> int:
    ap = argparse.ArgumentParser(description="Sync SQLite -> Supabase.")
    ap.add_argument("--db", default="data/content_hub.db")
    ap.add_argument("--limit", type=int, default=None,
                    help="Only sync the first N rows (smoke test).")
    ap.add_argument("--batch", type=int, default=200)
    args = ap.parse_args()

    if not (os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_KEY")):
        print("ERROR: set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars first "
              "(see config/.env.example).")
        return 1

    src = SqliteArticleStore(args.db)
    src.init_schema()
    dst = SupabaseArticleStore()

    rows = src.query(limit=args.limit) if args.limit else src.query()
    print(f"Read {len(rows)} rows from {args.db}")

    # Upsert grouped by kind so provenance (live/backfill) is preserved.
    by_kind: dict[str, list] = {}
    for r in rows:
        by_kind.setdefault(r.get("kind") or "live", []).append(r)

    inserted = skipped = promoted = 0
    for kind, group in by_kind.items():
        for i in range(0, len(group), args.batch):
            chunk = group[i:i + args.batch]
            res = dst.upsert_articles(chunk, kind=kind)
            inserted += len(res.get("inserted", []))
            promoted += len(res.get("promoted", []))
            skipped += res.get("skipped", 0)
            print(f"  [{kind}] {i + len(chunk)}/{len(group)} "
                  f"(+{len(res.get('inserted', []))} new)")

    # Refresh fidelity fields on every row so enriched tags are faithful
    # (upsert only sets columns on INSERT; existing rows need an update).
    refreshed = 0
    for r in rows:
        fields = {k: r.get(k) for k in _FIDELITY_FIELDS if k in r}
        if dst.update_article(r["url_normalized"], fields):
            refreshed += 1

    total = dst.count()
    print("-" * 50)
    print(f"SYNC DONE: inserted={inserted} promoted={promoted} skipped={skipped} "
          f"refreshed={refreshed}")
    print(f"Supabase content_hub_articles total: {total}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
