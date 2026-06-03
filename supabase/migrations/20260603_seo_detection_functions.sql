-- SEO detection functions (fix: tables were empty because these RPCs never existed)
--
-- The sync edge function calls supabase.rpc("detect_seo_opportunities", ...) and
-- supabase.rpc("detect_seo_regressions", ...), but no migration defined them, so the calls
-- errored silently and seo_opportunities / seo_regression_alerts stayed at 0 rows despite
-- 364k seo_gsc_daily rows. These functions also fix the original design flaw: detection must
-- aggregate over a ROLLING WINDOW, not per keyword-per-day (single-day impressions rarely hit
-- the threshold). Parameter names match exactly what the edge function passes.

-- 1) Opportunities: high windowed impressions but low windowed CTR.
CREATE OR REPLACE FUNCTION detect_seo_opportunities(
  impression_threshold INT DEFAULT 500,
  ctr_threshold FLOAT DEFAULT 0.02,
  window_days INT DEFAULT 28
)
RETURNS TABLE (
  keyword TEXT,
  current_impressions INT,
  current_ctr FLOAT,
  current_position FLOAT,
  priority INT
) AS $$
BEGIN
  -- Retire previously-flagged opportunities; current detection revives the ones still valid.
  UPDATE seo_opportunities
     SET resolved_at = NOW()
   WHERE opportunity_type = 'high_impressions_low_ctr'
     AND resolved_at IS NULL;

  RETURN QUERY
  WITH agg AS (
    SELECT
      g.product_id,
      g.keyword AS kw,
      SUM(g.impressions)::INT AS imp,
      SUM(g.clicks)::INT AS clk,
      (SUM(g.clicks)::FLOAT / NULLIF(SUM(g.impressions), 0)) AS w_ctr,
      (SUM(g.position * g.impressions) / NULLIF(SUM(g.impressions), 0)) AS w_pos
    FROM seo_gsc_daily g
    WHERE g.date >= CURRENT_DATE - window_days
    GROUP BY g.product_id, g.keyword
  ),
  qualifying AS (
    SELECT *
    FROM agg
    WHERE imp >= impression_threshold
      AND w_ctr < ctr_threshold
  )
  INSERT INTO seo_opportunities (
    product_id, keyword, opportunity_type,
    current_position, current_ctr, current_impressions,
    recommended_action, priority, detected_at, resolved_at
  )
  SELECT
    q.product_id, q.kw, 'high_impressions_low_ctr',
    ROUND(q.w_pos::NUMERIC, 1)::FLOAT,
    q.w_ctr, q.imp,
    'Rewrite title/meta to lift CTR: ' || ROUND((q.w_ctr * 100)::NUMERIC, 2)
      || '% CTR on ' || q.imp || ' impressions (avg pos ' || ROUND(q.w_pos::NUMERIC, 1) || ') over last '
      || window_days || ' days',
    CASE WHEN q.imp >= impression_threshold * 2 THEN 2 ELSE 1 END,
    NOW(), NULL
  FROM qualifying q
  ON CONFLICT (product_id, keyword, opportunity_type) DO UPDATE SET
    current_position    = EXCLUDED.current_position,
    current_ctr         = EXCLUDED.current_ctr,
    current_impressions = EXCLUDED.current_impressions,
    recommended_action  = EXCLUDED.recommended_action,
    priority            = EXCLUDED.priority,
    detected_at         = NOW(),
    resolved_at         = NULL
  RETURNING
    seo_opportunities.keyword,
    seo_opportunities.current_impressions,
    seo_opportunities.current_ctr,
    seo_opportunities.current_position,
    seo_opportunities.priority;
END;
$$ LANGUAGE plpgsql;

