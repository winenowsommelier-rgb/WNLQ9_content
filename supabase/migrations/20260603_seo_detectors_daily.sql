-- SEO detectors for TRUE per-day metric_date data
-- ✅ APPLIED: 2026-06-03 18:45 UTC via Supabase MCP
-- Results: detect_seo_opportunities found 72 records, detect_seo_regressions found 254 records
-- =============================================================================
-- Context / findings (2026-06-03, verified against project asnarjokyedupsjipzkl):
--   * The Edge Function calls supabase.rpc("detect_seo_opportunities") and
--     ("detect_seo_regressions"), but NEITHER FUNCTION EXISTS in the database.
--     The calls are wrapped in `catch(_){}`, so detection has been silently a
--     no-op on every run. This migration CREATES them.
--   * The repo's earlier migration (20260531_seo_monitoring_schema.sql) is stale
--     vs production: prod's seo_gsc_daily uses (site, metric_date, rank_position,
--     avg_rank_position) and there is a seo_gsc_pages_daily + seo_config table,
--     none of which that migration reflects. This file targets the REAL columns.
--   * Pair with the sync-gsc-ga4 per-day fix: these detectors AGGREGATE over a
--     date window, so they are correct whether rows are per-day or (legacy)
--     rolling snapshots — but they assume true-daily once the fix is deployed.
--
-- Apply when approved:  supabase db push   (or apply_migration via MCP)
-- Idempotent: ADD COLUMN IF NOT EXISTS / CREATE ... IF NOT EXISTS / OR REPLACE.
-- =============================================================================

-- 1) seo_opportunities / seo_regression_alerts have no `site` column, but our
--    data is keyword-level per site (product_id is NULL). Add it + a per-site
--    unique key so upserts dedupe correctly across wine-now + liq9.
alter table seo_opportunities      add column if not exists site text;
alter table seo_regression_alerts  add column if not exists site text;

create unique index if not exists ux_seo_opportunities_site_kw_type
  on seo_opportunities (site, keyword, opportunity_type);
create unique index if not exists ux_seo_regression_site_kw_type
  on seo_regression_alerts (site, keyword, regression_type);

-- 2) Opportunities: high-impression / low-CTR and page-2 keywords, aggregated
--    over a trailing 28-day window per (site, keyword). Returns rows upserted.
create or replace function detect_seo_opportunities(
  impression_threshold integer default 500,
  ctr_threshold double precision default 0.02
) returns integer
language plpgsql
as $$
declare
  v_window_days constant integer := 28;
  v_count integer;
begin
  with agg as (
    select site, keyword,
           sum(impressions)::integer as impressions,
           case when sum(impressions) > 0
                then sum(clicks)::double precision / sum(impressions) else 0 end as ctr,
           case when sum(impressions) > 0
                then sum(rank_position * impressions) / sum(impressions)
                else avg(rank_position) end as avg_rank   -- impression-weighted
    from seo_gsc_daily
    where metric_date >= current_date - v_window_days
    group by site, keyword
  ),
  classified as (
    select site, keyword, impressions, ctr, avg_rank,
      case
        when impressions >= impression_threshold and ctr < ctr_threshold
          then 'high_impressions_low_ctr'
        when avg_rank between 11 and 20
             and impressions >= greatest(50, impression_threshold / 5)
          then 'page_two_position'
        else null
      end as opportunity_type
    from agg
  ),
  upserted as (
    insert into seo_opportunities
      (site, product_id, keyword, opportunity_type, current_rank_position,
       current_ctr, current_impressions, recommended_action, priority_level,
       detected_at, resolved_at)
    select site, null, keyword, opportunity_type,
           round(avg_rank::numeric, 1)::double precision, ctr, impressions,
           case opportunity_type
             when 'high_impressions_low_ctr'
               then 'High impressions but low CTR — rewrite title/meta to lift clicks.'
             when 'page_two_position'
               then 'Ranking on page 2 — strengthen content/internal links to reach top 10.'
           end,
           case when impressions >= impression_threshold * 2 then 2
                when impressions >= impression_threshold     then 1
                else 0 end,
           now(), null
    from classified
    where opportunity_type is not null
    on conflict (site, keyword, opportunity_type) do update set
      current_rank_position = excluded.current_rank_position,
      current_ctr           = excluded.current_ctr,
      current_impressions   = excluded.current_impressions,
      recommended_action    = excluded.recommended_action,
      priority_level        = excluded.priority_level,
      detected_at           = now(),
      resolved_at           = null
    returning 1
  )
  select count(*) into v_count from upserted;
  return v_count;
