-- ============================================================
-- Stacq Performance: Schema + Indexes
-- Run this in your Supabase SQL Editor (Database → SQL Editor)
-- ============================================================

-- Step 1: Required extension for the title search index
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- Step 2: Create the 'follows' table if it doesn't exist yet
-- (The FollowButton component requires this table to function)
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Anyone can read follows (needed for follower counts)
CREATE POLICY IF NOT EXISTS "follows_read" ON follows FOR SELECT USING (true);
-- Users can only follow/unfollow as themselves
CREATE POLICY IF NOT EXISTS "follows_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY IF NOT EXISTS "follows_delete" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ============================================================
-- Step 3: Performance Indexes
-- ============================================================

-- stacqs: user_id is used in every profile page query
CREATE INDEX IF NOT EXISTS idx_stacqs_user_id ON stacqs(user_id);

-- stacqs: created_at is used in ORDER BY on the feed & explore queries
CREATE INDEX IF NOT EXISTS idx_stacqs_created_at ON stacqs(created_at DESC);

-- stacqs: title ILIKE search used in the explore/search page
CREATE INDEX IF NOT EXISTS idx_stacqs_title_trgm ON stacqs USING gin(title gin_trgm_ops);

-- resources: stacq_id is the most common JOIN key
CREATE INDEX IF NOT EXISTS idx_resources_stacq_id ON resources(stacq_id);

-- saved_collections: user_id + stacq_id are used in every saved page query
CREATE INDEX IF NOT EXISTS idx_saved_user_id ON saved_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_stacq_id ON saved_collections(stacq_id);
-- Composite for the "has user saved this stacq?" lookup
CREATE INDEX IF NOT EXISTS idx_saved_user_stacq ON saved_collections(user_id, stacq_id);

-- follows: both sides of the relationship are queried frequently
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
-- Composite for the "does A follow B?" check
CREATE INDEX IF NOT EXISTS idx_follows_pair ON follows(follower_id, following_id);

-- profiles: username is the primary lookup key for profile pages
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
