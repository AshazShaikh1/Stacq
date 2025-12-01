-- ============================================
-- FIX USERNAME CONFLICT IN USER PROFILE TRIGGER
-- ============================================
-- This migration fixes the handle_new_user function to handle username conflicts
-- by appending a random suffix if the username is already taken

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_display_name text;
  user_username text;
  final_username text;
  username_exists boolean;
  attempt_count integer := 0;
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

  -- Check if username exists and generate a unique one
  final_username := user_username;
  LOOP
    SELECT EXISTS(SELECT 1 FROM public.users WHERE username = final_username) INTO username_exists;
    
    IF NOT username_exists THEN
      EXIT; -- Username is available
    END IF;
    
    -- Username exists, append a random suffix
    attempt_count := attempt_count + 1;
    IF attempt_count > 10 THEN
      -- Fallback: use UUID-based username
      final_username := 'user_' || SUBSTRING(NEW.id::text, 1, 8);
      EXIT;
    END IF;
    
    final_username := user_username || '_' || SUBSTRING(NEW.id::text, 1, 8);
    
    -- Check again with the new username
    SELECT EXISTS(SELECT 1 FROM public.users WHERE username = final_username) INTO username_exists;
    IF NOT username_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  INSERT INTO public.users (id, email, email_verified, display_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    user_display_name,
    final_username
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    display_name = COALESCE(EXCLUDED.display_name, users.display_name),
    username = COALESCE(EXCLUDED.username, users.username);
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If there's still a conflict (shouldn't happen with the loop above), use UUID-based username
    INSERT INTO public.users (id, email, email_verified, display_name, username)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
      user_display_name,
      'user_' || SUBSTRING(NEW.id::text, 1, 8)
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      email_verified = EXCLUDED.email_verified,
      display_name = COALESCE(EXCLUDED.display_name, users.display_name);
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

