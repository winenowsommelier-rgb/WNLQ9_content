# WNLQ9 — Session Handoff & Subsystem Map

**Verified:** 2026-06-03 (against live Vercel + Supabase via MCP).
**Authoritative docs win:** [`CLAUDE.md`](../CLAUDE.md) and
[`docs/RUNBOOK.md`](RUNBOOK.md) are the source of truth. This file just maps the
three subsystems and records verified infra state, because earlier verbal
handoffs drifted from reality (see "Corrections" below).

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
