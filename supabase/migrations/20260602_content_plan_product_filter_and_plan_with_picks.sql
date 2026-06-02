-- Content plan <-> product picks join layer.
-- Target project: "WNLQ9 PI DB" (holds products, content_plan, pick_products()).
--
-- Adds a per-row product_filter (the pick_products() args) and a single RPC,
-- plan_with_picks(), that returns each plan row in a Day range with its top
-- in-stock product suggestions attached — the query-time join the /api/plan
-- endpoint calls.

-- Per-row product selection args for pick_products(). '{}' => site-only top picks.
alter table public.content_plan
  add column if not exists product_filter jsonb not null default '{}'::jsonb;

create index if not exists idx_content_plan_day_site on public.content_plan (day, site);

-- Returns each plan row (as jsonb) in a Day range (+ optional site) with a
-- `picks` array of top in-stock products, ranked by commercial_score via
-- pick_products(). product_filter keys map 1:1 onto pick_products() params.
create or replace function public.plan_with_picks(
  p_day_from int  default null,
  p_day_to   int  default null,
  p_site     text default null,
  p_picks    int  default 4
) returns setof jsonb
language sql
stable
as $$
  select to_jsonb(cp) || jsonb_build_object(
    'picks',
    coalesce((
      select jsonb_agg(to_jsonb(pp))
      from public.pick_products(
        p_site      => cp.site,
        p_styles    => case
                         when jsonb_typeof(cp.product_filter -> 'styles') = 'array'
                         then array(select jsonb_array_elements_text(cp.product_filter -> 'styles'))
                         else null
                       end,
        p_grape     => cp.product_filter ->> 'grape',
        p_food      => cp.product_filter ->> 'food',
        p_name      => cp.product_filter ->> 'name',
        p_country   => cp.product_filter ->> 'country',
        p_price_min => nullif(cp.product_filter ->> 'price_min', '')::numeric,
        p_price_max => nullif(cp.product_filter ->> 'price_max', '')::numeric,
        p_limit     => p_picks
      ) pp
    ), '[]'::jsonb)
  )
  from public.content_plan cp
  where (p_day_from is null or cp.day >= p_day_from)
    and (p_day_to   is null or cp.day <= p_day_to)
    and (p_site     is null or cp.site = p_site)
  order by cp.day nulls last, cp.site;
$$;

grant execute on function public.plan_with_picks(int, int, text, int)
  to service_role, authenticated, anon;
