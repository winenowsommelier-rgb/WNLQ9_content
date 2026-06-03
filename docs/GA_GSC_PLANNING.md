# GA4 + GSC Content-Planning Runbook

Goal: start the next planning session **straight on real data**. There are two
ways to get GA4 + GSC numbers in; **both produce the same two CSVs and feed the
same scorer** (`plan-from-csv.mjs`), so the downstream is identical.

```
 (A) ga-gsc-pull.mjs  ── FREE GA4 + GSC APIs ──┐
                                               ├─►  pipeline/data/{ga4,gsc}.csv ─►  plan-from-csv.mjs ─► /tmp/ga-gsc/plan.json
 (B) manual CSV export ────────────────────────┘
```

> Note: GA4 Data API + GSC API are **free** — the repo's "no paid API" rule is
> about the Anthropic generation API, not Google. Either path is fine.

---

## Path A — automated pull (preferred: direct + stable)

One command, no manual export, repeatable/schedulable. Uses a **service account**
(no token expiry, no interactive consent — best for unattended runs).

**One-time:** set these in the environment that RUNS the script (your server /
Vercel, or the Claude Code env once its secrets are configured — see
https://code.claude.com/docs/en/claude-code-on-the-web for env/secrets):

| Var | What |
|---|---|
| `GA_GSC_SERVICE_ACCOUNT_JSON` | service-account JSON (or reuse `GOOGLE_SERVICE_ACCOUNT_JSON`) |
| `GA4_PROPERTY_WN` / `GA4_PROPERTY_LIQ9` | numeric GA4 property IDs |
| `GSC_SITE_WN` / `GSC_SITE_LIQ9` | `sc-domain:wine-now.com` or `https://th.wine-now.com/` |

Grant the service account's `client_email`: **GA4** property → Viewer; **GSC**
property → user. Scopes (read-only): `analytics.readonly`, `webmasters.readonly`.

```bash
node pipeline/scripts/ga-gsc-pull.mjs --check        # validate config/creds, NO network
node pipeline/scripts/ga-gsc-pull.mjs --days 28      # → pipeline/data/{ga4,gsc}.csv
node pipeline/scripts/ga-gsc-pull.mjs --plan         # pull AND score in one go
```
`--check` prints exactly what's missing (and detects an unsubstituted
`${PLACEHOLDER}` secret, i.e. the run environment isn't injecting it).

---

## Path B — manual CSV (zero creds, always works)

Export from your own GA/GSC and drop the files (header names matched loosely):
- **`pipeline/data/ga4.csv`** — `page_path, page_title, views, users, avg_engagement_time`
- **`pipeline/data/gsc.csv`** — `keyword, brand, clicks, impressions, ctr, position`

(With neither path's files present, the scorer falls back to the bundled
`dashboard/data/sample-*.csv`, clearly labeled SAMPLE.)

---

## Score it

```bash
node pipeline/scripts/build-articles-manifest.mjs   # refresh content-index.json
node pipeline/scripts/plan-from-csv.mjs             # → /tmp/ga-gsc/plan.json + summary
```
`plan.json`:
- `performance[]` — per article `views/users/eng`, **bucket** (`win/scale` ≥P75 ·
  `mid` · `thin` ≤P25 · `no-traffic-data`), `inboundLinks`, `orphan`, `priorityLink`.
- `opportunities` — `strikingDistance` (GSC pos 4–20, ≥median impressions),
  `lowCtr` (high impressions, CTR <2%, pos ≤10), `newTopics` (impressions, no
  covering article).

**Join key:** GA4 `page_path` basename → `urlKey` in `content-index.json`. Legacy
Day 1–7 posts strip the `dayN-` prefix in their live URL; the index keys off each
file's `<link rel="canonical">`, so this is already handled.

---

## Act on it (the refresh pass)
1. **Internal links first** — execute `docs/INTERNAL_LINK_PLAN.md`, prioritizing
   orphans with real `views` and the Day 12 Champagne pillar. Re-run the manifest;
   assert 0 orphans, every pillar ≥6 inbound.
2. **Striking-distance / low-CTR** — tune title/H1 + meta + FAQ on those pages.
3. **New topics** — turn `newTopics` (by brand) into briefs (golden rules: real
   in-stock SKUs, no fabricated numbers, ~฿+LINE, Thai-only).
4. `validate-articles.mjs` → `inline-css.mjs` → Drive (one clean re-delivery) → Notion.
5. **Write-backs** (`update-page`, exact names): `GA Views` (number), `Target
   Keyword`, `Funnel`, `Day`.

The web dashboard ingests the same CSVs via its UI (BriefGenerator /
TopicIntelligence) if you want a visual pass — `plan-from-csv.mjs` is the headless
equivalent.

## Guardrails
- Service account = read-only; the puller never writes to Google.
- No Supermetrics.
- Planning data informs *what to write/fix* — never paste raw metrics into article
  bodies as claims. Every produced/updated article still passes `validate-articles.mjs`.
