-- Migration: Create batch RPC function for collection data
-- This function returns collection + cards + owner in a single query
-- Reduces multiple round trips to a single database call

CREATE OR REPLACE FUNCTION get_collection_with_cards(
  collection_identifier text,  -- Can be UUID or slug
  requesting_user_id uuid DEFAULT NULL  -- For access control
)
RETURNS jsonb AS $$
DECLARE
  collection_record collections%ROWTYPE;
  result jsonb;
BEGIN
  -- Try to find collection by UUID first, then by slug
  SELECT * INTO collection_record
  FROM collections
  WHERE 
    (id::text = collection_identifier OR slug = collection_identifier)
    AND (
      is_public = true 
      OR owner_id = requesting_user_id
      OR (is_hidden = true AND owner_id = requesting_user_id)
    )
  LIMIT 1;

  -- If collection not found or access denied, return null
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Build result JSON with collection, owner, tags, and cards
  SELECT jsonb_build_object(
    'collection', jsonb_build_object(
      'id', collection_record.id,
      'title', collection_record.title,
      'description', collection_record.description,
      'cover_image_url', collection_record.cover_image_url,
      'owner_id', collection_record.owner_id,
      'stats', collection_record.stats,
      'is_public', collection_record.is_public,
      'is_hidden', collection_record.is_hidden,
      'slug', collection_record.slug,
      'created_at', collection_record.created_at,
      'updated_at', collection_record.updated_at
    ),
    'owner', (
      SELECT jsonb_build_object(
        'id', u.id,
        'username', u.username,
        'display_name', u.display_name,
        'avatar_url', u.avatar_url
      )
      FROM users u
      WHERE u.id = collection_record.owner_id
    ),
    'tags', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'name', t.name
        )
      ), '[]'::jsonb)
      FROM collection_tags ct
      JOIN tags t ON ct.tag_id = t.id
      WHERE ct.collection_id = collection_record.id
    ),
    'cards', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'title', c.title,
          'description', c.description,
          'thumbnail_url', c.thumbnail_url,
          'canonical_url', c.canonical_url,
          'domain', c.domain,
          'added_by', cc.added_by,
          'added_at', cc.added_at
        )
        ORDER BY cc.added_at DESC
      ), '[]'::jsonb)
      FROM collection_cards cc
      JOIN cards c ON cc.card_id = c.id
      WHERE cc.collection_id = collection_record.id
        AND c.status = 'active'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_collection_with_cards(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_collection_with_cards(text, uuid) TO anon;

-- Add comment
COMMENT ON FUNCTION get_collection_with_cards IS 'Batch function to fetch collection with owner, tags, and cards in a single query. Returns JSONB with all related data.';
