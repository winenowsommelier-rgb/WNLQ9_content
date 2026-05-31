# 🔐 WNLQ9 Environment Setup

## Overview

All API keys and secrets are **centrally managed in Vercel** and automatically loaded into Claude Code. You never need to manually pass keys or configure them again.

## Architecture

```
Vercel (Online Master)
    ↓ (vercel env pull)
.env.local (Local Cache)
    ↓ (auto-loaded)
.claude/settings.json (Claude Code)
    ↓
Every Claude Session
```

## What's Configured

### Online (Vercel)
- **WNLQ9_BI_API_KEY** - WNLQ9 Data Warehouse API
- **ANTHROPIC_API_KEY** - Claude API (if needed)
- **SUPABASE_SERVICE_ROLE_KEY** - Database access
- **WNLQ9_PASSWORD** - App password

### Locally
- **.env.local** - Contains all secrets (git ignored)
- **.claude/settings.json** - Auto-loads them for Claude

## One-Time Setup (Already Done ✓)

If you're on a new machine or want to reset:

```bash
bash .claude/setup-env.sh
```

This script:
1. Verifies Vercel CLI is installed
2. Links the project (if not already linked)
3. Pulls all env vars from Vercel
4. Adds the API key to .env.local
5. Confirms everything is ready

## Using the API Keys

In Claude Code, keys are automatically available:

```bash
# WNLQ9 API - automatically uses WNLQ9_BI_API_KEY
curl -H "X-API-Key: $WNLQ9_BI_API_KEY" https://wnlq9-bi-api.vercel.app/...

# Or ask Claude directly
# "Get the top 10 selling products"
# (Claude will use $WNLQ9_BI_API_KEY automatically)
```

## Adding New Secrets

1. **Add to Vercel** (online master):
   ```bash
   vercel env add NEW_SECRET_NAME production
   # Then paste the value
   ```

2. **Sync locally**:
   ```bash
   vercel env pull --environment=production
   ```

3. **Update .claude/settings.json**:
   ```json
   {
     "env": {
       "NEW_SECRET_NAME": "${NEW_SECRET_NAME}"
     }
   }
   ```

## Security

- ✅ `.env.local` is in `.gitignore` - never committed
- ✅ Secrets live in Vercel - secure online backup
- ✅ Local cache stays on your machine
- ✅ Only add secrets you actually need

## Troubleshooting

**"WNLQ9_BI_API_KEY not found"**
→ Run `vercel env pull --environment=production` to sync

**"Permission denied" on setup script**
→ Run `chmod +x .claude/setup-env.sh`

**Need to rotate a key?**
1. Update in Vercel dashboard
2. Run `vercel env pull --environment=production`
3. Restart Claude

## Status

- **Setup Date**: 2026-05-31
- **Last Sync**: vercel env pull (production)
- **Secrets**: 4 configured
- **Status**: ✅ Ready to use
