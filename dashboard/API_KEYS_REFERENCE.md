# API Keys Reference — WNLQ9 Dashboard

**Keep this document updated whenever you set up new integrations or renew credentials.**

---

## 🔐 Current API Credentials

### ✅ Notion API (Active)

| Property | Value |
|----------|-------|
| **Status** | ✅ Configured & Verified |
| **Integration Name** | WNLQ9 Blog Content Dashboard |
| **Bearer Token** | `<see .env.local — NOTION_API_TOKEN>` |
| **Database ID** | `786d080f8da24a1eb84e161f4e19d56d` |
| **Created** | May 30, 2026 |
| **Last Verified** | [UPDATE WHEN YOU TEST] |
| **Environment Variable** | `NOTION_API_TOKEN` |

**Where to Find This Token:**
1. Go to https://www.notion.so/my-integrations
2. Click on integration "WNLQ9 Blog Content Dashboard"
3. Under "Internal Integration Token", copy the Bearer token (starts with `ntn_`)

**How to Use:**
- Add to `.env.local`: `NOTION_API_TOKEN=<see .env.local — NOTION_API_TOKEN>`
- The app will use this to read/write briefs to Notion database

**Test Connection:**
```bash
curl -H "Authorization: Bearer <see .env.local — NOTION_API_TOKEN>" \
  "https://api.notion.com/v1/users/me" \
  -H "Notion-Version: 2022-06-28"
```

**If Token Expires/Rotates:**
1. Go back to https://www.notion.so/my-integrations
2. Click on the integration
3. Regenerate token if needed
4. Update `.env.local` with new token
5. Restart dev server: `npm run dev`
6. Test connection via Settings page

---

### ✅ Slack Webhook (Active)

| Property | Value |
|----------|-------|
| **Status** | ✅ Configured & Verified |
| **Channel** | #content-workflow |
| **Webhook URL** | `<see .env.local — SLACK_WEBHOOK_URL>` |
| **Created** | May 30, 2026 |
| **Last Verified** | May 30, 2026 (test message delivered) |
| **Environment Variable** | `SLACK_WEBHOOK_URL` |

**Setup Instructions:**
See **SLACK_WEBHOOK_SETUP.md** in this folder for detailed, step-by-step instructions.

**Quick Path:**
1. Desktop Slack: Click workspace name → "Settings & Administration" → "Manage apps"
2. Search for "Incoming Webhooks" (official Slack app)
3. Install it
4. "Add New Webhook to Workspace" → Select #content-workflow
5. Copy the URL and paste it in `.env.local`

**How to Use:**
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../XXX
```

**Test Webhook:**
```bash
curl -X POST \
  -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  https://hooks.slack.com/services/T.../B.../XXX
```

---

## 📋 Future API Keys (Week 3+)

These will be added when you set up Google APIs:

### Google Service Account (Week 3)

```
GOOGLE_SERVICE_ACCOUNT_KEY={full JSON key}
GOOGLE_GA4_PROPERTY_ID=123456789
GOOGLE_GSC_DOMAIN_WINE_NOW=wine-now.com
GOOGLE_GSC_DOMAIN_LIQ9=liq9.com
```

Setup: Will be documented in SETUP.md when ready.

---

## 🔄 Credential Rotation Schedule

| Service | Frequency | Last Rotated | Next Due |
|---------|-----------|-------------|----------|
| Notion | As needed | May 30, 2026 | [TBD] |
| Slack | As needed | [Not started] | [TBD] |
| Google APIs | Quarterly | [Not started] | [TBD] |

---

## 🔒 Security Notes

**DO:**
- ✅ Keep `.env.local` in `.gitignore` (already done)
- ✅ Store tokens in `.env.local` locally only
- ✅ Use `.env.example` for template without real values
- ✅ Rotate tokens quarterly
- ✅ Regenerate tokens if they're ever exposed

**DON'T:**
- ❌ Commit `.env.local` to git
- ❌ Paste tokens in Slack, email, or public repos
- ❌ Share tokens in screenshots or documents
- ❌ Use the same token across multiple apps

---

## 📞 Token Troubleshooting

**"Notion connection failed"**
- Check token isn't expired
- Verify database is shared with integration
- Test token with curl command above
- Restart dev server

**"Slack webhook returns 404"**
- Verify webhook URL is complete (not truncated)
- Confirm #content-workflow channel exists
- Test with curl command above
- Regenerate webhook if needed

**"Token works locally but not on Vercel"**
- Verify env variable is set in Vercel project settings
- Use exact token (no extra spaces)
- Restart deployment after updating env vars

---

## 📝 Change Log

| Date | Service | Action | Details |
|------|---------|--------|---------|
| May 30, 2026 | Notion | Created | Integration "WNLQ9 Blog Content Dashboard" |
| May 30, 2026 | Notion | Configured | Token: `ntn_4226...` |
| May 30, 2026 | Slack | Created & Verified | Webhook for #content-workflow, test delivered |
| [Date] | Google | Created | [Details] |

---

**Last Updated:** May 30, 2026  
**Document Purpose:** Central reference for all API credentials, setup instructions, and rotation schedule