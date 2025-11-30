-- Fix for the promoted index error
-- Run this if you got the IMMUTABLE function error

-- Drop the problematic index if it exists
DROP INDEX IF EXISTS idx_stacks_promoted;

-- Create the corrected index without now() in the predicate
CREATE INDEX idx_stacks_promoted ON stacks (promoted_until DESC) WHERE promoted_until IS NOT NULL;

