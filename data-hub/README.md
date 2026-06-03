# Content Trend Data Hub — User Guide

A fully automated system that collects wine & spirits content from premium
publishers, organizes it, and surfaces trends for **Wine-Now** and **LIQ9** —
feeding SEO/AEO strategy, competitive monitoring, and editorial planning.

It runs itself daily. You mostly just *read the Google Sheet*.

---

## 1. What it does (in one picture)

```
  PREMIUM SOURCES        PIPELINE (runs daily, 2 AM)        SQLITE DB              GOOGLE SHEET (mirror)
  ───────────────        ──────────────────────────        ──────────────         ─────────────────────
  Decanter (RSS)      ┐                                     data/content_hub.db   ┌ Articles  (raw feed)
  The Spirits Biz     │  collect → dedupe (within-run)      ┌────────────────┐    │ Dashboard (overview)
  Punch (scraper)     ├▶ → categorize (region, type,   ───▶ │ articles table │──▶ │ Trends    (signals)
  Whisky Advocate     │    trend signals, AEO value)        │ (system of     │    │ Regions
  (+ more configured) ┘                                     │  record + dedup)│    │ Brands
                            DB upsert is the cross-run       └────────────────┘    │ AEO Opportunities
                            dedup; only NEW rows mirror                            └ Editorial
                            to the Sheet (no full read).
```

**Architecture (source of truth):** the SQLite database
`data/content_hub.db` is now the **system of record**. Each run writes new
articles to the DB *first* (deduping against an indexed `url_normalized`
column — no more reading the whole Sheet), then **mirrors only the
newly-inserted rows** to Google Sheets so the dashboards keep updating with no
duplicates. The Sheet is a **read-only mirror/view**, not the store. If the
Sheets API ever fails, the data is already safe in the DB. Swapping SQLite for
Supabase/Postgres later is a drop-in: implement the same `ArticleStore`
interface (`storage/article_store.py`) and inject it — nothing else changes.

Every article is auto-tagged with: **source, title, URL, date, region,
spirits/wine type, trend signals, primary category, buyer persona, AEO value.**

---

## 2. How it's set up (already done — for reference)

| Piece | Where | Status |
|-------|-------|--------|
| Code & pipeline | `/Users/admin/WNLQ9 CONTENT/data-hub/` | ✅ on GitHub |
| SQLite DB (system of record) | `data/content_hub.db` (gitignored) | ✅ auto-created |
| Google Sheet (mirror/view) | "WNQL9 Content Data Hub" (ID `1c5X9wcg…qJuM`) | ✅ live |
| Credentials | `config/google-credentials.json` (gitignored secret) | ✅ installed |
| Daily scheduler | macOS LaunchAgent `com.wnlq9.datahub.ingest`, 2 AM | ✅ running |
| Sheet ID | baked into the LaunchAgent + run script | ✅ set |

**You don't need to re-do any of this.** It survives reboots and runs unattended.

---

## 3. The daily process (automatic)

Every day at **2:00 AM** the LaunchAgent runs the pipeline:

1. **Collect** — pulls latest articles from each configured source
2. **Dedupe** — removes repeats *within* the run
3. **Categorize** — tags region, spirits type, trend signals, AEO value, etc.
4. **Store (system of record)** — upserts into the SQLite DB
   (`data/content_hub.db`). The DB's indexed `url_normalized` column **is** the
   cross-run dedup: anything already stored from a prior run is skipped — no
   full-Sheet read needed, so it scales past the Sheets cell ceiling.
5. **Mirror** — appends only the *newly-inserted* articles to the **Articles**
   tab (so no duplicates pile up day after day). This happens *after* the DB
   write, so a Sheets/API hiccup never loses data.
6. **Dashboards** — formulas recompute automatically when you open the sheet

Output of each run is logged to `logs/cron.log`.

