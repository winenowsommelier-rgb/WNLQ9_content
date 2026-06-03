# Phase 1: SEO Monitoring Autopilot — Deployment Guide

**Goal:** Automated daily GSC/GA4 sync → Supabase → Slack alerts + Opportunity detection

**Timeline:** 2-3 hours to deploy + configure

---

## Architecture

```
Google Search Console ──┐
                        ├─→ sync-gsc-ga4 Edge Function (daily 6 AM) ──→ Supabase
Google Analytics 4 ────┘                                                   │
                                                                            ├─→ Auto-detect
                                                                            │   opportunities
                                                                            │   & regressions
                                                                            │
                                                   seo-slack-alerts (daily 7 AM)
                                                            │
                                                            └─→ Slack #seo-dashboard
```

---

## Deployment Steps

### 1. Deploy Supabase Migration (5 min)

Apply the schema to Supabase:

```bash
# Option A: Using Supabase CLI (local development)
supabase migration up

# Option B: Manual (copy-paste into Supabase SQL Editor)
# Visit: https://app.supabase.com → [project] → SQL Editor
# Create new query → paste migrations/20260531_seo_monitoring_schema.sql
# Run query
```

**Verify:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'seo_%';
```

Expected output:
```
seo_gsc_daily
seo_ga4_daily
seo_opportunities
seo_regression_alerts
seo_metrics_snapshot
seo_sync_log
```

---

### 2. Deploy Edge Functions to Supabase (10 min)

**Function 1: sync-gsc-ga4**

```bash
# Deploy via CLI
supabase functions deploy sync-gsc-ga4

# Or manual upload:
# Supabase Dashboard → Functions → Create function → "sync-gsc-ga4"
# Copy-paste supabase/functions/sync-gsc-ga4/index.ts
# Deploy
```

**Function 2: seo-slack-alerts**

```bash
supabase functions deploy seo-slack-alerts
```

**Verify both deployed:**
```bash
supabase functions list
```

---

### 3. Connect Google Search Console API (15 min)

**Prerequisites:**
- Google Cloud Project with Search Console API enabled
- Service account with GSC access

**Steps:**

1. Create GCP Service Account (if not already done):
   - Go to https://console.cloud.google.com/iam-admin/serviceaccounts
   - Create → Service Account
   - Grant role: "Viewer" (for GSC read-only)
   - Create Key → JSON → Download

2. Add GSC property in Google Search Console:
   - Visit https://search.google.com/search-console
   - Verify your site: `th.wine-now.com` (and `th.liq9.com` for LIQ9)
   - Note the Site URL

3. Grant service account access to GSC:
   - In GSC → Settings → Users & permissions
   - Add the service account email as "Reader"

4. Set environment variables in Supabase:

   ```bash
   # Supabase Dashboard → Project Settings → Environment Variables
   
   GSC_SITE_URL=https://th.wine-now.com
   GSC_PROJECT_ID=[your-gcp-project-id]
   GSC_SERVICE_ACCOUNT_KEY=[contents-of-service-account-json]
   GSC_SCOPE_DATE_RANGE=last_90_days  # Sync last 90 days of data
   ```

5. Test GSC connection:
   ```bash
   curl -X POST https://[your-project].supabase.co/functions/v1/sync-gsc-ga4 \
     -H "Authorization: Bearer [anon-key]" \
     -H "Content-Type: application/json"
   ```

---

### 4. Connect Google Analytics 4 API (15 min)

**Prerequisites:**
- Same GCP Service Account from step 3
- GA4 property ID

**Steps:**

1. Enable Google Analytics API:
   - GCP Console → APIs & Services → Enable "Google Analytics Data API"

2. Grant service account access to GA4:
   - Google Analytics → Admin → Account → Property → Property Access Management
   - Add service account email with "Editor" role

3. Set environment variables:

   ```bash
   # Supabase Dashboard → Project Settings → Environment Variables
   
   GA4_PROPERTY_ID=[your-ga4-property-id]  # Format: 123456789
   GA4_LOOKBACK_DAYS=90
   ```

4. Test GA4 connection:
   ```bash
   curl -X POST https://[your-project].supabase.co/functions/v1/sync-gsc-ga4 \
     -H "Authorization: Bearer [anon-key]" \
     -H "Content-Type: application/json"
   ```

---

### 5. Connect Slack Webhook (10 min)

**Steps:**

1. Create Slack app (if not already done):
   - Go to https://api.slack.com/apps
   - Create New App → From scratch
   - Name: "SEO Autopilot"
   - Choose workspace: `winenowsommelier`

2. Enable Incoming Webhooks:
   - App page → Incoming Webhooks → Activate
   - Add New Webhook to Workspace
   - Choose channel: `#seo-dashboard` (create if needed)
   - Copy Webhook URL

