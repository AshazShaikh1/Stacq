-- Fix notify_on_comment function to reference collections instead of stacks
CREATE OR REPLACE FUNCTION public.notify_on_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  target_owner_id uuid;
  collection_slug text;
  collection_title text;
  card_title text;
  notification_data jsonb;
  parent_comment_user_id uuid;
BEGIN
  -- If this is a reply, notify the parent comment author
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO parent_comment_user_id
    FROM comments
    WHERE id = NEW.parent_id AND deleted = false;
    
    IF parent_comment_user_id IS NOT NULL AND parent_comment_user_id != NEW.user_id THEN
      -- Get target info for the notification
      IF NEW.target_type = 'collection' THEN
        SELECT slug, title INTO collection_slug, collection_title
        FROM collections
        WHERE id = NEW.target_id;
        
        notification_data := jsonb_build_object(
          'target_type', 'collection',
          'target_id', NEW.target_id,
          'collection_slug', collection_slug,
          'collection_title', collection_title,
          'comment_id', NEW.id,
          'parent_comment_id', NEW.parent_id
        );
      ELSIF NEW.target_type = 'card' THEN
        SELECT title INTO card_title
        FROM cards
        WHERE id = NEW.target_id;
        
        SELECT c.slug, c.title INTO collection_slug, collection_title
        FROM collections c
        JOIN collection_cards cc ON c.id = cc.collection_id
        WHERE cc.card_id = NEW.target_id
        LIMIT 1;
        
        notification_data := jsonb_build_object(
          'target_type', 'card',
          'target_id', NEW.target_id,
          'card_title', card_title,
          'collection_slug', collection_slug,
          'collection_title', collection_title,
          'comment_id', NEW.id,
          'parent_comment_id', NEW.parent_id
        );
      END IF;
      
      PERFORM create_notification(
        parent_comment_user_id,
        NEW.user_id,
        'comment',
        notification_data
      );
    END IF;
  END IF;

  -- Also notify the owner of the collection/card (if not already notified as parent comment author)
  IF NEW.target_type = 'collection' THEN
    SELECT owner_id, slug, title INTO target_owner_id, collection_slug, collection_title
    FROM collections
    WHERE id = NEW.target_id;
    
    IF target_owner_id IS NOT NULL AND target_owner_id != NEW.user_id AND 
       (parent_comment_user_id IS NULL OR target_owner_id != parent_comment_user_id) THEN
      notification_data := jsonb_build_object(
        'target_type', 'collection',
        'target_id', NEW.target_id,
        'collection_slug', collection_slug,
        'collection_title', collection_title,
        'comment_id', NEW.id
      );
      
      PERFORM create_notification(
        target_owner_id,
        NEW.user_id,
        'comment',
        notification_data
      );
    END IF;
  ELSIF NEW.target_type = 'card' THEN
    -- For cards, notify the owner of the first collection containing this card
    SELECT c.owner_id, c.slug, c.title INTO target_owner_id, collection_slug, collection_title
    FROM collections c
    JOIN collection_cards cc ON c.id = cc.collection_id
    WHERE cc.card_id = NEW.target_id
    LIMIT 1;
    
    IF target_owner_id IS NOT NULL AND target_owner_id != NEW.user_id AND 
       (parent_comment_user_id IS NULL OR target_owner_id != parent_comment_user_id) THEN
      SELECT title INTO card_title
      FROM cards
      WHERE id = NEW.target_id;
      
      notification_data := jsonb_build_object(
        'target_type', 'card',
        'target_id', NEW.target_id,
        'card_title', card_title,
        'collection_slug', collection_slug,
        'collection_title', collection_title,
        'comment_id', NEW.id
      );
      
      PERFORM create_notification(
        target_owner_id,
        NEW.user_id,
        'comment',
        notification_data
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
