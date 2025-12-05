-- ============================================
-- CREATE RANKING SYSTEM
-- ============================================
-- This migration creates the ranking system for Cards and Collections
-- Feature flag: ranking/final-algo

-- 1.1 ranking_scores table (canonical store for computed scores)
CREATE TABLE IF NOT EXISTS ranking_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('card','collection')),
  item_id uuid NOT NULL,
  raw_score double precision NOT NULL DEFAULT 0,
  norm_score double precision NOT NULL DEFAULT 0,
  last_raw_updated timestamptz NOT NULL DEFAULT now(),
  last_norm_updated timestamptz,
  last_event_at timestamptz,
  CONSTRAINT uniq_item UNIQUE (item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_ranking_scores_type_raw ON ranking_scores(item_type, raw_score DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_scores_norm ON ranking_scores(item_type, norm_score DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_scores_item ON ranking_scores(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_ranking_scores_last_event ON ranking_scores(item_type, last_event_at DESC NULLS LAST);

-- 1.2 materialized view for quick top lists (refresh concurrently)
-- Drop existing table if it exists (from migration 026)
-- Use DO block to safely drop table or view
DO $$
BEGIN
  -- Drop table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'explore_ranking_items' AND table_type = 'BASE TABLE') THEN
    DROP TABLE explore_ranking_items CASCADE;
  END IF;
  
  -- Drop materialized view if it exists
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'explore_ranking_items') THEN
    DROP MATERIALIZED VIEW explore_ranking_items CASCADE;
  END IF;
END $$;

-- Create materialized view
CREATE MATERIALIZED VIEW explore_ranking_items AS
SELECT 
  item_type, 
  item_id, 
  norm_score, 
  last_norm_updated,
  last_event_at
FROM ranking_scores
WHERE norm_score IS NOT NULL
ORDER BY norm_score DESC;

CREATE UNIQUE INDEX idx_explore_ranking_items_unique ON explore_ranking_items(item_type, item_id);

-- 1.3 event log to drive delta recompute
CREATE TABLE IF NOT EXISTS ranking_events (
  id bigserial PRIMARY KEY,
  item_type text NOT NULL CHECK (item_type IN ('card','collection')),
  item_id uuid NOT NULL,
  event_type text NOT NULL, -- 'upvote','save','comment','visit','promotion','unvote','unsave'
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ranking_events_item ON ranking_events(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_ranking_events_created ON ranking_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_events_type_item ON ranking_events(item_type, item_id, created_at DESC);

-- 1.4 ranking_config table for tunable parameters
CREATE TABLE IF NOT EXISTS ranking_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

-- Insert default configuration
INSERT INTO ranking_config (config_key, config_value, description) VALUES
  ('card_weights', '{"w_u": 1.0, "w_s": 2.0, "w_c": 2.5, "w_v": 1.5}', 'Card ranking weights: upvotes, saves, comments, visits'),
  ('collection_weights', '{"w_u": 0.8, "w_s": 3.0, "w_c": 2.0, "w_v": 0.5}', 'Collection ranking weights: upvotes, saves, comments, visits'),
  ('card_half_life_hours', '48', 'Card half-life in hours for age decay'),
  ('collection_half_life_hours', '168', 'Collection half-life in hours for age decay'),
  ('promotion_multiplier', '0.5', 'Base promotion multiplier (P)'),
  ('normalization_window_days', '7', 'Window in days for normalization mean/stddev'),
  ('default_creator_quality', '30', 'Default creator quality score (0-100)'),
  ('abuse_penalty_floor', '0.01', 'Minimum abuse factor'),
  ('delta_debounce_seconds', '5', 'Debounce time for delta updates in seconds'),
  ('feed_mix_default', '{"cards": 0.6, "collections": 0.4}', 'Default feed mix ratio')
ON CONFLICT (config_key) DO NOTHING;

-- 1.5 ranking_stats table for normalization tracking
CREATE TABLE IF NOT EXISTS ranking_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('card','collection')),
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  mean_raw_score double precision NOT NULL,
  stddev_raw_score double precision NOT NULL,
  item_count integer NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uniq_stats_window UNIQUE (item_type, window_start, window_end)
);

CREATE INDEX IF NOT EXISTS idx_ranking_stats_type_window ON ranking_stats(item_type, window_end DESC);

-- Enable RLS
ALTER TABLE ranking_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- ranking_scores: readable by all, writable by service role only
CREATE POLICY "ranking_scores_readable" ON ranking_scores FOR SELECT USING (true);
CREATE POLICY "ranking_scores_writable" ON ranking_scores FOR ALL USING (false); -- Service role only

-- ranking_events: readable by all, writable by service role only
CREATE POLICY "ranking_events_readable" ON ranking_events FOR SELECT USING (true);
CREATE POLICY "ranking_events_writable" ON ranking_events FOR ALL USING (false); -- Service role only

-- ranking_config: readable by all authenticated users, writable by admins only
CREATE POLICY "ranking_config_readable" ON ranking_config FOR SELECT USING (true);
CREATE POLICY "ranking_config_writable" ON ranking_config FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ranking_stats: readable by all
CREATE POLICY "ranking_stats_readable" ON ranking_stats FOR SELECT USING (true);
CREATE POLICY "ranking_stats_writable" ON ranking_stats FOR ALL USING (false); -- Service role only

-- Function to get ranking config value
CREATE OR REPLACE FUNCTION get_ranking_config(key text, default_value jsonb DEFAULT NULL)
RETURNS jsonb AS $$
  SELECT COALESCE((SELECT config_value FROM ranking_config WHERE config_key = key), default_value);
$$ LANGUAGE sql STABLE;

-- Function to log ranking events (for delta worker)
CREATE OR REPLACE FUNCTION log_ranking_event(
  p_item_type text,
  p_item_id uuid,
  p_event_type text
)
RETURNS void AS $$
BEGIN
  INSERT INTO ranking_events (item_type, item_id, event_type)
  VALUES (p_item_type, p_item_id, p_event_type)
  ON CONFLICT DO NOTHING; -- Prevent duplicate events
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get signals for ranking computation
CREATE OR REPLACE FUNCTION get_ranking_signals(
  p_item_type text,
  p_item_id uuid
)
RETURNS TABLE (
  upvotes_count bigint,
  saves_count bigint,
  comments_count bigint,
  visits_count bigint,
  age_hours numeric,
  creator_quality numeric,
  promotion_boost numeric,
  abuse_factor numeric,
  created_at timestamptz
) AS $$
DECLARE
  v_promotion_boost numeric := 0.0;
  v_abuse_factor numeric := 1.0;
BEGIN
  -- Check for promotion (using promoted_until on collections)
  IF p_item_type = 'collection' THEN
    SELECT CASE WHEN promoted_until IS NOT NULL AND promoted_until > now() THEN 0.5 ELSE 0.0 END INTO v_promotion_boost
    FROM collections WHERE id = p_item_id;
  END IF;
  
  -- Default abuse factor to 1.0 (no fraud system yet, can be extended)
  v_abuse_factor := 1.0;
  
  IF p_item_type = 'card' THEN
    RETURN QUERY
    SELECT 
      COALESCE((SELECT COUNT(DISTINCT user_id) FROM votes WHERE target_type = 'card' AND target_id = p_item_id), 0)::bigint as upvotes_count,
      COALESCE((SELECT COUNT(DISTINCT user_id) FROM saves WHERE target_type = 'card' AND target_id = p_item_id), 0)::bigint as saves_count,
      COALESCE((SELECT COUNT(*) FROM comments WHERE target_type = 'card' AND target_id = p_item_id), 0)::bigint as comments_count,
      COALESCE((SELECT visits_count FROM cards WHERE id = p_item_id), 0)::bigint as visits_count,
      EXTRACT(EPOCH FROM (now() - (SELECT created_at FROM cards WHERE id = p_item_id))) / 3600.0 as age_hours,
      COALESCE((SELECT quality_score FROM users WHERE id = (SELECT created_by FROM cards WHERE id = p_item_id)), 30.0) as creator_quality,
      v_promotion_boost as promotion_boost,
      v_abuse_factor as abuse_factor,
      (SELECT created_at FROM cards WHERE id = p_item_id) as created_at;
  ELSIF p_item_type = 'collection' THEN
    RETURN QUERY
    SELECT 
      COALESCE((SELECT COUNT(DISTINCT user_id) FROM votes WHERE target_type = 'collection' AND target_id = p_item_id), 0)::bigint as upvotes_count,
      COALESCE((SELECT COUNT(DISTINCT user_id) FROM saves WHERE target_type = 'collection' AND target_id = p_item_id), 0)::bigint as saves_count,
      COALESCE((SELECT COUNT(*) FROM comments WHERE target_type = 'collection' AND target_id = p_item_id), 0)::bigint as comments_count,
      COALESCE(((SELECT stats->>'views' FROM collections WHERE id = p_item_id)::int), 0)::bigint as visits_count,
      EXTRACT(EPOCH FROM (now() - (SELECT created_at FROM collections WHERE id = p_item_id))) / 3600.0 as age_hours,
      COALESCE((SELECT quality_score FROM users WHERE id = (SELECT owner_id FROM collections WHERE id = p_item_id)), 30.0) as creator_quality,
      v_promotion_boost as promotion_boost,
      v_abuse_factor as abuse_factor,
      (SELECT created_at FROM collections WHERE id = p_item_id) as created_at;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_explore_ranking_items()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY explore_ranking_items;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to non-concurrent refresh if CONCURRENTLY not supported
    REFRESH MATERIALIZED VIEW explore_ranking_items;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE ranking_scores IS 'Canonical store for computed ranking scores for cards and collections';
COMMENT ON TABLE ranking_events IS 'Event log for tracking feed-affecting events (upvotes, saves, comments, visits)';
COMMENT ON TABLE ranking_config IS 'Configuration table for tunable ranking parameters';
COMMENT ON TABLE ranking_stats IS 'Statistics for normalization (mean/stddev per item type and time window)';
COMMENT ON MATERIALIZED VIEW explore_ranking_items IS 'Materialized view for fast feed queries, ordered by norm_score';
COMMENT ON FUNCTION refresh_explore_ranking_items() IS 'Refreshes the explore_ranking_items materialized view';

