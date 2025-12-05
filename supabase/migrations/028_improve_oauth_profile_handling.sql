-- ============================================
-- IMPROVE OAUTH PROFILE HANDLING
-- ============================================
-- This migration updates the handle_new_user function to better handle
-- OAuth providers (Google, GitHub, etc.) that provide different metadata fields

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_display_name text;
  user_username text;
BEGIN
  -- Get metadata values, checking multiple possible fields from OAuth providers
  -- OAuth providers may use: display_name, full_name, name, or user_name
  user_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'user_name',
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

