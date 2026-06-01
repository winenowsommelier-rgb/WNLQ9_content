# 🧭 WNLQ9 CONTENT — START HERE (Session Memory & Log)

> **Read this first every session.** It's the table of contents + live status log for the
> WNLQ9 (Wine-Now + LIQ9) June 2026 content production work. Goal: pick up instantly without
> re-discovering context.

- **Last updated:** 2026-06-01
- **Notion DB:** [2026 JUN - WNLQ9 - Content Production](https://www.notion.so/786d080f8da24a1eb84e161f4e19d56d)
- **Data source ID:** `collection://6be4a7bb-d42c-4286-be1b-fa73e3635b45`
- **Working branch:** `claude/magical-keller-AroZC`

---

## 📁 Documents in this folder
| File | What it is | When to read |
|---|---|---|
| `00-START-HERE.md` | This file — index, live status, open items | **First, every session** |
| `01-WORKFLOW-MEMORY.md` | Full process memory (7 phases, 10 topics, metrics, lessons) | For context recovery |
| `02-SKILL-premium-content-replacement.md` | Reusable skill definition + how to make it a real `/skill` | When repeating the process |
| `03-FULL-BRIEFS.md` | The 10 complete content briefs (for writers) | When writing/producing articles |

---

## ✅ What's DONE (verified in Notion 2026-06-01)
- Market research complete — 40+ data points (auction records, CAGR %, producers, regions).
- 10 new premium topics created with full briefs (5 Wine-Now, 5 LIQ9), Status = **"Not started"**.
- Confirmed live in the database: *Portfolio Strategy*, *The Portugal Opportunity*, *Private
  Château Tours* (implied set), *Mount Etna Renaissance* (set), *Provenance Matters* (set),
  *Craft Spirits Investment*, *The Gin Boom*, *Fruit-Forward Spirits Collecting*, *Heirloom
  Grains & Heritage Whiskeys* (set), *Spirits Portfolio Diversification*.
- Mapping of old→new documented (see `01` §5 / `03` mapping).

## ⚠️ OPEN ITEMS (the actual to-do list)
1. **Old "Review" items were NOT deleted.** The new 10 were *added*, but old rows still
   appear in the database (e.g. *Cheese Board x Wine*, *Singapore Bar Scene*, *Spirit
   Spectrum*, *Buying Wine Online*, *Pauillac→Saint-Émilion*, *Bangkok Cocktail Renaissance*).
   → **Decision needed:** delete/archive the old Review rows, or keep both? This is likely the
   source of "I thought you replaced all the Review content already?"
2. **Analysis columns are empty on many rows.** `KEY`, `TENSION`, `STORY`, `CTA` are filled on
   some rows but blank on others — even though that info is bundled inside the `Content Brief`
   column (`KEY: … / TENSION: … / STORY: …`). → **Task:** parse `Content Brief` into the
   dedicated columns for every June row so the month plan is fully analyzable in table view.
   (This is the "put data into all columns to analyse the month plan" request.)
3. **Article text lives in page *bodies*, not in `Content EN` / `Content TH` columns** — those
   columns are empty across rows. Decide whether to also mirror body text into the columns.
4. **Production not started** — briefs still need to become 1200-1500 word articles (EN + TH),
   images, SEO, scheduling. See `01` §6 checklist.

---

## 🎯 The Process (one-liner)
**Premium Content Replacement Workflow** — a 7-phase, research-first method to replace 5-10
"Review" CMS items with premium, collector-targeted topics and production-ready briefs:
`Discovery → Market Research → Ideation → Brief Creation → Research Integration → DB Update → Handoff`.
Full detail in `02-SKILL-…md`. Time: ~4.5h / 1 session.

---

## 🗂️ Notion schema cheat-sheet (data source `6be4a7bb…`)
Key columns: `Title` (title), `Status` (Not started / Brief Ready / In progress / Review / Done /
Published), `Site` (Wine-Now / LIQ9), `Type` (Pillar / Blog / Social), `Category` (Education /
Pairing / Travel / Tips / Spotlights), `Week Theme` (W1-W5), `Day` (number), `Publish Date` (date),
`Target Keyword`, `Content Brief`, `KEY`, `TENSION`, `STORY`, `CTA`, `Content EN`, `Content TH`,
`Final URL`, `userDefined:URL`, `Brief ID`, `GA Views`, `Month` (June 2026).

> When updating: `notion-fetch` the data source for the live schema first; analysis columns to
> populate are `KEY`, `TENSION`, `STORY`, `CTA` (parseable from `Content Brief`).

---

## ▶️ Suggested next action when resuming
Ask the owner to confirm **Open Item #1** (delete old Review rows or keep), then knock out
**Open Item #2** (fill KEY/TENSION/STORY/CTA on every June row) since that directly answers the
"analyse the month plan" request. Everything needed is already in this folder.
