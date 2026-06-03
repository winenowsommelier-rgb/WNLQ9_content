# SQL Intelligence Views

Now that the hub's data lives in Supabase (Postgres), a set of analytical
**views** turn the raw tagged-article table into decision-ready intelligence —
including joins against your **real Google Search Console data** (the `seo_*`
tables in the same project). They refresh in the Google Sheet daily (the
`Intel_*` tabs) via the GitHub Actions job, and are queryable directly in the
Supabase SQL editor.

## The views (schema: `public`)

| View | Sheet tab | What it answers |
|------|-----------|-----------------|
| `ch_content_gap` | **Intel_ContentGap** | Where the **market is active** AND you have **search demand but rank poorly** — your highest-value content opportunities. Joins `content_hub_articles` ↔ `seo_gsc_daily`. |
| `ch_trend_velocity` | **Intel_TrendVelocity** | Which trend signals are **accelerating** (last 30d vs prior 30d). |
| `ch_premium_pulse` | **Intel_PremiumPulse** | The premium-market signals (investment, scarcity, price, limited release, awards, emerging regions) over 30/90 days. |
| `ch_category_velocity` | **Intel_CategoryVelocity** | Which verticals (wine/spirits/food/lifestyle/travel/hospitality) are heating up. |
| `ch_editorial_opportunities` | **Intel_Editorial** | The "what to write" feed: high-AEO, beverage-relevant, trend-carrying articles, newest first. |
| `ch_thailand_intelligence` | **Intel_Thailand** | Everything Thailand-relevant (high first), across all verticals. |

`ch_articles_v` is a helper view that parses the text `published_date` into a
real `pub_date` for window math.

## How to read the key ones

**Content gap (`Intel_ContentGap`)** — columns: `keyword, site, impressions,
clicks, avg_rank, market_articles`. A row with high `impressions` (real
demand), `avg_rank` > 8 (you're off page 1), and a high `market_articles`
count (the press is writing about it) = a **prime topic to publish on**.
Example signal: *Bordeaux — 475 impressions, rank 10.5, 35 market articles.*

**Trend velocity (`Intel_TrendVelocity`)** — `velocity_ratio` = last-30d ÷
prior-30d. > 1 means accelerating. NOTE: ratios are inflated immediately after
the initial bulk load (prior periods are sparse); they become meaningful as the
daily job accumulates real history over the following weeks.

## Querying directly (Supabase SQL editor)

```sql
select * from ch_content_gap limit 25;
select * from ch_trend_velocity order by last_30d desc;
select * from ch_premium_pulse;
```

## Refresh

- **Automatic:** the daily GitHub Actions ingest runs `scripts/export_intelligence.py`
  after collection, refreshing all `Intel_*` tabs.
- **Manual:** `python scripts/export_intelligence.py` (with `SUPABASE_URL`,
  `SUPABASE_SERVICE_KEY`, `DATA_HUB_SHEET_ID` in env / `config/.env`).

## Extending

Add a new view with a Supabase migration (or the SQL editor), then add a
`(tab, view, columns, limit)` entry to `VIEWS` in `scripts/export_intelligence.py`
to surface it in the Sheet. Because GSC/GA4 live in the same database, you can
join market trends against impressions, clicks, rank, and (via `seo_ga4_daily`)
on-site engagement.