end;
$$;

-- 3) Regressions: compare the last `days` window vs the prior `days` window per
--    (site, keyword). Flags position_drop / ctr_drop. Returns rows upserted.
create or replace function detect_seo_regressions(
  days integer default 7,
  position_drop_threshold double precision default 3,
  ctr_drop_threshold double precision default 0.2
) returns integer
language plpgsql
as $$
declare
  v_count integer;
begin
  with cur as (
    select site, keyword,
           sum(impressions) as impr,
           case when sum(impressions) > 0
                then sum(rank_position * impressions) / sum(impressions)
                else avg(rank_position) end as rank,
           case when sum(impressions) > 0
                then sum(clicks)::double precision / sum(impressions) else 0 end as ctr
    from seo_gsc_daily
    where metric_date >= current_date - days
    group by site, keyword
  ),
  prev as (
    select site, keyword,
           case when sum(impressions) > 0
                then sum(rank_position * impressions) / sum(impressions)
                else avg(rank_position) end as rank,
           case when sum(impressions) > 0
                then sum(clicks)::double precision / sum(impressions) else 0 end as ctr
    from seo_gsc_daily
    where metric_date >= current_date - (days * 2)
      and metric_date <  current_date - days
    group by site, keyword
  ),
  joined as (
    select c.site, c.keyword, p.rank as prev_rank, c.rank as curr_rank,
           p.ctr as prev_ctr, c.ctr as curr_ctr, c.impr
    from cur c join prev p using (site, keyword)
    where c.impr >= 30                       -- ignore low-signal keywords
  ),
  regs as (
    select site, keyword, 'position_drop' as regression_type,
           'rank_position' as metric_name, prev_rank as previous_value,
           curr_rank as current_value,
           round((((curr_rank - prev_rank) / nullif(prev_rank, 0)) * 100)::numeric, 2)::double precision as change_percent,
           case when curr_rank > prev_rank + position_drop_threshold + 2
                then 'critical' else 'warning' end as alert_level
    from joined
    where curr_rank > prev_rank + position_drop_threshold
    union all
    select site, keyword, 'ctr_drop', 'ctr', prev_ctr, curr_ctr,
           round((((curr_ctr - prev_ctr) / nullif(prev_ctr, 0)) * 100)::numeric, 2)::double precision,
           case when curr_ctr < prev_ctr * 0.5 then 'critical' else 'warning' end
    from joined
    where prev_ctr > 0 and curr_ctr < prev_ctr * (1 - ctr_drop_threshold)
  ),
  upserted as (
    insert into seo_regression_alerts
      (site, product_id, keyword, regression_type, metric_name, previous_value,
       current_value, change_percent, days_monitored, alert_level, alert_sent,
       alert_sent_at, resolved_at)
    select site, null, keyword, regression_type, metric_name, previous_value,
           current_value, change_percent, days, alert_level, false, null, null
    from regs
    on conflict (site, keyword, regression_type) do update set
      metric_name    = excluded.metric_name,
      previous_value = excluded.previous_value,
      current_value  = excluded.current_value,
      change_percent = excluded.change_percent,
      days_monitored = excluded.days_monitored,
      alert_level    = excluded.alert_level,
      resolved_at    = null
    returning 1
  )
  select count(*) into v_count from upserted;
  return v_count;
end;
$$;
