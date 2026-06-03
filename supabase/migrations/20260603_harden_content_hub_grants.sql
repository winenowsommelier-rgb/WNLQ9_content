-- Harden the dashboard's content_hub_* tables to least privilege.
--
-- These tables (created by the parallel dashboard work, migration content_hub_schema)
-- granted anon AND authenticated the full set of privileges — SELECT, INSERT, UPDATE,
-- DELETE, TRUNCATE, REFERENCES, TRIGGER. That means an anonymous visitor could mutate
-- or truncate the dashboard's content. This is the same anti-pattern that was removed
-- from the seo_* tables in 20260603_harden_seo_revoke_anon_grants.
--
-- We keep SELECT for anon/authenticated (the dashboard reads these client-side) and
-- revoke everything else. Writes are expected to happen via service_role (which bypasses
-- grants), matching the rest of the pipeline. If the dashboard turns out to write via
-- anon/authenticated, restore the specific privilege it needs rather than the whole set.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.content_hub_articles, public.content_hub_runs
  FROM anon, authenticated;
