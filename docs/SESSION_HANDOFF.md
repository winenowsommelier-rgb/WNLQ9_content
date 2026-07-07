# WNLQ9 — Session Handoff & Subsystem Map

**Last updated:** 2026-07-07 (end of July 2026 full production run).
**Authoritative docs win:** [`CLAUDE.md`](../CLAUDE.md) and
[`docs/RUNBOOK.md`](RUNBOOK.md) are the source of truth. This file maps the
subsystems and carries the live session state for the next Claude Code session.

---

## 0) NEXT SESSION KICKOFF — August 2026 production run

**Pick this up at the start of the next session.** July is fully done. August is up.

### Current state (end of 2026-07-07 session)

**July 2026 — COMPLETE (63 articles, all delivered)**
- Jul 1–7: 17 articles ✅ | Jul 8–14: 15 articles ✅ | Jul 15–31: 31 articles ✅
- All HTML masters committed on branch `claude/festive-dirac-QcgOV`
- All 63 Drive files uploaded to **"2026-07 July"** folder `1AnwiLYQx8BeZmKDUzHqW5Y-XEQVXgO2u`
  with **brand-prefixed date-first naming**: `WN-YYYY-MM-DD-slug.html` / `LQ-YYYY-MM-DD-slug.html`
- All 63 Notion rows in **"2026 JUL - WNLQ9 - Content Production"** board set
  `Status = "Brief Ready"` + `Drive file URL` pointing to the brand-prefixed files
- ⚠️ Drive folder also contains ~120+ old/duplicate files from earlier upload rounds —
  user to manually delete any file that does NOT start with `WN-` or `LQ-`

**Product feed** — `pipeline/data/products.json` rebuilt 2026-06-28 from live Supabase BI
(`public.products`, `dsyplzckfezcxiuikkfm`). 246 in-stock SKUs. Re-confirm prices at build —
they shift monthly.

**Branch** — all July work lives on `claude/festive-dirac-QcgOV`. Ship to prod by branching
from `main`, copying deliverables in additively, PR + merge (per `CLAUDE.md §Git`).

---

### August kickoff checklist

1. **Read** `docs/CONTENT_PLAN_AUGUST_2026.md` (28-piece slate) and
   `docs/CONTENT_PLAN_AUGUST_2026_BRIEF.md` (intelligence table + funnel map).

2. **Create the August Drive folder** under root `1CKAXssXrvhGPjxa9hBMxdk-yXv0qygpm`:
   name it `2026-08 August`. Use `mcp__a15357b9__create_file` with type `application/vnd.google-apps.folder`.
   Save the returned folder id — you'll use it for all August uploads.

3. **Confirm the August Notion board exists** and get its data source URL.
   The board is named "2026 AUG - WNLQ9 - Content Production". Use `notion-search` to find it.

4. **Author articles in publish-date order**, same per-article workflow as July:
   - Write full Thai HTML in `pipeline/public/content/<slug>.html`
   - Use `wn-article.css` (WN) or `lq-article.css` (LQ) — already global in `assets/`
   - Validate: H1 == Article JSON-LD headline, on-page FAQ mirrors FAQPage JSON-LD,
     real in-stock `data-sku` chips with `~฿` price from feed, Sarabun + Raleway fonts,
     16:9 `.figph` aspect-ratio holders, 3 JSON-LD blocks
   - Commit to branch, then export Magento fragment (strip doctype/html/head/body,
     all `<script>`+`<link>` tags, `.wn-top`/`.lq-top` nav, `.wn-arthead`/`.lq-arthead`)
   - **File naming for Drive: `WN-YYYY-MM-DD-slug.html` or `LQ-YYYY-MM-DD-slug.html`**
     (date-first, brand-prefixed — learned from July)
   - Upload to August Drive folder via `create_file`
   - Update Notion row: `Status = "Brief Ready"`, `Drive file URL` = new file URL

5. **August tentpole cluster** = Mother's Day run-up Aug 8–12:
   WN-S9 (rosé) → WN-S8 (moscato) → WN-H1 (gift guide) → WN-H2 (family-table pairing) → WN-H4 (Opus One).
   Prioritize this cluster if behind schedule.

6. **LIQ9 whisky hub-and-spoke** = LQ-H1 Whisky 101 hub ← LQ-S1 regions, LQ-S2 malt-vs-blend,
   LQ-S3 highball, LQ-S4 Japanese, LQ-H2 Macallan 18 collector. Author hub first.

7. **SKU verify-at-build flag**: Robert Mondavi SKU (WN-S5) — check `products.json` at build time;
   if OOS, education-led 0-cards + LINE CTA only.

