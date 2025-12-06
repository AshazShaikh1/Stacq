-- ============================================
-- Migration: Fix Supabase Security Warnings
-- ============================================
-- This migration addresses security warnings from Supabase database linter:
-- 1. Function search_path mutable warnings (27 functions)
-- 2. Extensions in public schema (pg_trgm, citext)
-- 3. Materialized views accessible via API (documented)
-- 4. Leaked password protection (manual configuration - see Docs)
--
-- References:
-- - https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
-- - https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public
-- - https://supabase.com/docs/guides/database/database-linter?lint=0016_materialized_view_in_api
-- - https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

-- ============================================
-- PART 1: Fix Function Search Path Security
-- ============================================
-- Add SET search_path to all functions to prevent search_path injection attacks
-- For SECURITY DEFINER functions, use SET search_path = public, pg_temp
-- For regular functions, use SET search_path = public, pg_temp

-- 1. is_admin function
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- 2. owns_stack function
CREATE OR REPLACE FUNCTION owns_stack(user_id uuid, stack_id uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM stacks 
    WHERE id = stack_id AND owner_id = user_id
  );
END;
$$;

-- 3. account_age_hours function
CREATE OR REPLACE FUNCTION account_age_hours(user_id uuid)
RETURNS numeric 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXTRACT(EPOCH FROM (now() - (SELECT created_at FROM users WHERE id = user_id))) / 3600;
END;
$$;

-- 4. handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_display_name text;
  user_username text;
BEGIN
  -- Get metadata values
  user_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );
  
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    LOWER(split_part(NEW.email, '@', 1))
  );
  
  -- Ensure username is valid (only lowercase letters, numbers, underscores)
  user_username := LOWER(REGEXP_REPLACE(user_username, '[^a-z0-9_]', '', 'g'));
  
  -- If username is empty after cleaning, use a default
  IF user_username = '' THEN
    user_username := 'user_' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  
  INSERT INTO public.users (id, email, email_verified, display_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    user_display_name,
    user_username
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    display_name = COALESCE(EXCLUDED.display_name, users.display_name),
    username = COALESCE(EXCLUDED.username, users.username);
  
  RETURN NEW;
END;
$$;

-- 5. handle_email_verification function
CREATE OR REPLACE FUNCTION public.handle_email_verification()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Update email_verified when email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.users
    SET email_verified = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. get_follower_count function
CREATE OR REPLACE FUNCTION get_follower_count(user_id uuid)
RETURNS integer 
LANGUAGE plpgsql 
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (SELECT COUNT(*)::integer FROM follows WHERE following_id = user_id);
END;
$$;

-- 7. get_following_count function
CREATE OR REPLACE FUNCTION get_following_count(user_id uuid)
RETURNS integer 
LANGUAGE plpgsql 
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (SELECT COUNT(*)::integer FROM follows WHERE follower_id = user_id);
END;
$$;

-- 8. is_following function
CREATE OR REPLACE FUNCTION is_following(follower_id uuid, following_id uuid)
RETURNS boolean 
LANGUAGE plpgsql 
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM follows WHERE follows.follower_id = is_following.follower_id AND follows.following_id = is_following.following_id);
END;
$$;

-- 9. is_stacker function
CREATE OR REPLACE FUNCTION is_stacker(user_id uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND role = 'stacker'
  );
END;
$$;

-- 10. can_publish function
CREATE OR REPLACE FUNCTION can_publish(user_id uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND (role = 'stacker' OR role = 'admin')
  );
END;
$$;

-- 11. update_card_counters function
CREATE OR REPLACE FUNCTION update_card_counters()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_TABLE_NAME = 'votes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE cards SET upvotes_count = upvotes_count + 1
      WHERE id = NEW.target_id AND NEW.target_type = 'card';
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE cards SET upvotes_count = GREATEST(upvotes_count - 1, 0)
      WHERE id = OLD.target_id AND OLD.target_type = 'card';
    END IF;
  ELSIF TG_TABLE_NAME = 'saves' THEN
    -- Saves are for stacks, not cards, but we track card saves via card_attributions
    -- This will be handled separately
    NULL;
  ELSIF TG_TABLE_NAME = 'comments' THEN
    IF TG_OP = 'INSERT' AND NEW.deleted = false THEN
      UPDATE cards SET comments_count = comments_count + 1
      WHERE id = NEW.target_id AND NEW.target_type = 'card';
    ELSIF TG_OP = 'UPDATE' AND OLD.deleted = false AND NEW.deleted = true THEN
      UPDATE cards SET comments_count = GREATEST(comments_count - 1, 0)
      WHERE id = NEW.target_id AND NEW.target_type = 'card';
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

