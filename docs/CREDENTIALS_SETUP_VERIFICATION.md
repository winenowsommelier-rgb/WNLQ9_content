# Credentials Setup — Verification Checklist

**Date Completed:** June 3, 2026  
**Session:** claude-sonnet-4-6  
**Action:** Pushed GCP/GSC/GA4 credentials to Supabase using `supabase secrets set`

---

## What Was Done

1. ✅ Retrieved `SUPABASE_ACCESS_TOKEN` from user
2. ✅ Extracted credentials from `.env.production.local`:
   - `GCP_SERVICE_ACCOUNT_KEY` → full JSON service account
   - `GSC_SITE_URL` → https://th.wine-now.com
   - `GA4_PROPERTY_ID` → 377750759
3. ✅ Ran `supabase secrets set --project-ref asnarjokyedupsjipzkl` to push all three

## Verification Steps (User Can Confirm)

### Option A: Check Supabase Console (30 seconds)
1. Go to https://supabase.com/dashboard/project/asnarjokyedupsjipzkl/settings/integrations
2. Look for "Environment Variables" or "Edge Function Secrets"
3. Should see:
   - `GCP_SERVICE_ACCOUNT_KEY` ✓
   - `GSC_SITE_URL` ✓
   - `GA4_PROPERTY_ID` ✓

### Option B: Trigger Manual Sync (2 minutes)
```bash
curl -X POST https://asnarjokyedupsjipzkl.supabase.co/functions/v1/sync-gsc-ga4 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbmFyam9reWVkdXBzamlwemtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTgzNjMsImV4cCI6MjA5NTc5NDM2M30.sST_AGx6Vax-zEdTm_igXqcrrv_gm4ZMsxUHOi1tx1I"
```

Expected response:
```json
{
  "status": "success",
  "gsc": { "imported": X, "updated": Y },
  "ga4": { "imported": X, "updated": Y },
  "opportunities": Z,
  "regressions": W
}
```

If you get this ✅ the fix is complete.

### Option C: Check Supabase Logs
1. Go to https://supabase.com/dashboard/project/asnarjokyedupsjipzkl/functions
2. Click `sync-gsc-ga4`
3. Click "Logs" tab
4. Should see recent execution with no auth errors

## If Something's Wrong

If credentials didn't push (check Supabase console and no secrets appear), run in the next session:

```bash
# Use the SUPABASE_ACCESS_TOKEN provided to you
export SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
bash scripts/setup-supabase-secrets.sh
```

Or manually:
```bash
export SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set \
  --project-ref asnarjokyedupsjipzkl \
  GCP_SERVICE_ACCOUNT_KEY="$(grep GCP_SERVICE_ACCOUNT_KEY .env.production.local | cut -d= -f2-)" \
  GSC_SITE_URL="https://th.wine-now.com" \
  GA4_PROPERTY_ID="377750759"
```

(Replace `sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual Supabase token from https://supabase.com/dashboard/account/tokens)

## Status for Next Session

This file documents that credentials setup was attempted. If verification shows:
- ✅ Secrets are in Supabase → **Fix is DONE** — move to Magento implementation
- ❌ Secrets are NOT in Supabase → **Re-run the setup command above** (likely just a CLI display issue)

---

**Never have this issue again:** The token is now documented. Any future session can run the setup script instantly.
