-- SEO Performance Monitoring Schema
-- Phase 1: GSC/GA4 Rank Tracking + Opportunity Detection

-- 1. Daily GSC keyword performance (Google Search Console)
CREATE TABLE IF NOT EXISTS seo_gsc_daily (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  position FLOAT NOT NULL,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  ctr FLOAT DEFAULT 0,
  avg_position FLOAT DEFAULT 0,
  date DATE NOT NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, keyword, date)
);

CREATE INDEX idx_gsc_daily_product_date ON seo_gsc_daily(product_id, date DESC);
CREATE INDEX idx_gsc_daily_keyword ON seo_gsc_daily(keyword);

-- 2. Daily GA4 page performance (Google Analytics)
CREATE TABLE IF NOT EXISTS seo_ga4_daily (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  users INT DEFAULT 0,
  sessions INT DEFAULT 0,
  pageviews INT DEFAULT 0,
  bounce_rate FLOAT DEFAULT 0,
  avg_session_duration FLOAT DEFAULT 0,
  goal_completions INT DEFAULT 0,
  conversion_rate FLOAT DEFAULT 0,
  date DATE NOT NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, page_path, date)
);

CREATE INDEX idx_ga4_daily_product_date ON seo_ga4_daily(product_id, date DESC);
CREATE INDEX idx_ga4_daily_page ON seo_ga4_daily(page_path);

-- 3. SEO Opportunity Detection (high-impression, low-CTR keywords to fix)
CREATE TABLE IF NOT EXISTS seo_opportunities (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  opportunity_type TEXT NOT NULL, -- 'high_impressions_low_ctr', 'low_position', 'declining_rank'
  current_position FLOAT,
  current_ctr FLOAT,
  current_impressions INT,
  recommended_action TEXT,
  priority INT DEFAULT 0, -- 0=low, 1=medium, 2=high
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  UNIQUE(product_id, keyword, opportunity_type)
);

CREATE INDEX idx_opportunities_product ON seo_opportunities(product_id);
CREATE INDEX idx_opportunities_priority ON seo_opportunities(priority DESC);
CREATE INDEX idx_opportunities_unresolved ON seo_opportunities(resolved_at) WHERE resolved_at IS NULL;

-- 4. SEO Regression Alerts (automated detection)
CREATE TABLE IF NOT EXISTS seo_regression_alerts (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  regression_type TEXT NOT NULL, -- 'position_drop', 'ctr_drop', 'impressions_drop'
  metric_name TEXT,
  previous_value FLOAT,
  current_value FLOAT,
  change_percent FLOAT,
  days_monitored INT DEFAULT 7,
  alert_level TEXT DEFAULT 'warning', -- 'warning', 'critical'
  alert_sent BOOLEAN DEFAULT FALSE,
  alert_sent_at TIMESTAMP,
  resolved_at TIMESTAMP,
  UNIQUE(product_id, keyword, regression_type)
);

CREATE INDEX idx_regression_product ON seo_regression_alerts(product_id);
CREATE INDEX idx_regression_unresolved ON seo_regression_alerts(alert_sent, resolved_at)
  WHERE resolved_at IS NULL;

-- 5. SEO Metrics Baseline (30-90-180 day snapshots for trend analysis)
CREATE TABLE IF NOT EXISTS seo_metrics_snapshot (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  snapshot_period TEXT NOT NULL, -- '30d', '90d', '180d'
  avg_position FLOAT,
  avg_ctr FLOAT,
  total_impressions INT,
  total_clicks INT,
  avg_users INT,
  avg_sessions INT,
  snapshot_date DATE NOT NULL,
  UNIQUE(product_id, snapshot_period, snapshot_date)
);

CREATE INDEX idx_snapshot_product ON seo_metrics_snapshot(product_id, snapshot_period);

