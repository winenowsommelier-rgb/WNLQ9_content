-- SEO Automation — TRUE PRODUCTION BASELINE  (captured 2026-06-03, project asnarjokyedupsjipzkl)
-- =============================================================================
-- PURPOSE: Authoritative schema capture.  The earlier migration
--   20260531_seo_monitoring_schema.sql was written BEFORE the live schema
--   diverged and no longer reflects production (wrong column names, missing
--   tables, broken RLS policies).  This file supersedes it for recreation
--   purposes.
--
-- WHAT CHANGED vs 20260531:
--   seo_gsc_daily    — col names: position→rank_position, avg_position→avg_rank_position,
--                      date→metric_date; added site column; added idx_gsc_site_date.
--   seo_ga4_daily    — date→metric_date; added site column; added idx_ga4_site_date.
--   seo_gsc_pages_daily — NEW table (did not exist in the old migration).
--   seo_config       — NEW table (config key/value store read by the Edge Function).
--   seo_opportunities — current_position→current_rank_position; priority→priority_level.
--   seo_regression_alerts — structure unchanged except site column (added by
--                      20260603_seo_detectors_daily.sql, not here).
--   seo_metrics_snapshot — avg_position→avg_rank_position.
--   RLS policies      — old migration used auth.role()='authenticated_user' (invalid);
--                       production has no policies on data tables (service_role bypass
--                       is sufficient for the sync Edge Function); seo_config has a
--                       separate "Service role read all" policy.
--   Detector RPCs     — detect_seo_opportunities / detect_seo_regressions are defined
--                       in 20260603_seo_detectors_daily.sql, not here.
--
-- IDEMPOTENT: all statements use IF NOT EXISTS / OR REPLACE.
-- Apply via:  supabase db push   (or apply_migration via MCP)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. seo_config  —  key/value store; read by the Edge Function at startup.
--    GSC_SITE_URL, GSC_SITE_URL_LIQ9, GA4_PROPERTY_ID, GA4_PROPERTY_ID_LIQ9.
-- ---------------------------------------------------------------------------
create table if not exists seo_config (
  id            bigserial primary key,
  config_key    text      not null,
  config_value  text      not null,
  is_secret     boolean            default false,
  created_at    timestamp          default current_timestamp,
  updated_at    timestamp          default current_timestamp,
  unique (config_key)
);

create unique index if not exists seo_config_config_key_key
  on seo_config (config_key);

alter table seo_config enable row level security;

-- Only service_role reads config (it holds non-secret values; secrets stay in Vault).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'seo_config'
      and policyname = 'Service role read all'
  ) then
    execute $p$
      create policy "Service role read all" on seo_config
        for select using (auth.role() = 'service_role')
    $p$;
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- 2. seo_gsc_daily  —  per-day GSC keyword metrics (site × keyword × date).
--    product_id is NULL for site-level rows (wine-now / liq9).
--    The unique constraint includes product_id; since it is always NULL for
--    site data, it does NOT enforce per-site uniqueness — the Edge Function
--    uses range-delete before insert to keep rows clean.
-- ---------------------------------------------------------------------------
create table if not exists seo_gsc_daily (
  id               bigserial primary key,
  product_id       bigint,
  keyword          text              not null,
  rank_position    double precision  not null,
  impressions      integer                    default 0,
  clicks           integer                    default 0,
  ctr              double precision           default 0,
  avg_rank_position double precision          default 0,
  metric_date      date              not null,
  synced_at        timestamp                  default current_timestamp,
  site             text,
  unique (product_id, keyword, metric_date)
);

create index if not exists idx_gsc_daily_keyword
  on seo_gsc_daily (keyword);
create index if not exists idx_gsc_daily_product_date
  on seo_gsc_daily (product_id, metric_date desc);
create index if not exists idx_gsc_site_date
  on seo_gsc_daily (site, metric_date);

alter table seo_gsc_daily enable row level security;

-- ---------------------------------------------------------------------------
-- 3. seo_gsc_pages_daily  —  per-day GSC page-level metrics (site × page × date).
--    id uses GENERATED ALWAYS AS IDENTITY (not a sequence default).
--    No unique constraint — range-delete before insert handles idempotency.
--    ctr / avg_rank_position are NUMERIC here (vs DOUBLE PRECISION elsewhere).
-- ---------------------------------------------------------------------------
create table if not exists seo_gsc_pages_daily (
  id               bigint generated always as identity primary key,
  site             text    not null,
  page_path        text    not null,
  impressions      integer          default 0,
  clicks           integer          default 0,
  ctr              numeric          default 0,
  avg_rank_position numeric         default 0,
  metric_date      date    not null,
  synced_at        timestamptz      default now()
);

create index if not exists idx_seo_gsc_pages_daily_page_path
  on seo_gsc_pages_daily (page_path);
create index if not exists idx_seo_gsc_pages_daily_site_date
  on seo_gsc_pages_daily (site, metric_date);

alter table seo_gsc_pages_daily enable row level security;

-- ---------------------------------------------------------------------------
-- 4. seo_ga4_daily  —  per-day GA4 page metrics (site × page_path × date).
--    Same null product_id / range-delete pattern as seo_gsc_daily.
-- ---------------------------------------------------------------------------
create table if not exists seo_ga4_daily (
  id                   bigserial primary key,
  product_id           bigint,
  page_path            text              not null,
  users                integer                    default 0,
  sessions             integer                    default 0,
  pageviews            integer                    default 0,
  bounce_rate          double precision           default 0,
  avg_session_duration double precision           default 0,
  goal_completions     integer                    default 0,
  conversion_rate      double precision           default 0,
  metric_date          date              not null,
  synced_at            timestamp                  default current_timestamp,
  site                 text,
  unique (product_id, page_path, metric_date)
);

