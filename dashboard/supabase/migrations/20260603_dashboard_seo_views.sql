-- ============================================================
-- Dashboard SEO aggregation layer (project: WNLQ9 SEO Automation)
-- Applied 2026-06-03. Powers the dashboard's Topics & Keywords tabs from the
-- real GSC/GA4 data synced into seo_gsc_daily / seo_ga4_daily.
--
-- This file documents the DDL applied via Supabase migrations:
--   1. dashboard_seo_aggregation_matviews
--   2. dashboard_seo_views_daily_refresh
-- ============================================================

-- Materialized views: roll the per-day, per-site rows up to one row per
-- (site, keyword) / (site, page_path). Materialized (not plain views) because
-- the GSC table has 360k+ rows and on-the-fly aggregation exceeds the anon
-- statement timeout.

CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_gsc_keywords AS
SELECT
  site,
  keyword,
  SUM(impressions)::int                                            AS impressions,
  SUM(clicks)::int                                                 AS clicks,
  CASE WHEN SUM(impressions) > 0
       THEN ROUND((SUM(clicks)::numeric / SUM(impressions)) * 100, 2)
       ELSE 0 END                                                  AS ctr,        -- percentage
  ROUND(
    COALESCE(
      SUM(rank_position * impressions) / NULLIF(SUM(impressions), 0),
      AVG(rank_position)
    )::numeric, 2)                                                 AS position,   -- impression-weighted
  MAX(metric_date)                                                 AS last_seen
FROM public.seo_gsc_daily
WHERE keyword IS NOT NULL AND keyword <> ''
GROUP BY site, keyword;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_ga4_pages AS
SELECT
  site,
  page_path,
  SUM(users)::int                                                  AS users,
  SUM(sessions)::int                                               AS sessions,
  SUM(pageviews)::int                                              AS pageviews,
  ROUND(AVG(bounce_rate)::numeric, 4)                              AS bounce_rate,
  ROUND(AVG(avg_session_duration)::numeric, 2)                     AS avg_session_duration,
  MAX(metric_date)                                                 AS last_seen
FROM public.seo_ga4_daily
WHERE page_path IS NOT NULL AND page_path <> ''
GROUP BY site, page_path;

-- Unique indexes enable REFRESH ... CONCURRENTLY; sort indexes serve top-N reads.
CREATE UNIQUE INDEX IF NOT EXISTS dashboard_gsc_keywords_pk  ON public.dashboard_gsc_keywords (site, keyword);
CREATE INDEX        IF NOT EXISTS dashboard_gsc_keywords_impr_idx ON public.dashboard_gsc_keywords (site, impressions DESC);
CREATE UNIQUE INDEX IF NOT EXISTS dashboard_ga4_pages_pk     ON public.dashboard_ga4_pages (site, page_path);
CREATE INDEX        IF NOT EXISTS dashboard_ga4_pages_views_idx ON public.dashboard_ga4_pages (site, pageviews DESC);

GRANT SELECT ON public.dashboard_gsc_keywords TO anon, authenticated;
GRANT SELECT ON public.dashboard_ga4_pages   TO anon, authenticated;

-- Refresh helper, called by the daily cron job below.
CREATE OR REPLACE FUNCTION public.refresh_dashboard_seo_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_gsc_keywords;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_ga4_pages;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_dashboard_seo_views() TO service_role;

-- Daily refresh at 07:00 UTC, just after the ~06:00 UTC GSC/GA4 sync.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'refresh-dashboard-seo-views',
  '0 7 * * *',
  $$SELECT public.refresh_dashboard_seo_views();$$
);
