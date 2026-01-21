-- Add pillar column to collections table
ALTER TABLE collections 
ADD COLUMN pillar text NOT NULL DEFAULT 'build' 
CHECK (pillar IN ('build', 'play', 'grow'));

-- Comment on column
COMMENT ON COLUMN collections.pillar IS 'Categorization pillar: build, play, or grow';
