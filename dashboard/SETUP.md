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

### 3️⃣ Sample Data (Included)

**Status:** Pre-loaded for testing

The dashboard includes sample GA4 and GSC data:
- `data/sample-ga4-data.csv` — Top 15 wine/spirits topics (mock GA4 data)
- `data/sample-gsc-data.csv` — Top 20 keywords by brand (mock GSC data)

**To use in the app:**
1. Go to Settings page
2. Click "Import GA Data" → Upload `data/sample-ga4-data.csv`
3. Click "Import GSC Data" → Upload `data/sample-gsc-data.csv`

The data is cached in memory with a 6-hour TTL. Click "Refresh Data" to reload.

---

## Week 2 Setup (Polish & Documentation)

*(Coming as features are built)*

- [ ] GA4 CSV import workflow (automatic caching)
- [ ] GSC keyword clustering
- [ ] Publication Tracker (read from Notion)
- [ ] Team collaboration features

---

## Week 3 Setup (API Integration - Future)

*(Deferred to when GA4 API + GSC API are ready)*

### Google Cloud Project Setup

When ready to replace manual CSV imports with live APIs:

1. Create a Google Cloud Project
2. Enable APIs:
   - Google Analytics 4 API
   - Google Search Console API
3. Create a Service Account → Download JSON key
4. Add the service account email to:
   - GA4 property settings (read-only)
   - GSC settings (read-only)
5. Set environment variables:
   ```
   GOOGLE_SERVICE_ACCOUNT_KEY={...full json...}
   GOOGLE_GA4_PROPERTY_ID=123456789
   GOOGLE_GSC_DOMAIN_WINE_NOW=wine-now.com
   GOOGLE_GSC_DOMAIN_LIQ9=liq9.com
   ```

---

## Environment Variables Reference

| Variable | Purpose | Status | Where to Get |
|----------|---------|--------|-------------|
| `NOTION_API_TOKEN` | Notion API authentication | ✅ Week 1 | notion.so/my-integrations |
| `NOTION_DATABASE_ID` | Content database ID | ✅ Pre-configured | `786d080f8da24a1eb84e161f4e19d56d` |
| `SLACK_WEBHOOK_URL` | Slack notifications | ✅ Week 1 | Slack workspace → Incoming Webhooks |
| `NEXT_PUBLIC_BRANDS` | Brand dropdown options | ✅ Default | `wine-now,liq9` |
| `NEXT_PUBLIC_APP_URL` | App base URL | ✅ Default | `http://localhost:3000` |
| `DATA_CACHE_TTL_HOURS` | GA/GSC cache duration | ✅ Default | `6` hours |

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