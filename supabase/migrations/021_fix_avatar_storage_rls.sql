-- ============================================
-- FIX AVATAR STORAGE RLS POLICIES
-- ============================================
-- This migration fixes the RLS policies for the avatars storage bucket
-- to properly allow users to upload avatars to their own folder

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Public read access for avatars
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Users can upload to their own folder (path starts with their user ID)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (name ~ ('^' || auth.uid()::text || '/'))
);

-- Users can update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (name ~ ('^' || auth.uid()::text || '/'))
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (name ~ ('^' || auth.uid()::text || '/'))
);

-- Users can delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (name ~ ('^' || auth.uid()::text || '/'))
);

