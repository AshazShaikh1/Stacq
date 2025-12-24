-- Fix broken RLS policies that reference the deleted 'stacks' table
-- This migration updates policies on 'comments' and 'cards' to use 'collections'

-- 1. Fix Comments Policies
-- Drop potential legacy policies
DROP POLICY IF EXISTS "Users and stack owners can soft-delete comments" ON comments;
DROP POLICY IF EXISTS "Users and stack owners can delete comments" ON comments;

-- Create correct policy using 'collections'
CREATE POLICY "Users and collection owners can soft-delete comments"
ON comments FOR UPDATE
TO authenticated
USING (
  -- User is the comment author
  auth.uid() = user_id 
  -- OR user owns the collection this comment is on
  OR EXISTS (
    SELECT 1 FROM collections c
    WHERE c.id = comments.target_id 
    AND comments.target_type = 'collection'
    AND c.owner_id = auth.uid()
  )
  -- OR user is admin
  OR is_admin(auth.uid())
)
WITH CHECK (
  -- When soft-deleting (setting deleted = true), allow it
  (deleted = true AND (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = comments.target_id 
      AND comments.target_type = 'collection'
      AND c.owner_id = auth.uid()
    )
    OR is_admin(auth.uid())
  ))
  -- OR when updating content (user is author)
  OR (auth.uid() = user_id AND deleted = false)
);

-- 2. Fix Cards Policies
-- Drop potential legacy policies on Cards that might reference stacks
DROP POLICY IF EXISTS "Cards are viewable based on status and stack visibility" ON cards;
DROP POLICY IF EXISTS "Public cards are viewable" ON cards;

-- Recreate "Public cards are viewable" using collections
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

-- 3. Fix Card Attributions Policies (just in case)
DROP POLICY IF EXISTS "Users can view card attributions" ON card_attributions;
CREATE POLICY "Users can view card attributions"
  ON card_attributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cards
      WHERE cards.id = card_attributions.card_id
      AND (cards.is_public = true OR cards.created_by = auth.uid())
    )
  );