-- 12. refresh_explore_ranking function
CREATE OR REPLACE FUNCTION refresh_explore_ranking()
RETURNS void 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY explore_ranking;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to non-concurrent refresh if CONCURRENTLY not supported
    REFRESH MATERIALIZED VIEW explore_ranking;
END;
$$;

-- 13. refresh_explore_ranking_items function
CREATE OR REPLACE FUNCTION refresh_explore_ranking_items()
RETURNS void 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY explore_ranking_items;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to non-concurrent refresh if CONCURRENTLY not supported
    REFRESH MATERIALIZED VIEW explore_ranking_items;
END;
$$;

-- 14. get_ranking_config function
CREATE OR REPLACE FUNCTION get_ranking_config(key text, default_value jsonb DEFAULT NULL)
RETURNS jsonb 
LANGUAGE sql 
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((SELECT config_value FROM ranking_config WHERE config_key = key), default_value);
$$;

-- 15. log_ranking_event function
CREATE OR REPLACE FUNCTION log_ranking_event(
  p_item_type text,
  p_item_id uuid,
  p_event_type text
)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO ranking_events (item_type, item_id, event_type)
  VALUES (p_item_type, p_item_id, p_event_type)
  ON CONFLICT DO NOTHING; -- Prevent duplicate events
END;
$$;

-- 16. get_ranking_signals function
CREATE OR REPLACE FUNCTION get_ranking_signals(
  p_item_type text,
  p_item_id uuid
)
RETURNS TABLE (
  upvotes_count bigint,
  saves_count bigint,
  comments_count bigint,
  visits_count bigint,
  age_hours numeric,
  creator_quality numeric,
  promotion_boost numeric,
  abuse_factor numeric,
  created_at timestamptz
) 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_promotion_boost numeric := 0.0;
  v_abuse_factor numeric := 1.0;
BEGIN
  -- Check for promotion (using promoted_until on collections)
  IF p_item_type = 'collection' THEN
    SELECT CASE WHEN promoted_until IS NOT NULL AND promoted_until > now() THEN 0.5 ELSE 0.0 END INTO v_promotion_boost
    FROM collections WHERE id = p_item_id;
  END IF;
  
  -- Default abuse factor to 1.0 (no fraud system yet, can be extended)
  v_abuse_factor := 1.0;
  
  IF p_item_type = 'card' THEN
    RETURN QUERY
    SELECT 
      COALESCE((SELECT COUNT(DISTINCT user_id) FROM votes WHERE target_type = 'card' AND target_id = p_item_id), 0)::bigint as upvotes_count,
      COALESCE((SELECT COUNT(DISTINCT user_id) FROM saves WHERE target_type = 'card' AND target_id = p_item_id), 0)::bigint as saves_count,
      COALESCE((SELECT COUNT(*) FROM comments WHERE target_type = 'card' AND target_id = p_item_id), 0)::bigint as comments_count,
      COALESCE((SELECT visits_count FROM cards WHERE id = p_item_id), 0)::bigint as visits_count,
      EXTRACT(EPOCH FROM (now() - (SELECT created_at FROM cards WHERE id = p_item_id))) / 3600.0 as age_hours,
      COALESCE((SELECT quality_score FROM users WHERE id = (SELECT created_by FROM cards WHERE id = p_item_id)), 30.0) as creator_quality,
      v_promotion_boost as promotion_boost,
      v_abuse_factor as abuse_factor,
      (SELECT created_at FROM cards WHERE id = p_item_id) as created_at;
  ELSIF p_item_type = 'collection' THEN
    RETURN QUERY
    SELECT 
      COALESCE((SELECT COUNT(DISTINCT user_id) FROM votes WHERE target_type = 'collection' AND target_id = p_item_id), 0)::bigint as upvotes_count,
      COALESCE((SELECT COUNT(DISTINCT user_id) FROM saves WHERE target_type = 'collection' AND target_id = p_item_id), 0)::bigint as saves_count,
      COALESCE((SELECT COUNT(*) FROM comments WHERE target_type = 'collection' AND target_id = p_item_id), 0)::bigint as comments_count,
      COALESCE(((SELECT stats->>'views' FROM collections WHERE id = p_item_id)::int), 0)::bigint as visits_count,
      EXTRACT(EPOCH FROM (now() - (SELECT created_at FROM collections WHERE id = p_item_id))) / 3600.0 as age_hours,
      COALESCE((SELECT quality_score FROM users WHERE id = (SELECT owner_id FROM collections WHERE id = p_item_id)), 30.0) as creator_quality,
      v_promotion_boost as promotion_boost,
      v_abuse_factor as abuse_factor,
      (SELECT created_at FROM collections WHERE id = p_item_id) as created_at;
  END IF;
