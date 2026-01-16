-- Fix broken RLS policies on cards table that reference the deleted 'stacks' table
-- Failure to update these manifests as 'relation "stacks" does not exist' errors during updates/SELECTs

-- Drop potentially broken policies
DROP POLICY IF EXISTS "Public cards are viewable" ON cards;
DROP POLICY IF EXISTS "Cards are viewable based on status and stack visibility" ON cards;

-- Recreate policy using correct 'collections' and 'collection_cards' tables
CREATE POLICY "Public cards are viewable"
ON cards FOR SELECT
USING (
  is_public = true 
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM collection_cards cc
    JOIN collections c ON c.id = cc.collection_id
    WHERE cc.card_id = cards.id
    AND (c.is_public = true OR c.owner_id = auth.uid())
  )
);
