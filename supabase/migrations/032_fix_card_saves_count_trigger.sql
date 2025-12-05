-- ============================================
-- Fix card saves_count trigger
-- ============================================
-- The trigger was updating cards.metadata->>'saves' but the feed API expects cards.saves_count
-- This migration fixes the trigger to update the saves_count column

-- Update the trigger function to update saves_count column for cards
CREATE OR REPLACE FUNCTION update_collection_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update collection stats if target is a collection
    IF NEW.target_type = 'collection' THEN
      UPDATE collections
      SET stats = jsonb_set(
        COALESCE(stats, '{}'::jsonb),
        '{saves}',
        to_jsonb((COALESCE((stats->>'saves')::int, 0) + 1))
      )
      WHERE id = COALESCE(NEW.collection_id, NEW.target_id, NEW.stack_id);
    -- Update card saves_count column if target is a card
    ELSIF NEW.target_type = 'card' THEN
      UPDATE cards
      SET saves_count = COALESCE(saves_count, 0) + 1
      WHERE id = COALESCE(NEW.card_id, NEW.target_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update collection stats if target is a collection
    IF OLD.target_type = 'collection' THEN
      UPDATE collections
      SET stats = jsonb_set(
        COALESCE(stats, '{}'::jsonb),
        '{saves}',
        to_jsonb(GREATEST((COALESCE((stats->>'saves')::int, 0) - 1), 0))
      )
      WHERE id = COALESCE(OLD.collection_id, OLD.target_id, OLD.stack_id);
    -- Update card saves_count column if target is a card
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

-- Backfill saves_count for existing cards
UPDATE cards
SET saves_count = (
  SELECT COUNT(*)
  FROM saves
  WHERE saves.target_type = 'card' 
    AND saves.target_id = cards.id
);

