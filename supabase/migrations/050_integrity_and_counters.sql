-- Migration: Robust Counters & Data Integrity
-- 1. Atomic View Counting RPCs (Secure & Concurrency Safe)
-- 2. Collection Item Count Trigger (items_count)
-- 3. Unified Saves Trigger (Replacing old fragmented logic)

-- ==========================================
-- 1. Atomic View Counting
-- ==========================================

-- Function to increment card views safely
CREATE OR REPLACE FUNCTION increment_view(card_id uuid)
RETURNS void AS $$
BEGIN
  -- Use direct update for atomicity
  -- Note: We use 'views' in stats for collections, but cards has accurate columns in migration 42.
  -- Migration 42 created 'sorted_feed' view using 'cards.views'.
  -- Let's check card columns. Migration 26 added 'visits_count'.
  -- We will standardize on updating 'visits_count' as the source of truth if it exists, 
  -- or create it if missing, but migration 26 implies it exists.
  
  -- Update: We will update 'visits_count' on cards table.
  UPDATE cards 
  SET visits_count = COALESCE(visits_count, 0) + 1
  WHERE id = card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment collection views safely
CREATE OR REPLACE FUNCTION increment_collection_view(collection_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE collections
  SET stats = jsonb_set(
    COALESCE(stats, '{}'::jsonb),
    '{views}',
    to_jsonb(COALESCE((stats->>'views')::int, 0) + 1)
  )
  WHERE id = collection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to public (views are public)
GRANT EXECUTE ON FUNCTION increment_view(uuid) TO public;
GRANT EXECUTE ON FUNCTION increment_collection_view(uuid) TO public;
GRANT EXECUTE ON FUNCTION increment_view(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_collection_view(uuid) TO authenticated;


-- ==========================================
-- 2. Collection Items Count Trigger
-- ==========================================

-- Function to update collection items count
CREATE OR REPLACE FUNCTION update_collection_items_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE collections
    SET stats = jsonb_set(
      COALESCE(stats, '{}'::jsonb),
      '{cards}', -- Standardizing on 'cards' key for item count
      to_jsonb(COALESCE((stats->>'cards')::int, 0) + 1)
    )
    WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE collections
    SET stats = jsonb_set(
      COALESCE(stats, '{}'::jsonb),
      '{cards}',
      to_jsonb(GREATEST(COALESCE((stats->>'cards')::int, 0) - 1, 0))
    )
    WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: When card added/removed from collection
DROP TRIGGER IF EXISTS update_collection_items_count_trigger ON collection_cards;
CREATE TRIGGER update_collection_items_count_trigger
  AFTER INSERT OR DELETE ON collection_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_items_count();


-- ==========================================
-- 3. Unified Saves Trigger (Cleanup & Fix)
-- ==========================================

-- We overwrite the function from Migration 032 to be fully robust
-- ensuring it handles both CARDS (column) and COLLECTIONS (jsonb)

CREATE OR REPLACE FUNCTION update_collection_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- If Collection Saved
    IF NEW.target_type = 'collection' THEN
      UPDATE collections
      SET stats = jsonb_set(
        COALESCE(stats, '{}'::jsonb),
        '{saves}',
        to_jsonb(COALESCE((stats->>'saves')::int, 0) + 1)
      )
      WHERE id = COALESCE(NEW.collection_id, NEW.target_id, NEW.stack_id); -- Handle legacy ID cols if any
    
    -- If Card Saved
    ELSIF NEW.target_type = 'card' THEN
      UPDATE cards
      SET saves_count = COALESCE(saves_count, 0) + 1
      WHERE id = COALESCE(NEW.card_id, NEW.target_id);
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- If Collection Unsaved
    IF OLD.target_type = 'collection' THEN
      UPDATE collections
      SET stats = jsonb_set(
        COALESCE(stats, '{}'::jsonb),
        '{saves}',
        to_jsonb(GREATEST(COALESCE((stats->>'saves')::int, 0) - 1, 0))
      )
      WHERE id = COALESCE(OLD.collection_id, OLD.target_id, OLD.stack_id);
    
    -- If Card Unsaved
    ELSIF OLD.target_type = 'card' THEN
      UPDATE cards
      SET saves_count = GREATEST(COALESCE(saves_count, 0) - 1, 0)
      WHERE id = COALESCE(OLD.card_id, OLD.target_id);
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Check counts integrity (Optional one-time fix, can be skipped for speed, but good for "Audit")
-- Update collection card counts based on actual rows
WITH text_counts AS (
  SELECT collection_id, count(*) as real_count
  FROM collection_cards
  GROUP BY collection_id
)
UPDATE collections c
SET stats = jsonb_set(
  COALESCE(c.stats, '{}'::jsonb),
  '{cards}',
  to_jsonb(tc.real_count)
)
FROM text_counts tc
WHERE c.id = tc.collection_id;
