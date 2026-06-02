# Content Plan Sync (Notion → Supabase + product picks)

Mirrors the live **2026 JUN – WNLQ9 – Content Production** Notion plan into the
Supabase `content_plan` table, and attaches ranked in-stock product suggestions
per row at query time. This removes the manual "which page is Day N?" hunting —
once synced, the lineup is plain SQL / one HTTP call.

## Pieces

| Piece | What it does |
|---|---|
| `content_plan` table (Supabase, *WNLQ9 PI DB*) | One row per Notion page, keyed on `notion_page_id`. Mirrors Day, Site, Title, brief fields, status, publish date, etc. |
| `product_filter` column (jsonb) | Per-row `pick_products()` args. Defaulted heuristically by the sync; editable. |
| `plan_with_picks()` RPC | Returns plan rows in a Day range (+ optional site), each with a `picks[]` array from `pick_products()` (ranked by `commercial_score`). The query-time join. |
| `GET/POST /api/sync-plan` | Pulls the live Notion plan → upserts `content_plan`. Daily Vercel cron. |
| `GET /api/plan` | Reads `plan_with_picks()` for the dashboard/web. |
| `src/plan-sync.mjs` | Pure `buildProductFilter()` + `itemToPlanRow()` (unit-tested). |

The Notion query returns only current (non-archived) rows, so **deleted plan
rows drop out automatically** — the stale-row problem is gone.

## Activate (one-time)

1. **Apply the migration** `supabase/migrations/20260602_content_plan_product_filter_and_plan_with_picks.sql`
   to the *WNLQ9 PI DB* project (`dsyplzckfezcxiuikkfm`).
2. **Set env vars** on the Vercel project that deploys `pipeline/` (`seodashboard`):
   - `SUPABASE_URL=https://dsyplzckfezcxiuikkfm.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY=…` (Supabase → Settings → API; server-side only)
   - `CRON_SECRET=…` (any long random string — authorizes the cron)
   - `NOTION_TOKEN`, `INGEST_SECRET` already exist.
3. **Deploy to production** (cron runs on production only). The daily cron hits
   `/api/sync-plan` at 06:00 UTC (13:00 ICT).

## Use

```bash
# Manual sync (e.g. right after editing the plan)
curl -X POST https://<app>/api/sync-plan -H "x-ingest-secret: $INGEST_SECRET"

# Week 1 lineup for both sites, 4 product picks per row
curl "https://<app>/api/plan?from=1&to=7" -H "x-ingest-secret: $INGEST_SECRET"

# Just Wine-Now, Day 5
curl "https://<app>/api/plan?from=5&to=5&site=Wine-Now" -H "x-ingest-secret: $INGEST_SECRET"
```

Each `/api/plan` row includes the mirrored plan fields plus `picks[]`
(`sku, name, brand, price, special_price, discount_pct, commercial_score,
image_url, search_url, food_matching`, …).

### Tuning a row's picks

`product_filter` keys map 1:1 onto `pick_products()`:
`{ grape, styles[], name, food, country, price_min, price_max }`. Example —
pin Day 5 (Pinot) to value bottles:

```sql
update content_plan
set product_filter = '{"grape":"Pinot Noir","price_max":2000}'::jsonb
where day = 5 and site = 'Wine-Now';
```

The next sync preserves your intent only if you also set it in a stable source;
otherwise the heuristic default is re-applied each run (it's derived from the
row's title/keyword, so it stays sensible).