3. Set environment variable:

   ```bash
   # Supabase Dashboard → Project Settings → Environment Variables
   
   SLACK_WEBHOOK_URL=[your-webhook-url]  # https://hooks.slack.com/services/...
   ```

4. Test Slack alert:
   ```bash
   curl -X POST https://[your-project].supabase.co/functions/v1/seo-slack-alerts \
     -H "Authorization: Bearer [anon-key]" \
     -H "Content-Type: application/json"
   ```

   You should see a message appear in Slack #seo-dashboard.

---

### 6. Schedule Daily Cron Jobs (10 min)

**Option A: Using Supabase Cron (easiest)**

```bash
# Create cron job via Supabase CLI
supabase functions deploy sync-gsc-ga4 --schedule "0 6 * * *"  # 6 AM UTC daily
supabase functions deploy seo-slack-alerts --schedule "0 7 * * *"  # 7 AM UTC daily
```

**Option B: Using GitHub Actions** (if self-hosted)

Create `.github/workflows/seo-daily-sync.yml`:

```yaml
name: SEO Daily Sync

on:
  schedule:
    - cron: "0 6 * * *"  # 6 AM UTC
    - cron: "0 7 * * *"  # 7 AM UTC (alerts)

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: GSC/GA4 Sync
        run: |
          curl -X POST https://${{ secrets.SUPABASE_PROJECT_ID }}.supabase.co/functions/v1/sync-gsc-ga4 \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json"

      - name: Slack Alerts
        run: |
          curl -X POST https://${{ secrets.SUPABASE_PROJECT_ID }}.supabase.co/functions/v1/seo-slack-alerts \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json"
```

---

## Verification Checklist

- [ ] Supabase migration applied (seo_* tables visible)
- [ ] Both Edge Functions deployed and active
- [ ] GSC API connected (environment variables set)
- [ ] GA4 API connected (environment variables set)
- [ ] Slack webhook working (test message received)
- [ ] Cron jobs scheduled (visible in Supabase dashboard)

---

## Monitoring & Troubleshooting

### Check sync logs:

```sql
SELECT * FROM seo_sync_log 
ORDER BY started_at DESC 
LIMIT 10;
```

### Check for errors:

```sql
SELECT error_message, COUNT(*) FROM seo_sync_log 
WHERE status = 'failed' 
GROUP BY error_message;
```

### View today's GSC data:

```sql
SELECT COUNT(*), AVG(position), AVG(ctr) 
FROM seo_gsc_daily 
WHERE date = CURRENT_DATE;
```

### View unresolved regression alerts:

```sql
SELECT keyword, regression_type, change_percent, alert_level 
FROM seo_regression_alerts 
WHERE resolved_at IS NULL 
ORDER BY alert_level DESC, change_percent DESC;
```

---

## Next Steps (Phase 2)

Once Phase 1 is stable (3-5 days of clean syncs):

1. **Build SEO Generator:**
   - Generate meta titles, descriptions, alt text for all 11,436 products
   - Write to staging columns in Supabase

2. **Set up Notion Dashboard:**
   - Visualize daily rank/CTR trends
   - Flag opportunities automatically
   - Manual approval workflow before deploy

3. **Create Export Pipeline:**
   - Generate Magento-ready CSV
   - Manual upload to Magento (your current workflow)
   - Track changes → measure impact

---

## Support

- **Supabase Docs:** https://supabase.com/docs/guides/functions
- **Google Search Console API:** https://developers.google.com/webmaster-tools/search-console-api
- **Google Analytics API:** https://developers.google.com/analytics/devguides/reporting/data/v1
- **Slack API:** https://api.slack.com/messaging/webhooks

**Contact:** Ping #eng-seo or email winenowsommelier@gmail.com if deployment issues.