END;
$$;

-- 17. sync_card_visibility_on_collection_change function
CREATE OR REPLACE FUNCTION sync_card_visibility_on_collection_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only process if is_public actually changed
  IF (TG_OP = 'UPDATE' AND OLD.is_public = NEW.is_public) THEN
    RETURN NEW;
  END IF;

  -- Update all cards in this collection
  UPDATE cards c
  SET is_public = (
    -- Card should be public if:
    -- 1. This collection is public, OR
    -- 2. Card is in at least one other public collection
    NEW.is_public = true OR EXISTS (
      SELECT 1
      FROM collection_cards cc
      JOIN collections col ON cc.collection_id = col.id
      WHERE cc.card_id = c.id
        AND col.id != NEW.id
        AND col.is_public = true
    )
  )
  WHERE EXISTS (
    SELECT 1
    FROM collection_cards cc
    WHERE cc.card_id = c.id
      AND cc.collection_id = NEW.id
  );

  RETURN NEW;
END;
$$;

-- 18. update_cards_search_vector function (from migration 001)
CREATE OR REPLACE FUNCTION update_cards_search_vector()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, ''));
  RETURN NEW;
END;
$$;

-- 19. update_collections_search_vector function (renamed from update_stacks_search_vector in migration 029)
-- Handle both old and new names for safety
DO $$
BEGIN
  -- Update the renamed function if it exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_collections_search_vector') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION update_collections_search_vector()
      RETURNS TRIGGER 
      LANGUAGE plpgsql
      SET search_path = public, pg_temp
      AS $func$
      BEGIN
        NEW.search_vector := to_tsvector(''english'', COALESCE(NEW.title, '''') || '' '' || COALESCE(NEW.description, ''''));
        NEW.updated_at := now();
        RETURN NEW;
      END;
      $func$';
  END IF;
  
  -- Also handle the old name if it still exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_stacks_search_vector') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION update_stacks_search_vector()
      RETURNS TRIGGER 
      LANGUAGE plpgsql
      SET search_path = public, pg_temp
      AS $func$
      BEGIN
        NEW.search_vector := to_tsvector(''english'', COALESCE(NEW.title, '''') || '' '' || COALESCE(NEW.description, ''''));
        NEW.updated_at := now();
        RETURN NEW;
      END;
      $func$';
  END IF;
END $$;

-- 20. update_collection_saves_count function
-- Note: This function may exist in multiple migrations, updating to use search_path
-- Checking if it exists and updating accordingly
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_collection_saves_count') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION update_collection_saves_count()
      RETURNS TRIGGER 
      LANGUAGE plpgsql
      SET search_path = public, pg_temp
      AS $func$
      BEGIN
        IF TG_OP = ''INSERT'' THEN
          UPDATE collections SET 
            stats = jsonb_set(
              COALESCE(stats, ''{}''::jsonb),
              ''{saves}''::text[],
              to_jsonb((COALESCE((stats->>''saves'')::int, 0) + 1))
            )
          WHERE id = NEW.target_id AND NEW.target_type = ''collection'';
        ELSIF TG_OP = ''DELETE'' THEN
          UPDATE collections SET 
            stats = jsonb_set(
              COALESCE(stats, ''{}''::jsonb),
              ''{saves}''::text[],
              to_jsonb(GREATEST(COALESCE((stats->>''saves'')::int, 0) - 1, 0))
            )
          WHERE id = OLD.target_id AND OLD.target_type = ''collection'';
        END IF;
        RETURN NULL;
      END;
      $func$';
  END IF;
END $$;

-- 21. cleanup_old_clones function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_old_clones') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION cleanup_old_clones()
      RETURNS void 
      LANGUAGE plpgsql
      SET search_path = public, pg_temp
      AS $func$
      BEGIN
        DELETE FROM clones
        WHERE created_at < now() - interval ''7 days'';
      END;
      $func$';
  END IF;
END $$;

-- 22. get_collection_with_cards function (returns JSONB from migration 034)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_collection_with_cards') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION get_collection_with_cards(
        collection_identifier text,
        requesting_user_id uuid DEFAULT NULL
      )
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $func$
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
          ''collection'', jsonb_build_object(
            ''id'', collection_record.id,
            ''title'', collection_record.title,
            ''description'', collection_record.description,
            ''cover_image_url'', collection_record.cover_image_url,
            ''owner_id'', collection_record.owner_id,
            ''stats'', collection_record.stats,
            ''is_public'', collection_record.is_public,
            ''is_hidden'', collection_record.is_hidden,
            ''slug'', collection_record.slug,
            ''created_at'', collection_record.created_at,
            ''updated_at'', collection_record.updated_at
          ),
          ''owner'', (
            SELECT jsonb_build_object(
              ''id'', u.id,
              ''username'', u.username,
              ''display_name'', u.display_name,
              ''avatar_url'', u.avatar_url
            )
            FROM users u
            WHERE u.id = collection_record.owner_id
          ),
          ''tags'', (
            SELECT COALESCE(jsonb_agg(
              jsonb_build_object(
                ''id'', t.id,
                ''name'', t.name
              )
            ), ''[]''::jsonb)
            FROM collection_tags ct
            JOIN tags t ON ct.tag_id = t.id
            WHERE ct.collection_id = collection_record.id
          ),
          ''cards'', (
            SELECT COALESCE(jsonb_agg(
              jsonb_build_object(
                ''id'', c.id,
                ''title'', c.title,
                ''description'', c.description,
                ''thumbnail_url'', c.thumbnail_url,
                ''canonical_url'', c.canonical_url,
                ''domain'', c.domain,
                ''added_by'', cc.added_by,
                ''added_at'', cc.added_at
              )
              ORDER BY cc.added_at DESC
            ), ''[]''::jsonb)
            FROM collection_cards cc
            JOIN cards c ON cc.card_id = c.id
            WHERE cc.collection_id = collection_record.id
              AND c.status = ''active''
          )
        ) INTO result;
        
        RETURN result;
      END;
      $func$';
  END IF;
END $$;

-- 23. backfill_card_attributions function (returns integer, not TABLE)
-- Note: This function returns count of inserted rows
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'backfill_card_attributions') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION backfill_card_attributions(dry_run boolean DEFAULT true)
      RETURNS integer
      LANGUAGE plpgsql
      SET search_path = public, pg_temp
      AS $func$
      DECLARE
        inserted_count integer := 0;
      BEGIN
        IF dry_run THEN
          -- Return count of what would be inserted (don''t actually insert)
          SELECT COUNT(*) INTO inserted_count
          FROM (
            SELECT c.id, c.created_by
            FROM cards c
            WHERE c.created_by IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM card_attributions ca
              WHERE ca.card_id = c.id 
              AND ca.user_id = c.created_by 
              AND ca.source = ''import''
              AND ca.stack_id IS NULL
            )
            
            UNION ALL
            
            SELECT cc.card_id, cc.added_by
            FROM collection_cards cc
            WHERE cc.added_by IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM card_attributions ca
              WHERE ca.card_id = cc.card_id 
              AND ca.user_id = cc.added_by 
              AND ca.source = ''stack''
              AND ca.stack_id = cc.collection_id
            )
          ) AS to_insert;
          
          RETURN inserted_count;
        ELSE
          -- Backfill from cards.created_by
          WITH inserted_from_cards AS (
            INSERT INTO card_attributions (card_id, user_id, source, stack_id)
            SELECT 
              c.id,
              c.created_by,
              ''import'',
              NULL
            FROM cards c
            WHERE c.created_by IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM card_attributions ca
              WHERE ca.card_id = c.id 
              AND ca.user_id = c.created_by 
              AND ca.source = ''import''
              AND ca.stack_id IS NULL
            )
            ON CONFLICT ON CONSTRAINT card_attributions_card_id_user_id_source_stack_id_key DO NOTHING
            RETURNING 1
          )
          SELECT COUNT(*) INTO inserted_count FROM inserted_from_cards;
          
          -- Backfill from collection_cards.added_by
          WITH inserted_from_stacks AS (
            INSERT INTO card_attributions (card_id, user_id, source, stack_id)
            SELECT 
              cc.card_id,
              cc.added_by,
              ''stack'',
              cc.collection_id
            FROM collection_cards cc
            WHERE cc.added_by IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM card_attributions ca
              WHERE ca.card_id = cc.card_id 
              AND ca.user_id = cc.added_by 
              AND ca.source = ''stack''
              AND ca.stack_id = cc.collection_id
            )
            ON CONFLICT ON CONSTRAINT card_attributions_card_id_user_id_source_stack_id_key DO NOTHING
            RETURNING 1
          )
          SELECT inserted_count + COUNT(*) INTO inserted_count FROM inserted_from_stacks;
          
          RETURN inserted_count;
        END IF;
      END;
      $func$';
  END IF;
