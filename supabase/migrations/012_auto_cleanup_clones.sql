-- ============================================
-- Auto-cleanup for old clones (7 days)
-- ============================================
-- This migration creates a function to automatically delete clones
-- that are older than 7 days and have zero activity (no views, upvotes, saves, comments)
-- 
-- Uses Supabase pg_cron extension for automatic daily cleanup

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_clones()
RETURNS void AS $$
BEGIN
  -- Delete clones older than 7 days with zero activity
  DELETE FROM stacks
  WHERE id IN (
    SELECT c.new_stack_id
    FROM clones c
    INNER JOIN stacks s ON s.id = c.new_stack_id
    WHERE c.created_at < now() - interval '7 days'
      AND (s.stats->>'views')::int = 0
      AND (s.stats->>'upvotes')::int = 0
      AND (s.stats->>'saves')::int = 0
      AND (s.stats->>'comments')::int = 0
      AND s.is_public = false  -- Only cleanup private clones
  );
  
  -- Delete orphaned clone records (if stack was deleted)
  DELETE FROM clones
  WHERE new_stack_id NOT IN (SELECT id FROM stacks);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users (for API calls)
GRANT EXECUTE ON FUNCTION cleanup_old_clones() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_clones() TO anon;

-- Note: The cron job is scheduled in migration 013_setup_pg_cron_jobs.sql
-- Run that migration to set up automated cleanup