8. **No fabricated facts** — all prices from the feed, no critic scores in data-viz bars
   (use tasting-desk sensory ratings only), verify-list for any claim you can't source.

### Key IDs for August
| Thing | ID |
|---|---|
| Drive root "WNLQ9 Blog Html center" | `1CKAXssXrvhGPjxa9hBMxdk-yXv0qygpm` |
| July Drive folder (done, read-only) | `1AnwiLYQx8BeZmKDUzHqW5Y-XEQVXgO2u` |
| August Drive folder | **Create fresh** — save the id |
| July Notion board data source | `collection://d342f9b8-3725-4068-9ccb-03b09821b0c8` |
| Notion `Drive file URL` property type | `url` (NOT `userDefined:` prefix) |

### Drive MCP known limitations (avoid repeating July's mistakes)
- **No rename tool** — use `copy_file(fileId, title: "new-name", parentId)` to rename-via-copy
- **No delete tool** — duplicates accumulate; user cleans manually in Drive UI
- **`list_recent_files` / `search_files` unreliable** — use `get_file_metadata` on the folder to verify uploads
- **Name files correctly on first upload** — `BRAND-YYYY-MM-DD-slug.html` from the start avoids the rename round
- **Run parallel upload workflow + separate Notion-update workflow** — don't rely on a single combined workflow surviving context compaction

---

## 0b) Live state notes (2026-06-04 session)

- **July board EXISTS** in Notion: `2026 JUL - WNLQ9 - Content Production`
  id `93ac15a8-bb65-40f7-b357-b8cabd336214`, data source
  `collection://d342f9b8-3725-4068-9ccb-03b09821b0c8`. Note its link property is
  **`Final URL`** (url type) — it has **no `Drive file URL` property** like June did.
  Strategy doc calls July "batch-created Jun 2, generic, differentiation dropped."
  July HTML is **not authored yet** (only planned rows).
- **Two Drive folders now exist** under "WNLQ9 Blog Html center"
  (`1CKAXssXrvhGPjxa9hBMxdk-yXv0qygpm`):
  - `WNLQ9 Magento-Ready (scoped)` `1G8YX_IsFvv9VrvFiHT-HsPElerYv9AZM` — the OLD messy
    ~95-file June folder (dupes + the broken 2KB day8).
  - `WNLQ9 Magento-Ready Version` `1JBuRFDzO2UFZdQRO5LRzSzueNwgKZS4O` — a CLEAN set of
    **52 files, one per slug** (re-uploaded 2026-06-03 23:23→00:18). ⚠️ Contents are the
    **June** slugs (day1-most-expensive-wines … liq9-day30-…), despite "Version" naming —
    so this is the clean June deliverable, NOT July.
- **Real-URL access confirmed** (GSC + GA4 authenticated via Supermetrics). Inventory +
  cannibalization map saved to [`docs/REAL_URL_INVENTORY.md`](REAL_URL_INVENTORY.md).
  Key: Wine-Now has ~300 live indexed URLs (deep link graph); **LIQ9 is thin (homepage
  only indexed)**; new monthly articles overlap existing live rankers (e.g. new
  most-expensive-wines vs the live 150k-impression page).

### July de-dup APPLIED to Notion (2026-06-04)
Per `docs/JULY_DEDUP_PLAN.md` (user-approved). **18 rows edited, non-destructive:**
- **4 repurposes** (dup/twin → premium cluster, properties rewritten incl. Title/brief,
  old-topic drafts cleared, `REPURPOSED 2026-06-04` marker): Organic&Biodynamic →
  **Icon-Producer Spotlight**; Khao-Yai-Rainy → **Prestige Champagne**; 6-Bottles-Serious →
  **Rare/Collectible Whisky**; 3-Bottles-Round-Out → **Luxury Cognac**.
- **14 sharpen directives** inserted into the (blank) row bodies pinning a distinct angle +
  cross-links: Champagne 101, Bangkok New Wine Bars, Wine-Tasting-Beginners, Read-a-Label,
  Som Tam, Street-Food (re-angled→grilled/BBQ), 2× wine glasses, Tequila-with-Thai,
  Scotch 101, 5 Scotch Regions, Bangkok Cocktail Bars, World Rum Day, Ultimate Rum Guide.
- **Premium canonicals kept:** Fine-Wine Cellar (Hero), Collector's Bar, 5-Best-Value Home Bar.
- **Deferred to HTML build:** swap guessed June URLs → real live URLs
  (`REAL_URL_INVENTORY.md`); expand Standard **stub drafts → v2 full depth**; add a
  value→premium real-SKU pair per Education/listicle row.

