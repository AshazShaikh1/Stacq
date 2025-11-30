-- ============================================
-- Setup pg_cron jobs for automated tasks
-- ============================================
-- This migration sets up all automated cron jobs using Supabase pg_cron extension
-- 
-- Prerequisites:
-- 1. pg_cron extension must be enabled in Supabase
-- 2. Run this migration after all other migrations are complete

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 1. Explore Ranking Refresh (every 10 minutes)
-- ============================================
-- Refreshes the explore_ranking materialized view to keep trending stacks up to date
-- Schedule: Every 10 minutes
DO $$
BEGIN
  -- Unschedule if already exists
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-explore-ranking') THEN
    PERFORM cron.unschedule('refresh-explore-ranking');
  END IF;
  
  -- Schedule the job
  PERFORM cron.schedule(
    'refresh-explore-ranking',
    '*/10 * * * *',  -- Every 10 minutes
    'SELECT refresh_explore_ranking();'
  );
END $$;

-- ============================================
-- 2. Clone Cleanup (daily at 2 AM UTC)
-- ============================================
-- Removes old inactive clones (older than 7 days with zero activity)
-- Schedule: Daily at 2 AM UTC
DO $$
BEGIN
  -- Unschedule if already exists
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-clones') THEN
    PERFORM cron.unschedule('cleanup-old-clones');
  END IF;
  
  -- Schedule the job
  PERFORM cron.schedule(
    'cleanup-old-clones',
    '0 2 * * *',  -- Daily at 2 AM UTC
    'SELECT cleanup_old_clones();'
  );
END $$;

-- ============================================
-- View all scheduled jobs
-- ============================================
-- To view all scheduled cron jobs, run:
-- SELECT * FROM cron.job;
--
-- To view job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--
-- To unschedule a job:
-- SELECT cron.unschedule('job-name');

