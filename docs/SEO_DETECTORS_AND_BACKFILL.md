# SEO sync — per-day fix, backfill, and detectors (review before deploy)

Status 2026-06-03. All items below are **drafted in the repo, not deployed/applied.**
They go live only via explicit `supabase functions deploy` / `supabase db push`.

## Findings that drove this work
1. **Rolling-aggregate bug** — the deployed `sync-gsc-ga4` (v9) queried GSC/GA4
   without a `date` dimension, so 28–30-day aggregates were stamped on a single
   `metric_date`. Fixed in `supabase/functions/sync-gsc-ga4/index.ts` (per-day
   rows + pagination + range-delete).
2. **Detector RPCs were missing** — `detect_seo_opportunities` /
   `detect_seo_regressions` do **not** exist in the DB; the function's calls were
   silently swallowed by `catch(_){}`, so opportunity/regression detection never
   ran. Created in `supabase/migrations/20260603_seo_detectors_daily.sql`.
3. **Repo migrations are stale vs production** — `20260531_seo_monitoring_schema.sql`
   predates the live schema (no `site`/`metric_date`/`rank_position`, no
   `seo_gsc_pages_daily`/`seo_config`). Worth capturing a true baseline migration
   later; the new migration targets the *real* columns.

## Order of operations (when approved)
1. **Deploy the function fix** (true per-day rows):
   ```bash
   supabase functions deploy sync-gsc-ga4 --project-ref asnarjokyedupsjipzkl
   ```
   Verify a normal run, then check multiple distinct recent dates exist:
   ```sql
   select metric_date, count(*) from seo_gsc_daily
   where site='wine-now' group by 1 order by 1 desc limit 10;
   ```

2. **Re-backfill history as true-daily.** Old rows (>~30d) are still
   rolling-aggregates. Rewrite them in chunks via the new backfill body. GSC
   retains ~16 months; GA4 ~14 months. Example (anon JWT as the cron uses):
   ```bash
   ANON="<SUPABASE_ANON_KEY>"
   for m in 0 1 2 3 4 5; do
     start=$(date -u -d "$(( (m+1)*30 )) days ago" +%F)
     end=$(date -u -d "$(( m*30 + 3 )) days ago" +%F)
     curl -s -X POST https://asnarjokyedupsjipzkl.supabase.co/functions/v1/sync-gsc-ga4 \
       -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" \
       -d "{\"startDate\":\"$start\",\"endDate\":\"$end\"}"
     echo "  <- backfilled $start..$end"; sleep 2
   done
   ```
   The function deletes each (site, date-range) before insert, so re-runs are
   idempotent. Detectors are skipped during backfill chunks.

   > **Wall-clock limit — keep backfill windows small.** A single request is
   > bound by the edge worker's per-request wall-clock budget (~115s observed; a
   > 33-day wine-now range hit `WORKER_RESOURCE_LIMIT` / HTTP 546). The daily
   > 27-day window runs in ~32s, so keep each backfill call to **≤ ~14 days**.
   > The function (v14+) streams results page-by-page and processes the range in
   > `CHUNK_DAYS`-day windows with a per-window range-delete, so each call stays
   > memory-bounded and idempotent — but the *caller* must still split a wide
   > range across multiple requests (one ~11–14 day window per call).

3. **Apply the detectors migration:**
   ```bash
   supabase db push        # applies 20260603_seo_detectors_daily.sql
   ```
   Smoke-test:
   ```sql
   select detect_seo_opportunities(500, 0.02);   -- returns rows upserted
   select detect_seo_regressions(7, 3, 0.2);
   select site, opportunity_type, count(*) from seo_opportunities group by 1,2;
   ```

## Decisions to confirm (these are my defaults, change if you disagree)
- **Opportunity windows/thresholds:** 28-day aggregate; `high_impressions_low_ctr`
  at `impressions ≥ 500 AND ctr < 0.02`; `page_two_position` at avg rank 11–20
  with `impressions ≥ max(50, threshold/5)`. Priority 0/1/2 by impression volume.
- **Regression windows:** last `days` vs prior `days` (default 7v7), min 30
  impressions to reduce noise; `position_drop` when rank worsens by
  `> position_drop_threshold`; `ctr_drop` when CTR falls `> ctr_drop_threshold`.
- **Schema add:** `site` column on `seo_opportunities` + `seo_regression_alerts`
  (+ per-site unique index), since data is keyword-level per site with
  `product_id = NULL`. If you'd rather not alter those tables, say so and I'll
  rework the detectors to encode site into the keyword or a separate table.
- **GA4 `conversions` metric** is still used (deprecated → `keyEvents`); left as-is
  for now, flagged for a later swap.

Nothing here changes production until the three commands above are run.
