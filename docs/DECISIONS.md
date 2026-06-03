# WNLQ9 — Decisions & Session Log

Append-only. Newest first. Each entry: date · what changed · why · where it lives.
This is the durable memory across sessions — read the top before starting work.

---

## 2026-06-03 — Direct GA4 + GSC connection made real

**What:** Rewrote the `sync-gsc-ga4` Supabase Edge Function from a stub (returned
`[]`, imported 0) into a real direct-to-Google pipeline. Added `get_vault_secret`
RPC. Backfilled ~90 days of real GSC + GA4. Purged the wrong `winenowsommelier.com`
placeholder from code + docs.

**Why:** The "feedback loop is live" assumption was false — the cron called a stub,
and the 2,034/3,000 rows in Supabase were dev **sample data** (round 1,000-row
batches). The real credential + config existed but the code ignored them.

**Truth discovered (now documented in `docs/SEO_DATA_PIPELINE.md`):**
- Real sites: `th.wine-now.com` (GA4 `377750759`), `th.liq9.com` (GA4 `396617303`).
- `winenowsommelier.com` was never a site — just a hardcoded fallback default.
- GCP service account is in **Supabase Vault** (`gcp_sa_key`,
  `seo-dashboard@wnlq0-seo`), with access to both GSC + GA4 properties.
- Correct config was already in the `seo_config` table; the stub never read it.

**Result:** Real data flowing, idempotent + memory-safe function (v7), daily cron
unchanged. Example live insight already visible: `bottle stopper` = 27k impressions,
0 clicks @ pos 8.6 on wine-now (title/intent mismatch to fix).

**Decisions locked this session (architecture for the content intelligence system):**
- Publishing model: **Notion `Content TH/EN` → Magento** (retire HTML-pipeline playbook).
- Intelligence spine: **consolidate on the `WNLQ9 SEO Automation` Supabase project**;
  keep `WNLQ9 PI DB` as the catalog (11.4k products, 28.8k taste notes); retire the
  INACTIVE `WNLQ9 Intelligence Engine`.
- Durable memory: **git canon (`docs/`) + Notion mirror**; this file is the log.
- Cadence: **on-demand each session** (refresh metrics + recompute opportunities at
  the start of a planning session).

**Still open / next:**
- Build the **`content_registry`** table (the keystone: links Notion row ↔ final URL ↔
  cluster ↔ GSC/GA4 metrics) — not yet created.
- Compute `seo_opportunities` (striking-distance, zero-click winners, gaps, cannibalization)
  — tables exist but are empty; the `detect_*` RPC names in code don't match the
  migration (`seo_opportunity_score` / `detect_seo_regression`) — reconcile.
- Optional: extend liq9 GSC + older GA4 history; deeper than 90 days if needed.
- Then resume the monthly content engine (next month: **August 2026**).