> **First-time cutover:** if you already have rows in the Sheet from before the
> DB existed, import them once with `./scripts/migrate_sheet_to_db.sh` (reads
> the `Articles` + `Historical_Backfill` tabs into the DB; idempotent — safe to
> re-run, dupes are skipped by normalized URL).

---

## 4. How to USE it (your day-to-day)

Almost everything is in the Google Sheet. Open it and read the tabs:

- **Dashboard** — totals, date range, # of high-AEO articles. Your at-a-glance health view.
- **AEO Opportunities** — the top high-value articles AI engines are likely to
  cite. *Use this to pick what content to create* for Wine-Now / LIQ9.
- **Editorial** — trend-carrying, high-AEO topics. *Your content-calendar feed.*
- **Trends** — how often each trend signal appears (scarcity, celebrity_tie,
  emerging_region, etc.) + a 6-month heatmap. *Spot what's heating up.*
- **Regions** — which wine/spirits regions are getting coverage.
- **Brands** — mention counts + "last mentioned" for key brands (Macallan,
  Bordeaux, Hibiki…). *Early-warning radar for competitor/brand momentum.*
  Add/remove brands by editing column A on that tab.

That's the main loop: **the system fills the sheet; you read trends and plan content.**

---

## 5. Useful commands (only when you want them)

Run from `/Users/admin/WNLQ9 CONTENT/data-hub`. All need the venv + sheet ID:

```bash
cd "/Users/admin/WNLQ9 CONTENT/data-hub"
source venv/bin/activate
export DATA_HUB_SHEET_ID="1c5X9wcgBivLKVarNl0md0XgpnzE-zpPHhpsFiFmqJuM"
```

