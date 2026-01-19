-- Create collection_relations table
CREATE TABLE IF NOT EXISTS collection_relations (
    source_collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    target_collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (source_collection_id, target_collection_id)
);

-- Index for querying relations
CREATE INDEX IF NOT EXISTS idx_collection_relations_source ON collection_relations(source_collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_relations_target ON collection_relations(target_collection_id);

-- Prevent self-referencing (optional check constraint)
ALTER TABLE collection_relations 
ADD CONSTRAINT check_no_self_reference 
CHECK (source_collection_id <> target_collection_id);
