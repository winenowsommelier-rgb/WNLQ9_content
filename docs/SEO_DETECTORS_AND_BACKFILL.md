# SEO sync — per-day fix, backfill, and detectors

Status 2026-06-03. **DEPLOYED & VERIFIED.** See the "Execution log" at the
bottom for what actually shipped and what turned out unnecessary.

> **TL;DR after execution:** The function fix was deployed (v13). A live run
> confirmed true per-day rows. Investigation then showed production GSC/GA4
> data was **already clean per-day across 90+ days** — the rolling-aggregate
> "bug" existed only in an un-deployed repo draft, not in prod. So the
> historical **backfill was NOT needed** and was deliberately skipped. The
> detector RPCs were already applied earlier in the day. The baseline schema
> migration was applied (idempotent, history alignment only).

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

2. **Re-backfill history as true-daily.** Old rows are still rolling-aggregates.
   Rewrite them in **7-day chunks** via the new backfill body. GSC retains
   ~16 months; GA4 ~14 months.

   > ⚠️ **Chunk size matters.** The per-day fix produces ~30x more rows than the
   > old version. A 27-day window hit `WORKER_RESOURCE_LIMIT` (HTTP 546) at ~80s.
   > Keep each backfill chunk to ~7 days so it stays well under the worker's
   > compute budget. The default daily window was likewise shrunk to ~5 days.

   ```bash
   # ~26 chunks of 7 days = ~6 months. verify_jwt is OFF, so no auth header needed.
   for w in $(seq 0 25); do
     start=$(date -u -d "$(( (w+1)*7 + 3 )) days ago" +%F)
     end=$(date   -u -d "$(( w*7 + 3 )) days ago" +%F)
     curl -s -X POST https://asnarjokyedupsjipzkl.supabase.co/functions/v1/sync-gsc-ga4 \
       -H "Content-Type: application/json" \
       -d "{\"startDate\":\"$start\",\"endDate\":\"$end\"}"
     echo "  <- backfilled $start..$end"; sleep 3
   done
   ```
   The function deletes each (site, date-range) before insert, so re-runs are
   idempotent. Detectors are skipped during backfill chunks.

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

## Execution log (2026-06-03, what actually happened)

1. **Deployed the function fix.**
   - v12 (default 27-day window) hit `WORKER_RESOURCE_LIMIT` (HTTP 546) at ~80s
     because the per-day rows are ~30x the old volume.
   - Shrunk the daily window (GSC 7→3 days ≈ 5 days; GA4 4→1 ≈ 4 days) and
     redeployed as **v13**. Live run completed in seconds:
     `gsc_wine-now=21408, gsc_pages_wine-now=16411, ga4_wine-now=3678` (+ liq9).
   - Verified per-day: each `metric_date` holds its own ~4k-row slice.

2. **Backfill — SKIPPED (not needed).** Inspected the existing history:
   - `seo_gsc_daily` wine-now: 90 distinct days (Mar 4–Jun 1), avg 4,051
     rows/day, **max on any single day 4,935** — no rolling-aggregate spike.
   - `seo_ga4_daily`: 92 distinct days both sites. Clean per-day.
   - Conclusion: production was already writing clean per-day data; the
     rolling-aggregate bug lived only in an un-deployed repo draft. Running a
     6-month backfill would churn correct data for zero benefit, so it was not
     run. (Only `seo_gsc_pages_daily` is short — 28 days — because that table
     was created today; optionally backfillable later for history parity.)

3. **Detectors migration — already applied** earlier in the day
   (`20260603182234 seo_detectors_daily` in migration history). The RPCs
   `detect_seo_opportunities` / `detect_seo_regressions` exist and run on the
   daily (non-backfill) sync.

4. **Baseline schema migration — applied** (idempotent, history alignment only;
   every object already existed). Note: the repo `migrations/` folder and prod
   migration history have diverged — prod is managed via dashboard/MCP, not
   `supabase db push` from this repo. The stale `20260531_seo_monitoring_schema.sql`
   is marked SUPERSEDED (do not apply).
