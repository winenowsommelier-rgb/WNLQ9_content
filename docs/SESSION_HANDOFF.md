# Session Handoff — WNLQ9 SEO Automation
**Last Updated:** June 2026  
**Branch:** `claude/lucid-bardeen-F6DjC`  
**Repo:** winenowsommelier-rgb/WNLQ9_content

---

## Current System Status

| Component | Status | URL / Location |
|-----------|--------|----------------|
| SEO Dashboard (Vercel) | ✅ Live | https://seodashboard-rho.vercel.app |
| GSC/GA4 Daily Sync | ✅ Deployed | Supabase Edge Function: `sync-gsc-ga4` |
| Slack Alerts (7 AM UTC) | ✅ Deployed | Supabase Edge Function: `seo-slack-alerts` |
| GitHub Actions Cron | ✅ Running | `.github/workflows/seo-cron.yml` |
| Vercel Auto-Deploy | ⚠️ Pending | Fixed in latest commit — needs one push to confirm |
| GSC/GA4 Credentials | ✅ Working (in Vault) | Read via `get_gcp_sa_key()` RPC — sync importing real data daily |
| Magento 2 SEO Module | 🔄 In Progress | Guide: `docs/MAGENTO2_SEO_AEO_DEVELOPER_GUIDE.md` |

---

## Credentials — RESOLVED (this was a false alarm)

**The GSC/GA4 credentials are working.** An earlier handoff claimed they were
"NOT SET" and the sync "returns empty data" — that was wrong. Verified against
the live project (`asnarjokyedupsjipzkl`) on 2026-06-03:

- The **deployed** `sync-gsc-ga4` (v9) reads the service-account JSON from
  **Supabase Vault** via the `get_gcp_sa_key()` RPC — **not** from a
  `GCP_SERVICE_ACCOUNT_KEY` edge secret. Site/property config comes from the
  **`seo_config` table**.
- `seo_sync_log` shows recent runs **completed** (incl. the ~6 AM UTC daily
  run), **0 failures**, with real data: ~90 days backfilled across **2 sites**
  (wine-now + liq9), 0 duplicate rows.

The previous "fix" (run `scripts/setup-supabase-secrets.sh` to push
`GCP_SERVICE_ACCOUNT_KEY`) targeted a mechanism the deployed function doesn't
use, so it would be a **no-op** (and the script errors on the reserved
`SUPABASE_` prefix anyway). That script is now marked **DEPRECATED**.

> Note: the repo previously carried a divergent env-var version of this
> function whose JWT signer was a stub (`...signature` literal) — that draft
> would have failed Google auth and returned empty data, which is likely the
> source of the original (mistaken) "credentials missing" diagnosis. The repo
> now matches the working deployed v9.

### If you ever need to rotate the key
Update the Vault secret that `get_gcp_sa_key()` reads (a deliberate production
write, with the real SA JSON in hand) — do **not** use the deprecated secrets
script.

