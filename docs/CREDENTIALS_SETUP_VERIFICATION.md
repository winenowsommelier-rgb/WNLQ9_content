# Credentials Setup — Correction Notice

**Corrected:** 2026-06-03 (supersedes the earlier version of this file)

> ⚠️ The previous version of this document claimed credentials were "pushed to
> Supabase using `supabase secrets set`" and that this completed the fix. **That
> was inaccurate.** It also directly contradicted `SESSION_HANDOFF.md`, which
> simultaneously claimed the credentials were "NOT SET". Both were wrong.

## What is actually true (verified against the live project)

Verified on 2026-06-03 against Supabase project `asnarjokyedupsjipzkl`
("WNLQ9 SEO Automation") using read-only inspection of the deployed function
and the `seo_sync_log` / metric tables:

- The **deployed** `sync-gsc-ga4` (v9) authenticates to Google using a
  service-account JSON read from **Supabase Vault** via the `get_gcp_sa_key()`
  RPC — **not** from a `GCP_SERVICE_ACCOUNT_KEY` edge-function secret.
- Site/property config (`GSC_SITE_URL`, `GSC_SITE_URL_LIQ9`, `GA4_PROPERTY_ID`,
  `GA4_PROPERTY_ID_LIQ9`) is read from the **`seo_config` table**, not from
  function secrets.
- The sync **is working**: recent runs (incl. the ~6 AM UTC daily run)
  `completed` with **0 failures**, importing real data across **2 sites**
  (wine-now + liq9). ~90 days are backfilled; no duplicate rows.

So there was **no credential problem to fix.** Running
`scripts/setup-supabase-secrets.sh` (now **DEPRECATED**) would have been a
no-op for the live function — it sets a secret the deployed code never reads,
and it errors on the reserved `SUPABASE_` prefix.

## Why the confusion happened

The repo branch carried a separate, **un-deployed** env-var version of the
function whose JWT signer was a stub (it appended the literal string
`signature` instead of an RS256 signature). That draft would always fail Google
auth and return empty data — the likely origin of the mistaken "credentials
missing / returns empty" diagnosis. The repo function now matches the working
deployed v9 (Vault + `seo_config`, dual-site).

## How to verify (read-only)

- Edge function source: Supabase MCP `get_edge_function(sync-gsc-ga4)` — confirm
  it calls `supabase.rpc("get_gcp_sa_key")`.
- Health: `select sync_type, status, completed_at from seo_sync_log order by
  completed_at desc limit 12;` — expect `completed`, no `failed`.
- Freshness: `select max(metric_date), max(synced_at) from seo_ga4_daily;`
  (GSC tables lag ~3 days by design — Google finalization latency.)

## Key rotation (only if actually needed)

Update the **Vault** secret that `get_gcp_sa_key()` reads — a deliberate
production write, performed with the real SA JSON in hand. Do **not** use the
deprecated secrets script.
