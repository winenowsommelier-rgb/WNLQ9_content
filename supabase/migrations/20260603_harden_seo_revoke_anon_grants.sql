-- Least-privilege hardening for the seo_* tables.
--
-- Background: a security audit found anon + authenticated held ALL privileges
-- (SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER) on every seo_* table,
-- including seo_config (which historically held secrets). RLS was the only thing
-- preventing exploitation, and the existing SELECT policies referenced a
-- non-existent role string ('authenticated_user'), so they fail-closed by accident.
--
-- This migration removes the latent risk by stripping all anon/authenticated grants.
-- The data pipeline uses service_role (which bypasses both grants and RLS), so this
-- is non-breaking. service_role grants are intentionally left intact.
--
-- NOT done here (left for the team, depends on whether a dashboard reads these):
--   * fixing the 'authenticated_user' policy typo
--   * granting narrow SELECT to a real authenticated dashboard role

REVOKE ALL PRIVILEGES ON
  public.seo_config,
  public.seo_ga4_daily,
  public.seo_gsc_daily,
  public.seo_gsc_pages_daily,
  public.seo_metrics_snapshot,
  public.seo_opportunities,
  public.seo_regression_alerts,
  public.seo_sync_log
FROM anon, authenticated;

-- seo_config historically held secrets; force RLS even for the table owner.
ALTER TABLE public.seo_config FORCE ROW LEVEL SECURITY;
