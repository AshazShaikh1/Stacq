-- Migration: Stacq Sheriff - Nuanced Moderation with Strike System
-- Implements suspension tracking, bouncer triggers, and progressive punishment

-- ============================================================
-- PART 1: DATABASE SCHEMA
-- ============================================================

-- Add moderation tracking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS strike_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_strike_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN users.suspended_until IS 'Timestamp until which user is suspended (NULL = not suspended)';
COMMENT ON COLUMN users.strike_count IS 'Number of strikes (resets after 1 hour of good behavior)';
COMMENT ON COLUMN users.last_strike_at IS 'Last time user received a strike';

-- Create index for suspension checks (frequently queried)
CREATE INDEX IF NOT EXISTS idx_users_suspended_until ON users(suspended_until) WHERE suspended_until IS NOT NULL;

-- ============================================================
-- PART 2: THE BOUNCER TRIGGER (Block Suspended Users)
-- ============================================================

CREATE OR REPLACE FUNCTION check_suspension_status()
RETURNS TRIGGER AS $$
DECLARE
  user_suspended_until TIMESTAMPTZ;
  acting_user_id UUID;
BEGIN
  -- Determine the user performing the action based on table
  IF TG_TABLE_NAME = 'cards' THEN
    acting_user_id := NEW.created_by;
  ELSIF TG_TABLE_NAME = 'collections' THEN
    acting_user_id := NEW.owner_id;
  ELSIF TG_TABLE_NAME IN ('comments', 'votes') THEN
    acting_user_id := NEW.user_id;
  ELSE
    RETURN NEW; -- Unknown table, allow
  END IF;

  -- Check if user is suspended
  SELECT suspended_until INTO user_suspended_until
  FROM users
  WHERE id = acting_user_id;

  -- Block if currently suspended
  IF user_suspended_until IS NOT NULL AND user_suspended_until > NOW() THEN
    RAISE EXCEPTION 'Your account is temporarily suspended due to repeated violations.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on all action tables
DROP TRIGGER IF EXISTS trigger_bouncer_cards ON cards;
CREATE TRIGGER trigger_bouncer_cards
  BEFORE INSERT OR UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION check_suspension_status();

DROP TRIGGER IF EXISTS trigger_bouncer_collections ON collections;
CREATE TRIGGER trigger_bouncer_collections
  BEFORE INSERT OR UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION check_suspension_status();

DROP TRIGGER IF EXISTS trigger_bouncer_comments ON comments;
CREATE TRIGGER trigger_bouncer_comments
  BEFORE INSERT OR UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION check_suspension_status();

DROP TRIGGER IF EXISTS trigger_bouncer_votes ON votes;
CREATE TRIGGER trigger_bouncer_votes
  BEFORE INSERT OR UPDATE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION check_suspension_status();

-- ============================================================
-- PART 3: THE STRIKE LOGIC (Progressive Punishment)
-- ============================================================

CREATE OR REPLACE FUNCTION add_strike(target_user_id UUID)
RETURNS TABLE(
  new_strike_count INTEGER,
  is_suspended BOOLEAN,
  suspended_until TIMESTAMPTZ
) AS $$
DECLARE
  current_strikes INTEGER;
  last_strike TIMESTAMPTZ;
  new_strikes INTEGER;
  suspension_end TIMESTAMPTZ := NULL;
  suspended BOOLEAN := FALSE;
BEGIN
  -- Get current strike data
  SELECT strike_count, last_strike_at 
  INTO current_strikes, last_strike
  FROM users
  WHERE id = target_user_id;

  -- Step A: Reset strikes if user has been good for 1 hour
  IF last_strike < (NOW() - INTERVAL '1 hour') THEN
    current_strikes := 0;
  END IF;

  -- Step B: Increment strike count
  new_strikes := current_strikes + 1;

  -- Step C: Apply consequences based on strike count
  IF new_strikes = 1 THEN
    -- Strike 1: Warning only (frontend will show toast)
    UPDATE users
    SET strike_count = new_strikes,
        last_strike_at = NOW()
    WHERE id = target_user_id;

  ELSIF new_strikes = 2 THEN
    -- Strike 2: -2 Trust Points
    UPDATE users
    SET strike_count = new_strikes,
        last_strike_at = NOW(),
        trust_score = GREATEST(0, trust_score - 2)
    WHERE id = target_user_id;

  ELSE -- new_strikes >= 3
    -- Strike 3+: 24-hour suspension + reset strikes + -20 Trust Points
    suspension_end := NOW() + INTERVAL '24 hours';
    suspended := TRUE;

    UPDATE users
    SET strike_count = 0, -- Reset after suspension
        last_strike_at = NOW(),
        suspended_until = suspension_end,
        trust_score = GREATEST(0, trust_score - 20)
    WHERE id = target_user_id;

    new_strikes := 0; -- Return 0 since it was reset
  END IF;

  -- Return the result
  RETURN QUERY SELECT new_strikes, suspended, suspension_end;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_strike IS 'Adds a strike to user. 1=Warning, 2=-2 trust, 3+=24h ban & -20 trust';

-- ============================================================
-- CLEANUP
-- ============================================================

-- Ensure all existing users have default values
UPDATE users 
SET strike_count = 0,
    last_strike_at = NOW()
WHERE strike_count IS NULL;
