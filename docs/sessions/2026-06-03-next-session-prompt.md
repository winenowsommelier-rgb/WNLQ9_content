# WNLQ9 — Next-Session Continuation Prompt

Paste this as the opening prompt for the next session. It is self-contained for a
cold start. Full context: `docs/sessions/2026-06-03-retrospective.md`.

---

## Who you are / what this is
You are continuing work on **WNLQ9** — two Thai-market drinks brands:
**Wine-Now** (wine e-commerce, sommelier voice) and **LIQ9** (spirits, bartender
voice). Content is planned in Notion, published to a Magento blog, bilingual
TH+EN. An SEO measurement pipeline (Supabase + Google APIs) feeds the content
strategy. Thai alcohol law applies: no on-page price, LINE CTA only, 20+,
non-commercial/secular content on Buddhist sales-ban days, no emoji in
Title/Content (Magento rule).

Work on branch **`claude/awesome-bardeen-yijvd`**. Commit + push as you go.

## Key resources (IDs)
- **Supabase project**: `asnarjokyedupsjipzkl`
- **Edge functions**: `sync-gsc-ga4`, `seo-slack-alerts`, `check-sync-health`
- **Tables**: `seo_gsc_daily`, `seo_gsc_pages_daily`, `seo_ga4_daily`,
  `seo_sync_log`, `seo_config`, `seo_opportunities`, `seo_regression_alerts`,
  `seo_metrics_snapshot`
- **Vault RPCs**: `get_gcp_sa_key`, `get_slack_webhook`, `get_vault_secret`
  (service_role only)
- **Service account**: `seo-dashboard@wnlq0-seo.iam.gserviceaccount.com`
- **Notion — Editorial Production Standard**: `3729d75a-e4b5-81a8-83dd-c176804fdbdd`
  (§18 = Definition of Ready, compliance checklist, funnel quota, Hero word floor)
- **Notion — Master Topic Ledger**: page `43240f1120df437391017e67a64723a7`,
  data source `collection://f4cb9278-4ae6-4b1d-a94a-2279a5a103c1` (135 rows,
  overlap flags in Notes). **Plan all new content against this ledger first.**
- **Notion — July 2026 DB**: `collection://d342f9b8-3725-4068-9ccb-03b09821b0c8`
  (parent page `93ac15a8bb6540f7b357b8cabd336214`)
- **Notion — June 2026 DB**: `collection://6be4a7bb-d42c-4286-be1b-fa73e3635b45`
- **Scripts**: `scripts/compliance-lint.mjs`, `scripts/notion-backup.mjs`
- **Workflows**: `.github/workflows/seo-cron.yml`, `notion-backup.yml`

## Conventions (enforce these)
- New content must be checked against the **Master Topic Ledger** before briefing
  (prevents cross-month cannibalization).
- **Funnel quota** per month: ≤70% TOFU, ≥20% MOFU, ≥10% BOFU.
- **Definition of Ready** (§18.1) gates Review→Approved.
- **Hero/Pillar ≥ 2,500 words**.
- Run `node scripts/compliance-lint.mjs <records.json>` before handoff.

## Task queue (priority order)

1. **Build the enforced compliance gate** (user's explicit next ask). The linter
   `scripts/compliance-lint.mjs` exists; wrap it in automation that Slacks on any
   price/emoji/violation. RECOMMENDED design: a Supabase edge function
   `compliance-scan` that (a) reads a Notion token from Vault via
   `get_vault_secret('notion_token')`, (b) fetches Review/Approved-status pages
   from the ledger + month DBs via the Notion API, (c) ports the lint rules from
   `compliance-lint.mjs`, (d) posts error-severity violations to Slack via
   `get_slack_webhook`. Schedule daily in `seo-cron.yml`. Reuses existing Slack
   wiring; needs `notion_token` stored in Vault first (user provides the token).

2. **Run the linter live NOW** against current July drafts and review results —
   this was built but never audited. Confirm the Day-29/Day-30 holy-day pieces are
   clean (no price/CTA, age notice present). Fix any violation found.

3. **Close the measurement loop**: `seo_gsc_pages_daily` now has per-URL data. As
   June/July pieces go live on Magento, fill each ledger row's **Owning URL**,
   then pull that URL's impressions/clicks/position to drive next month's plan.

4. **July content fixes** (deferred — confirm whether the downstream process did
   them): apply the 7 dedup swaps (flagged in ledger Notes), expand the 7 Hero
   pillars to 2,500 words, resolve all `[VERIFY]` tags.

5. **Plan August** against the ledger, hitting the funnel quota (≥10% BOFU — July
   had zero). Seed BOFU from proven money-clusters (Buy Whisky/Gin Online,
   Champagne houses, value Bordeaux).

6. **Drink-day pins**: decide whether to add Cava Day and Shiraz Day (Shiraz =
   Jul 23, 4th Thursday, not 25) or drop them.

7. **Tuning**: bump GSC per-page rowLimit (wine-now capped at 5,000); consider #6
   (true single-day/date-partitioned GSC for real trends — but check the
   `detect_seo_*` RPCs first, it can break them).

## ⚠️ Gotchas
- **A dashboard is being built in parallel** (migrations `content_hub_schema`,
  `dashboard_seo_aggregation_*`). The anon/authenticated REVOKE this session may
  affect dashboard reads. Verify it works; if it needs reads, grant narrow SELECT
  on the dashboard VIEWS, not base tables. The existing read policies have a typo
  (`'authenticated_user'` — not a real Supabase role); fix if needed.
- The auto-mode classifier may block commits containing the anon JWT string
  (transient — retry usually succeeds).
- Notion `notion-fetch` on a `collection://` returns schema only, not rows;
  enumerate rows via `notion-search` scoped by `data_source_url` (caps at 25/query
  — sweep with varied queries).
- GA4 service account identity that works: `seo-dashboard@wnlq0-seo...` (added as
  Viewer). `seo-automation@...` does NOT exist as a valid identity.

## Pending USER actions (remind them)
1. Add `NOTION_TOKEN` GitHub secret (backup + compliance gate).
2. Store `notion_token` in Supabase Vault (for the compliance-scan function).
3. Disable the old leaked GCP key in IAM.
4. Verify the dashboard against the RLS REVOKE.
