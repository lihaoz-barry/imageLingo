-- =============================================================================
-- Storage Bucket Setup for ImageLingo
-- =============================================================================
-- This migration creates the 'images' storage bucket and sets up RLS policies
-- to allow authenticated users to upload, view, and manage their images.
-- =============================================================================

-- Create the images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  false,  -- Private bucket (requires signed URLs for access)
  52428800,  -- 50MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- Storage RLS Policies
-- =============================================================================
-- Storage policies use the path structure: {user_id}/{project_id}/{filename}
-- This allows us to enforce ownership based on the path.
-- =============================================================================

-- Drop existing policies if they exist (for clean re-runs)
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Policy: Users can upload images to their own folder
-- Path must start with their user ID
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own images
-- Users can only SELECT objects where path starts with their user ID
CREATE POLICY "Users can view their own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
