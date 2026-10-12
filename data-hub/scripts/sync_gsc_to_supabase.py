"""Pull Google Search Console keyword data into Supabase seo_gsc_daily.

Fetches the last N days of GSC performance data (clicks, impressions,
rank_position) per keyword for each configured property, then upserts into
the `seo_gsc_daily` table. The pg_cron job in Supabase refreshes the
`dashboard_gsc_keywords` materialized view at 07:00 UTC daily, so the
dashboard's Keywords tab stays live automatically.

SETUP (one-time):
1. Enable Google Search Console API in GCP Console:
   https://console.cloud.google.com/apis/api/searchconsole.googleapis.com/
   (project 92120947998 — the same project as the Sheets exporter)

2. Add the service account to each GSC property:
   Google Search Console → Settings → Users and permissions → Add user
   Email: data-hub-exporter@<project>.iam.gserviceaccount.com
   Permission: Restricted (read-only is fine)

3. Set env vars (already in config/.env for Supabase; add SUPABASE_SERVICE_KEY):
   SUPABASE_URL=https://asnarjokyedupsjipzkl.supabase.co
   SUPABASE_SERVICE_KEY=<service_role secret>

4. Ensure the seo_gsc_daily table exists (Supabase migration). Schema:
   CREATE TABLE public.seo_gsc_daily (
     id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     site        text NOT NULL,              -- 'wine-now' | 'liq9'
     keyword     text NOT NULL,
     metric_date date NOT NULL,
     impressions integer NOT NULL DEFAULT 0,
     clicks      integer NOT NULL DEFAULT 0,
     rank_position numeric(8,2),
     ctr         numeric(8,4),
     UNIQUE (site, keyword, metric_date)
   );
   GRANT INSERT, UPDATE ON public.seo_gsc_daily TO service_role;

Usage:
    cd data-hub && source venv/bin/activate
    python scripts/sync_gsc_to_supabase.py           # last 7 days
    python scripts/sync_gsc_to_supabase.py --days 30 # back-fill 30 days
    python scripts/sync_gsc_to_supabase.py --dry-run # print rows, no writes
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import date, timedelta
from typing import List, Dict

logger = logging.getLogger("sync_gsc")

# --- GSC property configuration -------------------------------------------
# Add one entry per brand.  `gsc_property` is EXACTLY as it appears in
# Search Console (domain property = "sc-domain:example.com",
# URL prefix property = "https://th.wine-now.com/").
PROPERTIES: List[Dict] = [
    {
        "site": "wine-now",
        "gsc_property": "https://th.wine-now.com/",  # adjust to your real property URL
    },
    {
        "site": "liq9",
        "gsc_property": "https://th.liq9.com/",  # adjust to your real property URL
    },
]

# Max rows the GSC API returns per request (API cap = 25 000).
_ROW_LIMIT = 25_000
_BATCH_UPSERT = 500   # Supabase PostgREST chunk size


def _gsc_service():
    """Build an authenticated Google Search Console API client."""
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    cred_path = os.path.join(os.path.dirname(__file__), "..", "config", "google-credentials.json")
    creds = service_account.Credentials.from_service_account_file(
        cred_path,
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
    )
    return build("webmasters", "v3", credentials=creds, cache_discovery=False)


def _supabase_client():
    """Return a Supabase client using the service-role key (bypasses RLS)."""
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        raise RuntimeError(
            "Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars "
            "(see config/.env.example)."
        )
    try:
        from supabase import create_client
        return create_client(url, key)
    except ImportError:
        raise ImportError("pip install supabase")


def fetch_gsc_rows(svc, gsc_property: str, start_date: str, end_date: str) -> List[Dict]:
    """Fetch keyword performance rows from the GSC Search Analytics API."""
    body = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": ["query", "date"],
        "rowLimit": _ROW_LIMIT,
        "startRow": 0,
    }
    resp = svc.searchanalytics().query(siteUrl=gsc_property, body=body).execute()
    return resp.get("rows", [])


def rows_to_upsert(raw_rows: List[Dict], site: str) -> List[Dict]:
    """Normalise GSC API rows into seo_gsc_daily upsert dicts."""
    records = []
    for r in raw_rows:
        keys = r.get("keys", [])
        if len(keys) < 2:
            continue
        keyword, metric_date = keys[0], keys[1]
        records.append({
            "site": site,
            "keyword": keyword,
            "metric_date": metric_date,
            "impressions": int(r.get("impressions", 0)),
            "clicks": int(r.get("clicks", 0)),
            "rank_position": round(float(r.get("position", 0)), 2),
            "ctr": round(float(r.get("ctr", 0)), 6),
        })
    return records


def upsert_to_supabase(client, records: List[Dict], dry_run: bool) -> int:
    """Upsert records into seo_gsc_daily in batches."""
    if dry_run:
        logger.info("[DRY-RUN] would upsert %d rows", len(records))
        for r in records[:5]:
            print(json.dumps(r))
        return 0

    total = 0
    for i in range(0, len(records), _BATCH_UPSERT):
        batch = records[i : i + _BATCH_UPSERT]
        client.table("seo_gsc_daily").upsert(
            batch,
            on_conflict="site,keyword,metric_date",
        ).execute()
        total += len(batch)
        logger.info("Upserted batch %d/%d (%d rows)", i // _BATCH_UPSERT + 1,
                    -(-len(records) // _BATCH_UPSERT), len(batch))
    return total


def refresh_matviews(client, dry_run: bool) -> None:
    """Trigger immediate refresh of the dashboard materialized views."""
    if dry_run:
        logger.info("[DRY-RUN] would call refresh_dashboard_seo_views()")
        return
    try:
        client.rpc("refresh_dashboard_seo_views").execute()
        logger.info("Materialized views refreshed.")
    except Exception as exc:
        logger.warning("Matview refresh failed (non-fatal): %s", exc)


def main(argv=None) -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    ap = argparse.ArgumentParser(description="Sync GSC keyword data → Supabase.")
    ap.add_argument("--days", type=int, default=7, help="Days back to fetch (default 7).")
    ap.add_argument("--dry-run", action="store_true", help="Print rows without writing.")
    ap.add_argument("--no-refresh", action="store_true", help="Skip matview refresh.")
    args = ap.parse_args(argv)

    end = date.today() - timedelta(days=3)   # GSC data lags ~3 days
    start = end - timedelta(days=args.days - 1)
    start_str, end_str = start.isoformat(), end.isoformat()
    logger.info("Fetching GSC data %s → %s (%d days)", start_str, end_str, args.days)

    try:
        svc = _gsc_service()
    except Exception as exc:
        logger.error("Could not build GSC service: %s", exc)
        return 1

    if not args.dry_run:
        try:
            client = _supabase_client()
        except Exception as exc:
            logger.error("Supabase client failed: %s", exc)
            return 1
    else:
        client = None

    total_rows = 0
    for prop in PROPERTIES:
        site = prop["site"]
        gsc_property = prop["gsc_property"]
        logger.info("Fetching %s (%s)", site, gsc_property)
        try:
            raw = fetch_gsc_rows(svc, gsc_property, start_str, end_str)
            records = rows_to_upsert(raw, site)
            logger.info("  %d keyword-date rows fetched", len(records))
            n = upsert_to_supabase(client, records, args.dry_run)
            total_rows += n
        except Exception as exc:
            logger.error("  Failed for %s: %s", site, exc)

    if not args.no_refresh:
        refresh_matviews(client, args.dry_run)

    logger.info("Done. Total upserted: %d rows.", total_rows)
    return 0


if __name__ == "__main__":
    sys.exit(main())
