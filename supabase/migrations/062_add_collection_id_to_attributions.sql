-- Add collection_id to card_attributions if it doesn't exist
ALTER TABLE card_attributions 
ADD COLUMN IF NOT EXISTS collection_id uuid REFERENCES collections(id) ON DELETE CASCADE;

-- Backfill collection_id from stack_id
UPDATE card_attributions 
SET collection_id = stack_id 
WHERE collection_id IS NULL AND stack_id IS NOT NULL;

-- Update the unique constraint to include collection_id instead of stack_id (or in addition)
-- For now, we will just ensure the column exists so the API works.
-- The API uses 'collection_id' in the insert.
