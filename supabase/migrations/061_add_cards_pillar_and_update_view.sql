-- 1. Add pillar to cards
ALTER TABLE cards 
ADD COLUMN pillar text NOT NULL DEFAULT 'build' 
CHECK (pillar IN ('build', 'play', 'grow'));

-- 2. Drop existing view
DROP VIEW IF EXISTS sorted_feed;

-- 3. Recreate View with Pillar
CREATE OR REPLACE VIEW sorted_feed AS
WITH merged_items AS (
    -- 1. Collections
    SELECT 
        id,
        'collection' as type,
        title,
        description,
        cover_image_url as thumbnail_url,
        NULL::text as canonical_url, 
        NULL::text as domain,        
        created_at,
        owner_id,
        COALESCE((stats->>'views')::int, 0) as views,
        COALESCE((stats->>'saves')::int, 0) as saves,
        COALESCE((stats->>'upvotes')::int, 0) as upvotes,
        pillar, -- Include Pillar
        1.5 as multiplier
    FROM collections
    WHERE is_public = true AND is_hidden = false

    UNION ALL

    -- 2. Cards (Standalone Only)
    SELECT 
        c.id,
        'card' as type,
        c.title,
        c.description,
        c.thumbnail_url,
        c.canonical_url,          
        c.domain,                 
        c.created_at,
        c.created_by as owner_id,
        COALESCE(c.visits_count, 0) as views,
        COALESCE(c.saves_count, 0) as saves,
        COALESCE(c.upvotes_count, 0) as upvotes,
        c.pillar, -- Include Pillar
        1.0 as multiplier
    FROM cards c
    WHERE c.status = 'active' 
      AND c.is_public = true
      AND NOT EXISTS (
          SELECT 1 FROM collection_cards cc WHERE cc.card_id = c.id
      )
)
SELECT 
    *,
    -- Gravity Calculation (Same as before)
    (
      ( (views * 1.0 + saves * 5.0) * multiplier + 1.0 ) 
      / 
      POWER( (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600.0) + 2.0, 1.8 )
    ) as gravity_score
FROM merged_items;

-- 4. Grant Permissions
GRANT SELECT ON sorted_feed TO anon, authenticated, service_role;
