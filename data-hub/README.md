# Content Trend Data Hub — User Guide

A fully automated system that collects wine & spirits content from premium
publishers, organizes it, and surfaces trends for **Wine-Now** and **LIQ9** —
feeding SEO/AEO strategy, competitive monitoring, and editorial planning.

It runs itself daily. You mostly just *read the Google Sheet*.

---

## 1. What it does (in one picture)

```
  PREMIUM SOURCES          PIPELINE (runs daily, 2 AM)            YOUR GOOGLE SHEET
  ───────────────          ──────────────────────────            ─────────────────
  Decanter (RSS)      ┐                                          ┌ Articles  (raw feed)
  The Spirits Biz     │    collect → dedupe (within-run          │ Dashboard (overview)
  Punch (scraper)     ├──▶          + against the sheet) ──────▶ │ Trends    (signals)
  Wine Enthusiast     │    → categorize (region, type,           │ Regions
  (+ more configured) ┘      trend signals, AEO value)           │ Brands
                                                                 │ AEO Opportunities
                                                                 └ Editorial
```

Every article is auto-tagged with: **source, title, URL, date, region,
spirits/wine type, trend signals, primary category, buyer persona, AEO value.**

---

## 2. How it's set up (already done — for reference)

| Piece | Where | Status |
|-------|-------|--------|
| Code & pipeline | `/Users/admin/WNLQ9 CONTENT/data-hub/` | ✅ on GitHub |
| Google Sheet | "WNQL9 Content Data Hub" (ID `1c5X9wcg…qJuM`) | ✅ live |
| Credentials | `config/google-credentials.json` (gitignored secret) | ✅ installed |
| Daily scheduler | macOS LaunchAgent `com.wnlq9.datahub.ingest`, 2 AM | ✅ running |
| Sheet ID | baked into the LaunchAgent + run script | ✅ set |

**You don't need to re-do any of this.** It survives reboots and runs unattended.

---

## 3. The daily process (automatic)

Every day at **2:00 AM** the LaunchAgent runs the pipeline:

1. **Collect** — pulls latest articles from each configured source
2. **Dedupe** — removes repeats *within* the run **and** skips anything whose
   URL is already in the sheet (so no duplicates pile up day after day)
3. **Categorize** — tags region, spirits type, trend signals, AEO value, etc.
4. **Export** — appends only the *new* articles to the **Articles** tab
5. **Dashboards** — formulas recompute automatically when you open the sheet

Output of each run is logged to `logs/cron.log`.

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
| Confirm the sheet connection is healthy | `./scripts/verify_sheets_setup.sh` |
| Check the pipeline's health (recent data, logs) | `./scripts/run_health_check.sh` |
| Backfill ~12 months of history (one-time/quarterly) | `./scripts/run_backfill.sh --months-back 12` |
| See the scheduled job | `launchctl list \| grep datahub` |
| Trigger the scheduled job manually | `launchctl kickstart gui/$(id -u)/com.wnlq9.datahub.ingest` |
| Read the run log | `tail -f logs/cron.log` |

---

## 6. Common tasks

**Add a new source**
1. Edit `config/sources.yaml` (copy an existing entry).
2. RSS source → set `api_type: rss` + `rss_feed:`.
   Scrape source → set `api_type: web_scrape` + a `selectors:` block
   (`article` / `title` / `link`). Note: JS-heavy sites (Wongnai, Difford's)
   need a headless scraper — not yet built.
3. Test: `./scripts/run_ingest.sh` and check it appears.

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

Full troubleshooting + maintenance schedule: **`docs/OPERATIONS.md`**.
Dashboard formula reference: **`docs/DASHBOARD_GUIDE.md`**.

---

## 8. Mental model (TL;DR)

> **It's a robot that reads the wine/spirits press every night and files
> everything into your spreadsheet, pre-sorted by trend, region, and
> content opportunity. Your job is to open the sheet and decide what to
> write about.**
