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
| GSC/GA4 Credentials in Supabase | ❌ NOT SET | Run `scripts/setup-supabase-secrets.sh` |
| Magento 2 SEO Module | 🔄 In Progress | Guide: `docs/MAGENTO2_SEO_AEO_DEVELOPER_GUIDE.md` |

---

## One Remaining Blocker

**The GSC/GA4 credentials are NOT yet in the Supabase secret store.**

The Edge Function code is correct and deployed. It reads from `Deno.env.get("GCP_SERVICE_ACCOUNT_KEY")` but that secret was never pushed to Supabase. The daily sync runs but returns empty data because Google API auth fails silently.

### Fix (2 minutes):

```bash
# 1. Add to web environment config (code.claude.com → your environment → Env Vars):
SUPABASE_ACCESS_TOKEN=sbp_xxxx   ← from supabase.com/dashboard/account/tokens

# 2. In the session, run:
bash scripts/setup-supabase-secrets.sh

# 3. Verify with a manual trigger:
curl -X POST https://asnarjokyedupsjipzkl.supabase.co/functions/v1/sync-gsc-ga4 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbmFyam9reWVkdXBzamlwemtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTgzNjMsImV4cCI6MjA5NTc5NDM2M30.sST_AGx6Vax-zEdTm_igXqcrrv_gm4ZMsxUHOi1tx1I"

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

Priority task: Push GSC/GA4 credentials to Supabase so the daily
sync actually works. The script is ready at scripts/setup-supabase-secrets.sh
— it just needs SUPABASE_ACCESS_TOKEN set in the environment.

Check: https://seodashboard-rho.vercel.app is the live dashboard.
```

---

## Remaining Work (Priority Order)

### P0 — Blocker (do first)
- [ ] **Push credentials to Supabase** via `scripts/setup-supabase-secrets.sh`
- [ ] **Verify sync works** — trigger manual curl, confirm data in `seo_gsc_daily` table
- [ ] **Confirm Vercel deploy** — push a small change, watch GitHub Actions succeed

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
- [ ] Add LIQ9 TH site (`https://th.liq9.com`) to GSC sync
- [ ] Add second GA4 property ID for LIQ9 to the sync function

---

## Success Metrics to Track

| Metric | Baseline | Week 2-4 Target | Month 1-3 Target |
|--------|----------|----------------|-----------------|
| GSC Avg Position | tbd after credentials fix | stable / improving | +10% improvement |
| CTR on target keywords | ~1-2% | +10-30% | +30%+ |
| Organic sessions (GA4) | tbd | +10% | +20-50% |
| AI engine citations | 0 | 5+ pages cited | 20+ pages cited |
| Regressions detected | tbd | 0 new | 0 new |
| Rich Results in Google | 0 | 50+ products | 1000+ products |
