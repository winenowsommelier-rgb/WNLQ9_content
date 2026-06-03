# Notion → git backup

Automated weekly backup of the WNLQ9 content operation from Notion into this
repository, so the entire content system survives an accidental Notion deletion.

## What gets backed up

The export script (`scripts/notion-backup.mjs`) writes JSON snapshots into
`notion-backups/`:

| File | Source | Notion ID |
| --- | --- | --- |
| `master-topic-ledger.json` | Master Topic Ledger DB | `43240f1120df437391017e67a64723a7` |
| `july-2026-db.json` | July 2026 monthly DB (data source) | `d342f9b8-3725-4068-9ccb-03b09821b0c8` (parent page `93ac15a8bb6540f7b357b8cabd336214`) |
| `june-2026-db.json` | June 2026 monthly DB (data source) | `6be4a7bb-d42c-4286-be1b-fa73e3635b45` |
| `editorial-standard.json` | Editorial Production Standard page (blocks, recursive) | `3729d75a-e4b5-81a8-83dd-c176804fdbdd` |
| `_manifest.json` | Run metadata: timestamp + per-target record/block count and status | — |

Databases (and data sources, which are queried the same way) are exported as the
full set of page records via the `/databases/{id}/query` endpoint with
pagination. The Editorial Production Standard page is exported as its full block
tree via `/blocks/{id}/children`, recursing into nested blocks.

Each target is handled independently: if one fails, the others still back up and
the failure is recorded in `_manifest.json` with `status: "error"`.

## Schedule

- **Weekly:** every Monday at 03:00 UTC (GitHub Actions cron `0 3 * * 1`).
- **On demand:** via the "Run workflow" button (`workflow_dispatch`) on the
  Notion backup workflow in the Actions tab.

The workflow commits any changes under `notion-backups/` back to the branch.

## Required setup (one time)

The backup **will not run until this is done.** It needs a Notion integration
token exposed to GitHub Actions as the secret `NOTION_TOKEN`.

1. **Create a Notion internal integration.**
   - In Notion, go to **Settings → Connections → develop/manage integrations**
     (i.e. `https://www.notion.so/my-integrations`).
   - Create a new **internal** integration. Give it read access (read content is
     sufficient for backups).
   - Copy its **Internal Integration Token** (starts with `secret_` / `ntn_`).

2. **Share the 4 targets with the integration.**
   For each of the following, open it in Notion, click the `•••` menu →
   **Connections** (or "Add connections"), and add the integration you created:
   - Master Topic Ledger DB
   - July 2026 DB (and/or its parent page `93ac15a8bb6540f7b357b8cabd336214`)
   - June 2026 DB
   - Editorial Production Standard page

   Without this sharing step the API returns 404/`object_not_found` for that
   target and it will be marked `status: "error"` in the manifest.

3. **Add the token as a GitHub secret.**
   - In the GitHub repo: **Settings → Secrets and variables → Actions → New
     repository secret**.
   - Name: `NOTION_TOKEN`. Value: the integration token from step 1.

## Running locally

```bash
NOTION_TOKEN=secret_xxx node scripts/notion-backup.mjs
```

The script respects Notion's ~3 requests/second rate limit (≈350 ms between
requests) and honors `Retry-After` on HTTP 429.
