# Content Trend Data Hub — Operations Runbook

This is the front-door document for running, monitoring, and troubleshooting
the Content Trend Data Hub. If something looks wrong with the data or the
nightly run, start here.

---

## 1. Overview

### What the system does

The Content Trend Data Hub automatically collects wine, spirits, and
food/beverage content from a registry of industry sources, normalizes and
categorizes it against a fixed schema, deduplicates it, and writes it into a
single Google Sheet that serves as the storage hub and dashboard backend. The
hub powers SEO/AEO analysis, competitive intelligence, and trend detection for
th.Wine-Now.com and th.LIQ9.com.

### Architecture (text diagram)

```
                        config/sources.yaml
                        (the source registry)
                                 |
                                 v
   +------------------------------------------------------------+
   |                      pipeline/ingest.py                     |
   |                      (daily orchestrator)                   |
   |                                                             |
   |   build_collectors        collect_all        process       |
   |        |                       |                |           |
   |        v                       v                v           |
   |  +-------------+        +-------------+   +---------------+  |
   |  | RSSCollector|        | WebScraper  |   | Deduplicator  |  |
   |  +-------------+        +-------------+   +-------+-------+  |
   |        \_______________________/                 |          |
   |                    |                              v          |
   |             collected articles            +---------------+  |
   |                                           |  Categorizer  |  |
   |                                           +-------+-------+  |
   |                                                   |          |
   |                                                   v          |
   |   (1) DB upsert FIRST              +-----------------------+  |
   |       (cross-run dedup,            | SqliteArticleStore    |  |
   |        system of record) ───────▶  | data/content_hub.db   |  |
   |                                    | (articles table)      |  |
   |                                    +-----------+-----------+  |
   |                                                |              |
   |   (2) mirror ONLY new rows                     v              |
   |       to Sheets                    +-----------------+        |
   |                                    | SheetsExporter  |        |
   |                                    +--------+--------+        |
   +-------------------------------------------- | ---------------+
                                                 v
                                    +-------------------------+
                                    | Google Sheet (MIRROR)   |
                                    | Articles / Backfill /   |
                                    | Dashboard / Trends ...  |
                                    +-------------------------+
                                                 ^
                                                 |
                 monitoring/health_check.py reads it back to verify health
```

**System of record = SQLite (`data/content_hub.db`).** The Google Sheet is a
**read-only mirror/view** that keeps the dashboards working. The DB is written
*first* and is authoritative; the Sheet is updated *after* with only the new
rows. The `ArticleStore` interface (`storage/article_store.py`) is the seam for
a future drop-in swap to Supabase/Postgres — implement the same methods against
the new backend and inject it; the pipelines don't change.

### Data flow

1. **Source registry** — `config/sources.yaml` lists every source with its
   `api_type` (`rss`, `web_scrape`, `api`, `keyword_monitor`) and connection
   details (RSS feed URL, scrape selectors, etc.).
2. **Collect** — `pipeline/ingest.py` builds a collector per source and runs
   each one fail-soft (a single broken source never aborts the run).
3. **Process** — collected articles are deduplicated *within the run* (by
   URL/title hash) then categorized (region, spirits type, trend signals, AEO
   value, etc.) against `schema/data-schema.md`.
4. **Store + cross-run dedup (DB-first)** — `pipeline/ingest.py` upserts the
   processed articles into the SQLite store (`storage/article_store.py`). The
   DB's **indexed `url_normalized` column is the cross-run dedup**: any article
   already stored from a prior run is skipped on upsert. This replaces the old
   full-Sheet `existing_urls` read — it scales past the Sheets cell ceiling and
   needs no Sheets round-trip. `upsert_articles` returns the list of
   *newly-inserted* rows; the run summary reports `db_inserted`,
   `db_total`, and `after_cross_run_dedup` (= `db_inserted`).