### Folder-naming convention (going forward — per user 2026-06-04)
Each month, upload that month's CLEAN set (one copy per slug, no dupes, no broken files)
into a **new subfolder named `YYYY-MM <Month>`** (e.g. `2026-07 July`) inside
"WNLQ9 Blog Html center". One month = one subfolder. Because Drive MCP can't overwrite/
delete, never re-upload into a live month folder — make the clean set first, upload once.
Recommend renaming `WNLQ9 Magento-Ready Version` → `2026-06 June` and deleting the
`(scoped)` folder once the Notion sweep points at the clean ids.

---

## 1) The repo has three subsystems — don't conflate them

| Subsystem | What it is | Stack | Data source | Deployed? |
|---|---|---|---|---|
| **`pipeline/`** | The **live** Option-B content ops console (author Thai HTML, push, Notion/Drive). | Node `.mjs`, static `public/` | Notion (read) + repo files | ✅ **YES** — Vercel `seodashboard`, root `pipeline/`, branch `main`. |
| **`dashboard/`** | Newer SEO/brief-planning UI (calendar, brief editor, GA4/GSC tables). | Next.js 16.2.6, React 19, Tailwind 4, TS | **CSV import + localStorage + Notion + Slack** | ❌ **NO live deploy** (its Vercel project `seo-dashboard` is a dead-dup, always ERROR). |
| **`data-hub/`** | Nightly wine/spirits press collector → trend tagging → dashboards. | Python (collectors→processors→exporters) | **SQLite `data/content_hub.db` → Google Sheets mirror** | ❌ Runs locally (macOS LaunchAgent, 2 AM). No cloud host. |

`CLAUDE.md` / `RUNBOOK.md` describe **only `pipeline/`**. `dashboard/` and
`data-hub/` are real and actively worked (recent commits are `data-hub`
beverage-relevance + agent enrichment) but were previously undocumented at the
top level — that gap is what this file fills.

---

## 2) Verified infra state (2026-06-03)

**Vercel** (team `winenowsommelier-rgbs-projects` / `team_pPQBZ8bFjr493T1hG6IEjeaI`):

| Project | Latest deploy | Verdict |
|---|---|---|
| `seodashboard` (`prj_Gqo7…`) | ✅ **READY** (production) | The live tool. Root `pipeline/`. **No fix needed.** |
| `seo-dashboard` (`prj_ziXzs…`) | ❌ ERROR | Dead duplicate — ignore (per `RUNBOOK.md` §1). |
| `wnlq-9-content-seo` (`prj_LfGum…`) | ❌ ERROR | Dead duplicate — ignore. |

**Supabase** (org `jxrteyibjaoadpzqfdbm`) — three projects exist; **none are wired
into `pipeline/` or `dashboard/` runtime code**:

