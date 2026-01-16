-- REDESIGN VOTE SYSTEM: Atomic RPC Function
-- This replaces the fragile Trigger+RLS system with a single, robust transaction.

-- 1. Drop the problematic triggers that were causing crashes
DROP TRIGGER IF EXISTS update_card_counters_votes ON votes;
-- We do NOT drop the function update_card_counters() because it is still used by 'comments' table triggers.
-- Dropping the trigger on 'votes' is sufficient to switch to the new RPC system. 
-- Actually, update_card_counters handled comments too. We should only DROP THE TRIGGER on VOTES.
-- Let's re-create the function logic for comments only if needed, or just rewrite the trigger for comments separate.
-- Safest approach: DROP TRIGGER ONLY. The function can stay but won't be called by votes.

-- 2. Create the Atomic Vote Function
CREATE OR REPLACE FUNCTION toggle_vote(
  p_target_type text,
  p_target_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS layers entirely
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_vote_exists boolean;
  v_new_state boolean;
  v_new_count bigint;
  v_normalized_type text;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Normalize target type (handle legacy 'stack')
  v_normalized_type := CASE 
    WHEN p_target_type = 'stack' THEN 'collection' 
    ELSE p_target_type 
  END;

  -- 1. Check if vote exists
  SELECT EXISTS (
    SELECT 1 FROM votes 
    WHERE user_id = v_user_id 
    AND target_type = v_normalized_type 
    AND target_id = p_target_id
  ) INTO v_vote_exists;

  -- 2. Toggle Vote (Insert/Delete)
  IF v_vote_exists THEN
    -- Remove Vote
    DELETE FROM votes 
    WHERE user_id = v_user_id 
    AND target_type = v_normalized_type 
    AND target_id = p_target_id;
    
    v_new_state := false;
  ELSE
    -- Add Vote
    INSERT INTO votes (user_id, target_type, target_id)
    VALUES (v_user_id, v_normalized_type, p_target_id);
    
    v_new_state := true;
  END IF;

  -- 3. Update Counts & Get New Count (Atomic Update)
  IF v_normalized_type = 'card' THEN
    -- Update Cards (Direct Column)
    -- Using simple math instead of expensive count(*) or triggers
    UPDATE cards
    SET upvotes_count = GREATEST(0, upvotes_count + (CASE WHEN v_new_state THEN 1 ELSE -1 END))
    WHERE id = p_target_id
    RETURNING upvotes_count INTO v_new_count;
    
  ELSIF v_normalized_type = 'collection' THEN
    -- Update Collections (JSONB Stats)
    UPDATE collections
    SET stats = jsonb_set(
      COALESCE(stats, '{}'::jsonb),
      '{upvotes}',
      to_jsonb(GREATEST(0, COALESCE((stats->>'upvotes')::int, 0) + (CASE WHEN v_new_state THEN 1 ELSE -1 END)))
    )
    WHERE id = p_target_id
    RETURNING (stats->>'upvotes')::bigint INTO v_new_count;
  END IF;

  -- 4. Return Result
  RETURN json_build_object(
    'voted', v_new_state,
    'count', COALESCE(v_new_count, 0)
  );
END;
$$;

-- 3. Grant verify permission
GRANT EXECUTE ON FUNCTION toggle_vote TO authenticated;
