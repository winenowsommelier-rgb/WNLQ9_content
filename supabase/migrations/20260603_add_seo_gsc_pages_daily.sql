-- Page-level Google Search Console data for per-URL ranking attribution.
-- Purely additive: complements the query-level seo_gsc_daily without changing it.
-- Enables the content measurement loop (map a published Magento URL to its
-- impressions/clicks/position over time).

CREATE TABLE IF NOT EXISTS public.seo_gsc_pages_daily (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site              text NOT NULL,
  page_path         text NOT NULL,
  impressions       integer DEFAULT 0,
  clicks            integer DEFAULT 0,
  ctr               numeric DEFAULT 0,
  avg_rank_position numeric DEFAULT 0,
  metric_date       date NOT NULL,
  synced_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_gsc_pages_daily_site_date
  ON public.seo_gsc_pages_daily (site, metric_date);
CREATE INDEX IF NOT EXISTS idx_seo_gsc_pages_daily_page_path
  ON public.seo_gsc_pages_daily (page_path);

ALTER TABLE public.seo_gsc_pages_daily ENABLE ROW LEVEL SECURITY;

-- Note: grants to anon/authenticated are intentionally NOT issued here; see the
-- companion migration 20260603_harden_seo_revoke_anon_grants.sql. The sync writes
-- via service_role, which bypasses RLS.
