# ✅ Phase 1 Deployment Checklist

**Status:** Supabase project created & migration deployed ✅

---

## Your Supabase Project Details

```
Project Name: WNLQ9 SEO Automation
Project ID: asnarjokyedupsjipzkl
URL: https://asnarjokyedupsjipzkl.supabase.co
API Key (anon): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Publishable Key: sb_publishable_n6__utmjJjGQBss5yzGedQ_2gSuzc46
Region: ap-northeast-1
Status: ACTIVE_HEALTHY
```

### Tables Created ✅
- `seo_gsc_daily` — Google Search Console daily metrics
- `seo_ga4_daily` — Google Analytics 4 daily metrics
- `seo_opportunities` — Detected quick wins
- `seo_regression_alerts` — Position/CTR regression alerts
- `seo_metrics_snapshot` — 30/90/180-day averages
- `seo_sync_log` — Import audit trail

---

## Step 1: Verify Google Search Console

Your site: `th.wine-now.com` (and `th.liq9.com` for LIQ9)

**Action:** Visit https://search.google.com/search-console

1. Click **"Property"** dropdown
2. Verify you see **"https://th.wine-now.com"** in the list
3. If NOT listed:
   - Click "Add property"
   - Enter: `https://th.wine-now.com`
   - Choose: "URL prefix" (faster)
   - Verify ownership (copy HTML tag → add to site header, OR add DNS record)
4. Once verified, continue to Step 2

**Time:** 5-15 min (depends on if site is already verified)

---

## Step 2: Create Google Cloud Service Account

This single service account will have access to BOTH GSC & GA4.

### 2.1 Create GCP Project (if needed)

1. Go to https://console.cloud.google.com
2. Click project dropdown → "New Project"
3. Name: `wine-now-seo-automation`
4. Click "Create"

### 2.2 Create Service Account

1. In GCP Console, go to **IAM & Admin** → **Service Accounts**
2. Click **"Create Service Account"**
3. Service account name: `seo-automation`
4. Service account ID: auto-fills as `seo-automation@[project].iam.gserviceaccount.com`
5. Description: `SEO data sync for Wine Now`
6. Click **"Create and Continue"**

### 2.3 Grant Permissions

1. On "Grant this service account access to project":
   - Role: Search your roles for **"Viewer"** (read-only)
   - This gives broad read access (needed for later)
2. Click **"Continue"** → **"Done"**

### 2.4 Create API Key (JSON)

1. Go to **Service Accounts** page
2. Click on the `seo-automation@...` account you just created
3. Go to **"Keys"** tab
4. Click **"Add Key"** → **"Create new key"**
5. Choose **"JSON"**
6. Click **"Create"**
7. A JSON file downloads automatically. **Keep it safe.**

**Save this file locally for Step 4.**

---

## Step 3: Connect GSC API

### 3.1 Enable Search Console API

1. In GCP, go to **APIs & Services** → **Library**
2. Search: `"Google Search Console API"`
3. Click the result
4. Click **"Enable"**

### 3.2 Grant Service Account Access to GSC

1. Go to https://search.google.com/search-console
2. Select your property: `th.wine-now.com` (and `th.liq9.com` for LIQ9)
3. Go to **Settings** (left sidebar) → **Users and permissions**
4. Click **"Invite users"**
5. Paste service account email: `seo-automation@[your-gcp-project].iam.gserviceaccount.com`
6. Role: **"Reader"** (read-only)
7. Click **"Invite"**

---

## Step 4: Connect GA4 API

### 4.1 Enable Google Analytics API

1. In GCP, go to **APIs & Services** → **Library**
2. Search: `"Google Analytics Data API"`
3. Click the result
4. Click **"Enable"**

### 4.2 Grant Service Account Access to GA4

1. Go to https://analytics.google.com
2. Click Admin (bottom left)
3. Select your **Account** and **Property**
4. Go to **Property Access Management** (under Property)
5. Click **"Invite users"** (or **"Access Management"**)
6. Paste service account email: `seo-automation@[your-gcp-project].iam.gserviceaccount.com`
7. Role: **"Viewer"** (read-only)
8. Click **"Grant Access"**

