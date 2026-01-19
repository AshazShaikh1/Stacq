-- Create sections table for ordered grouping
CREATE TABLE IF NOT EXISTS sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_sections_collection_id ON sections(collection_id);

-- Update collection_cards to reference sections
ALTER TABLE collection_cards ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL;

-- Index for the foreign key
CREATE INDEX IF NOT EXISTS idx_collection_cards_section_id ON collection_cards(section_id);

-- (Optional) Migration strategy: 
-- If we wanted to migrate existing 'section' text to this new table, we would do it here.
-- But assuming 'section' text column was barely used or we can start fresh for structure validity.
-- Let's just leave the 'section' column for now to avoid data loss, but we will use 'section_id' moving forward.
