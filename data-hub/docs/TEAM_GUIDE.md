# Content Trend Data Hub — Team Guide

A robot that reads the premium **wine, spirits, food, lifestyle, travel &
hospitality** press every day and files everything into a database + Google
Sheet — pre-sorted by region, trend, brand, AEO value, and Thailand relevance —
so the team knows **what the market is doing and what to publish next** for
Wine-Now & LIQ9.

---

## 1. The process (how it works)

```
 25 premium sources        Pipeline (daily 2 AM, automatic)         Outputs
 ─────────────────         ─────────────────────────────────       ───────────────
 Decanter, Liv-ex,    ┐                                            ┌ SQLite DB
 Drinks Business,     │   1. COLLECT   pull latest articles        │ (source of truth)
 VinePair, Whisky     │   2. DEDUPE    drop repeats (vs DB)        │
 Advocate, Punch,     ├─▶ 3. CATEGORIZE region/type/signals/       ├▶ Google Sheet
 Bangkok Post, Robb   │      AEO/persona/Thailand                  │ (8 dashboard tabs,
 Report, Skift, ...   ┘   4. STORE (DB)  5. MIRROR (Sheet)         └  auto-refresh)
```

Two extra layers:
- **Quarterly deep backfill** (automatic, 1st of Jan/Apr/Jul/Oct) — crawls
  source sitemaps for ~12 months of history.
- **Agent enrichment** (on-demand) — upgrades keyword tags to LLM-quality
  (real summaries, accurate regions). No API key; uses Claude agents.

## 2. Setup — already done; the team runs nothing

| Piece | Status |
|-------|--------|
| Code, DB, pipeline | ✅ on GitHub, running |
| Google Sheet (the team's window) | ✅ live & shared |
| Daily 2 AM job + quarterly backfill | ✅ scheduled, reboot-proof |
| Credentials | ✅ installed (rotated, secured) |

**The team only needs view access to the Google Sheet.** No software, no
commands. (The daily job runs on the host Mac, so it must be **awake at 2 AM**;
for guaranteed runs, move to cloud hosting — a documented future step.)

## 3. What it produces

**Every day (automatic):** ~50–200 new articles collected, deduped, tagged,
appended to the **Articles** tab; all dashboards recompute on open; a run log +
failure alert if anything breaks.

**The 8 tabs the team reads:**

| Tab | Use it to… |
|-----|-----------|
| **Dashboard** | totals, date range, # high-AEO at a glance |
| **AEO Opportunities** | pick **what content to create** (articles AI engines will cite) |
| **Editorial** | your **content-calendar feed** (trend-carrying, high-value topics) |
| **Trends** | spot **what's heating up** (signals + 6-month heatmap) |
| **Regions** | which wine/spirits regions are getting coverage |
| **Brands** | competitor/brand **mention radar** (edit column A to track any brand) |
| **Thailand** | everything **Thailand-relevant** across all verticals |
| **Historical_Backfill** | ~12 months of history for baselining |

**The team loop:** open the sheet 2–3×/week → read **Trends + AEO + Editorial**
→ decide what to write → hand to the blog writer.

## 4. Who does what

- **Content/marketing team:** read the Sheet, pick topics, plan the calendar.
  No technical work.
- **Operator (you):** occasionally run `./scripts/run_health_check.sh`; trigger
  an on-demand collection/enrichment if wanted (see `README.md` commands).
- **Claude (on request):** run agent enrichment, add/remove sources, build new
  views, fix issues.

## 5. Controls (operator)

- **Turn a content vertical on/off:** edit `enabled_verticals` in
  `config/sources.yaml`.
- **Add/disable a source:** add an entry / set `enabled: false`.
- **Track a brand:** type it into column A of the **Brands** tab.
- **Upgrade tagging quality:** `./scripts/enrich_with_agents.sh prep` → run the
  `enrich-articles` workflow → `./scripts/enrich_with_agents.sh merge --remirror`.

Full operations + troubleshooting: `docs/OPERATIONS.md`. Architecture &
commands: `README.md`.
