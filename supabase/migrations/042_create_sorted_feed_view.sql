-- =============================================
-- Migration: Create Realtime Sorted Feed View
-- Date: 2026-01-17
-- =============================================

-- 1. Create Indexes to Support the View
-- Performance is critical for this view as it aggregates two main tables.

CREATE INDEX IF NOT EXISTS idx_collection_cards_card_id ON collection_cards (card_id);

-- Fixed: Use 'status' column, not 'active'
CREATE INDEX IF NOT EXISTS idx_cards_feed_filter ON cards (status, is_public, created_at)
WHERE status = 'active' AND is_public = true;

CREATE INDEX IF NOT EXISTS idx_collections_feed_filter ON collections (is_public, is_hidden, created_at)
WHERE is_public = true AND is_hidden = false;


-- 2. Create the View
CREATE OR REPLACE VIEW sorted_feed AS
WITH merged_items AS (
    -- 1. Collections
    SELECT 
        id,
        'collection' as type,
        title,
        description,
        cover_image_url as thumbnail_url,
        NULL::text as canonical_url, -- Placeholder
        NULL::text as domain,        -- Placeholder
        created_at,
        owner_id,
        COALESCE((stats->>'views')::int, 0) as views,
        COALESCE((stats->>'saves')::int, 0) as saves,
        COALESCE((stats->>'upvotes')::int, 0) as upvotes,
        1.5 as multiplier -- Collection Bonus
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
        c.canonical_url,          -- Include canonical_url
        c.domain,                 -- Include domain
        c.created_at,
        c.created_by as owner_id,
        COALESCE(c.visits_count, 0) as views,
        COALESCE(c.saves_count, 0) as saves,
        COALESCE(c.upvotes_count, 0) as upvotes,
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
    -- Gravity Calculation
    -- (Points + 1) / (Age + 2)^1.8
    -- Points = (views * 1 + saves * 5) * multiplier
    (
      ( (views * 1.0 + saves * 5.0) * multiplier + 1.0 ) 
      / 
      POWER( (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600.0) + 2.0, 1.8 )
    ) as gravity_score
FROM merged_items;


-- 3. Grant Permissions
GRANT SELECT ON sorted_feed TO anon, authenticated, service_role;
