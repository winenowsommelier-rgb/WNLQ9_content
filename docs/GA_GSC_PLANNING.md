# GA4 + GSC Content-Planning Runbook

Purpose: start the next planning session **straight on real data**. We pull
Google Analytics 4 + Google Search Console **directly** (no Supermetrics), join
the numbers onto the Notion board per article, and decide what to refresh, kill,
or write next — then write `Target Keyword` / `Funnel` / `Day` / `GA Views` back.

---

## 1. One-time setup (do once, then it's ready)

Fill these in Vercel env (prod) and/or a local `.env` (template in
`pipeline/.env.example`):

| Var | What | Where to find it |
|---|---|---|
| `GA_GSC_SERVICE_ACCOUNT_JSON` | service-account JSON (1 line). Optional — falls back to the existing `GOOGLE_SERVICE_ACCOUNT_JSON` used for Drive. | GCP → IAM → Service Accounts → Keys |
| `GA4_PROPERTY_WN` / `GA4_PROPERTY_LIQ9` | numeric GA4 property IDs (digits only) | GA4 Admin → Property Settings → Property ID |
| `GSC_SITE_WN` / `GSC_SITE_LIQ9` | GSC property string | exactly as registered: `sc-domain:wine-now.com` **or** `https://th.wine-now.com/` |

Grant the service account's `client_email`:
- **GA4**: each property → Property Access Management → **Viewer**
- **GSC**: each property → Settings → Users and permissions → add as **Restricted** user

Scopes used (read-only): `analytics.readonly`, `webmasters.readonly`.

> If you use OAuth + a refresh token instead of a service account, that's a small
> swap in `getAccessToken()` (use `grant_type=refresh_token`); ask and I'll adapt it.

Verify with **no network / no creds needed**:
```bash
node pipeline/scripts/ga-gsc-pull.mjs --check    # validates env + creds parse
node pipeline/scripts/ga-gsc-pull.mjs --index    # builds the slug→article join map
```
`--check` prints exactly which vars are still missing and exits non-zero until ready.

---

## 2. Pull the data

```bash
node pipeline/scripts/ga-gsc-pull.mjs --days 28           # default window
node pipeline/scripts/ga-gsc-pull.mjs --since 2026-05-01 --until 2026-05-31
```
Writes to `/tmp/ga-gsc/`:
- `ga4-wn.json` / `ga4-liq9.json` — per page: `views, sessions, engagedSessions, avgSessionSec, conversions`
- `gsc-wn.json` / `gsc-liq9.json` — per page: `clicks, impressions, ctr, position, topQueries[10]`
- `merged.json` — **one record per article**, GA4 + GSC joined, with `title`/`site`/`onSite`
- `slug-index.json` — the join map

**Join key = the live-URL basename (canonical), not the repo filename.** Legacy
files carry a `dayN-` filename prefix that is stripped in the published URL
(e.g. `day1-most-expensive-wines-2026.html` → live `/blog/most-expensive-wines-2026.html`
→ join key `most-expensive-wines-2026`). The script already keys the index off
each file's `<link rel="canonical">`, so this is handled — just be aware when
eyeballing.

---

## 3. Join onto the Notion board

Board: **2026 JUN — WNLQ9 — Content Production**
(db `786d080f-8da2-4a1e-b84e-161f4e19d56d`, data source
`collection://6be4a7bb-d42c-4286-be1b-fa73e3635b45`).

`merged.json` is keyed by URL slug; the board rows are keyed by **Title**.
Bridge them with `slug-index.json` (`urlKey → {title, site}`), then match the
title to the row. Two reliable paths:
- If a row's **`Final URL`** is populated → join directly on the live URL.
- Else join `merged.slug → slug-index.title → board row Title` (Site
  disambiguates WN vs LIQ9).

Write-backs per row (Notion `update-page`, property names exact):
`GA Views` (number), and during planning `Target Keyword`, `Funnel`, `Day`,
optionally `Status`. (`GA Views` is already a column on the board.)

---

## 4. Scoring heuristic (starting point — tune with the client)

Per existing article:
- **Win / scale** — high impressions **and** good position (≤10): refresh,
  expand, add internal links, build a cluster around it.
- **Striking distance** — high impressions, position 11–20, low CTR: title/H1 +
  meta + FAQ tune; these move fastest.
- **Thin** — low impressions after 60+ days indexed: merge into a pillar or
  rework the angle.
- **Converter** — high `conversions`/`engagedSessions` per view: prioritize
  more like it; feed winning `topQueries` into new briefs.

For **new topics**: cluster GSC `topQueries` that have impressions but **no
ranking page yet** → candidate briefs. Respect the golden rules (no fabricated
numbers; real in-stock SKUs only; ~฿+LINE; Thai-only).

---

## 5. Guardrails
- **No Supermetrics.** Direct GA4 Data API + GSC Search Analytics API only.
- Read-only scopes; the script never writes to Google.
- GA/GSC data lags ~1–2 days — the script defaults `--until` to *yesterday*.
- Don't paste real metrics into article bodies as claims; planning data informs
  *what to write*, not fabricated stats inside posts.
- Every produced/updated article still goes through `validate-articles.mjs`.
