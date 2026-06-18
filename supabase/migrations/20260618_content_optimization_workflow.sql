-- Create table to store optimization recommendations and track status
create table if not exists seo_content_optimizations (
  id uuid primary key default gen_random_uuid(),
  site text not null,
  keyword text not null,
  current_title text,
  current_description text,
  opportunity_type text,
  current_ctr double precision,
  current_impressions integer,
  current_rank_position integer,

  -- AI-generated variants
  suggested_title_1 text,
  suggested_title_1_reasoning text,
  suggested_title_2 text,
  suggested_title_2_reasoning text,
  suggested_title_3 text,
  suggested_title_3_reasoning text,

  suggested_desc_1 text,
  suggested_desc_1_reasoning text,
  suggested_desc_2 text,
  suggested_desc_2_reasoning text,
  suggested_desc_3 text,
  suggested_desc_3_reasoning text,

  expected_ctr_lift double precision,
  expected_impact_score integer,
  priority text,

  -- Implementation tracking
  selected_title text,
  selected_description text,
  status text default 'pending', -- pending, approved, applied, monitoring, completed
  applied_at timestamp,
  applied_by text,

  -- Results tracking
  ctr_before double precision,
  ctr_after double precision,
  ctr_improvement_percent double precision,
  impressions_before integer,
  impressions_after integer,
  clicks_gained integer,

  -- Metadata
  generated_at timestamp default now(),
  updated_at timestamp default now(),
  notes text,

  unique(site, keyword)
);

-- Index for fast lookups
create index if not exists idx_optimizations_status on seo_content_optimizations(status, site);
create index if not exists idx_optimizations_priority on seo_content_optimizations(priority, expected_impact_score desc);

-- Trigger to update updated_at
create or replace function update_optimization_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_optimization_updated
before update on seo_content_optimizations
for each row
execute function update_optimization_timestamp();

-- RPC to apply optimization (update product with selected variants)
create or replace function apply_optimization(
  optimization_id uuid,
  applied_title text,
  applied_desc text,
  applied_by_user text
) returns json
language plpgsql
as $$
declare
  v_result json;
begin
  update seo_content_optimizations
  set
    selected_title = applied_title,
    selected_description = applied_desc,
    status = 'applied',
    applied_at = now(),
    applied_by = applied_by_user
  where id = optimization_id;

  select json_build_object(
    'status', 'success',
    'message', 'Optimization applied successfully'
  ) into v_result;

  return v_result;
end;
$$;

-- RPC to track CTR improvement (called daily by monitoring function)
create or replace function track_optimization_results(
  p_site text,
  p_keyword text,
  p_new_ctr double precision,
  p_new_impressions integer
) returns json
language plpgsql
as $$
declare
  v_ctr_before double precision;
  v_improvement_percent double precision;
  v_clicks_before integer;
  v_clicks_after integer;
begin
  -- Get baseline
  select current_ctr, current_impressions
  into v_ctr_before, v_clicks_before
  from seo_content_optimizations
  where site = p_site and keyword = p_keyword and status = 'applied';

  -- Calculate improvement
  v_clicks_before := (v_clicks_before::float / 100 * v_ctr_before * 100)::integer;
  v_clicks_after := (p_new_impressions::float / 100 * p_new_ctr * 100)::integer;
  v_improvement_percent := ((p_new_ctr - v_ctr_before) / nullif(v_ctr_before, 0) * 100);

  -- Update with results
  update seo_content_optimizations
  set
    ctr_before = v_ctr_before,
    ctr_after = p_new_ctr,
    ctr_improvement_percent = v_improvement_percent,
    impressions_before = v_clicks_before,
    impressions_after = p_new_impressions,
    clicks_gained = v_clicks_after - v_clicks_before,
    status = case when v_improvement_percent > 0 then 'completed' else 'monitoring' end
  where site = p_site and keyword = p_keyword and status = 'applied';

  return json_build_object(
    'status', 'success',
    'ctr_improvement_percent', v_improvement_percent,
    'clicks_gained', v_clicks_after - v_clicks_before
  );
end;
$$;
