-- Migration: Add moderation status to cards and collections
-- Part of Stacq Sentinel automated moderation system

-- Step 1: Create enum type for moderation status
DO $$ BEGIN
  CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Add moderation_status column to cards table
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS moderation_status moderation_status DEFAULT 'approved';

-- Step 3: Add moderation_status column to collections table
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS moderation_status moderation_status DEFAULT 'approved';

-- Step 4: Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_cards_moderation_status ON cards(moderation_status);
CREATE INDEX IF NOT EXISTS idx_collections_moderation_status ON collections(moderation_status);

-- Step 5: Add comments for documentation
COMMENT ON COLUMN cards.moderation_status IS 'Automated moderation status: pending, approved, or rejected';
COMMENT ON COLUMN collections.moderation_status IS 'Automated moderation status: pending, approved, or rejected';
