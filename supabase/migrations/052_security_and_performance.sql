-- =============================================
-- Migration: Security & Performance Hardening
-- Date: 2026-01-18
-- Description: Adds indexes for performance and enables RLS for security.
-- =============================================

-- 1. Performance: Foreign Key & Filter Indexes
-- =============================================

-- Users (PK is already indexed)

-- Collections
CREATE INDEX IF NOT EXISTS idx_collections_owner_id ON collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at);
CREATE INDEX IF NOT EXISTS idx_collections_public_filter ON collections(is_public, is_hidden);

-- Cards
CREATE INDEX IF NOT EXISTS idx_cards_created_by ON cards(created_by);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at);
CREATE INDEX IF NOT EXISTS idx_cards_status_public ON cards(status, is_public);

-- Collection Cards (Join Table)
CREATE INDEX IF NOT EXISTS idx_collection_cards_collection_id ON collection_cards(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_cards_card_id ON collection_cards(card_id);
CREATE INDEX IF NOT EXISTS idx_collection_cards_added_by ON collection_cards(added_by);

-- Follows
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);


-- 2. Security: Row Level Security (RLS) Audit
-- =============================================

-- Enable RLS on all key tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;


-- 3. Security: Specific Policies (Public Read / Private Write)
-- =============================================

-- COLLECTIONS
-- Drop existing policies to ensure clean slate or avoid conflicts (optional but safer for re-runs)
DROP POLICY IF EXISTS "Public collections are viewable by everyone" ON collections;
DROP POLICY IF EXISTS "Users can create collections" ON collections;
DROP POLICY IF EXISTS "Users can update own collections" ON collections;
DROP POLICY IF EXISTS "Users can delete own collections" ON collections;

-- Read: Public
CREATE POLICY "Public Read Collections" ON collections
    FOR SELECT
    USING (true); -- Simplify to true for public read (filtering happens at app level usually, or add is_public logic here if strict privacy needed, but prompt said "Public Read" implies true generally)
    -- Prompt specifically said: "ENABLE READ for true (public)"

-- Write: Owner Only
CREATE POLICY "Owner Create Collections" ON collections
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner Update Collections" ON collections
    FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Owner Delete Collections" ON collections
    FOR DELETE
    USING (auth.uid() = owner_id);


-- CARDS
-- Drop existing policies
DROP POLICY IF EXISTS "Public cards are viewable by everyone" ON cards;
DROP POLICY IF EXISTS "Users can create cards" ON cards;
DROP POLICY IF EXISTS "Users can update own cards" ON cards;
DROP POLICY IF EXISTS "Users can delete own cards" ON cards;

-- Read: Public
CREATE POLICY "Public Read Cards" ON cards
    FOR SELECT
    USING (true);

-- Write: Creator Only
CREATE POLICY "Creator Create Cards" ON cards
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator Update Cards" ON cards
    FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Creator Delete Cards" ON cards
    FOR DELETE
    USING (auth.uid() = created_by);
