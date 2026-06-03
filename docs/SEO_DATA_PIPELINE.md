# SEO Data Pipeline — Direct GA4 + GSC → Supabase

**Status:** LIVE (real data, direct from Google APIs — no Supermetrics in the loop).
**Owner project (Supabase):** `WNLQ9 SEO Automation` — ref `asnarjokyedupsjipzkl`.

## What it does
A Supabase Edge Function (`sync-gsc-ga4`) pulls **real** Google Search Console
(Search Analytics) and **GA4** (runReport) data for both sites and writes it to
`seo_gsc_daily` / `seo_ga4_daily`. It talks to Google **directly** using a GCP
service account — there is no third-party connector.

## The two sites (authoritative)
| Site slug | Domain (GSC property) | GA4 property ID |
|-----------|----------------------|-----------------|
| `wine-now` | `https://th.wine-now.com` | `377750759` |
| `liq9`     | `https://th.liq9.com`     | `396617303` |

> These values live in the **`seo_config`** table (keys: `GSC_SITE_URL`,
> `GSC_SITE_URL_LIQ9`, `GA4_PROPERTY_ID`, `GA4_PROPERTY_ID_LIQ9`). The function
> reads them at runtime — **never hardcode a domain in code.**
> (Historical bug, now fixed: the old stub hardcoded a fallback of
> `winenowsommelier.com`, which is NOT a real site. Purged 2026-06-03.)

## Credentials (already provisioned)
- **GCP service account** is stored in **Supabase Vault** as secret `gcp_sa_key`
  (`seo-dashboard@wnlq0-seo.iam.gserviceaccount.com`, GCP project `wnlq0-seo`).
  It has read access to both GSC properties and both GA4 properties.
- The function reads it via the `public.get_vault_secret(text)` RPC
  (SECURITY DEFINER, granted to `service_role` only).
- It mints a Google OAuth2 access token on the fly (RS256-signed JWT, jwt-bearer
  grant) for scopes `webmasters.readonly` + `analytics.readonly`.

## How to run it
POST to the function (auth = the project anon or service JWT):
```bash
URL=https://asnarjokyedupsjipzkl.supabase.co/functions/v1/sync-gsc-ga4
curl -X POST "$URL" -H "Authorization: Bearer <ANON_OR_SERVICE_JWT>" \
  -H "Content-Type: application/json" --data '{"days":4}'
```
Body options (all optional):
- `{}` → default last **4 days** (what the daily cron uses; covers GSC's 2–3 day latency).
- `{"days": N}` → last N days.
- `{"startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"}` → explicit window (backfill).
- `{"source":"gsc"}` or `{"source":"ga4"}` → run one pipe only (handy for backfills).

The function is **idempotent**: it delete-then-inserts per `(site, date-window)`,
so re-running a window is safe. It is **memory-safe** (streams one API page at a
time → insert → release), so month-scale backfills won't hit `WORKER_RESOURCE_LIMIT`.
For very large multi-month GSC backfills, still prefer ≤30-day windows.

## Automation
`.github/workflows/seo-cron.yml` calls the function daily at 06:00 UTC
(and `seo-slack-alerts` at 07:00 UTC). No code change needed there.

## Tables (schema)
- `seo_gsc_daily(site, product_id, keyword, metric_date, impressions, clicks, ctr,
  rank_position, avg_rank_position, synced_at)` — UNIQUE(product_id, keyword, metric_date).
  Site-level rows use `product_id = NULL`.
- `seo_ga4_daily(site, product_id, page_path, metric_date, sessions, users, pageviews,
  bounce_rate, avg_session_duration, goal_completions, conversion_rate, synced_at)`
  — UNIQUE(product_id, page_path, metric_date).
- `seo_sync_log` — one row per pipe per run (status, records_imported, notes=JSON summary).
- `seo_config` — the site/property config (above).

## Baseline loaded (2026-06-03)
Real data, ~90 days, all prior sample/mock rows overwritten:
- GSC wine-now: ~365k rows (Mar 4 – Jun 1). GSC liq9: low real volume.
- GA4 wine-now: ~92k rows (Mar 4 – Jun 3). GA4 liq9: ~19k rows.

## Source
`supabase/functions/sync-gsc-ga4/index.ts` (this repo). Deployed version ≥ 7.
