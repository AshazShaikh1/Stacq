-- Add section column to collection_cards
ALTER TABLE collection_cards ADD COLUMN IF NOT EXISTS section TEXT;

-- Comment on column
COMMENT ON COLUMN collection_cards.section IS 'The section/group name this card belongs to within the collection';
