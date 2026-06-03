# WNLQ9 Session Retrospective — 2026-06-03

Branch: `claude/awesome-bardeen-yijvd` · Supabase project: `asnarjokyedupsjipzkl`

## Scope of this session
Started as a June/July content-plan review, expanded into hardening the entire
SEO measurement + editorial production system. The throughline: **the system
optimized each artifact in isolation but had no connective tissue across time or
across the stack.** Most fixes added that connective tissue.

## What was delivered

### Data pipeline (Supabase edge functions + cron)
- **Replaced the GSC/GA4 sync stub** (it literally `return []`-ed). Real
  implementation now pulls Google Search Console + GA4 for **both sites**
  (Wine-Now + LIQ9), service-account JWT signed in-function, key read from Vault.
- **`seo_gsc_pages_daily`** added (per-URL Search Console data) — enables
  attributing rank/clicks to individual published posts (the measurement loop).
- **`check-sync-health`** edge function + daily cron — Slacks an alert if no
  successful sync in 36h or a run imports 0 rows. The pipeline can no longer fail
  silently (which is how the original stub went unnoticed).
- **Data-loss bug fixed**: the delete-then-insert sync always deleted a day's rows
  then only inserted if rows came back — a 0-row API response wiped good data.
  Now guarded (`if (!rows.length) return 0;` before the delete).
- **Cron secret-dependency removed**: SEO cron inlines the public Supabase anon
  key (safe — anon has zero grants after RLS hardening), so a missing GitHub
  secret can't silently 401 the pipeline.

### Security
- Confirmed GCP key + Slack webhook live in **Vault** (RPCs `get_gcp_sa_key`,
  `get_slack_webhook`, plus a generic `get_vault_secret`), execute granted to
  `service_role` only. `seo_config` holds only non-secret config keys now.
- **RLS hardening** (`harden_seo_revoke_anon_grants`): anon + authenticated had
  ALL privileges on every `seo_*` table (only RLS-with-broken-policies saved it).
  Revoked all anon/authenticated grants; forced RLS on `seo_config`.

### Editorial system (Notion)
- **Editorial Production Standard** (`3729d75a-e4b5-81a8-83dd-c176804fdbdd`) §18
  added: Definition of Ready (9-point pre-handoff gate), expanded §9 compliance
  checklist, monthly funnel quota (≤70% TOFU / ≥20% MOFU / ≥10% BOFU), Hero
  2,500-word floor.
- **Master Topic Ledger** created (`43240f1120df437391017e67a64723a7`, data source
  `collection://f4cb9278-4ae6-4b1d-a94a-2279a5a103c1`): 135 rows (all June + July),
  clustered, hub/spoke mapped, 7 cross-month overlap rows flagged. This is the
  planning gate that prevents the June↔July cannibalization found below.
- **Compliance linter** (`scripts/compliance-lint.mjs`) implementing §18.2:
  detects on-page price, emoji (Magento rule), missing 20+ notice, direct
  purchase CTA, and sales-ban-day commercial content. CLI exits 1 on any
  error-severity violation (CI-gate ready).
- **Notion→git backup**: weekly workflow + `scripts/notion-backup.mjs` (paginated
  Notion API export), plus a baseline in-session snapshot committed to
  `notion-backups/`.

## Analysis findings (delivered, not yet actioned)
- **June↔July cannibalization**: 7 hard duplicates / pillar collisions — two
  "Tequila 101" pillars, two beginner pillars, two "Single Malt vs Blended",
  Wine&Cheese, Decanting, Bangkok bars, Negroni. Keep/deepen/swap map produced;
  the 7 are flagged in the ledger Notes.
- **Funnel imbalance**: July is 83% TOFU / **0 BOFU** (June had 6 BOFU). No
  bottom-funnel/commercial content pointed at proven money-clusters.
- **Compliance**: holy-day handling (Asalha Bucha Jul 29, Khao Phansa Jul 30) is
  correct in principle; Day-29 piece's guardrail block was never confirmed.
- **Drink-day pins**: World Rum (11), Bastille (14), Daiquiri (19), Tequila (24),
  Scotch (27) correct. **Cava Day and Shiraz Day content don't exist** in the DB;
  Shiraz date if added should be Jul 23 (4th Thu), not 25.
- **Hero depth**: pillars drafted ~1,700 words vs the 2,500 spec.

## Key decisions & rationale
- **Anon key inlined, not secreted**: anon keys are public-by-design; the real
  risk is the service-role key (which lives only in Supabase env). Inlining
  removes an operational failure mode for zero security cost.
- **GSC per-page as a NEW table**, not a change to `seo_gsc_daily`: keeps the
  existing query-level data + the `detect_seo_*` RPCs untouched (non-breaking).
- **Deferred #6 (true date-partitioned single-day GSC)**: changing
  `seo_gsc_daily` semantics risks the regression/opportunity RPCs; needs a
  careful look first.

## Surprises / flags for next session
- **A dashboard is being built in parallel** (migrations `content_hub_schema`,
  `dashboard_seo_aggregation_views`, `dashboard_seo_aggregation_matviews`,
  `dashboard_seo_views_daily_refresh` appeared this session, not authored here).
  ⚠️ The anon/authenticated REVOKE could affect dashboard reads if it queries
  base `seo_*` tables via anon/authenticated. **Verify the dashboard still works;
  if it needs reads, grant narrow SELECT on the dashboard VIEWS (not base
  tables).** Also the existing read policies reference a non-existent role string
  `'authenticated_user'` (typo) — fix if a real authenticated dashboard role
  needs access.
- **wine-now GSC per-page hit the 5,000 rowLimit** — truncating; bump if full
  coverage needed.
- The compliance linter was built + committed but its **live audit results
  against current July drafts were never reviewed** (agent committed, report not
  captured). Run it as step 1 next session.

## Pipeline state at session end (verified live)
- GSC per-query: wine-now 361k rows (history accumulating), liq9 91
- GSC per-page: wine-now 5,000 (capped), liq9 1
- GA4: wine-now 91,813, liq9 20,059 — conversions ARE configured (wine-now 7,795,
  liq9 185 goal completions)
- All syncs `completed`, no errors at session end.

## Pending USER actions
1. Add `NOTION_TOKEN` GitHub secret → activates weekly backup + unblocks the
   future automated compliance gate. (Cannot be set by the agent — no secret-write
   capability; it's the correct security boundary.)
2. Disable the OLD leaked GCP service-account key in GCP IAM (rotated already; old
   one should be deleted). Low urgency, user chose "leave for now."
3. Hreflang on TH/EN pairs — user's team is on it.
4. Verify the in-progress dashboard against the RLS REVOKE (see flags above).
