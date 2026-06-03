#!/bin/bash
# ============================================================
# ⚠️ DEPRECATED — DO NOT RUN. Kept for historical reference only.
#
# The deployed `sync-gsc-ga4` function does NOT read the GCP key from an
# edge-function secret. It reads the service-account JSON from Supabase
# Vault via the `get_gcp_sa_key()` RPC, and its site/property config from
# the `seo_config` table — verified against the live function (v9) and a
# working daily sync (seo_sync_log shows successful imports, 0 failures).
#
# Therefore `supabase secrets set GCP_SERVICE_ACCOUNT_KEY=...` is a no-op
# for the live function. This script also fails on the SUPABASE_URL /
# SUPABASE_SERVICE_ROLE_KEY lines below — Supabase reserves the `SUPABASE_`
# secret prefix and rejects setting it.
#
# To rotate the real key, update the Vault secret that `get_gcp_sa_key()`
# reads (a production write — do it deliberately, with the SA JSON in hand).
echo "This script is DEPRECATED and a no-op for the deployed Vault-based function."
echo "See the banner in this file. Exiting without changing anything."
exit 0
# ------------------------------------------------------------
# Original (obsolete) script below:
# ============================================================
# Supabase Edge Function Secrets Setup Script
# Run this once per new session/container to push credentials
# to the Supabase project so the Edge Functions can access them.
#
# Prerequisites:
#   1. Set SUPABASE_ACCESS_TOKEN in your environment
#      (get it from https://supabase.com/dashboard/account/tokens)
#   2. The credentials file .env.production.local must exist
#      OR set the variables below manually
#
# Usage:
#   export SUPABASE_ACCESS_TOKEN=your_token_here
#   bash scripts/setup-supabase-secrets.sh
# ============================================================

set -e

PROJECT_REF="asnarjokyedupsjipzkl"

# Check for access token
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN is not set."
  echo ""
  echo "To get your access token:"
  echo "  1. Go to https://supabase.com/dashboard/account/tokens"
  echo "  2. Generate a new token"
  echo "  3. Export it: export SUPABASE_ACCESS_TOKEN=sbp_xxxx"
  echo ""
  exit 1
fi

# Load credentials from .env.production.local if it exists
if [ -f ".env.production.local" ]; then
  echo "✅ Loading credentials from .env.production.local"
  source .env.production.local
else
  echo "⚠️  .env.production.local not found — using environment variables"
fi

# Validate required variables
MISSING=0
for VAR in GCP_SERVICE_ACCOUNT_KEY GSC_SITE_URL GA4_PROPERTY_ID; do
  if [ -z "${!VAR}" ]; then
    echo "❌ Missing required variable: $VAR"
    MISSING=1
  fi
done

if [ "$MISSING" -eq 1 ]; then
  echo ""
  echo "Set these variables or restore .env.production.local and re-run."
  exit 1
fi

echo ""
echo "🚀 Pushing secrets to Supabase project: $PROJECT_REF"
echo ""

# Push all secrets to Supabase Edge Functions
supabase secrets set \
  --project-ref "$PROJECT_REF" \
  GCP_SERVICE_ACCOUNT_KEY="$GCP_SERVICE_ACCOUNT_KEY" \
  GSC_SITE_URL="$GSC_SITE_URL" \
  GA4_PROPERTY_ID="$GA4_PROPERTY_ID" \
  SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}" \
  SUPABASE_URL="https://asnarjokyedupsjipzkl.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

echo ""
echo "✅ Secrets pushed successfully!"
echo ""
echo "Next steps:"
echo "  1. Trigger a test sync:"
echo "     curl -X POST https://asnarjokyedupsjipzkl.supabase.co/functions/v1/sync-gsc-ga4 \\"
echo "       -H 'Authorization: Bearer \$SUPABASE_ANON_KEY'"
echo ""
echo "  2. Check the dashboard: https://seodashboard-rho.vercel.app"
echo ""
