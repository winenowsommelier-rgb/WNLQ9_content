# 09 — BI & Product Engine (live data API)

> WNLQ9's live business data — sales, customers, products, inventory, forecasts (THB) — is served
> by a REST API. **When a task needs real numbers, call the API; don't guess.** The API key is a
> secret: it is read from the `WNLQ9_API_KEY` environment variable / GitHub secret and is **never
> committed to this repo**.

## Connection
- **Base URL:** `https://wnlq9-bi-api.vercel.app`
- **Auth header:** `X-API-Key: ${WNLQ9_API_KEY}`  (value lives in GitHub Secrets / env as `WNLQ9_API_KEY`)
- **Full schema:** `https://wnlq9-bi-api.vercel.app/docs`
- All endpoints return JSON. Values in **THB**. Data refreshed daily. Months = calendar-month start.

## Core endpoints
```
GET /marts                                   -> list 20 data marts
GET /marts/{name}?limit=5000                 -> read any mart
                                                (e.g. sales_monthly, rfm_snapshot,
                                                 inventory_status, customer_spend_monthly)
GET /marketing/bestsellers?days=90&limit=20  -> top SKUs by revenue
GET /marketing/winback?segment=At+Risk       -> lapsed high-value customers (RFM)
GET /marketing/must-move?limit=50            -> clearance / restock flags
GET /marketing/forecast-vs-actual?months_back=6 -> actuals + 3-month forecast
GET /products?brand=Macallan&limit=50        -> product catalogue
GET /products/{sku}                          -> single SKU + price/cost/margin
```

## Usage rules (follow these)
1. If unsure what's available, hit `/marts` first — don't guess mart names.
2. **Always cite the endpoint** when presenting numbers, e.g.
   *"from /marketing/bestsellers?days=30: Macallan 18 leads at ฿248,860 revenue."*
3. Values are THB; months are calendar-month start; data refreshes daily.
4. **401** = key was rotated → ask the owner for the new `WNLQ9_API_KEY`.

## How it plugs into the content engine
Use BI to make the monthly slate evidence-led (Engine Step 1, live-signal research):
- `/marketing/bestsellers` → which brands/SKUs deserve Spotlights & Pairing pieces this month.
- `/marketing/must-move` → clearance/restock items to feature as *decision-stage education*
  (never as a named sale — see §15.6 compliance).
- `/marketing/winback` + `rfm_snapshot` → audience framing and LINE-CTA targeting.
- `/products/{sku}` → **resolve [VERIFY] facts** (brand, ABV, price/margin) against real catalogue
  data instead of web guesses. Note: never put on-page price in published content (§9) — BI price
  is for internal planning / LINE replies only.
- `/marts/sales_monthly` + `/marketing/forecast-vs-actual` → seasonal timing of clusters.

## Access requirements & the snapshot bridge (important)
Direct calls need two switches: (1) `WNLQ9_API_KEY`, and (2) network egress to `wnlq9-bi-api.vercel.app`.

**Reality of the Claude Code web sandbox:** its shell has no outbound internet at all - every host
(Notion, GitHub, the BI API) returns `403 Host not in allowlist`. Notion/GitHub still work because
they run through MCP connectors (a separate channel); the BI API has no connector, so a web session
cannot call it directly unless the environment owner changes the network policy to allow that host.

**The bridge (default path):** GitHub Actions runners DO have egress, so we pull BI data in CI and
commit it to the repo:
- Script: `scripts/bi-snapshot.mjs` (Node 18+, zero deps; reads `WNLQ9_API_KEY`).
- Workflow: `.github/workflows/bi-snapshot.yml` (weekly + manual; commits to `docs/wnlq9/bi-snapshot/`).
- Content sessions then read the committed snapshot in `docs/wnlq9/bi-snapshot/` for real numbers -
  no network needed: `bestsellers_90d.json`, `must_move.json`, `forecast_vs_actual.json`,
  `sales_monthly.json`, `rfm_snapshot.json`, `inventory_status.json`, `marts.json`, plus `SUMMARY.md`
  and `_manifest.json`. Still cite the originating endpoint when using a number.

**Three ways to get live data, easiest first:**
1. Run the **BI Snapshot** Action (set the `WNLQ9_API_KEY` secret first) -> snapshot lands in the repo.
2. Run locally: `npm run bi:snapshot` (or `WNLQ9_API_KEY=... node scripts/bi-snapshot.mjs`).
3. Direct calls from a web session - only if the environment owner allowlists the host.

## Quick verification
```bash
WNLQ9_API_KEY=... node scripts/bi-snapshot.mjs   # writes docs/wnlq9/bi-snapshot/
# or one endpoint:
curl -s -H "X-API-Key: $WNLQ9_API_KEY" https://wnlq9-bi-api.vercel.app/marts | jq .
```
`403 Host not in allowlist` = egress blocked (use the Action/local path). `401` = rotate the key.
