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

## ✅ What's DONE — GA4+GSC data-driven refresh (2026-06-01)
**Major pivot:** the 10 premium *investment/collector* topics were found to have **zero search
demand** (GSC) and wrong audience. Ran a full GA4 (90-day landing pages) + GSC (queries) pull
for both sites, then executed a **~50% swap**:
- **29 weak rows → trashed** (no demand / not GA performers / gimmick / luxury-niche). Parked in
  Notion page **"🗑️ Cut from June Plan — 2026-06-01"** (`3729d75a-e4b5-81b7-b50f-db779ad9f5e5`),
  recoverable. Includes all 10 premium topics + En Primeur, Pauillac, Wine Journal, Body, Wine
  Faults, Brunch, Pizza/Lambrusco, Cheese Board, Beachfront (WN) and Ocean-Aged, Tasmanian,
  Distillery Tourism, Vodka, Organic-spirits, Savory Cocktails, Post-Massage, Cigar, Infinity
  Bottle, Japanese Gin/Yuzu (LIQ9).
- **29 new demand-driven rows created** (14 WN + 15 LIQ9), each fully populated (Title, Site,
  Type, Category, Week, Status=Not started, Target Keyword, KEY/TENSION/STORY, CTA, Content
  Brief + body outline). Themes: most-expensive-wine (~60K imp), champagne/sparkling (~60K),
  mainstream brands (Mondavi/Mouton Cadet/Penfolds), beginner TH education, grape guides (WN);
  VSOP cognac, whisky 101, whisky/gin/tequila buying guides, Thai spirits, cocktails (LIQ9).
- **25 keep rows completed:** parsed `Content Brief` → filled KEY/TENSION/STORY/CTA columns,
  fixed Category mismatches (e.g. Tannin Pairing→Education, Why-Every-Gin Travel→Education),
  set Status → **Brief Ready**.

➡️ **Net active plan = 54 rows (25 keep + 29 new), ALL columns complete.** Mapping in `01` §5 is
now superseded by this GA/GSC swap.

## ⚠️ OPEN ITEMS (the actual to-do list)
1. **Production not started** — briefs are now complete; next is writing 1200-1500 word articles
   (EN + TH) into page bodies / `Content EN`·`Content TH`, images, SEO, scheduling. Two rows
   already have full Thai copy (*Rosé Myths*, partial others) as the style reference.
2. **Body outlines** exist on the 29 new rows; the 25 keep rows have complete briefs in columns
   but blank bodies — add production outlines (H2/FAQ/meta) if desired before writing.
3. **Trash bin cleanup** — the connector can't reach system Trash, so cut rows live in the
   "🗑️ Cut from June Plan" page. Empty it manually in Notion when confident.

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
