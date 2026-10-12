-- ============================================================
-- seo_gsc_daily: raw daily GSC keyword metrics per site
-- Applied 2026-06-28. Feeds the dashboard_gsc_keywords matview.
--
-- Populated by:  data-hub/scripts/sync_gsc_to_supabase.py
-- Consumed by:   dashboard_gsc_keywords matview (20260603 migration)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.seo_gsc_daily (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site          text        NOT NULL,           -- 'wine-now' | 'liq9'
  keyword       text        NOT NULL,
  metric_date   date        NOT NULL,
  impressions   integer     NOT NULL DEFAULT 0,
  clicks        integer     NOT NULL DEFAULT 0,
  rank_position numeric(8,2),
  ctr           numeric(8,6),                   -- decimal fraction (not percent)
  ingested_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site, keyword, metric_date)
);

CREATE INDEX IF NOT EXISTS seo_gsc_daily_site_date_idx
  ON public.seo_gsc_daily (site, metric_date DESC);

CREATE INDEX IF NOT EXISTS seo_gsc_daily_impr_idx
  ON public.seo_gsc_daily (site, impressions DESC);

-- Anon can't see raw rows; service_role writes; dashboard reads matview only.
GRANT INSERT, UPDATE ON public.seo_gsc_daily TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.seo_gsc_daily_id_seq TO service_role;

-- seo_ga4_daily: raw daily GA4 page metrics per site
CREATE TABLE IF NOT EXISTS public.seo_ga4_daily (
  id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site                 text        NOT NULL,
  page_path            text        NOT NULL,
  metric_date          date        NOT NULL,
  users                integer     NOT NULL DEFAULT 0,
  sessions             integer     NOT NULL DEFAULT 0,
  pageviews            integer     NOT NULL DEFAULT 0,
  bounce_rate          numeric(8,6),
  avg_session_duration numeric(10,2),
  ingested_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site, page_path, metric_date)
);

CREATE INDEX IF NOT EXISTS seo_ga4_daily_site_date_idx
  ON public.seo_ga4_daily (site, metric_date DESC);

GRANT INSERT, UPDATE ON public.seo_ga4_daily TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.seo_ga4_daily_id_seq TO service_role;
