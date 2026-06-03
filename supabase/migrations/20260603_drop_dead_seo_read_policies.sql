-- Remove dead "Allow authenticated read" policies on the seo_* tables.
--
-- These policies test `auth.role() = 'authenticated_user'`, but 'authenticated_user'
-- is not a real Postgres/Supabase role (the actual role is 'authenticated'), so the
-- policy never matched and silently failed closed. It only created confusion.
--
-- Context: anon/authenticated grants on these tables were already revoked in
-- 20260603_harden_seo_revoke_anon_grants, and RLS is enabled, so the tables are
-- service_role-only (service_role bypasses RLS). The parallel dashboard does NOT
-- read these base tables — it reads the public.dashboard_* materialized views,
-- which carry their own anon/authenticated SELECT grants. Verified: dropping these
-- policies does not change any working access path.
--
-- Dropping (rather than fixing the typo to 'authenticated') is deliberate: a base-
-- table read path for logged-in users is not wanted under the least-privilege model.

DROP POLICY IF EXISTS "Allow authenticated read" ON public.seo_ga4_daily;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.seo_gsc_daily;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.seo_gsc_pages_daily;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.seo_metrics_snapshot;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.seo_opportunities;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.seo_regression_alerts;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.seo_sync_log;
