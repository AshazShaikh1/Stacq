-- Migration: Sync card visibility with collection visibility
-- When a collection's is_public changes, update cards' is_public accordingly
-- Cards should be public if they're in at least one public collection

-- Function for collections
CREATE OR REPLACE FUNCTION sync_card_visibility_on_collection_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if is_public actually changed
  IF (TG_OP = 'UPDATE' AND OLD.is_public = NEW.is_public) THEN
    RETURN NEW;
  END IF;

  -- Update all cards in this collection
  UPDATE cards c
  SET is_public = (
    -- Card should be public if:
    -- 1. This collection is public, OR
    -- 2. Card is in at least one other public collection
    NEW.is_public = true OR EXISTS (
      SELECT 1
      FROM collection_cards cc
      JOIN collections col ON cc.collection_id = col.id
      WHERE cc.card_id = c.id
        AND col.id != NEW.id
        AND col.is_public = true
    )
  )
  WHERE EXISTS (
    SELECT 1
    FROM collection_cards cc
    WHERE cc.card_id = c.id
      AND cc.collection_id = NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for collections
DROP TRIGGER IF EXISTS sync_card_visibility_on_collection_update ON collections;
CREATE TRIGGER sync_card_visibility_on_collection_update
  AFTER UPDATE OF is_public ON collections
  FOR EACH ROW
  WHEN (OLD.is_public IS DISTINCT FROM NEW.is_public)
  EXECUTE FUNCTION sync_card_visibility_on_collection_change();

-- Add comment
COMMENT ON FUNCTION sync_card_visibility_on_collection_change IS 
'Automatically updates card visibility when collection visibility changes. Cards are public if they are in at least one public collection.';
