-- Cleanup stale RLS policies that reference the deleted 'stacks' table
-- Migration 029 renamed tables but failed to drop some policies due to name mismatches.
-- These stale policies cause 'relation "stacks" does not exist' errors.

-- 1. Cleanup collection_cards (formerly stack_cards)
DROP POLICY IF EXISTS "Stack cards are viewable with stack" ON collection_cards;
DROP POLICY IF EXISTS "Stack owners can add cards" ON collection_cards;
DROP POLICY IF EXISTS "Stack owners can remove cards" ON collection_cards;
DROP POLICY IF EXISTS "Stack cards are viewable based on stack visibility" ON collection_cards; -- 029 attempt

-- 2. Cleanup collection_tags (formerly stack_tags)
DROP POLICY IF EXISTS "Stack tags are viewable with stack" ON collection_tags;
DROP POLICY IF EXISTS "Stack owners can manage tags" ON collection_tags;

-- 3. Cleanup collections (formerly stacks) - redundant but safe
DROP POLICY IF EXISTS "Stacks are viewable based on visibility" ON collections;

-- 4. Cleanup cards (just in case)
DROP POLICY IF EXISTS "Cards are viewable based on status and stack visibility" ON cards;

-- Note: We don't need to recreate these because Migration 029 and 045 created the correct "Collection..." policies.
-- We just need to remove the broken legacy ones.
