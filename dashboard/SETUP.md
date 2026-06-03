# WNLQ9 Blog Workflow Dashboard — Setup Guide

## Quick Start (5 minutes)

```bash
# 1. Copy environment file
cp .env.example .env.local

# 2. Add your Notion API token (see instructions below)
# Edit .env.local and add: NOTION_API_TOKEN=secret_xxx

# 3. Start the dev server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000)

---

## Week 1 Setup (Required for MVP)

### 1️⃣ Notion API Token

**Status:** Ready to integrate  
**Database ID:** `786d080f8da24a1eb84e161f4e19d56d` (pre-configured)

**Steps:**

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "Create new integration" and name it `WNLQ9 Dashboard`
3. In the integration details:
   - Copy the **Bearer Token** (starts with `secret_`)
   - Save it to `.env.local` as `NOTION_API_TOKEN=secret_xxx`
4. Go back to Notion workspace → Database (786d080f8da24a1eb84e161f4e19d56d)
5. Click the three-dot menu → "Connections" → Add your integration
6. Test the connection in the dashboard Settings page

**Field Mapping (App → Notion):**
- `Date` → Publish Date
- `Brand` → Brand (Wine-Now / LIQ9)
- `Headline` → Topic
- `KEY` → KEY
- `TENSION` → TENSION
- `STORY` → STORY
- `SEO Keyword` → SEO Keyword
- Status → Status (auto-set to "Brief Ready")

---

### 2️⃣ Slack Webhook (Optional but Recommended)

**Status:** Ready for Week 1 notifications

**Steps:**

1. Open your Slack workspace → Settings & administration → Manage apps
2. Search "Incoming Webhooks" → Install
3. Select channel **#content-workflow** (create if needed)
4. Copy the webhook URL
5. Add to `.env.local` as `SLACK_WEBHOOK_URL=https://hooks.slack.com/...`

**Notifications Triggered:**
- Brief created → "✅ Brief ready: [Topic] ([Brand])"
- HTML generated → "✅ HTML generated: [filename]"
- Published to Magento → "🚀 LIVE: [Topic]"

---

### 3️⃣ GA4 / GSC Data (Live via Supabase)

**Status:** ✅ Live

Real Google Search Console + Analytics 4 metrics are synced daily into the
Supabase project **WNLQ9 SEO Automation** and read by `/api/data`, pre-aggregated
per brand by the `dashboard_gsc_keywords` / `dashboard_ga4_pages` materialized
views. Set these in `.env.local` to go live:

```
SUPABASE_URL=https://asnarjokyedupsjipzkl.supabase.co
SUPABASE_ANON_KEY=<anon or publishable key>
```

The Topics and Keywords tabs then show real wine-now / liq9 data, brand-tagged
from the `site` column (no heuristic guessing).

**Fallback:** when the Supabase env vars are absent, `/api/data` falls back to
the bundled sample CSVs (`data/sample-*.csv`) so the UI still renders for
local/offline dev.

---

## Week 2 Setup (Polish & Documentation)

*(Coming as features are built)*

- [ ] GA4 CSV import workflow (automatic caching)
- [ ] GSC keyword clustering
- [ ] Publication Tracker (read from Notion)
- [ ] Team collaboration features

---

## Live Data Architecture (GA4 + GSC)

**Status:** ✅ Done — the dashboard reads real data from Supabase.

```
Google Search Console API ─┐
Google Analytics 4 API ────┤→ sync-gsc-ga4 (Supabase Edge Fn, daily)
                           │     ↓ writes
                           │   seo_gsc_daily / seo_ga4_daily  (per-day rows, per site)
                           │     ↓ rolled up by
                           │   dashboard_gsc_keywords / dashboard_ga4_pages  (materialized views)
                           └→  /api/data  →  Topics & Keywords tabs
```

- The per-day tables hold 360k+ GSC rows; the **materialized views** pre-aggregate
  per `(site, keyword)` / `(site, page_path)` so top-N reads are instant.
- A **pg_cron** job (`refresh-dashboard-seo-views`, `0 7 * * *` UTC) runs
  `refresh_dashboard_seo_views()` daily, just after the ~06:00 UTC sync, so the
  aggregates stay current automatically.
- The dashboard reads the views with the **anon key** (views are granted to anon
  and bypass base-table RLS as aggregate-only, non-sensitive data) — server-side
  only, via `/api/data`.

No Google service-account key is needed in the dashboard itself; that lives in the
sync pipeline. Supermetrics is **not** used.

---

## Environment Variables Reference

| Variable | Purpose | Status | Where to Get |
|----------|---------|--------|-------------|
| `SUPABASE_URL` | Live GA4/GSC data source | ✅ Live | `https://asnarjokyedupsjipzkl.supabase.co` |
| `SUPABASE_ANON_KEY` | Read the aggregation views | ✅ Live | Supabase → Project Settings → API keys |
| `NOTION_API_TOKEN` | Notion API authentication | Week 1 | notion.so/my-integrations |
| `NOTION_DATABASE_ID` | Content database ID | Pre-configured | `786d080f8da24a1eb84e161f4e19d56d` |
| `SLACK_WEBHOOK_URL` | Slack notifications | Week 1 | Slack workspace → Incoming Webhooks |

---

## Troubleshooting

### "Notion integration not connected"
- Verify `NOTION_API_TOKEN` is set in `.env.local`
- Confirm the integration is shared with database `786d080f8da24a1eb84e161f4e19d56d`
- Restart dev server after env changes

### "Slack webhook failed"
- Double-check webhook URL format: `https://hooks.slack.com/services/T.../B.../XX...`
- Verify the webhook is for the correct channel (`#content-workflow`)
- Test with curl: `curl -X POST -H 'Content-type: application/json' --data '{"text":"test"}' YOUR_WEBHOOK_URL`

### "Sample CSV won't import"
- Ensure file is in correct format (see `data/sample-*.csv` for examples)
- Check browser console for error messages
- Data cache is cleared when you refresh the page

### "Dev server won't start"
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## Project Structure

```
dashboard/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes (Notion, Slack, GA, GSC)
│   ├── page.tsx                  # Main dashboard
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── Calendar/                 # Month view calendar
│   ├── Brief/                    # Brief editor form
│   ├── Settings/                 # API configuration
│   ├── TopicIntelligence/        # GA trends display
│   ├── KeywordManager/           # GSC keywords display
│   ├── BriefGenerator/           # 3-option generator
│   └── PublicationTracker/       # Status grid
├── lib/                          # Utilities & helpers
│   ├── api/                      # API client functions
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript types
│   └── utils/                    # Helper functions
├── data/                         # Sample data
│   ├── sample-ga4-data.csv       # Mock GA4 export
│   └── sample-gsc-data.csv       # Mock GSC export
├── public/                       # Static assets
├── .env.example                  # Environment template
├── .env.local                    # (Your local config - not committed)
├── SETUP.md                      # This file
└── package.json                  # Dependencies
```

---

## Next Steps

1. **Complete env setup** (5 min) → `.env.local` with Notion token
2. **Test Notion connection** (2 min) → Settings page → "Test Connection"
3. **Load sample data** (1 min) → Import CSV files from `data/`
4. **Build Week 1 features** (start here):
   - [ ] Calendar component (view Notion data)
   - [ ] Brief Editor form (create new briefs)
   - [ ] "Save to Notion" integration
   - [ ] Slack notifications
   - [ ] Settings panel refinement

---

## Support

For issues or questions:
1. Check this SETUP.md
2. Review inline code comments
3. Check the `/api` route implementations
4. Run `npm run dev` with `DEBUG=*` for verbose logging

Last updated: May 30, 2026