**Get your GA4 Property ID:**
1. Go to Google Analytics
2. Click Admin → Property
3. In **Property settings**, find **"Property ID"** (looks like: `123456789`)
4. Copy it (you'll need this)

---

## Step 5: Configure Supabase Environment Variables

### 5.1 Prepare Variables

You'll need:
- **GSC_SITE_URL:** `https://th.wine-now.com`
- **GSC_SERVICE_ACCOUNT_KEY:** Contents of JSON file from Step 2.4
- **GA4_PROPERTY_ID:** Property ID from Step 4.2
- **SLACK_WEBHOOK_URL:** We'll get this next

### 5.2 Set in Supabase Dashboard

1. Go to https://app.supabase.com
2. Select project: **WNLQ9 SEO Automation**
3. Go to **Project Settings** → **Environment Variables** (or **Secrets**)
4. Click **"New Variable"** and add:

```
GSC_SITE_URL = https://th.wine-now.com
GSC_PROJECT_ID = [your-gcp-project-id]
GSC_SERVICE_ACCOUNT_KEY = [entire JSON file content]
GA4_PROPERTY_ID = 123456789
```

---

## Step 6: Create Slack Webhook

### 6.1 Create Slack App

1. Go to https://api.slack.com/apps
2. Click **"Create New App"**
3. Choose: **"From scratch"**
4. App name: `SEO Autopilot`
5. Workspace: Select your workspace
6. Click **"Create App"**

### 6.2 Enable Incoming Webhooks

1. In your app page, go to **"Incoming Webhooks"** (left sidebar)
2. Toggle **"Activate Incoming Webhooks"** → **ON**
3. Scroll down, click **"Add New Webhook to Workspace"**
4. Choose channel: **#seo-dashboard** (or create it first)
5. Click **"Allow"**
6. Copy the **Webhook URL** (looks like: `https://hooks.slack.com/services/T.../B.../X...`)

### 6.3 Add to Supabase Environment

1. Go back to Supabase → **Project Settings** → **Environment Variables**
2. Add:

```
SLACK_WEBHOOK_URL = https://hooks.slack.com/services/T.../B.../X...
```

---

## Step 7: Deploy Edge Functions

Once all environment variables are set in Supabase, deploy the functions:

### 7.1 Deploy Sync Function

```bash
supabase functions deploy sync-gsc-ga4
```

### 7.2 Deploy Slack Alerts Function

```bash
supabase functions deploy seo-slack-alerts
```

**Verify in Supabase Dashboard:**
1. Go to **Edge Functions**
2. You should see:
   - `sync-gsc-ga4` — Status: **Active**
   - `seo-slack-alerts` — Status: **Active**

---

## Step 8: Schedule Cron Jobs

### 8.1 Schedule GSC/GA4 Sync (6 AM UTC Daily)

```bash
supabase functions deploy sync-gsc-ga4 --schedule "0 6 * * *"
```

### 8.2 Schedule Slack Alerts (7 AM UTC Daily)

```bash
supabase functions deploy seo-slack-alerts --schedule "0 7 * * *"
```

**Verify in Supabase Dashboard:**
1. Go to **Edge Functions**
2. Click each function
3. You should see **Schedule** field populated with cron expression

---

## Step 9: Test Everything

### 9.1 Manual GSC Sync Test

```bash
# Get your Supabase anon key from dashboard
curl -X POST https://asnarjokyedupsjipzkl.supabase.co/functions/v1/sync-gsc-ga4 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "status": "success",
  "gsc": { "imported": 0, "updated": 0 },
  "ga4": { "imported": 0, "updated": 0 },
  "opportunities": 0,
  "regressions": 0
}
```

### 9.2 Manual Slack Alert Test

```bash
curl -X POST https://asnarjokyedupsjipzkl.supabase.co/functions/v1/seo-slack-alerts \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

Check Slack — you should see a test message in **#seo-dashboard** within 5 seconds.

### 9.3 Check Sync Logs

In Supabase dashboard, run this query in SQL Editor:

```sql
SELECT * FROM seo_sync_log ORDER BY started_at DESC LIMIT 5;
```

Should show your test runs with `status: 'completed'`.

---

## Step 10: Monitor for 7 Days

Once everything is deployed, monitor for a week:

- ✅ Sync logs: No errors (check daily)
- ✅ Slack alerts: Daily message at 7 AM UTC
- ✅ Data growth: `SELECT COUNT(*) FROM seo_gsc_daily;` should grow each day

After 7 stable days → Phase 2 is ready (SEO Generator build).

---

## Troubleshooting

### GSC API shows no data
- **Check 1:** Service account has "Reader" role in GSC? (Step 3.2)
- **Check 2:** GSC site is verified? (Step 1)
- **Check 3:** Service account key is valid JSON? (Step 2.4)
- **Action:** Re-invite service account to GSC with correct role

### GA4 API shows no data
- **Check 1:** Service account has "Viewer" role in GA4? (Step 4.2)
- **Check 2:** GA4 Property ID is correct? (Step 4.2)
- **Check 3:** GA4 is tracking your site (should have traffic)
- **Action:** Check GA4 reports → make sure tracking is active

### Slack webhook not working
- **Check 1:** Webhook URL is correct in Supabase env vars?
- **Check 2:** Channel `#seo-dashboard` exists?
- **Check 3:** Webhook app has permission to post?
- **Action:** Regenerate webhook (Step 6.2) and update Supabase

### Cron jobs not running
- **Check 1:** Functions show schedule in dashboard?
- **Check 2:** Check Edge Function logs for errors
- **Action:** Try manual invocation (Step 9) to debug

---

## Success Criteria

✅ All steps completed
✅ Supabase tables created
✅ Edge Functions deployed
✅ Environment variables set
✅ GSC/GA4 access granted to service account
✅ Slack webhook connected
✅ Manual tests pass
✅ Cron jobs scheduled
✅ Daily 7 AM Slack messages arriving

**Estimated Time:** 60-90 minutes total

**Next:** After 7 stable days, Phase 2 SEO Generator build (6-8 hours)
