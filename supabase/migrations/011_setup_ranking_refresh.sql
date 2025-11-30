-- Setup for explore_ranking refresh
-- This migration ensures the materialized view and refresh function are properly set up

-- Grant permissions for the refresh function
GRANT EXECUTE ON FUNCTION refresh_explore_ranking() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_explore_ranking() TO anon;

-- Create a helper function to check if ranking needs refresh
-- (Optional - can be used to check last refresh time)
CREATE OR REPLACE FUNCTION get_ranking_last_refresh()
RETURNS timestamptz AS $$
  SELECT MAX(updated_at) FROM explore_ranking;
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION get_ranking_last_refresh() TO authenticated;
GRANT EXECUTE ON FUNCTION get_ranking_last_refresh() TO anon;

-- Note: To set up automatic refresh, you can:
-- 1. Use Supabase pg_cron extension (if available)
-- 2. Use Vercel Cron Jobs
-- 3. Use external cron service (cron-job.org, etc.)
-- 4. Call POST /api/admin/refresh-ranking periodically

-- Example pg_cron setup (if extension is enabled):
-- SELECT cron.schedule('refresh-explore-ranking', '*/10 * * * *', 'SELECT refresh_explore_ranking();');