5. **Mirror to Sheets** — `pipeline/ingest.py` then appends **only the
   newly-inserted rows** to the **Articles** tab via
   `exporters/sheets_exporter.py`, in the fixed column order. The mirror runs
   *after* the DB write, so a Sheets/API failure is recorded in the summary's
   `errors` but never loses data (it's already durable in the DB) and never
   crashes the run. With no exporter configured the mirror is skipped.
6. **Observe** — every stage logs to `logs/ingest.log`; each run is also
   appended to the DB `runs` ledger; `monitoring/health_check.py` reads the
   sheet and the log back to confirm the run worked.

> **One-time cutover (existing Sheet data → DB):** run
> `./scripts/migrate_sheet_to_db.sh` once. It reads the `Articles` and
> `Historical_Backfill` tabs (`valueRenderOption=UNFORMATTED_VALUE`), maps each
> row back to an article dict (the inverse of `format_article_row`, including
> the `AEO Value` → `aeo_citation_opportunity` and `Trend Signals` →
> list mappings), and upserts them into `data/content_hub.db`. It is
> idempotent — re-running skips rows already present (by normalized URL) — and
> fail-soft per row. It prints read/inserted/skipped counts per tab plus a
> total.

---

## 2. Daily Operations

### What runs automatically

A single cron job runs the daily ingestion at **02:00 local time**:

```cron
0 2 * * * DATA_HUB_SHEET_ID=YOUR_SHEET_ID /abs/path/data-hub/scripts/run_ingest.sh >> /abs/path/data-hub/logs/cron.log 2>&1
```

(See `scripts/cron_setup.md` for full setup, including how to provide the
sheet id and make the wrapper executable.)

The wrapper `scripts/run_ingest.sh` activates the virtualenv and runs
`python -m pipeline.ingest`, which:

- reads `config/sources.yaml`,
- collects → deduplicates → categorizes,
- appends new rows to the **Articles** tab,
- logs counts and any per-source errors to `logs/ingest.log`.

### What to check each morning

1. Run the health check (see §3) — this is the fastest single signal.
2. If anything is `warning`/`critical`, open `logs/ingest.log` and look at the
   most recent `=== Run complete ... ===` line for the collected/exported counts
   and any `ERROR` lines.
3. Spot-check the **Articles** tab: newest rows should carry today's
   `Collected Date` and be fully categorized (Region, AEO Value populated).

---

## 3. Monitoring

### Running the health check

```bash
DATA_HUB_SHEET_ID=YOUR_SHEET_ID ./scripts/run_health_check.sh
# or directly:
DATA_HUB_SHEET_ID=YOUR_SHEET_ID python -m monitoring.health_check
```

It runs three checks and prints a report, for example:

```
Content Hub health check
  timestamp : 2026-06-01T12:00:00Z
  OVERALL   : HEALTHY

  recent_articles : HEALTHY
      18 recent / 4123 total (threshold 5)
  log_freshness   : HEALTHY
      last write 9.8h ago (2026-06-01T02:11:00Z)
  data_quality    : HEALTHY
      checked 100 row(s)
```

### The three checks

| Check | What it verifies | Source |
|---|---|---|
| `recent_articles` | New articles landed in the last ~26h (≥ 5 → healthy) | Articles tab, `Collected Date` |
| `log_freshness` | `logs/ingest.log` was written within ~26h | log file mtime |
| `data_quality` | Recent rows have Title, URL, Region, AEO Value | last 100 Articles rows |

### What the verdicts mean

- **healthy** — all three checks passed. Nothing to do.
- **warning** — at least one check is soft-failing (few/old articles, a stale
  or missing log, or some rows missing fields). The system is up but degraded;
  investigate during the day. The health check still exits `0`.
- **critical** — at least one check **errored** (e.g. the Sheets API was
  unreachable or credentials failed). The health check exits `1` so cron can
  alert. Treat as an outage — see §7 (Runbook for Failures).

### Reading the output

- `recent_articles` shows `recent / total (threshold)`. A low `recent` with a
  healthy log usually means a source/feed problem, not a pipeline crash.
- `log_freshness` shows hours since the last log write. A large number (or
  "log not found") means the nightly run did not happen.
- `data_quality` lists each issue type with a count, e.g.
  `- 3 row(s) missing Region`.

### Exit codes (for cron / alerting)

| Overall | Exit code | Cron behavior |
|---|---|---|
| healthy | 0 | quiet |
| warning | 0 | quiet (review manually) |
| critical | 1 | alert |

### Alerting (webhook + macOS notification)

All three entry points (`pipeline.ingest`, `pipeline.backfill`,
`monitoring.health_check`) route failures through `monitoring/notifier.py`'s
`send_alert()`. It is fully **fail-soft** — an alerting error never crashes
the run — and surfaces a failure through up to three channels:

1. **Logging** (always): ERROR for critical, WARNING otherwise.
2. **Webhook** (optional): if the environment variable
   **`DATA_HUB_ALERT_WEBHOOK`** is set to a Slack-compatible incoming webhook
   URL, it POSTs JSON `{"text": "<message>"}`.
3. **macOS desktop notification** (best effort, via `osascript`).

To enable Slack/Teams/Discord alerts, export the webhook in the cron/launchd
environment (alongside `DATA_HUB_SHEET_ID`):

```bash
export DATA_HUB_ALERT_WEBHOOK="https://hooks.slack.com/services/XXX/YYY/ZZZ"
```

If the variable is unset, alerting silently falls back to logging only.

### Non-zero exit on failure

The pipelines now make failures **visible to the scheduler**:

| Entry point | Exits non-zero (1) when… | Exits 0 when… |
|---|---|---|
| `python -m pipeline.ingest` | the run summary has a non-empty `errors` list (a source or the export failed) | clean run, even a partial one with zero errors |
| `python -m pipeline.backfill` | same — any collected error | clean run |
| `python -m monitoring.health_check` | overall verdict is `critical` | `healthy` or `warning` |

A non-zero ingest/backfill exit also fires `send_alert(..., level="critical")`.
This means launchd (or GitHub Actions — see below) sees the failure instead of
a silent "success".

### Log rotation

`logs/ingest.log` and `logs/backfill.log` use a `RotatingFileHandler`
(**5 MB per file, 5 backups**, ~30 MB cap each). Logs no longer grow
unbounded; old data rolls off automatically as `*.log.1` … `*.log.5`.

### ⚠️ Scheduling is a single point of failure (SPOF)

The daily ingest is scheduled with **launchd** (or cron) on a single Mac.
**launchd does NOT run while the Mac is asleep, shut down, or offline.** If the
machine is off at 02:00, that day's run is simply missed — there is no catch-up
and no alert (the alerting only fires when a run *executes* and fails).

For **guaranteed** daily runs, host the pipeline in the cloud — e.g. a
**GitHub Actions** scheduled workflow (`on: schedule: cron`) running
`python -m pipeline.ingest` with `DATA_HUB_SHEET_ID` /
`DATA_HUB_ALERT_WEBHOOK` / the service-account key supplied as repository
secrets. That removes the always-on-Mac dependency. *(This is documented as
the recommended hardening — Track B — and is not yet built.)*

---

## 4. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| **No new articles today** (`recent_articles` warning) | Pipeline didn't run; an RSS feed URL changed; a source is down | Check `logs/ingest.log` for the latest run and `ERROR` lines. Verify the feed URL in `config/sources.yaml` still resolves (`curl -I <feed>`). If the source is down, it will recover on its own; if the URL moved, update `sources.yaml`. |
| **Articles missing categorization** (`data_quality` flags Region/AEO) | Categorizer error or an input field the categorizer couldn't map | Check `logs/ingest.log` for categorizer warnings. Review `processors/categorizer.py` rules against the new content. Re-run the pipeline after fixing. |
| **Google Sheets quota exceeded** | Too many write/read calls (e.g. backfill + daily + frequent health checks) | Batch writes (the exporter already appends in one call per run); reduce health-check frequency; space out backfills. Quotas reset per 100s window and per day. |
| **Auth / credentials error** (health check `critical`) | `config/google-credentials.json` missing/expired, or the sheet isn't shared with the service account | Confirm the credentials file exists and is valid (see `docs/GOOGLE_SHEETS_SETUP.md`). Share the target sheet with the service account's `client_email` as Editor. |
| **Web scrape returns nothing** | The site's HTML changed; selectors no longer match | Inspect the page, update the `selectors` (article/title/link) in `config/sources.yaml`, then test that source's collector in isolation (§6). |
| **`log not found` in health check** | Pipeline never ran, or `logs/` was wiped | Confirm the cron job is installed (`crontab -l`) and the wrapper is executable. Run the pipeline manually once (§7) to recreate the log. |

---

## 5. Routine Maintenance

### Weekly
- Review categorization accuracy: sample ~10 recent rows in the **Articles**
  tab and confirm Region, Spirits Type, Primary Category, Trend Signals, and
  AEO Value look right. Adjust `processors/categorizer.py` if a pattern is
  consistently miscategorized.
- Skim `logs/ingest.log` for recurring per-source errors.

### Monthly
- Check source health: confirm every source in `config/sources.yaml` is still
  contributing (the `recent_articles` total should keep climbing). Retire or
  fix any source that has produced nothing for weeks.

### Quarterly
- Run a historical backfill to capture newly added sources:
  `./scripts/run_backfill.sh` (writes to the separate **Historical_Backfill**
  tab — never the daily Articles tab). For deep history, the backfill also
  crawls XML sitemaps (`backfill_sources` in `config/sources.yaml`, `api_type:
  sitemap`) via the `SitemapCollector`, which reaches back YEARS using each
  article's `<lastmod>` date — far beyond the ~1 month RSS exposes. Sitemaps
  are backfill-only; the daily ingest deliberately skips them.
- Audit the full source list against the prioritization matrix in `research/`;
  add high-value sources and prune dead ones.

---

## 6. Content Verticals & Adding a New Source

### Content verticals (the on/off switch)

The hub collects six selectable content verticals: **wine, spirits, food,
lifestyle, travel, hospitality**. Which ones are collected is controlled in
`config/sources.yaml` under `collection_config:`:

```yaml
collection_config:
  enabled_verticals: [wine, spirits, food, lifestyle, travel, hospitality]
```

- Every source carries a `vertical:` tag and an `enabled:` flag. Both
  `pipeline/ingest.py` and `pipeline/backfill.py` skip a source when
  `enabled: false`, or when its `vertical` is **not** in `enabled_verticals`.
- **Toggle a vertical** — remove/add it in `enabled_verticals` (e.g. drop
  `travel` to stop all travel sources). The skip is logged.
- **Disable a single source** — set `enabled: false` on that source.
- **Default-safe / backward compatible** — if `enabled_verticals` is absent,
  no vertical filtering is applied (every source builds).
- Each article is stamped with its source's vertical in `primary_category`
  (column K) — no new column. The categorizer keeps a valid preset and only
  runs keyword detection for un-stamped articles. The Dashboard's "by category"
  query therefore shows the six-vertical breakdown automatically.

### Adding a new source

1. **Edit `config/sources.yaml`** — add an entry under the right vertical group
   with a unique `name`, a `vertical:` (one of the six), `enabled: true`, a
   `url`, and an `api_type`:
   - `rss` → also set `rss_feed` (the feed URL).
   - `web_scrape` → also set `selectors` with at minimum `article`, `title`,
     and `link` (entries without full selectors are skipped on purpose).
   - `sitemap` (backfill-only) → add under the top-level `backfill_sources:`
     block with a `sitemap_url` (and optional `sitemap_child_pattern`).
2. **Add selectors (scrape only)** — open the listing page in a browser, find
   the CSS selectors for the article container, headline, and link, and fill in
   the `selectors` mapping.
3. **Test the collector in isolation** before wiring it into the nightly run:
   ```bash
   source venv/bin/activate
   python -c "from collectors.rss_collector import RSSCollector; \
       print(RSSCollector(name='X', feed_url='<feed>').collect()[:2])"
   ```
   (Use `WebScraper(name=..., listing_url=..., selectors=...)` for scrape sources.)
4. **Run the pipeline once manually** (§7) and confirm the new source appears in
   the run summary's `sources_run` and that its rows land in the Articles tab.
5. Run the health check to confirm overall health is still `healthy`.

---

## 7. Accessing the Data

- **The SQLite DB (`data/content_hub.db`) is the system of record.** Query it
  directly for analysis/time-series:
  ```bash
  sqlite3 data/content_hub.db "SELECT COUNT(*) FROM articles;"
  sqlite3 data/content_hub.db \
    "SELECT primary_category, COUNT(*) FROM articles GROUP BY 1 ORDER BY 2 DESC;"
  ```
  Or from Python via the `ArticleStore` interface
  (`store.query(...)`, `store.count(...)` in `storage/article_store.py`).
- **The Google Sheet** is a **read-only mirror/view** for humans + dashboards.
  Open it at `https://docs.google.com/spreadsheets/d/<DATA_HUB_SHEET_ID>/edit`
  (the id is whatever you set in `DATA_HUB_SHEET_ID` / the cron entry).
- **Tabs:**
  - **Articles** — the daily-ingested, deduplicated, categorized rows (columns
    A:O, order owned by `SheetsExporter.COLUMNS`).
  - **Historical_Backfill** — historical seed rows from `pipeline/backfill.py`,
    kept separate from the daily feed.
  - **Dashboard** — overview views/charts bootstrapped by
    `exporters/dashboard_bootstrap.py`.
  - **Trends** — aggregated trend-signal views.
- **Logs** live in `logs/`:
  - `logs/ingest.log` — daily ingestion (and health-check) output.
  - `logs/backfill.log` — backfill runs.
  - `logs/cron.log` — raw stdout/stderr captured by the cron entry.

---

## 8. Runbook for Failures

### The daily run failed (or didn't happen)

1. Run the health check. If `log_freshness` says the log is stale/missing, the
   nightly job didn't run.
2. Confirm cron is installed: `crontab -l`. Confirm the wrapper is executable:
   `chmod +x scripts/run_ingest.sh`.
3. **Re-run manually:**
   ```bash
   DATA_HUB_SHEET_ID=YOUR_SHEET_ID ./scripts/run_ingest.sh
   ```
   Watch the console + `logs/ingest.log`. The run is idempotent at the article
   level (dedup is by URL/title hash), so re-running is safe — already-present
   articles are dropped by the deduplicator.
4. If it crashes on auth, fix credentials/sharing per §4 and re-run.

### Google Sheets is corrupted or rows look wrong

1. **The Sheet is only a mirror — the DB (`data/content_hub.db`) is the source
   of truth, so a corrupted Sheet is not data loss.** Rebuild the mirror from
   the DB by re-exporting (e.g. `store.query(...)` → `exporter.export_articles`),
   or restore the Sheet from its own version history
   (*File → Version history → See version history*).
2. If only the **Articles** tab is bad, you can clear it and let the daily run
   repopulate going forward (new rows mirror automatically), then optionally
   re-seed history with `./scripts/run_backfill.sh` (writes to
   Historical_Backfill). The DB de-dupes, so nothing is double-counted.
3. If the **header row** was lost, re-add it once with a header-included export
   (the exporter supports `include_header=True`) or paste
   `SheetsExporter.COLUMNS` into row 1 of the Articles tab.
4. After recovery, run the health check and confirm `overall: healthy`.

### A single source keeps failing

The pipeline is fail-soft, so one bad source only loses that source's articles;
the run still completes. Fix the source per §4 (No new articles / Web scrape),
or set `enabled: false` on its entry in `config/sources.yaml` (and add a
one-line `disabled_reason:`) until it's repaired — do not delete the entry, so
it stays documented. Several sources known not to return data are already
disabled this way (broken RSS, JS-rendered scrapers, unimplemented APIs).

### Securing the service-account key

`config/google-credentials.json` grants write access to the sheet and must be
owner-readable only:

```bash
chmod 600 config/google-credentials.json
```

`scripts/install_launchd.sh` and `scripts/verify_sheets_setup.py` enforce this
automatically (fail-soft), but verify it after any restore or re-copy.