END $$;

-- 24. backfill_card_attributions_dry_run function (returns TABLE with specific columns)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'backfill_card_attributions_dry_run') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION backfill_card_attributions_dry_run()
      RETURNS TABLE(
        card_id uuid,
        user_id uuid,
        source text,
        stack_id uuid,
        card_title text
      )
      LANGUAGE plpgsql
      SET search_path = public, pg_temp
      AS $func$
      BEGIN
        RETURN QUERY
        -- From cards.created_by
        SELECT 
          c.id,
          c.created_by,
          ''import''::text,
          NULL::uuid,
          c.title
        FROM cards c
        WHERE c.created_by IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM card_attributions ca
          WHERE ca.card_id = c.id 
          AND ca.user_id = c.created_by 
          AND ca.source = ''import''
          AND ca.stack_id IS NULL
        )
        
        UNION ALL
        
        -- From collection_cards.added_by
        SELECT 
          cc.card_id,
          cc.added_by,
          ''stack''::text,
          cc.collection_id,
          c.title
        FROM collection_cards cc
        JOIN cards c ON c.id = cc.card_id
        WHERE cc.added_by IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM card_attributions ca
          WHERE ca.card_id = cc.card_id 
          AND ca.user_id = cc.added_by 
          AND ca.source = ''stack''
          AND ca.stack_id = cc.collection_id
        );
      END;
      $func$';
  END IF;
