"""Backfill empty article excerpts, then re-categorize -- the enrichment pass.

87% of stored articles (mostly sitemap-backfilled rows) have an EMPTY
``content_excerpt`` -- only a slug-derived title. With no body text the keyword
categorizer can't detect region / spirits_type / trend_signals, so
``topic_region`` is ~85% "Other". This operator script walks the DB rows that
are missing an excerpt and not yet enriched, fetches each article's REAL page
text (publisher meta description / first paragraph -- NO LLM, NO API key), and
when text is found re-runs the existing :class:`Categorizer` so the category
fields refresh from the new excerpt, then writes everything back to the DB.

It is idempotent and fail-soft per row:

* Bounded by ``--limit`` (default 500) so a single run has a known ceiling;
  re-run until it reports 0 processed to drain the backlog.
* Every processed row is marked ``enriched=1`` -- INCLUDING rows whose fetch
  found nothing -- so a dead URL is never refetched on the next run.
* A polite ``--delay`` between fetches.

This script talks to the LIVE network + local DB and is therefore NOT part of
the mocked pytest suite (same convention as scripts/verify_sheets_setup.py).
The PURE-ish per-article step :func:`enrich_one` IS unit-tested in
tests/test_enrich.py with an injected fetcher + a real Categorizer.

Usage:
    cd data-hub
    source venv/bin/activate
    python scripts/enrich_excerpts.py                  # up to 500 rows
    python scripts/enrich_excerpts.py --limit 1000 --delay 0.5
    python scripts/enrich_excerpts.py --db-path data/content_hub.db

After an enrichment pass, refresh the Google Sheet from the DB with
``./scripts/remirror_to_sheets.sh``.
"""

from __future__ import annotations

import argparse
import copy
import os
import sys
import time
from typing import Callable, Dict, Optional

# Make the data-hub package importable when run as `python scripts/...`.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from collectors.fulltext import fetch_excerpt as _real_fetch_excerpt  # noqa: E402
from processors.categorizer import Categorizer  # noqa: E402
from storage.article_store import ARTICLE_FIELDS, SqliteArticleStore  # noqa: E402

DEFAULT_DB_PATH = "data/content_hub.db"
DEFAULT_LIMIT = 500
DEFAULT_DELAY = 0.5  # seconds between fetches; polite to publishers.


# -- PURE-ish per-article step (unit-tested, no network) ---------------------


def enrich_one(
    article: Dict,
    fetch_excerpt: Callable[[str], str],
    categorizer: Categorizer,
) -> Dict:
    """Enrich ONE article: fetch its excerpt, re-categorize, flag enriched.

    Pure-ish: depends only on its injected ``fetch_excerpt`` (a single-arg
    callable returning page text) and ``categorizer``. It does NOT mutate the
    input ``article`` -- it works on a copy and returns it.

    * Fetches ``article["article_url"]``. If text comes back, it sets
      ``content_excerpt`` and re-runs the categorizer so ``topic_region`` /
      ``spirits_type`` / ``trend_signals`` / ``primary_category`` /
      ``buyer_persona`` / ``aeo_citation_opportunity`` / ``thailand_focus``
      refresh from the new text.
    * If the fetch returns "" the article is left unchanged EXCEPT for the
      ``enriched`` flag (so a dead URL isn't refetched next run).
    * Always sets ``enriched = 1`` and a transient ``excerpt_found`` bool the
      caller uses for its summary tally (and to decide what to persist).
    """
    result = copy.deepcopy(article)
    url = result.get("article_url") or ""
    excerpt = fetch_excerpt(url) if url else ""

    if excerpt:
        result["content_excerpt"] = excerpt
        # Re-run the real keyword categorizer over title + new excerpt.
        categorizer.categorize([result])
        result["excerpt_found"] = True
    else:
        result["excerpt_found"] = False

    result["enriched"] = 1
    return result


# -- live pass (network + DB; not in the mocked suite) -----------------------