| I want to… | Command |
|------------|---------|
| Run a collection *right now* (don't wait for 2 AM) | `./scripts/run_ingest.sh` |
| Import existing Sheet rows into the DB (one-time cutover) | `./scripts/migrate_sheet_to_db.sh` |
| Confirm the sheet connection is healthy | `./scripts/verify_sheets_setup.sh` |
| Check the pipeline's health (recent data, logs) | `./scripts/run_health_check.sh` |
| Backfill ~12 months of history (one-time/quarterly) | `./scripts/run_backfill.sh --months-back 12` |
| See the scheduled job | `launchctl list \| grep datahub` |
| Trigger the scheduled job manually | `launchctl kickstart gui/$(id -u)/com.wnlq9.datahub.ingest` |
| Read the run log | `tail -f logs/cron.log` |

---

## 6. Common tasks

**Content verticals (wine, spirits, food, lifestyle, travel, hospitality)**

Every source is tagged with a `vertical:` and an `enabled:` flag. The pipeline
only collects sources whose vertical is switched on. The switch lives in
`config/sources.yaml` under `collection_config:`:

```yaml
collection_config:
  enabled_verticals: [wine, spirits, food, lifestyle, travel, hospitality]
```

- **Turn a vertical off** — delete it from `enabled_verticals` (e.g. drop
  `travel` to stop collecting all travel sources). Add it back to re-enable.
- **Disable one source** — set `enabled: false` on that source in `sources.yaml`
  (it's skipped even if its vertical is on).
- **Backward compatible** — if you remove the `enabled_verticals` line
  entirely, no vertical filtering is applied and every source builds.

Each article is tagged with its source's vertical in the `primary_category`
column (column K), so the Dashboard's "by category" breakdown shows the
six-vertical split automatically — no new column needed. (For un-tagged or
manually-entered articles, the categorizer falls back to keyword detection.)

**Thailand focus (cross-vertical geo tag)**

Geo-relevance cuts ACROSS the six verticals — it is **not** a vertical. Every
article gets a **Thailand Focus** value (column P: `high`, `medium`, or blank)
via two paths:

- **Source flag (baseline = `medium`)** — a source with `geo_focus: thailand`
  in `sources.yaml` (e.g. the Bangkok Post and Coconuts Bangkok feeds) tags all
  its articles `medium`, no matter which vertical it feeds. `medium` means
  "from a Thai outlet / locally relevant, but not explicitly about Thailand" —
  a Thai source carries plenty of off-topic content (e.g. national politics),
  so source membership alone is **not** treated as `high`.
- **Keyword / Thai-script detection (upgrade to `high`)** — any article from
  any source is tagged `high` when a Thailand/Bangkok/Phuket/etc. signal (or
  Thai script) appears in the title or URL, and `medium` when it's only in the
  body or a weaker regional cue (`southeast asia` / `baht`) appears. A keyword
  match **upgrades** a Thai-source `medium` baseline to `high`; the detector
  never downgrades an existing `medium`/`high`.

Net semantics:

| Source | Thailand keyword? | Thailand Focus |
| --- | --- | --- |
| `geo_focus: thailand` | yes | `high` |
| `geo_focus: thailand` | no  | `medium` |
| any other source | yes (title/URL) | `high` |
| any other source | no  | blank |

This keeps `high` precise — it means an article genuinely *about* Thailand —
so the Thailand dashboard isn't polluted by off-topic articles that merely came
from a Thai outlet.

A dedicated **Thailand** dashboard tab lists every Thailand-focused article
across all verticals. To make a non-Thai source Thailand-focused, add
`geo_focus: thailand` to its entry in `sources.yaml`.

**Add a new source**
1. Edit `config/sources.yaml` (copy an existing entry).
2. Set `vertical:` (one of the six) and `enabled: true`.
3. RSS source → set `api_type: rss` + `rss_feed:`.
   Scrape source → set `api_type: web_scrape` + a `selectors:` block
   (`article` / `title` / `link`). Note: JS-heavy sites (Wongnai, Difford's)
   need a headless scraper — not yet built.
4. Test: `./scripts/run_ingest.sh` and check it appears.

**Track a new brand** — type the brand name into column A of the **Brands** tab. The formulas fill down automatically.

**Stop / restart the daily job**
```bash
# stop
launchctl bootout gui/$(id -u)/com.wnlq9.datahub.ingest
# start again
./scripts/install_launchd.sh
```

---

## 7. If something looks wrong

| Symptom | Check |
|---------|-------|
| No new rows for days | `tail logs/cron.log` — a feed may have changed or the Mac was asleep at 2 AM |
| Dashboard counts look off | Make sure row 1 of **Articles** is the header (`Source, Title…`) |
| "403" on a run | Sheet sharing — confirm shared with `data-hub-exporter@content-trend-data-hub.iam.gserviceaccount.com` (Editor) |
| Auth error | Credentials — re-run `./scripts/verify_sheets_setup.sh` |

**Alerts & reliability**

- **Failure alerts** — set `DATA_HUB_ALERT_WEBHOOK` to a Slack-compatible
  incoming webhook URL and any failed ingest/backfill or `critical` health
  check posts a message there (plus a macOS notification). Unset → it just
  logs. The pipeline also now **exits non-zero** when a run has errors, so the
  scheduler can tell a real failure from a clean run.
- **Logs are size-capped** — `logs/ingest.log` / `logs/backfill.log` rotate at
  5 MB × 5 backups, so they can't fill the disk.
- **⚠️ The 2 AM run is a single point of failure.** launchd does **not** run
  while the Mac is **asleep or off** — a missed slot is simply skipped (no
  catch-up, no alert). For guaranteed runs, host the pipeline in the cloud
  (e.g. a GitHub Actions scheduled workflow). See `docs/OPERATIONS.md` §3.

Full troubleshooting + maintenance schedule: **`docs/OPERATIONS.md`**.
Dashboard formula reference: **`docs/DASHBOARD_GUIDE.md`**.

---

## 8. Mental model (TL;DR)

> **It's a robot that reads the wine/spirits press every night and files
> everything into your spreadsheet, pre-sorted by trend, region, and
> content opportunity. Your job is to open the sheet and decide what to
> write about.**
