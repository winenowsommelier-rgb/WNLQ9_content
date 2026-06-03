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

## Deploy (pending — requires owner action)

This function was **not** auto-deployed. Two prerequisites:

1. **Store the Notion token in Vault** (one time):
   ```sql
   select vault.create_secret('<notion_integration_token>', 'notion_token');
   ```
   The integration must be shared with the Master Topic Ledger and the monthly
   DBs (same integration used by `scripts/notion-backup.mjs`).

2. **Deploy the function.** Via Supabase CLI:
   ```sh
   supabase functions deploy compliance-scan --no-verify-jwt
   ```
   `--no-verify-jwt` matches `check-sync-health` so the cron's `GET` works with
   the public anon key (the function itself holds no secrets in its request
   path; all secrets come from Vault server-side). If you prefer JWT
   verification, deploy without that flag and have the cron send a key that
   passes `verify_jwt`.

## Smoke test after deploy

```sh
# Should report not_configured until the token is stored, then clean/violations.
curl -s "https://asnarjokyedupsjipzkl.supabase.co/functions/v1/compliance-scan?verbose=true" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq
```
