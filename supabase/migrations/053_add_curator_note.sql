-- Add curator note to collection_cards
ALTER TABLE collection_cards ADD COLUMN IF NOT EXISTS note TEXT;

-- Comment on column
COMMENT ON COLUMN collection_cards.note IS 'Optional curator note/instruction for this card in this specific collection';
