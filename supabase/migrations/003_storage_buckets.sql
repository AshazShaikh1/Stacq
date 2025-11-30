-- ============================================
-- SUPABASE STORAGE BUCKETS
-- ============================================
-- Note: These need to be created via Supabase Dashboard or API
-- This file documents the required buckets and policies

-- Buckets to create:
-- 1. thumbnails - For card thumbnails
-- 2. cover-images - For stack cover images
-- 3. avatars - For user avatars

-- Storage policies are managed via Supabase Dashboard
-- Example policies:

-- THUMBNAILS BUCKET
-- Policy: Public read access
-- Policy: Authenticated users can upload
-- Policy: Users can delete their own uploads

-- COVER-IMAGES BUCKET
-- Policy: Public read access
-- Policy: Authenticated users can upload
-- Policy: Users can delete their own uploads

-- AVATARS BUCKET
-- Policy: Public read access
-- Policy: Authenticated users can upload to their own folder
-- Policy: Users can delete their own avatars

-- SQL to create buckets (run in Supabase SQL Editor):

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('thumbnails', 'thumbnails', true),
  ('cover-images', 'cover-images', true),
  ('avatars', 'avatars', true);


-- Storage policies (run in Supabase SQL Editor):

-- Thumbnails: Public read, authenticated upload
CREATE POLICY "Public read access for thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

-- Cover images: Public read, authenticated upload
CREATE POLICY "Public read access for cover images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cover-images');

CREATE POLICY "Authenticated users can upload cover images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cover-images');

-- Avatars: Public read, users can upload to own folder
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

