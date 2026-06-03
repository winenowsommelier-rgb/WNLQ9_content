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

### Session retrospective (2026-06-03)

**Goal drift:** started as "resume monthly engine / build a month" → pivoted to
"design & solidify the content intelligence system" → narrowed to the urgent fix:
make the GA4+GSC connection real and direct, fix the wrong domain.

**Went well:** grounded every claim in real inspection of the actual estate;
found the credential the owner said existed (Supabase Vault `gcp_sa_key`); shipped
a verified working fix with real data, not just a plan.

**Went badly (honest):**
1. Overclaimed early — said "GA4+GSC authenticated, feedback loop is live now" based
   on connector status + row counts, without checking **provenance**. The loop was a
   stub importing 0; the rows were sample data. → New rule: never call a pipeline
   "live/working" until you verify who wrote the rows, when, and via what.
2. Too many question rounds up front (parameters, then architecture forks) read as
   stalling to an owner who wanted action; two were dismissed. → Bias to
   investigate-and-act; do cheap discovery first; reserve questions for true forks.
3. `winenowsommelier.com` sat in committed code/docs across sessions — a
   single-source-of-truth failure. → `seo_config` is authoritative; code never
   hardcodes; config is verified against reality.

**Process to carry forward (session protocol):**
1. Read the top of this DECISIONS log + `docs/SEO_DATA_PIPELINE.md` first.
2. Do cheap discovery (DB, repo, config) before proposing or asking.
3. Act; verify provenance of any data before trusting it.
4. Log here + commit + mirror to Notion before ending the session.

**Handoff state:** branch `claude/brave-gates-FrHj8` clean + pushed · edge fn `sync-gsc-ga4`
v7 live · daily cron 06:00 UTC · ~90 days real GSC/GA4 in Supabase `asnarjokyedupsjipzkl`.
