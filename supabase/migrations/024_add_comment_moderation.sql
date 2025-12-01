-- Add hidden column to comments table for moderation
ALTER TABLE comments ADD COLUMN IF NOT EXISTS hidden boolean DEFAULT false;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS moderation_metadata jsonb DEFAULT '{}';

-- Index for hidden comments
CREATE INDEX IF NOT EXISTS idx_comments_hidden ON comments (hidden) WHERE hidden = true;

-- Update RLS to hide moderated comments from public view
-- (Comments are still visible to admins and comment authors)

