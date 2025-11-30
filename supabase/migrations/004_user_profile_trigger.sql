-- ============================================
-- AUTOMATIC USER PROFILE CREATION TRIGGER
-- ============================================
-- This trigger automatically creates a user profile in the users table
-- when a new user signs up in auth.users

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that fires when a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- UPDATE USER PROFILE WHEN EMAIL IS VERIFIED
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email_verified when email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.users
    SET email_verified = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for email verification
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_email_verification();

