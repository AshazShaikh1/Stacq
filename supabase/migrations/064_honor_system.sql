-- Migration: Stacq Honor System - Trust Score & Reputation
-- Implements trust scores, daily earning caps, and shadowban via RLS

-- ============================================================
-- PART 1: DATABASE SCHEMA
-- ============================================================

-- Add trust_score to profiles table (users table in this schema)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50 
CHECK (trust_score >= 0 AND trust_score <= 100);

COMMENT ON COLUMN users.trust_score IS 'User reputation score (0-100). Users below 30 are shadowbanned.';

-- Create daily_trust_logs table for rate limiting
CREATE TABLE IF NOT EXISTS daily_trust_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  points_earned FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_trust_logs_user_action 
ON daily_trust_logs(user_id, action_type, created_at DESC);

COMMENT ON TABLE daily_trust_logs IS 'Tracks daily trust point earnings for rate limiting';

-- ============================================================
-- PART 2: TRIGGER FUNCTIONS
-- ============================================================

-- Function A: Handle Vote Events
CREATE OR REPLACE FUNCTION handle_vote_event()
RETURNS TRIGGER AS $$
DECLARE
  target_author_id UUID;
  current_daily_points FLOAT;
BEGIN
  -- Get the author of the voted content
  IF NEW.target_type = 'card' THEN
    SELECT created_by INTO target_author_id
    FROM cards
    WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'collection' THEN
    SELECT owner_id INTO target_author_id
    FROM collections
    WHERE id = NEW.target_id;
  END IF;

  -- Reward the content creator (RECEIVER)
  IF target_author_id IS NOT NULL THEN
    UPDATE users
    SET trust_score = LEAST(100, trust_score + 1)
    WHERE id = target_author_id;
  END IF;

  -- Reward the voter (ACTOR) with daily cap
  SELECT COALESCE(SUM(points_earned), 0) INTO current_daily_points
  FROM daily_trust_logs
  WHERE user_id = NEW.user_id
    AND action_type = 'vote'
    AND created_at > NOW() - INTERVAL '24 hours';

  IF current_daily_points < 1.0 THEN
    UPDATE users
    SET trust_score = LEAST(100, trust_score + 0.1)
    WHERE id = NEW.user_id;

    INSERT INTO daily_trust_logs (user_id, action_type, points_earned)
    VALUES (NEW.user_id, 'vote', 0.1);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for votes
DROP TRIGGER IF EXISTS trigger_vote_trust_update ON votes;
CREATE TRIGGER trigger_vote_trust_update
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION handle_vote_event();

-- Function B: Handle Comment Events
CREATE OR REPLACE FUNCTION handle_comment_event()
RETURNS TRIGGER AS $$
DECLARE
  target_author_id UUID;
  current_daily_points FLOAT;
BEGIN
  -- Get the author of the commented content
  IF NEW.target_type = 'card' THEN
    SELECT created_by INTO target_author_id
    FROM cards
    WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'collection' THEN
    SELECT owner_id INTO target_author_id
    FROM collections
    WHERE id = NEW.target_id;
  END IF;

  -- Reward the content creator (RECEIVER)
  IF target_author_id IS NOT NULL THEN
    UPDATE users
    SET trust_score = LEAST(100, trust_score + 0.2)
    WHERE id = target_author_id;
  END IF;

  -- Reward the commenter (ACTOR) with daily cap
  SELECT COALESCE(SUM(points_earned), 0) INTO current_daily_points
  FROM daily_trust_logs
  WHERE user_id = NEW.user_id
    AND action_type = 'comment'
    AND created_at > NOW() - INTERVAL '24 hours';

  IF current_daily_points < 2.0 THEN
    UPDATE users
    SET trust_score = LEAST(100, trust_score + 0.5)
    WHERE id = NEW.user_id;

    INSERT INTO daily_trust_logs (user_id, action_type, points_earned)
    VALUES (NEW.user_id, 'comment', 0.5);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comments
DROP TRIGGER IF EXISTS trigger_comment_trust_update ON comments;
CREATE TRIGGER trigger_comment_trust_update
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_comment_event();

-- Function C: Handle Sentinel Penalty
CREATE OR REPLACE FUNCTION handle_sentinel_penalty()
RETURNS TRIGGER AS $$
DECLARE
  author_id UUID;
BEGIN
  -- Only apply penalty when moderation_status changes to 'rejected'
  IF NEW.moderation_status = 'rejected' 
     AND (OLD.moderation_status IS NULL OR OLD.moderation_status != 'rejected') THEN
    
    -- Get the author ID based on table
    IF TG_TABLE_NAME = 'cards' THEN
      author_id := NEW.created_by;
    ELSIF TG_TABLE_NAME = 'collections' THEN
      author_id := NEW.owner_id;
    END IF;

    -- Apply -5 penalty (minimum 0)
    IF author_id IS NOT NULL THEN
      UPDATE users
      SET trust_score = GREATEST(0, trust_score - 5)
      WHERE id = author_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for moderation penalties
DROP TRIGGER IF EXISTS trigger_card_sentinel_penalty ON cards;
CREATE TRIGGER trigger_card_sentinel_penalty
  AFTER UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION handle_sentinel_penalty();

DROP TRIGGER IF EXISTS trigger_collection_sentinel_penalty ON collections;
CREATE TRIGGER trigger_collection_sentinel_penalty
  AFTER UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION handle_sentinel_penalty();

-- ============================================================
-- PART 3: RLS POLICIES (Shadowban)
-- ============================================================

-- Drop existing SELECT policies to recreate with trust score check
DROP POLICY IF EXISTS "cards_select_policy" ON cards;
DROP POLICY IF EXISTS "collections_select_policy" ON collections;

-- Cards: Visible if public AND author has trust_score >= 30, OR if you're the author
CREATE POLICY "cards_select_policy" ON cards
  FOR SELECT
  USING (
    -- Always visible to the author
    created_by = auth.uid()
    OR
    -- Visible to public if approved AND author has sufficient trust
    (
      status = 'active'
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = cards.created_by
        AND users.trust_score >= 30
      )
    )
  );

-- Collections: Visible if public AND author has trust_score >= 30, OR if you're the owner
CREATE POLICY "collections_select_policy" ON collections
  FOR SELECT
  USING (
    -- Always visible to the owner
    owner_id = auth.uid()
    OR
    -- Visible to public if public AND author has sufficient trust
    (
      is_public = true
      AND NOT is_hidden
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = collections.owner_id
        AND users.trust_score >= 30
      )
    )
  );

-- ============================================================
-- CLEANUP & VERIFICATION
-- ============================================================

-- Ensure all existing users start with default trust score
UPDATE users 
SET trust_score = 50 
WHERE trust_score IS NULL;

-- Add helpful comment
COMMENT ON FUNCTION handle_vote_event IS 'Awards trust points for voting: +1 to receiver, +0.1 to actor (max 1.0/day)';
COMMENT ON FUNCTION handle_comment_event IS 'Awards trust points for commenting: +0.2 to receiver, +0.5 to actor (max 2.0/day)';
COMMENT ON FUNCTION handle_sentinel_penalty IS 'Applies -5 trust penalty when content is rejected by moderation';
