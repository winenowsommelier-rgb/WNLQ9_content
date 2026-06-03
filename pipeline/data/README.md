# pipeline/data

| File | What | Source |
|---|---|---|
| `products.json` | product feed — the **only** source of real, in-stock SKUs/prices for cards | upstream BI/feed |
| `articles.json` | `/api/approve` page-id → HTML file map (Option B: largely vestigial) | hand-maintained |
| `content-index.json` | generated content index (52 articles) for planning + the GA/GSC join | `build-articles-manifest.mjs` |
| `ga4.csv` | GA4 export (planning input) — **gitignore / not committed** | `ga-gsc-pull.mjs` **or** manual export |
| `gsc.csv` | GSC export (planning input) — **gitignore / not committed** | `ga-gsc-pull.mjs` **or** manual export |

## CSV column contracts (header names matched loosely, order-independent)

**`ga4.csv`**
```
page_path,page_title,views,users,avg_engagement_time
/blog/day8-champagne-vs-prosecco-vs-cava.html,…,2100,1500,72
```
- `page_path` is the **live** URL path; its basename joins to `content-index.json`
  `urlKey`. Legacy posts strip the `dayN-` prefix in their live URL — already
  handled by the index (keyed off each file's `<link rel="canonical">`).

**`gsc.csv`**
```
keyword,brand,clicks,impressions,ctr,position
แชมเปญ ราคา,wine-now,120,4200,2.9,6.5
```
- `brand` = `wine-now` | `liq9` when both properties are combined into one file.
- A `page` column is used if present (page-level GSC export).

Real `ga4.csv`/`gsc.csv` are planning inputs, not deliverables — keep them out of
git. With neither present, `plan-from-csv.mjs` falls back to the bundled
`dashboard/data/sample-*.csv` (clearly labeled SAMPLE).
