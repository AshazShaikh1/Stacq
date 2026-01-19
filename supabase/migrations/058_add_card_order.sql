-- Add order column to collection_cards for Drag and Drop
ALTER TABLE collection_cards ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_collection_cards_order ON collection_cards("order");
