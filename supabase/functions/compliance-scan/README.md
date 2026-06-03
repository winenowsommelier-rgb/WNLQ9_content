# compliance-scan — WNLQ9 enforced compliance gate

Automated, scheduled counterpart to `scripts/compliance-lint.mjs`. It runs the
Editorial Production Standard **§18.2** Thai-alcohol compliance rules over live
Notion content and posts any **error-severity** violations to Slack.

`compliance-lint.mjs` stays the source of truth for the rule definitions and is
the local/CI gate. This function re-implements the same pure rule core in Deno
so it can run against live Notion data on a schedule. **Keep the two in sync** —
if you change a regex or threshold in one, change it in the other.

## What it does

1. Reads the Notion integration token from Supabase Vault
   (`get_vault_secret('notion_token')`).
2. Queries the Notion content system — Master Topic Ledger + the monthly
   production DBs (June/July 2026) — and selects rows whose **Status** is at or
   past the gate point (`Review`, `Done`, `Published` by default).
3. Maps each row's Title / Content EN / Content TH / Publish Date / Funnel and
   runs the §18.2 rules (on-page price, emoji, age notice, direct-purchase CTA,
   sales-ban-day commercial copy).
4. Posts **error-severity** violations to Slack via `get_slack_webhook()`.
   Warnings (e.g. missing age notice) are counted in the JSON summary but do not
   trigger an alert.

Both secrets are read from Vault via service_role RPCs — never inlined.

## Invocation

```
GET /functions/v1/compliance-scan
GET /functions/v1/compliance-scan?statuses=Review,Done&verbose=true
```

- `statuses` — comma-separated Status names to gate on (default
  `Review,Done,Published`).
- `verbose=true` — also post an "all clear" message to Slack when there are no
  errors (otherwise it stays silent on clean runs, like `check-sync-health`).

Always returns HTTP 200 with a JSON summary for non-fatal outcomes, including
`{"status":"not_configured"}` when `notion_token` is absent from Vault (so the
daily cron does not spam Slack before the token is set). HTTP 500 only on an
unexpected error.

## Schedule

Wired into `.github/workflows/seo-cron.yml` at **08:00 UTC daily** (after the
06:00 GSC/GA4 sync and 07:00 Slack alerts, before the 09:00 health check). The
cron calls the endpoint over `GET` with the public anon bearer.

## Database IDs

`TARGETS` uses Notion **database_ids**, which the REST `/databases/{id}/query`
endpoint requires — NOT the `collection://` data-source ids that the MCP tooling
and `next-session-prompt.md` reference. The two differ for the monthly DBs and
using the data-source id returns `404 object_not_found`:

| Target | database_id (use this) | data-source id (404s) |
|--------|------------------------|------------------------|
| Master Topic Ledger | `43240f11-20df-4373-9101-7e67a64723a7` | `f4cb9278-…` |
| July 2026 | `93ac15a8-bb65-40f7-b357-b8cabd336214` | `d342f9b8-…` |
| June 2026 | `786d080f-8da2-4a1e-b84e-161f4e19d56d` | `6be4a7bb-…` |

## Status: DEPLOYED & LIVE

Deployed to project `asnarjokyedupsjipzkl` (`verify_jwt: false`), `notion_token`
stored in Vault, and verified with a live run. First scan (2026-06-03): 81
Review/Done/Published pages, 24 errors across 5 pages (July emoji `→`, June
price-in-title), Slack alert delivered.

If you need to redeploy after editing this file: via Supabase CLI,
`supabase functions deploy compliance-scan --no-verify-jwt`
(`--no-verify-jwt` matches `check-sync-health` so the cron's `GET` works with
the public anon key — all secrets come from Vault server-side, none in the
request path).

## Smoke test

```sh
curl -s "https://asnarjokyedupsjipzkl.supabase.co/functions/v1/compliance-scan?verbose=true" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq
```

## Running the canonical linter against the same live content

`scripts/fetch-notion-for-lint.mjs` pulls the same Review/Done/Published rows
and emits a JSON file that the source-of-truth linter consumes — useful for
detailed per-page violations and for cross-checking this function:

```sh
NOTION_TOKEN=ntn_xxx node scripts/fetch-notion-for-lint.mjs out.json
node scripts/compliance-lint.mjs out.json
```