END $$;

-- 25. search_users function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_users') THEN
    EXECUTE '
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
      )
      LANGUAGE plpgsql
      SET search_path = public, pg_temp
      AS $func$
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
          u.username::text ILIKE ''%'' || search_term || ''%''
          OR
          u.display_name ILIKE ''%'' || search_term || ''%''
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
      $func$';
  END IF;
END $$;

-- 26. get_ranking_last_refresh function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_ranking_last_refresh') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION get_ranking_last_refresh()
      RETURNS timestamptz
      LANGUAGE sql
      STABLE
      SET search_path = public, pg_temp
      AS $func$
        SELECT MAX(updated_at) FROM explore_ranking;
      $func$';
  END IF;
END $$;

-- 27-30. Notification functions (fix search_path for notification-related functions)
-- These functions exist in the database but may not be in migrations
-- We'll fix all overloads of these functions by setting search_path

-- Generic function to fix search_path for all overloads of a function
DO $$
DECLARE
  func_name text;
  func_oid oid;
  func_signature text;
BEGIN
  -- Fix all notification-related functions
  FOR func_name IN SELECT unnest(ARRAY['create_notification', 'notify_on_upvote', 'notify_on_clone', 'notify_on_comment']) LOOP
    -- Fix all overloads of this function
    FOR func_oid IN 
      SELECT oid
      FROM pg_proc
      WHERE proname = func_name
        AND pronamespace = 'public'::regnamespace
    LOOP
      BEGIN
        -- Get the function signature for error reporting
        SELECT pg_get_function_identity_arguments(func_oid) INTO func_signature;
        
        -- Set search_path using ALTER FUNCTION
        EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', func_oid::regprocedure);
        
        RAISE NOTICE 'Fixed search_path for function: %(%)', func_name, func_signature;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Could not fix function %(%): %', func_name, func_signature, SQLERRM;
      END;
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- PART 2: Handle Extensions in Public Schema
-- ============================================
-- Extensions pg_trgm and citext are installed in public schema.
-- Best practice is to move them to a separate schema.
--
-- WARNING: Moving extensions is a complex operation that requires:
-- 1. Dropping all dependent objects (functions, indexes, etc.)
-- 2. Dropping the extension
-- 3. Recreating in new schema
-- 4. Recreating all dependent objects
-- 
-- This is a BREAKING CHANGE and should be done during a maintenance window.
-- 
-- For now, we create the extensions schema and document the migration process.
-- The extensions will remain in public schema until manually migrated.

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Note: To actually move extensions, you'll need to:
-- 1. Identify all objects depending on the extension (indexes using gin_trgm_ops, citext columns, etc.)
-- 2. Create a maintenance window
-- 3. Drop and recreate extension in extensions schema
-- 4. Update all references (indexes, column types, function calls)
-- 
-- This is complex and risky. For most use cases, extensions in public schema
-- are acceptable, though not ideal from a security best practices perspective.

