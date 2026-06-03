# GA4 + GSC switch-over — planning & runbook

This is the data half of the WNLQ9 content engine: pull **Google Analytics 4**
(engagement) + **Google Search Console** (search demand) for the live blog,
join it to the Notion content board, score every URL into an action bucket, and
feed the result into refreshes + new briefs.

Everything here is reproducible from the repo: the pull/merge/score code lives in
`pipeline/` and is unit-tested. A fresh session runs three commands (below) and
gets `data/ga-gsc/scored.json` to work from.

> **Status (2026-06): wiring complete, data not yet pulled.** The code, env
> hooks, and scoring model are in place. The pull has not run because the two
> access items below aren't set yet. `--check` already confirms the service
> account JSON is present in the environment.

---

## 1. Prerequisites — the items to set before the first pull

The pull reuses the **same Google service account** as the Drive uploader
(`GOOGLE_SERVICE_ACCOUNT_JSON`, already configured). Two things remain:

1. **Grant the service account read access**
   - GA4: each property → *Admin → Property Access Management* → add the SA
     `client_email` as **Viewer**.
   - GSC: each property → *Settings → Users and permissions* → add the SA
     `client_email` as **Restricted** (read) user.
2. **Set the two env vars** (Vercel project `seodashboard`, or local `.env`):

   | Var | Example | Notes |
   |---|---|---|
   | `GA4_PROPERTY_IDS` | `properties/123456789,properties/987654321` | comma list; one per brand, or one combined property. `properties/` prefix optional. |
   | `GSC_SITES` | `https://th.wine-now.com/,https://th.liq9.com/` | comma list. Use the exact verified property string — URL-prefix (trailing slash) **or** `sc-domain:wine-now.com`. |

   Optional: `GA_GSC_LOOKBACK_DAYS` (default `28`).

`node pipeline/scripts/ga-gsc-pull.mjs --check` turns **green** once both are set
and the SA has access.

---

## 2. Commands

```bash
# 1) reachability probe — no data pulled, exits non-zero if not green
node pipeline/scripts/ga-gsc-pull.mjs --check

# 2) pull GA4 + GSC for the lookback window -> data/ga-gsc/*.json
node pipeline/scripts/ga-gsc-pull.mjs --pull --days 28

# 3) join merged.json to the board + score -> data/ga-gsc/scored.json
node pipeline/scripts/ga-gsc-pull.mjs --score

# (no flag) = pull then score
node pipeline/scripts/ga-gsc-pull.mjs
```

### Outputs (`pipeline/data/ga-gsc/`)
| File | What |
|---|---|
| `ga4.json` | raw GA4 rows (host, path → views, sessions, engagedSessions, conversions) |
| `gsc-pages.json` | raw GSC per-page rows (clicks, impressions, ctr, position) |
| `gsc-queries.json` | raw GSC page×query rows (for mining) |
| `merged.json` | **one record per URL** = GA4 ⨝ GSC + top 5 queries per URL |
| `queries.json` | aggregated keyword opportunities (demand with weak position) |
| `scored.json` | merged ⨝ board, every URL bucketed + ranked by opportunity score |

Commit `merged.json` + `scored.json` with the refresh so the next session is
reproducible.

---

## 3. The join key

Everything keys on the **canonical live URL** (`normalizeUrl` in
`src/ga-gsc.mjs`): lower-cased host, `https://`, trailing dir-slash trimmed,
`.html` paths preserved. This is the exact form of each article's
`<link rel="canonical">` and the Notion board's **`Final URL`**, so GA4 + GSC +
board align 1:1. When `Final URL` is empty on the board, `--score` falls back to
a local snapshot built from the canonical tags in `public/content/*.html`.

---

## 4. Scoring model

`src/scoring.mjs` (pure, unit-tested). Each URL gets every tag it qualifies for
plus one **primary** bucket (priority order below). Thresholds default to a
~28-day window on a small blog and are overridable as volumes grow.

| Bucket (priority) | Rule (defaults) | Action |
|---|---|---|
| **converter** | `conversions > 0` **or** (BOFU/Commercial/Transactional **and** views ≥ 20) | Protect & optimise — sharpen CTA, product cards, LINE route. Highest value. |
| **win-scale** | `position ≤ 10` **and** `clicks ≥ 20` | Already winning — scale via clusters + internal links; build the pillar around it. |
| **striking-distance** | `8 ≤ position ≤ 20` **and** `impressions ≥ 100` | **Best ROI.** Page-2 / bottom-of-page-1 with demand — small refresh + internal links to break the top 10. |
| **thin** | `impressions < 30` **and** `views < 20` | Little visibility/demand — consolidate, rework, or retire. |
| **none** | qualifies for nothing yet | Watch. |

`opportunityScore` ranks the list so striking-distance + converter pages
(where editing effort pays off) surface above already-won pages.

Defaults live in `DEFAULT_THRESHOLDS`; re-tune once a real pull shows actual
volumes (a small blog may need `winClicks`/`sdImpr` lowered).

---

## 5. The switch-over session workflow

1. `--check` → green → `--pull` → `--score`.
2. Read `scored.json`:
   - **striking-distance** → priority refresh queue (data-driven refreshes).
   - **win-scale** → expand into clusters; wire as pillars (see
     `INTERNAL_LINK_PLAN.md`).
   - **thin** → consolidate/rework/retire.
   - **converter** → CTA + product-card tune-up.
   - `unmatchedBoard` → planned posts with no live data yet (most of the current
     board — they're unpublished).
3. Execute `INTERNAL_LINK_PLAN.md` (fix orphans, wire the Champagne pillar)
   **together with** the data-driven refreshes → **one clean Drive re-delivery**
   (clear-then-reupload per CLAUDE.md, since Drive MCP can't overwrite).
4. **Backfill the board** from the data (`mcp__notion__notion-update-page`):
   - `GA Views` ← `merged.records[*].views`
   - `Target Keyword` ← top query from `topQueries` / `queries.json` where blank
   - `Funnel` ← infer from intent of the winning query (TOFU/MOFU/BOFU)
   - `Day` ← from the editorial calendar where blank
5. **Mine `queries.json`** — high-impression / weak-position queries not already
   targeted → new brief rows on the board (Status `Not started`).

---

## 6. Files

| File | Role |
|---|---|
| `pipeline/src/google-auth.mjs` | service-account JWT → access token (GA4 + GSC scopes), dependency-free |
| `pipeline/src/ga-gsc.mjs` | live GA4/GSC client + pure merge/mine helpers |
| `pipeline/src/scoring.mjs` | pure bucket/score logic |
| `pipeline/scripts/ga-gsc-pull.mjs` | CLI: `--check` / `--pull` / `--score` |
| `pipeline/test/{google-auth,ga-gsc,ga-gsc-client,scoring}.test.mjs` | coverage |

Run `cd pipeline && npm test` to verify the suite.
