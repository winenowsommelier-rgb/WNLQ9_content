# 08 — Secrets & Access (how to make this runnable from the repo)

> **Honest note:** the agent cannot harvest the live session's API keys into GitHub secrets — those
> credentials are injected by the Claude Code web environment and are not visible to the model, and
> there is no MCP tool that writes GitHub Actions secrets. **You** (who hold the values) add them
> once, using the steps below. The repo is already wired to *read* them from env (`.mcp.json`,
> `.env.example`).

## What credential each capability needs
| Capability | Secret(s) | Required? |
|---|---|---|
| **Notion** (the content DBs — core) | `NOTION_TOKEN` | **Required** |
| Run Claude Code headless (Action/CLI) | `ANTHROPIC_API_KEY` | Required for automation |
| Web search / trend research | built into Claude — none | — |
| Live keyword/SERP data (DataForSEO) | `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` | Optional |
| GA4 / Search Console (data-driven refresh) | `GA4_PROPERTY_ID`, `GSC_SITE_URL`, `GOOGLE_APPLICATION_CREDENTIALS` | Optional |
| App stack (existing dashboard) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SLACK_BOT_TOKEN` | Optional |

## 1) Create the Notion integration token (required)
1. Go to https://www.notion.so/my-integrations -> **New integration** (internal). Copy the token (`ntn_...`).
2. In Notion, open **"2026 Content Calendar Hub"** -> ••• -> **Connections** -> add your integration.
   (This grants access to the June/July DBs and the Editorial Standard beneath it.)
3. Use that value as `NOTION_TOKEN`.

## 2a) For Claude Code on the WEB (what we use now)
MCP connectors + environment variables are configured in the **environment settings** of the web
session (not in the repo). Add `NOTION_TOKEN` (and any optional keys) there as environment
secrets; `.mcp.json` in this repo references them by name. Docs:
https://code.claude.com/docs/en/claude-code-on-the-web

## 2b) For Claude Code CLI (local)
```bash
cp .env.example .env.local        # fill in NOTION_TOKEN (and optional keys)
set -a; source .env.local; set +a # export into the shell
claude                            # .mcp.json auto-loads the Notion MCP server
```

## 2c) For GitHub Actions (scheduled / on-demand automation)
Add repo secrets (you need the values):
```bash
gh secret set NOTION_TOKEN
gh secret set ANTHROPIC_API_KEY
# optional:
gh secret set DATAFORSEO_LOGIN
gh secret set DATAFORSEO_PASSWORD
```
Or: GitHub -> repo **Settings -> Secrets and variables -> Actions -> New repository secret**.
A starter workflow that runs the content engine on demand lives at
`.github/workflows/monthly-content.yml` (uses `anthropics/claude-code-action`; reads the secrets
above). Trigger it from the **Actions** tab (workflow_dispatch).

## 3) Security hygiene to fix (flagged, not auto-changed)
- `.github/workflows/seo-cron.yml` currently has a **hardcoded Supabase bearer JWT** committed in
  the file. It is the public *anon* key, but best practice is to move it to a secret
  (`SUPABASE_ANON_KEY`) and reference `${{ secrets.SUPABASE_ANON_KEY }}`. Rotate it if it was ever
  a service-role key.
- `.gitignore` already excludes `.env.local` / `.env.production.local` — keep real values there or in secrets, never committed.

## Quick verification
In a new session, ask Claude: *"List the data sources under the 2026 Content Calendar Hub."*
If Notion access is wired correctly it returns the June + July databases. If not, re-check Step 1–2.