# Expected response: {"status":"success","gsc":{...},"ga4":{...}}
```

---

## Session Retrospective

### Sessions Completed

**Session 1 — Dashboard & Infrastructure**
- Built Next.js 14 SEO dashboard with Supabase backend
- Created Supabase tables: `seo_gsc_daily`, `seo_ga4_daily`, `seo_regression_alerts`, `seo_opportunities`, `seo_sync_log`
- Deployed Supabase Edge Functions: `sync-gsc-ga4`, `seo-slack-alerts`
- Set up GitHub Actions cron (6 AM UTC sync, 7 AM UTC Slack alerts)
- Fixed build: excluded `supabase/` from TypeScript compilation
- Fought Vercel deploy repeatedly — `amondnet/vercel-action@v25` was broken

**Session 2 — Real API Integration**
- Replaced mock data with real Google Search Console API v3 calls
- Replaced mock data with real Google Analytics 4 Data API v1beta calls
- Implemented OAuth 2.0 JWT flow for GCP service account authentication
- Filters GA4 to organic traffic only (`sessionDefaultChannelGroup = "Organic Search"`)

**Session 3 — Magento 2 Developer Guide**
- Created `docs/MAGENTO2_SEO_AEO_DEVELOPER_GUIDE.md` (818 lines)
- Covers: product title/description optimization, schema markup, AEO for AI engines
- PHP code examples: `ProductTitleOptimizer`, `MetaDescriptionOptimizer`, `ProductSchema`
- Deployment checklist, testing procedures, success metrics

**Session 4 — Credentials Fix & Vercel Fix (this session)**
- Diagnosed `seodashboard-rho.vercel.app` is live (Vercel project exists and deployed)
- Diagnosed GitHub Actions failure root cause: `amondnet/vercel-action@v25` needs `.vercel/project.json`
- Fixed: replaced `amondnet` with direct `vercel deploy --prod --token` CLI in workflow
- Added `.vercel/project.json` → links to `prj_Gqo7kfur1j5tMxB1iVMA8bLR1dyB`
- Created `scripts/setup-supabase-secrets.sh` — one-command credential push
- Created `SYSTEM_PROMPT.md` — full context document for any new session
- Created `docs/SESSION_HANDOFF.md` — this file

---

## All Infrastructure Details

### Supabase
| Item | Value |
|------|-------|
| Project | WNLQ9 SEO Automation |
| Project Ref | `asnarjokyedupsjipzkl` |
| Region | `ap-northeast-1` (Tokyo) |
| URL | `https://asnarjokyedupsjipzkl.supabase.co` |
| Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbmFyam9reWVkdXBzamlwemtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTgzNjMsImV4cCI6MjA5NTc5NDM2M30.sST_AGx6Vax-zEdTm_igXqcrrv_gm4ZMsxUHOi1tx1I` |
| Edge Function 1 | `sync-gsc-ga4` (v9) — daily GSC + GA4 data pull |
| Edge Function 2 | `seo-slack-alerts` (v3) — daily Slack digest |
| Edge Function 3 | `check-sync-health` (v1) — health check endpoint |
| Edge Function 4 | `compliance-scan` (v3) — compliance scanning |

### Vercel
| Item | Value |
|------|-------|
| Team | winenowsommelier-rgb's projects |
| Team ID | `team_pPQBZ8bFjr493T1hG6IEjeaI` |
| Project | `seodashboard` |
| Project ID | `prj_Gqo7kfur1j5tMxB1iVMA8bLR1dyB` |
| Live URL | `https://seodashboard-rho.vercel.app` |
| Deploy trigger | Push to `claude/lucid-bardeen-F6DjC` or `main` |

### Google Cloud Platform
| Item | Value |
|------|-------|
| Project | `wnlq0-seo` |
| Service Account | `seo-automation@wnlq0-seo.iam.gserviceaccount.com` |
| Private Key ID | `4a163a84fa98e6acd88b45196d2bb4aca8d089a3` |
| GA4 Property ID | `377750759` |
| GSC Site URL | `https://th.wine-now.com` |
| Credentials file | `.env.production.local` (gitignored — present locally) |

### GitHub Actions
| Workflow | Schedule | Trigger | Status |
|----------|----------|---------|--------|
| `deploy-vercel.yml` | On push | `claude/lucid-bardeen-F6DjC`, `main` | ⚠️ Fixed, needs confirm |
| `seo-cron.yml` | 6 AM UTC (sync), 7 AM UTC (alerts) | cron + manual | ✅ Running |
| `datahub-daily-ingest` | daily | `main` | ✅ Running |
| `datahub-quarterly-backfill` | quarterly | `main` | ✅ Running |

### Required GitHub Secrets
| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | From Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `team_pPQBZ8bFjr493T1hG6IEjeaI` |
| `VERCEL_PROJECT_ID` | `prj_Gqo7kfur1j5tMxB1iVMA8bLR1dyB` |

---

## Key Files

| File | Purpose |
|------|---------|
| `SYSTEM_PROMPT.md` | Full context for starting any new session |
| `docs/SESSION_HANDOFF.md` | This file — status, retrospective, next steps |
| `docs/MAGENTO2_SEO_AEO_DEVELOPER_GUIDE.md` | 818-line developer guide for Magento 2 team |
| `scripts/setup-supabase-secrets.sh` | One-command credential push to Supabase |
| `.vercel/project.json` | Links repo to Vercel `seodashboard` project |
| `.github/workflows/deploy-vercel.yml` | Fixed auto-deploy (uses Vercel CLI directly) |
| `.github/workflows/seo-cron.yml` | Daily GSC/GA4 sync + Slack alerts |
| `supabase/functions/sync-gsc-ga4/index.ts` | Real GSC + GA4 API integration |
| `app/page.tsx` | Dashboard main page |
| `lib/supabase.ts` | Supabase client + TypeScript types |
| `.env.production.local` | Real credentials — gitignored, present locally |