-- 6. SEO Sync Log (audit trail for all imports)
CREATE TABLE IF NOT EXISTS seo_sync_log (
  id BIGSERIAL PRIMARY KEY,
  sync_type TEXT NOT NULL, -- 'gsc', 'ga4', 'rank_check'
  records_imported INT DEFAULT 0,
  records_updated INT DEFAULT 0,
  sync_date DATE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  error_message TEXT,
  notes TEXT
);

-- Helper function: Calculate opportunity score (0-100)
CREATE OR REPLACE FUNCTION seo_opportunity_score(
  impressions INT,
  ctr FLOAT,
  position FLOAT
) RETURNS INT AS $$
BEGIN
  -- High impressions (>500) but low CTR (<2%) = high opportunity
  -- Position >10 with any impressions = medium opportunity
  RETURN CASE
    WHEN impressions > 500 AND ctr < 0.02 THEN 90
    WHEN impressions > 300 AND ctr < 0.03 THEN 75
    WHEN position > 10 AND impressions > 100 THEN 60
    WHEN position > 15 AND impressions > 50 THEN 50
    ELSE 10
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function: Detect regressions (position drop >3, CTR drop >20%)
CREATE OR REPLACE FUNCTION detect_seo_regression(
  prev_position FLOAT,
  curr_position FLOAT,
  prev_ctr FLOAT,
  curr_ctr FLOAT
) RETURNS TABLE (regression_type TEXT, severity TEXT, change_pct FLOAT) AS $$
BEGIN
  -- Position dropped >3 places
  IF curr_position > prev_position + 3 THEN
    RETURN QUERY SELECT
      'position_drop'::TEXT,
      CASE WHEN curr_position > prev_position + 5 THEN 'critical' ELSE 'warning' END,
      ROUND(((curr_position - prev_position) / prev_position * 100)::NUMERIC, 2)::FLOAT;
  END IF;

  -- CTR dropped >20%
  IF prev_ctr > 0 AND curr_ctr < prev_ctr * 0.8 THEN
    RETURN QUERY SELECT
      'ctr_drop'::TEXT,
      CASE WHEN curr_ctr < prev_ctr * 0.5 THEN 'critical' ELSE 'warning' END,
      ROUND((((curr_ctr - prev_ctr) / prev_ctr) * 100)::NUMERIC, 2)::FLOAT;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- RLS: Enable for monitoring tables (read-only for app, write-only for sync function)
ALTER TABLE seo_gsc_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_ga4_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_regression_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_metrics_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_sync_log ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read
CREATE POLICY "Allow authenticated read" ON seo_gsc_daily
  FOR SELECT USING (auth.role() = 'authenticated_user');
CREATE POLICY "Allow authenticated read" ON seo_ga4_daily
  FOR SELECT USING (auth.role() = 'authenticated_user');
CREATE POLICY "Allow authenticated read" ON seo_opportunities
  FOR SELECT USING (auth.role() = 'authenticated_user');
CREATE POLICY "Allow authenticated read" ON seo_regression_alerts
  FOR SELECT USING (auth.role() = 'authenticated_user');
CREATE POLICY "Allow authenticated read" ON seo_metrics_snapshot
  FOR SELECT USING (auth.role() = 'authenticated_user');
CREATE POLICY "Allow authenticated read" ON seo_sync_log
  FOR SELECT USING (auth.role() = 'authenticated_user');

COMMENT ON TABLE seo_gsc_daily IS 'Google Search Console daily metrics (keyword position, impressions, CTR)';
COMMENT ON TABLE seo_ga4_daily IS 'Google Analytics 4 daily page performance (users, sessions, conversions)';
COMMENT ON TABLE seo_opportunities IS 'Auto-detected SEO quick wins (high-impression low-CTR keywords)';
COMMENT ON TABLE seo_regression_alerts IS 'Position/CTR regressions monitored daily for alert triggers';
COMMENT ON TABLE seo_metrics_snapshot IS '30/90/180-day rolling averages for trend analysis';
COMMENT ON TABLE seo_sync_log IS 'Audit trail of all GSC/GA4/rank check imports';
