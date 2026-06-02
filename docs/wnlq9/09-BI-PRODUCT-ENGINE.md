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

## Access requirements (two switches)
1. **Secret:** `WNLQ9_API_KEY` set in the runtime (Claude Code web environment vars, or GitHub
   Actions secret). See `08-SECRETS-AND-ACCESS.md`.
2. **Network egress:** the runtime must allow outbound to `wnlq9-bi-api.vercel.app`.
   - In **Claude Code on the web**, the environment's network policy must allowlist that host
     (a fresh session here returned `403 Host not in allowlist` until it's added).
   - **GitHub Actions** runners have open egress, so the `monthly-content.yml` workflow can call it
     once `WNLQ9_API_KEY` is set.

## Quick verification (once access is granted)
```bash
curl -s -H "X-API-Key: $WNLQ9_API_KEY" https://wnlq9-bi-api.vercel.app/marts | jq .
```
Should list the 20 marts. If you get `403 Host not in allowlist`, fix egress (switch 2);
if `401`, fix/rotate the key (switch 1).