---

## Next Session Prompt

Copy and paste this to start the next session:

```
Continue WNLQ9 SEO Automation setup.
Repo: winenowsommelier-rgb/WNLQ9_content
Branch: claude/lucid-bardeen-F6DjC

Read docs/SESSION_HANDOFF.md first for full status.

Note: the GSC/GA4 credentials are already working (read from Supabase Vault
via get_gcp_sa_key(); daily sync is importing data with 0 failures). The old
"push credentials" task and scripts/setup-supabase-secrets.sh are DEPRECATED
— see the Credentials section above. Do NOT run that script.

Check: https://seodashboard-rho.vercel.app is the live dashboard.
```

---

## Remaining Work (Priority Order)

### P0 — Credentials/sync (RESOLVED — no action)
- [x] ~~Push credentials to Supabase~~ — not needed; key is in Vault, sync works (verified 2026-06-03)
- [x] ~~Verify sync works~~ — `seo_sync_log` shows `completed`, 0 failures, dual-site data
- [ ] **Confirm Vercel deploy** — push a small change, watch GitHub Actions succeed
- [ ] (Optional) Data-quality follow-ups — see "Known issues" below

### P1 — Magento 2 Implementation
- [ ] Dev team reads `docs/MAGENTO2_SEO_AEO_DEVELOPER_GUIDE.md`
- [ ] Create `app/code/WineNow/SEO/` module on Magento staging
- [ ] Implement `ProductTitleOptimizer`, `MetaDescriptionOptimizer`, `ProductSchema`
- [ ] Test on 5 products in staging, validate with Rich Results Test
- [ ] Deploy to production for all 11,436 products

### P2 — Dashboard Enhancements
- [ ] Add date range picker (currently shows only yesterday)
- [ ] Add trend chart (7-day position/CTR over time using Recharts)
- [ ] Add keyword search/filter in the Opportunities table
- [ ] Add export to CSV button for the SEO team

### P3 — Monitoring & Alerts
- [ ] Verify Slack webhook is receiving daily 7 AM UTC alerts
- [x] ~~Add LIQ9 TH site to GSC sync~~ — deployed v9 already syncs wine-now + liq9 (`seo_config`)
- [x] ~~Add second GA4 property for LIQ9~~ — already handled by deployed v9

---

## Known Issues (data-quality, non-blocking — from 2026-06-03 audit)

The sync runs green, but a read-only audit of the deployed v9 + tables surfaced
these. None is breaking ingestion today; prioritize before trusting trends.

1. **`metric_date` stores trailing-window aggregates, not daily values.** The
   GSC (`["query"]`/`["page"]`) and GA4 (`["pagePath"]`) queries have **no date
   dimension** over 28–30-day windows, then stamp every row with one
   `metric_date`. So each "daily" row is a rolling 30-day **sum** — trend charts
   and the `detect_seo_opportunities`/`detect_seo_regressions` thresholds operate
   on rolling totals. Fix: add a `date` dimension for true per-day rows, or
   rename to `snapshot_date` and make detectors window-aware.
2. **Daily GSC query `rowLimit: 1000` truncates the long tail** (backfill seeded
   up to ~5000/snapshot). Raise + paginate so opportunity detection sees more.
3. **Partial failures look successful.** The handler returns HTTP 200
   `"success"` even when a per-site sync threw (error only in the JSON payload),
   and `detect_*` RPC errors are swallowed by `catch(_){}`. Surface per-site
   failures into `seo_sync_log` + the Slack alert.
4. **GA4 `conversions` metric is deprecated** (→ `keyEvents`); plan the swap.
5. **GSC tables lag GA4 by ~3 days** (Google finalization latency; `endDate =
   today-3`). Annotate dashboards so GSC panels don't read as "stale".

---

## Success Metrics to Track

| Metric | Baseline | Week 2-4 Target | Month 1-3 Target |
|--------|----------|----------------|-----------------|
| GSC Avg Position | pull from `seo_gsc_daily` (data is live) | stable / improving | +10% improvement |
| CTR on target keywords | ~1-2% | +10-30% | +30%+ |
| Organic sessions (GA4) | tbd | +10% | +20-50% |
| AI engine citations | 0 | 5+ pages cited | 20+ pages cited |
| Regressions detected | tbd | 0 new | 0 new |
| Rich Results in Google | 0 | 50+ products | 1000+ products |
