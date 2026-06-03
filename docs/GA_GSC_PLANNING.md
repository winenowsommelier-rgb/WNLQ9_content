# GA4 + GSC Content-Planning Runbook (CSV-based)

Purpose: start the next planning session **straight on real data** with **no API
keys, no service accounts, no property IDs** — the same CSV-ingest model the
dashboard already uses (`dashboard/lib/csv.ts`, sample files in
`dashboard/data/`). You export GA4 + GSC CSVs from your own GA/GSC, drop them in,
and the scripts join them onto the content index and score everything.

> Why CSV (and not the GA/GSC API): this project is deliberately no-paid-API
> (Option B). The live MCP connections that ARE wired — Notion, Drive, GitHub,
> Supabase — stay as-is. GA/GSC come in as CSV exports. Do **not** add GA4
> property IDs or a service account; nothing here needs them.

---

## 1. Export the two CSVs (once per planning cycle)

**GA4** → Reports/Explore → *Pages and screens* → export CSV with columns
(header names are matched loosely, order-independent):
`page_path, page_title, views, users, avg_engagement_time`
Save as **`pipeline/data/ga4.csv`** (combine both brands into one file — the
join is by URL, so brand falls out of the path).

**GSC** → Performance → *Queries* (and/or *Pages*) → export CSV:
`keyword, brand, clicks, impressions, ctr, position` (a `page` column is used if
present; `brand` = `wine-now` | `liq9` if you combine both properties).
Save as **`pipeline/data/gsc.csv`**.

(Or pass paths: `--ga4 <file> --gsc <file>`. With neither present the scripts run
on the bundled `dashboard/data/sample-*.csv` and clearly label it SAMPLE.)

---

## 2. Run the planner (zero deps, no creds)

```bash
node pipeline/scripts/build-articles-manifest.mjs   # refresh content-index.json (52 articles)
node pipeline/scripts/plan-from-csv.mjs             # join + score → /tmp/ga-gsc/plan.json + summary
```

`plan.json` contains:
- `performance[]` — every article with `views/users/eng`, a **bucket**
  (`win/scale` ≥P75 views · `mid` · `thin` ≤P25 · `no-traffic-data`), its
  `inboundLinks`, `orphan`, and `priorityLink` flags.
- `opportunities` — `strikingDistance` (GSC pos 4–20, ≥median impressions),
  `lowCtr` (high impressions, CTR <2%, pos ≤10), `newTopics` (queries with
  impressions but no covering article).

The console summary leads with **orphans capturing real traffic** (fix internal
links there first), striking-distance keywords, and new-topic candidates.

### Join key
GA4 `page_path` → basename → `urlKey` in `content-index.json`. Legacy Day 1–7
posts strip the `dayN-` filename prefix in their live URL (file
`day1-most-expensive-wines-2026.html` → live `/blog/most-expensive-wines-2026`),
which the index already handles (it keys off each file's `<link rel="canonical">`).

---

## 3. Act on it (this is the refresh pass)

1. **Internal links first** — execute `docs/INTERNAL_LINK_PLAN.md`, prioritizing
   any orphan with real `views` and the Day 12 Champagne pillar. Re-run the
   manifest and assert **0 orphans**, every pillar ≥6 inbound.
2. **Striking-distance / low-CTR** — tune title/H1 + meta + FAQ on those pages.
3. **New topics** — turn `newTopics` (grouped by brand) into briefs; respect the
   golden rules (real in-stock SKUs only, no fabricated numbers, ~฿+LINE, Thai-only).
4. Run everything through `validate-articles.mjs` → `inline-css.mjs` → Drive
   (one clean re-delivery) → Notion.
5. **Write-backs** to the board (`update-page`, exact property names): `GA Views`
   (number, from `performance.views`), and `Target Keyword` / `Funnel` / `Day`.

The web dashboard consumes the **same** CSVs (upload via its UI → BriefGenerator
/ TopicIntelligence) if you prefer a visual pass — `plan-from-csv.mjs` is the
headless equivalent for a Claude Code session.

---

## 4. Guardrails
- No Supermetrics, no GA/GSC API keys, no service account. CSV in, plan out.
- Planning data informs *what to write/fix* — never paste raw metrics into
  article bodies as claims.
- Every produced/updated article still passes `validate-articles.mjs`.