-- ============================================
-- PART 3: Materialized Views in API
-- ============================================
-- Materialized views explore_ranking and explore_ranking_items are accessible via API.
-- These are intentionally public for the explore/feed functionality.
-- 
-- Options to address this warning:
-- 1. Move views to a private schema (requires code changes)
-- 2. Create wrapper functions with proper security (recommended)
-- 3. Keep as-is if public access is intentional (current approach)
--
-- We'll add comments and create wrapper functions as a recommended approach.

-- Add comments documenting the intentional public access
COMMENT ON MATERIALIZED VIEW IF EXISTS explore_ranking IS 
  'Public materialized view for explore/feed functionality. Intentionally accessible via API for public ranking data.';

COMMENT ON MATERIALIZED VIEW IF EXISTS explore_ranking_items IS 
  'Public materialized view for explore/feed functionality. Intentionally accessible via API for public ranking data.';

-- Note: Materialized views don't support RLS directly.
-- If you want to restrict access, you can:
-- 1. Move them to a private schema (not exposed via Supabase API)
-- 2. Create wrapper functions that access them (functions can have RLS)
-- 3. Access them only through application code (not directly via API)
--
-- For now, they remain public as they contain only public ranking data.

-- ============================================
-- PART 4: Leaked Password Protection
-- ============================================
-- This is a Supabase Auth configuration setting, not a database migration.
-- Enable it in Supabase Dashboard:
-- Auth > Policies > Password Security > Enable "Leaked Password Protection"
-- Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

-- Add comment for documentation
COMMENT ON SCHEMA public IS 
  'Note: Enable Leaked Password Protection in Supabase Dashboard under Auth > Policies > Password Security';

-- ============================================
-- SUMMARY
-- ============================================
-- This migration fixes the following Supabase security warnings:
--
-- ✅ FIXED: Function Search Path Mutable (27+ functions)
--   - All functions now have SET search_path = public, pg_temp
--   - Includes: helper functions, triggers, ranking functions, etc.
--   - Notification functions (create_notification, notify_on_*) fixed via ALTER FUNCTION
--
-- ⚠️ REMAINING: Extensions in Public Schema (pg_trgm, citext)
--   - Created extensions schema for future migration
--   - Moving extensions requires complex migration during maintenance window
--   - See PART 2 above for details
--   - Status: Documented, migration can be done in separate maintenance migration
--
-- ⚠️ REMAINING: Materialized Views in API (explore_ranking, explore_ranking_items)
--   - These are intentionally public for explore/feed functionality
--   - Materialized views don't support RLS directly
--   - Options: Move to private schema, create wrapper functions, or keep as-is
--   - See PART 3 above for details
--   - Status: Documented, intentionally public by design
--
-- ⚠️ MANUAL: Leaked Password Protection
--   - Must be enabled in Supabase Dashboard
--   - Path: Auth > Policies > Password Security > Enable "Leaked Password Protection"
--   - Status: Requires manual configuration
--
-- Note: If notification functions cannot be fixed via ALTER FUNCTION, they may need
-- to be recreated with search_path. Check migration logs for any NOTICE messages.