create index if not exists idx_ga4_daily_page
  on seo_ga4_daily (page_path);
create index if not exists idx_ga4_daily_product_date
  on seo_ga4_daily (product_id, metric_date desc);
create index if not exists idx_ga4_site_date
  on seo_ga4_daily (site, metric_date);

alter table seo_ga4_daily enable row level security;

-- ---------------------------------------------------------------------------
-- 5. seo_opportunities  —  auto-detected keyword opportunities.
--    site column + ux_seo_opportunities_site_kw_type index are added by
--    20260603_seo_detectors_daily.sql (ADD COLUMN IF NOT EXISTS / IF NOT EXISTS
--    index), so they are safe to include here as well for fresh-install.
-- ---------------------------------------------------------------------------
create table if not exists seo_opportunities (
  id                   bigserial primary key,
  product_id           bigint,
  keyword              text     not null,
  opportunity_type     text     not null,
  current_rank_position double precision,
  current_ctr          double precision,
  current_impressions  integer,
  recommended_action   text,
  priority_level       integer           default 0,
  detected_at          timestamp         default current_timestamp,
  resolved_at          timestamp,
  site                 text,
  unique (product_id, keyword, opportunity_type)
);

create unique index if not exists ux_seo_opportunities_site_kw_type
  on seo_opportunities (site, keyword, opportunity_type);
create index if not exists idx_opportunities_product
  on seo_opportunities (product_id);
create index if not exists idx_opportunities_priority
  on seo_opportunities (priority_level desc);
create index if not exists idx_opportunities_unresolved
  on seo_opportunities (resolved_at)
  where resolved_at is null;

alter table seo_opportunities enable row level security;

-- ---------------------------------------------------------------------------
-- 6. seo_regression_alerts  —  position/CTR regression signals.
--    site column + ux_seo_regression_site_kw_type are similarly safe to
--    include here — 20260603_seo_detectors_daily.sql is idempotent on them.
-- ---------------------------------------------------------------------------
create table if not exists seo_regression_alerts (
  id              bigserial primary key,
  product_id      bigint,
  keyword         text              not null,
  regression_type text              not null,
  metric_name     text,
  previous_value  double precision,
  current_value   double precision,
  change_percent  double precision,
  days_monitored  integer                    default 7,
  alert_level     text                       default 'warning',
  alert_sent      boolean                    default false,
  alert_sent_at   timestamp,
  resolved_at     timestamp,
  site            text,
  unique (product_id, keyword, regression_type)
);

create unique index if not exists ux_seo_regression_site_kw_type
  on seo_regression_alerts (site, keyword, regression_type);
create index if not exists idx_regression_product
  on seo_regression_alerts (product_id);
create index if not exists idx_regression_unresolved
  on seo_regression_alerts (alert_sent, resolved_at)
  where resolved_at is null;

alter table seo_regression_alerts enable row level security;

-- ---------------------------------------------------------------------------
-- 7. seo_metrics_snapshot  —  30/90/180-day rolling snapshot aggregates.
-- ---------------------------------------------------------------------------
create table if not exists seo_metrics_snapshot (
  id               bigserial primary key,
  product_id       bigint,
  snapshot_period  text     not null,
  avg_rank_position double precision,
  avg_ctr          double precision,
  total_impressions integer,
  total_clicks      integer,
  avg_users         integer,
  avg_sessions      integer,
  snapshot_date    date     not null,
  unique (product_id, snapshot_period, snapshot_date)
);

create index if not exists idx_snapshot_product
  on seo_metrics_snapshot (product_id, snapshot_period);

alter table seo_metrics_snapshot enable row level security;

-- ---------------------------------------------------------------------------
-- 8. seo_sync_log  —  audit trail for all GSC / GA4 sync runs.
-- ---------------------------------------------------------------------------
create table if not exists seo_sync_log (
  id               bigserial primary key,
  sync_type        text     not null,
  records_imported integer           default 0,
  records_updated  integer           default 0,
  sync_date        date,
  started_at       timestamp         default current_timestamp,
  completed_at     timestamp,
  status           text              default 'pending',
  error_message    text,
  notes            text
);

alter table seo_sync_log enable row level security;

-- ---------------------------------------------------------------------------
-- Table comments
-- ---------------------------------------------------------------------------
comment on table seo_config         is 'Key/value config for the sync Edge Function (GSC sites, GA4 property IDs).';
comment on table seo_gsc_daily      is 'Per-day GSC keyword metrics (rank, impressions, CTR) — site × keyword × metric_date.';
comment on table seo_gsc_pages_daily is 'Per-day GSC page-level metrics — site × page_path × metric_date.';
comment on table seo_ga4_daily      is 'Per-day GA4 page metrics (users, sessions, conversions) — site × page_path × metric_date.';
comment on table seo_opportunities  is 'Auto-detected SEO quick wins: high-impression/low-CTR keywords and page-2 positions.';
comment on table seo_regression_alerts is 'Position and CTR regressions detected by comparing rolling windows.';
comment on table seo_metrics_snapshot is '30/90/180-day rolling snapshot aggregates for trend analysis.';
comment on table seo_sync_log       is 'Audit trail of all GSC/GA4 sync runs with status and record counts.';