def _fields_to_persist(enriched: Dict, excerpt_found: bool) -> Dict:
    """Pick the DB columns to write back from an enriched article.

    When text was found we persist the refreshed excerpt + all re-categorized
    schema fields; otherwise only the ``enriched`` flag (so we don't refetch a
    dead URL). ``enriched`` is always set.
    """
    if not excerpt_found:
        return {"enriched": 1}
    fields = {field: enriched.get(field) for field in ARTICLE_FIELDS}
    fields["enriched"] = 1
    return fields


def run(
    store: SqliteArticleStore,
    limit: int = DEFAULT_LIMIT,
    delay: float = DEFAULT_DELAY,
    fetch_excerpt: Optional[Callable[[str], str]] = None,
    categorizer: Optional[Categorizer] = None,
    sleep: Optional[Callable[[float], None]] = None,
) -> Dict:
    """Run one bounded enrichment pass over the DB. Returns a summary dict.

    Fail-soft per row: a single row that errors is counted as failed and the
    pass continues. Counts: processed / excerpts_found / recategorized /
    failed.
    """
    fetch_excerpt = fetch_excerpt or _real_fetch_excerpt
    categorizer = categorizer or Categorizer()
    sleep = sleep if sleep is not None else time.sleep

    rows = store.iter_articles_missing_excerpt(limit=limit)
    summary = {
        "processed": 0,
        "excerpts_found": 0,
        "recategorized": 0,
        "failed": 0,
    }

    for index, article in enumerate(rows, start=1):
        key = article.get("url_normalized")
        url = article.get("article_url") or ""
        try:
            enriched = enrich_one(article, fetch_excerpt, categorizer)
            found = enriched.pop("excerpt_found", False)
            fields = _fields_to_persist(enriched, found)
            store.update_article(key, fields)

            summary["processed"] += 1
            if found:
                summary["excerpts_found"] += 1
                summary["recategorized"] += 1
            status = "OK " if found else "EMPTY"
            print(f"  [{index}/{len(rows)}] {status} {url}")
        except Exception as exc:  # noqa: BLE001 -- never abort the whole pass
            summary["failed"] += 1
            print(f"  [{index}/{len(rows)}] FAIL {url}: {exc}")

        # Polite pause between live fetches (skipped on the last row).
        if delay and index < len(rows):
            sleep(delay)

    return summary


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Backfill empty article excerpts (fetch real page text) "
                    "and re-categorize, writing back to the SQLite DB."
    )
    parser.add_argument(
        "--db-path", default=DEFAULT_DB_PATH,
        help="Path to the SQLite DB (default data/content_hub.db).",
    )
    parser.add_argument(
        "--limit", type=int, default=DEFAULT_LIMIT,
        help=f"Max rows to process this run (default {DEFAULT_LIMIT}).",
    )
    parser.add_argument(
        "--delay", type=float, default=DEFAULT_DELAY,
        help=f"Seconds to wait between fetches (default {DEFAULT_DELAY}).",
    )
    args = parser.parse_args(argv)

    print("Excerpt enrichment pass")
    print("=" * 40)

    store = SqliteArticleStore(db_path=args.db_path)
    store.init_schema()

    remaining = store.count() and len(
        store.iter_articles_missing_excerpt(limit=args.limit)
    )
    print(f"DB: {args.db_path}")
    print(f"Rows to process this run (<= --limit {args.limit}): {remaining}")
    print("-" * 40)

    summary = run(store, limit=args.limit, delay=args.delay)

    print("-" * 40)
    print(
        f"SUMMARY: processed={summary['processed']} "
        f"excerpts_found={summary['excerpts_found']} "
        f"recategorized={summary['recategorized']} "
        f"failed={summary['failed']}"
    )
    if summary["processed"] == 0:
        print("Nothing left to enrich. Done.")
    else:
        print("Re-run until 'processed=0' to drain the backlog, then refresh "
              "the Sheet with ./scripts/remirror_to_sheets.sh")
    return 0


if __name__ == "__main__":
    sys.exit(main())
