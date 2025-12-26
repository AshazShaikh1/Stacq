-- Migration: Improved Search Function
-- Description: Adds a unified search function that uses full-text search, tags, and ranking scores.

CREATE OR REPLACE FUNCTION search_items(
  query_text text,
  filter_type text DEFAULT 'all', -- 'all', 'collection', 'card'
  limit_count int DEFAULT 20,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  type text,
  title text,
  description text,
  image_url text, -- cover_image or thumbnail
  slug text, -- for collections
  canonical_url text, -- for cards
  domain text, -- for cards
  owner_id uuid,
  owner_username text,
  owner_display_name text,
  owner_avatar_url text,
  stats jsonb,
  score double precision,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  search_query tsquery;
BEGIN
  -- Convert text to search query (english)
  -- Use plainto_tsquery for simple input if websearch fails or for consistency, 
  -- but websearch_to_tsquery is better for "quoted" phrases and -negation.
  search_query := websearch_to_tsquery('english', query_text);

  RETURN QUERY
  WITH matches AS (
    -- Search Collections
    SELECT
      c.id,
      'collection'::text as item_type,
      c.title,
      c.description,
      c.cover_image_url as image_url,
      c.slug,
      NULL::text as canonical_url,
      NULL::text as domain,
      c.owner_id,
      u.username,
      u.display_name,
      u.avatar_url,
      c.stats,
      -- Score calculation:
      -- Rank based on text match (0-1) + Normalized Ranking Score (0-100 usually, but normalized might be 0-1)
      -- Let's give weight to the text match for relevance, but boost by popularity
      (ts_rank(c.search_vector, search_query) * 10.0) + (COALESCE(rs.norm_score, 0) * 1.0) as relevance_score,
      c.created_at
    FROM collections c
    JOIN users u ON c.owner_id = u.id
    LEFT JOIN ranking_scores rs ON rs.item_id = c.id AND rs.item_type = 'collection'
    WHERE
      (filter_type = 'all' OR filter_type = 'collection' OR filter_type = 'collections' OR filter_type = 'stacks') AND
      c.is_public = true AND c.is_hidden = false AND
      (
        -- Title/Desc match
        c.search_vector @@ search_query
        OR
        -- Tag match (simple ILIKE for keywords in tags)
        EXISTS (
          SELECT 1 FROM collection_tags ct
          JOIN tags t ON ct.tag_id = t.id
          WHERE ct.collection_id = c.id
          AND t.name ILIKE '%' || query_text || '%'
        )
      )

    UNION ALL

    -- Search Cards
    SELECT
      car.id,
      'card'::text as item_type,
      car.title,
      car.description,
      car.thumbnail_url as image_url,
      NULL::text as slug,
      car.canonical_url,
      car.domain,
      car.created_by as owner_id,
      u.username,
      u.display_name,
      u.avatar_url,
      jsonb_build_object(
        'upvotes', car.upvotes_count,
        'saves', car.saves_count,
        'comments', car.comments_count,
        'views', car.visits_count
      ) as stats,
      (ts_rank(car.search_vector, search_query) * 10.0) + (COALESCE(rs.norm_score, 0) * 1.0) as relevance_score,
      car.created_at
    FROM cards car
    LEFT JOIN users u ON car.created_by = u.id
    LEFT JOIN ranking_scores rs ON rs.item_id = car.id AND rs.item_type = 'card'
    WHERE
      (filter_type = 'all' OR filter_type = 'card' OR filter_type = 'cards') AND
      car.status = 'active' AND
      car.is_public = true AND
      (
        car.search_vector @@ search_query
        OR
        EXISTS (
          SELECT 1 FROM card_tags ct
          JOIN tags t ON ct.tag_id = t.id
          WHERE ct.card_id = car.id
          AND t.name ILIKE '%' || query_text || '%'
        )
      )
  )
  SELECT
    id, item_type as type, title, description, image_url, slug, canonical_url, domain,
    owner_id, username, display_name, avatar_url,
    stats,
    relevance_score as score,
    created_at
  FROM matches
  ORDER BY relevance_score DESC, created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;