| Project | ID | Status | Role |
|---|---|---|---|
| WNLQ9 PI DB | `dsyplzckfezcxiuikkfm` | ACTIVE_HEALTHY | The "optional/dormant" one named in `RUNBOOK.md` §1. |
| WNLQ9 SEO Automation | `asnarjokyedupsjipzkl` | ACTIVE_HEALTHY | GSC/GA4 daily pipeline (separate from this repo's app code). |
| WNLQ9 Intelligence Engine | `xfcvliyxxguhihehqwkg` | INACTIVE | — |

---

## 3) Corrections to the earlier verbal handoff

The prior session handoff was written against a stale mental model. For the record:

- ❌ "Fix the Vercel deploy: set `seo-dashboard` Root Directory = `dashboard`."
  → The **live** project is `seodashboard` (root `pipeline/`) and it is **already
  deploying READY**. `seo-dashboard` is a dead duplicate `CLAUDE.md`/`RUNBOOK.md`
  say to ignore. **No Vercel change is required.**
- ❌ "`main/dashboard` uses Supabase `asnarjokyedupsjipzkl`."
  → `dashboard/` has **no Supabase code at all** — only CSV (`lib/csv.ts`),
  `localStorage` (`lib/store.ts`), Notion (`app/api/notion`), Slack
  (`app/api/slack`). `data-hub/` uses **SQLite→Sheets**, not Supabase.
- ❌ "`dashboard/` is *the* real project."
  → The live, deployed project is `pipeline/`. `dashboard/` is an
  un-deployed newer UI.
- ⚠️ Old prototype branches `claude/gifted-pascal-7RHkk` and
  `claude/lucid-bardeen-F6DjC` remain abandoned — do not merge.

---

## 4) Open items (carried forward, not blocking)

- **`data-hub` known bug:** `seo_opportunities` / `seo_regression_alerts` come up
  empty because the detection threshold (≥500 impressions, <2% CTR) is applied
  per-keyword-per-**day**; it needs a 7/28-day rollup before thresholding. (Note:
  this concerns the SEO-Automation pipeline, not `pipeline/` or `dashboard/`.)
- **`dashboard/` is unhosted** — if it should go live, it needs its own healthy
  Vercel project (root `dashboard/`) + env (`NOTION_API_TOKEN`,
  `NOTION_DATABASE_ID`, `SLACK_WEBHOOK_URL`); don't reuse the dead-dup projects.
- See `RUNBOOK.md` §7 for the `pipeline/` content backlog.

---

## 5) Content corrections & verify-list (2026-06-03 session)

**day4 excise-tax article — premise was wrong, now fixed.**
`pipeline/public/content/day4-wine-excise-tax-2026.html` originally argued
"why wine/liquor prices **rose** in 2026" — contradicting its own *reframed*
Notion brief, which says the 2026 excise direction was a **cut**. Rewrote H1,
title, meta/OG, all three JSON-LD blocks (Article headline = H1; FAQPage mirrors
on-page FAQ), and the body to the corrected framing. Commits `0defae7` (premise)
+ `d04a144` (figures). SKUs and compliance footer unchanged.

**Verify-list** (Golden Rule #2 — figures sourced, for legal/tax review before
publish; keep abstract if any source is later contradicted by the official
notice):

| Claim in article | Value used | Sources |
|---|---|---|
| Wine import duty (HS 22.04/22.05) | 54–60% → **0%** (exempt) | USDA FAS TH2024-0014; Royal Thai Embassy OCA (commercethaiusa.org); Acclime |
| Wine excise (ad valorem) | ~10% → **~5%** of retail | USDA FAS; belaws; Bangkok Global Law |
| Wine excise (specific) | **~1,000 ฿ / litre pure alcohol** | belaws; USDA FAS |
| Effective / status | Jan 2 2024, continuing through 2026 (indefinite) | USDA FAS; multiple legal-firm briefings |
| Retail impact | ~35–40% cheaper for some imports | USDA FAS (post estimate) |

⚠️ The exact current rates still carry a visible verify-note pointing to the
**official Excise Department notice** — confirm before any commercial citation.

**Audits run this session (read-only):**
- Premise/fact-drift across the other 16 articles vs their briefs → **clean**
  (no other day4-type reversal; one cosmetic title variance on
  `liq9-day7-bourbon-recommend`).
- SKU validity sweep — all **43** product-card SKUs across the 17 articles exist
  in `pipeline/data/products.json` (2026-06-01 feed) **and** are `in_stock`.

**Drive delivery folder (`1CKAXssXrvhGPjxa9hBMxdk-yXv0qygpm`) — day4 cleanup:**
canonical = **`day4-wine-excise-tax-2026-FINAL.html`** (id `14FggWC…`, 32,471 B,
verified-correct; Notion `Drive file URL` points here). The older
`-inlined`/`-v2`/`-v3` copies are stale duplicates — **delete manually** (Drive
MCP has no delete/rename, only create/copy). A concurrent upload session was
producing `<slug>-inlined.html` files from a checkout **lacking** the day4 fix;
its `day4-…-inlined.html` (28,666 B) was confirmed wrong-premise. Because Drive
can't overwrite by name, that session can't clobber `FINAL` or the Notion
pointer — but it should pull `claude/festive-dirac-QcgOV` before any re-run.

---

## 6) Drive consolidation + Notion URL sweep — IN PROGRESS (hand to next session)

**Canonical delivery folder is now the subfolder "WNLQ9 Magento-Ready (scoped)"**
(id `1G8YX_IsFvv9VrvFiHT-HsPElerYv9AZM`, inside Blog Html center). One self-
contained, CSS-inlined HTML per slug lives here for Magento paste-in. The Blog
Html center **root** should end up holding only this subfolder.

### ⚠️ STOP-AND-RESYNC GOTCHA (why this is unfinished)
A **separate upload agent** is re-uploading ~35 corrected/re-inlined files into
Magento-Ready. Drive MCP can't overwrite by name → **each re-upload makes a new
duplicate with a NEW file id**. The newest id per slug is the correct one.

This invalidates part of the Notion sweep already done: rows were pointed at the
**older** (first-upload) ids. Per the user, **the new ids are authoritative** and
the earlier pointers are partially wrong. **Do not resume piecemeal updates.**

### Correct procedure (single clean sweep) — TOOLED, ready to fire
Helpers committed this session:
- **`docs/notion-drive-sweep-map.json`** — stable `slug → Notion page id` for all
  **52** rows (Drive id deliberately NOT stored; it changes every re-upload).
- **`docs/notion-drive-sweep-plan.mjs`** — feed it a folder scan, it dedupes
  newest-per-slug, joins the map, and prints the Notion updates + the by-hand
  delete list + anomalies (tiny/broken files, unmapped slugs, missing slugs).

Steps:
1. **Confirm the upload agent has STOPPED.** (As of 2026-06-03 ~22:34 it was
   still running — the user confirmed "still running / not sure", so the sweep
   was deliberately NOT fired. Repointing now would go stale on the next round.)
2. `search_files parentId = '1G8YX_IsFvv9VrvFiHT-HsPElerYv9AZM'` (pageSize 100) →
   save the JSON to `/tmp/scan.json`.
3. `node docs/notion-drive-sweep-plan.mjs /tmp/scan.json`.
4. Apply the printed **Notion updates** via `notion-update-page`
   (`{"Drive file URL":"…"}`, NO `userDefined:` prefix) — batch them.
5. Hand the user the printed **delete list** (stale dup ids + the 2,090 B broken
   `day8-champagne-vs-prosecco-vs-cava` copy) plus: everything in Blog Html
   center **root** except the Magento-Ready subfolder.

### State at handoff (2026-06-03 ~22:40)
- **52 unique slugs confirmed** in Magento-Ready (27 Wine-Now + 25 LIQ9) — full
  set authored. Roster = the keys in `notion-drive-sweep-map.json`.
- Folder is **bloated to ~95 files**: the agent ran repeated rounds (17:xx, 18:xx,
  19:xx, 22:xx). The 22:xx round re-inlined larger/corrected versions for ~30
  slugs, so most slugs now have 2–3 copies (a few have 4). Newest = keep.
- **Known broken upload:** `day8-champagne-vs-prosecco-vs-cava.html` id
  `1bq2zfmd…` is 2,090 B (truncated) — the plan script auto-skips it.
- Notion `Drive file URL` sweep is **PARTIALLY APPLIED to STALE ids** from earlier
  rounds; the clean re-sweep above supersedes all of it (idempotent — just
  overwrites each row with the final newest id).

### Decisions captured this session
- **July:** the board is **June-only** (`Month` option set = just "June 2026"); no
  July rows/board exist. User chose **"June first, July later"** — do NOT plan
  July yet; finish finalizing June (sweep → dedup delete → status normalization).

### Known duplicate sets observed mid-upload (newest = keep)
- `day8-champagne-vs-prosecco-vs-cava`: `1WBVEWF…` 34,034B (old) ·
  `1bq2zfmd…` **2,090B BROKEN** · `1aLfSIC7…` 35,677B (newest, keep)
- `liq9-day13-world-gin-day-2026`: `1u8QrUwj…` 38,810B (old) ·
  `1stMo57W…` 40,191B (newest, keep)
- `liq9-day14-capsule-bar-8-bottles`: `1qiJNQ5W…` 44,436B (old) ·
  `10_ZwcGx…` 45,893B (newest, keep)
- (re-scan for any further dupes the agent produced after this note.)

### Notion property name (important)
The DB property is literally **`Drive file URL`** (type url). Do **not** prefix
with `userDefined:` — that errors. `notion-update-page` →
`{"properties": {"Drive file URL": "https://drive.google.com/file/d/<id>/view"}}`.
DB id `786d080f-8da2-4a1e-b84e-161f4e19d56d`,
collection `6be4a7bb-d42c-4286-be1b-fa73e3635b45`.

### Two slugs whose Notion rows were found this session
- `day2-tannin` → Notion page `3749d75a-e4b5-81a6-b07d-f6d6e27c0c4f`
  ("Tannin คืออะไร…"); Drive (pre-resync) `1b_xPJl6fjXZw14L9udkdiYoq3Z44XLT9`.
- `day3-wine-storage-condo` → Notion page `3739d75a-e4b5-814b-afac-feb4c1e24117`
  ("เริ่มเซลลาร์แรกในงบจำกัด…" / "เก็บไวน์คอนโด"); Drive (pre-resync)
  `1ydlwYojWBZFy1mXYKKEDk78sSedtYJnQ`. ⚠️ Re-verify both titles against the row
  before trusting — these were semantic-search matches, not exact.
