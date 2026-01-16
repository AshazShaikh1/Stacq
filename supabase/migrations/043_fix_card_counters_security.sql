-- Fix security context for update_card_counters function
-- This ensures that upvotes/comments counters can be updated by any user (via trigger)
-- even if they don't have update permissions on the cards table (RLS).

CREATE OR REPLACE FUNCTION update_card_counters()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