-- 2) Regressions: compare the recent window vs the prior window of equal length.
-- The recent-vs-prior aggregation is recomputed in each INSERT (two separate statements) to avoid
-- modifying the same table twice within one statement and temp-table plan-cache pitfalls in plpgsql.
CREATE OR REPLACE FUNCTION detect_seo_regressions(
  days INT DEFAULT 7,
  position_drop_threshold FLOAT DEFAULT 3,
  ctr_drop_threshold FLOAT DEFAULT 0.2,
  min_baseline_impressions INT DEFAULT 50
)
RETURNS TABLE (
  keyword TEXT,
  regression_type TEXT,
  previous_value FLOAT,
  current_value FLOAT,
  change_percent FLOAT,
  alert_level TEXT
) AS $$
BEGIN
  -- position drops
  RETURN QUERY
  WITH recent AS (
    SELECT g.product_id, g.keyword AS kw,
           (SUM(g.position * g.impressions) / NULLIF(SUM(g.impressions), 0)) AS pos
    FROM seo_gsc_daily g
    WHERE g.date >= CURRENT_DATE - days
    GROUP BY g.product_id, g.keyword
  ),
  prior AS (
    SELECT g.product_id, g.keyword AS kw,
           SUM(g.impressions)::INT AS imp,
           (SUM(g.position * g.impressions) / NULLIF(SUM(g.impressions), 0)) AS pos
    FROM seo_gsc_daily g
    WHERE g.date >= CURRENT_DATE - (days * 2) AND g.date < CURRENT_DATE - days
    GROUP BY g.product_id, g.keyword
  ),
  joined AS (
    SELECT r.product_id, r.kw, r.pos AS r_pos, p.pos AS p_pos
    FROM recent r JOIN prior p ON p.product_id = r.product_id AND p.kw = r.kw
    WHERE p.imp >= min_baseline_impressions AND r.pos > p.pos + position_drop_threshold
  )
  INSERT INTO seo_regression_alerts (
    product_id, keyword, regression_type, metric_name,
    previous_value, current_value, change_percent, days_monitored, alert_level, resolved_at
  )
  SELECT product_id, kw, 'position_drop', 'avg_position',
         ROUND(p_pos::NUMERIC, 1)::FLOAT, ROUND(r_pos::NUMERIC, 1)::FLOAT,
         ROUND(((r_pos - p_pos) / NULLIF(p_pos, 0) * 100)::NUMERIC, 2)::FLOAT,
         days,
         CASE WHEN r_pos > p_pos + position_drop_threshold * 2 THEN 'critical' ELSE 'warning' END,
         NULL
  FROM joined
  ON CONFLICT (product_id, keyword, regression_type) DO UPDATE SET
    previous_value = EXCLUDED.previous_value,
    current_value  = EXCLUDED.current_value,
    change_percent = EXCLUDED.change_percent,
    alert_level    = EXCLUDED.alert_level,
    alert_sent     = FALSE,
    resolved_at    = NULL
  RETURNING seo_regression_alerts.keyword, seo_regression_alerts.regression_type,
            seo_regression_alerts.previous_value, seo_regression_alerts.current_value,
            seo_regression_alerts.change_percent, seo_regression_alerts.alert_level;

  -- CTR drops
  RETURN QUERY
  WITH recent AS (
    SELECT g.product_id, g.keyword AS kw,
           (SUM(g.clicks)::FLOAT / NULLIF(SUM(g.impressions), 0)) AS ctr
    FROM seo_gsc_daily g
    WHERE g.date >= CURRENT_DATE - days
    GROUP BY g.product_id, g.keyword
  ),
  prior AS (
    SELECT g.product_id, g.keyword AS kw,
           SUM(g.impressions)::INT AS imp,
           (SUM(g.clicks)::FLOAT / NULLIF(SUM(g.impressions), 0)) AS ctr
    FROM seo_gsc_daily g
    WHERE g.date >= CURRENT_DATE - (days * 2) AND g.date < CURRENT_DATE - days
    GROUP BY g.product_id, g.keyword
  ),
  joined AS (
    SELECT r.product_id, r.kw, r.ctr AS r_ctr, p.ctr AS p_ctr
    FROM recent r JOIN prior p ON p.product_id = r.product_id AND p.kw = r.kw
    WHERE p.imp >= min_baseline_impressions AND p.ctr > 0
      AND r.ctr < p.ctr * (1 - ctr_drop_threshold)
  )
  INSERT INTO seo_regression_alerts (
    product_id, keyword, regression_type, metric_name,
    previous_value, current_value, change_percent, days_monitored, alert_level, resolved_at
  )
  SELECT product_id, kw, 'ctr_drop', 'ctr',
         ROUND(p_ctr::NUMERIC, 4)::FLOAT, ROUND(r_ctr::NUMERIC, 4)::FLOAT,
         ROUND(((r_ctr - p_ctr) / NULLIF(p_ctr, 0) * 100)::NUMERIC, 2)::FLOAT,
         days,
         CASE WHEN r_ctr < p_ctr * 0.5 THEN 'critical' ELSE 'warning' END,
         NULL
  FROM joined
  ON CONFLICT (product_id, keyword, regression_type) DO UPDATE SET
    previous_value = EXCLUDED.previous_value,
    current_value  = EXCLUDED.current_value,
    change_percent = EXCLUDED.change_percent,
    alert_level    = EXCLUDED.alert_level,
    alert_sent     = FALSE,
    resolved_at    = NULL
  RETURNING seo_regression_alerts.keyword, seo_regression_alerts.regression_type,
            seo_regression_alerts.previous_value, seo_regression_alerts.current_value,
            seo_regression_alerts.change_percent, seo_regression_alerts.alert_level;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_seo_opportunities IS 'Windowed (default 28d) high-impression low-CTR detection; upserts seo_opportunities. Called by sync-gsc-ga4.';
COMMENT ON FUNCTION detect_seo_regressions  IS 'Compares recent vs prior window (default 7d each); upserts seo_regression_alerts. Called by sync-gsc-ga4.';
