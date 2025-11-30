-- Create a function to search users with pg_trgm fuzzy matching
-- This provides better search results than simple ILIKE

CREATE OR REPLACE FUNCTION search_users(
  search_term text,
  result_limit integer DEFAULT 20,
  result_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  username citext,
  display_name text,
  avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.username,
    u.display_name,
    u.avatar_url
  FROM users u
  WHERE
    -- Full match on username (highest priority)
    LOWER(u.username::text) = LOWER(search_term)
    OR
    -- Similarity search using pg_trgm
    similarity(LOWER(u.username::text), LOWER(search_term)) > 0.3
    OR
    similarity(LOWER(u.display_name), LOWER(search_term)) > 0.3
    OR
    -- ILIKE fallback for partial matches
    u.username::text ILIKE '%' || search_term || '%'
    OR
    u.display_name ILIKE '%' || search_term || '%'
  ORDER BY
    -- Prioritize exact matches
    CASE WHEN LOWER(u.username::text) = LOWER(search_term) THEN 1 ELSE 2 END,
    -- Then by similarity score
    GREATEST(
      similarity(LOWER(u.username::text), LOWER(search_term)),
      similarity(LOWER(u.display_name), LOWER(search_term))
    ) DESC,
    u.username
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_users(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION search_users(text, integer, integer) TO anon;

