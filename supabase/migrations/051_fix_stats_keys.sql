-- Migration: Fix Stats Keys to match Frontend
-- Align 'cards' vs 'cards_count' mismatch in JSONB stats

-- Update the trigger function to use 'cards_count'
CREATE OR REPLACE FUNCTION update_collection_items_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE collections
    SET stats = jsonb_set(
      COALESCE(stats, '{}'::jsonb),
      '{cards_count}', -- Changing from 'cards' to 'cards_count'
      to_jsonb(COALESCE((stats->>'cards_count')::int, 0) + 1)
    )
    WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE collections
    SET stats = jsonb_set(
      COALESCE(stats, '{}'::jsonb),
      '{cards_count}',
      to_jsonb(GREATEST(COALESCE((stats->>'cards_count')::int, 0) - 1, 0))
    )
    WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- One-time fix: Rename 'cards' key to 'cards_count' in existing data if needed
-- or just re-calculate from source of truth
WITH text_counts AS (
  SELECT collection_id, count(*) as real_count
  FROM collection_cards
  GROUP BY collection_id
)
UPDATE collections c
SET stats = jsonb_set(
  COALESCE(c.stats, '{}'::jsonb),
  '{cards_count}',
  to_jsonb(tc.real_count)
)
FROM text_counts tc
WHERE c.id = tc.collection_id;
