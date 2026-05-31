# 🚀 Phase 1 Deployment — Quick Start

**Status:** ✅ Supabase ready | Follow 10 steps below | ~90 minutes

---

## What's Already Done

✅ Supabase project created: `WNLQ9 SEO Automation`  
✅ All 6 tables deployed + indexes created  
✅ RLS security policies enabled  
✅ Edge function code ready to deploy  
✅ Cron scheduling configured  

---

## What You Do Now (10 Steps)

### ✅ Step 1: Verify Google Search Console
- Site: `winenowsommelier.com`
- Status: **Need to verify** (5-15 min)
- Go: https://search.google.com/search-console

### ✅ Step 2: Create GCP Service Account (5 min)
- Name: `seo-automation`
- Project: `wine-now-seo-automation`
- Create API key (JSON) → **Save the file**

### ✅ Step 3: Enable GSC API
- GCP Console → APIs → Search for "Google Search Console API"
- Click **Enable**

### ✅ Step 4: Grant Service Account GSC Access
- Google Search Console → Settings → Users & permissions
- Invite: `seo-automation@[project].iam.gserviceaccount.com`
- Role: **Reader**

### ✅ Step 5: Enable GA4 API
- GCP Console → APIs → Search for "Google Analytics Data API"
- Click **Enable**

### ✅ Step 6: Grant Service Account GA4 Access
- Google Analytics → Admin → Property Access Management
- Invite: `seo-automation@[project].iam.gserviceaccount.com`
- Role: **Viewer**
- **Save your GA4 Property ID** (looks like: 123456789)

### ✅ Step 7: Set Supabase Environment Variables
```
GSC_SITE_URL = https://winenowsommelier.com
GSC_PROJECT_ID = [your-gcp-project-id]
GSC_SERVICE_ACCOUNT_KEY = [JSON file contents from Step 2]
GA4_PROPERTY_ID = [your-ga4-property-id]
SLACK_WEBHOOK_URL = [we'll get this next]
```

**How to set:**
- Supabase Dashboard → Project Settings → Environment Variables → Add

### ✅ Step 8: Create Slack Webhook
1. Go: https://api.slack.com/apps → "Create New App" → "From scratch"
2. Name: `SEO Autopilot`
3. Workspace: Select yours
4. Go to: **Incoming Webhooks** → Activate → Add Webhook
5. Channel: `#seo-dashboard` (create if needed)
6. Copy webhook URL → Add to Supabase env vars

### ✅ Step 9: Deploy Edge Functions
```bash
# Terminal
supabase functions deploy sync-gsc-ga4
supabase functions deploy seo-slack-alerts

# Schedule (daily 6 AM + 7 AM UTC)
supabase functions deploy sync-gsc-ga4 --schedule "0 6 * * *"
supabase functions deploy seo-slack-alerts --schedule "0 7 * * *"
```

### ✅ Step 10: Test
```bash
# Test GSC/GA4 sync
curl -X POST https://asnarjokyedupsjipzkl.supabase.co/functions/v1/sync-gsc-ga4 \
  -H "Authorization: Bearer [your-anon-key]" \
  -H "Content-Type: application/json"

# Test Slack (check #seo-dashboard for message)
curl -X POST https://asnarjokyedupsjipzkl.supabase.co/functions/v1/seo-slack-alerts \
  -H "Authorization: Bearer [your-anon-key]" \
  -H "Content-Type: application/json"
```

---

## Your Supabase Credentials

```
URL: https://asnarjokyedupsjipzkl.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbmFyam9reWVkdXBzamlwemtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTgzNjMsImV4cCI6MjA5NTc5NDM2M30.sST_AGx6Vax-zEdTm_igXqcrrv_gm4ZMsxUHOi1tx1I
Publishable Key: sb_publishable_n6__utmjJjGQBss5yzGedQ_2gSuzc46
```

---

## After Deployment

1. **Wait for 6 AM UTC tomorrow** → First automated sync runs
2. **Wait for 7 AM UTC tomorrow** → First Slack report appears
3. **Monitor for 7 days** → Check logs for errors
4. **After 7 stable days** → Phase 2 build (SEO Generator)

---

## Full Instructions

See: `docs/DEPLOYMENT_CHECKLIST.md` for step-by-step details & troubleshooting

---

## Questions?

Each step has detailed instructions in the checklist.  
All APIs are free-tier compatible.  
Total time: ~90 minutes start-to-finish.

**Let's go!** 🎯
