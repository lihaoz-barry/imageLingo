-- =============================================================================
-- ImageLingo Seed Data
-- =============================================================================
-- This seed file populates the database with sample data for local development
-- and preview branch testing.
--
-- IMPORTANT:
--   - This file runs AFTER migrations during `supabase db reset`
--   - It does NOT run in production deployments
--   - Do NOT include real user data or production secrets
--   - auth.users cannot be seeded directly (managed by Supabase Auth)
--
-- To test with seed data:
--   1. Run `supabase db reset` to apply migrations + seed
--   2. Sign up via the app UI to create auth.users entries
--   3. The on_auth_user_created trigger will create profiles automatically
--
-- For local testing with pre-existing data, you can:
--   1. Create test users via Supabase Studio (localhost:54323)
--   2. Then run the INSERT statements below with those user IDs
-- =============================================================================

-- -----------------------------------------------------------------------------
-- NOTE: The following seed data requires existing auth.users entries.
--
-- Option 1: Comment out and use app UI to create users first
-- Option 2: Use Supabase Studio to create test users, then update UUIDs below
-- Option 3: For fully automated local testing, use the test user approach below
-- -----------------------------------------------------------------------------

-- We'll use a DO block to conditionally seed based on whether test users exist
-- This makes the seed file safe to run even without pre-existing users

DO $$
DECLARE
  test_user_id uuid;
  test_project_id uuid;
  test_image_id uuid;
BEGIN
  -- Check if we have any users (from manual signup or Studio)
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;

  -- Only seed if we have at least one user
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Found existing user %, seeding demo data...', test_user_id;

    -- Create a demo project for the first user
    INSERT INTO public.projects (id, owner_id, name, description)
    VALUES (
      gen_random_uuid(),
      test_user_id,
      'Demo Project',
      'A sample project for testing ImageLingo features'
    )
    RETURNING id INTO test_project_id;

    -- Create a demo image entry (no actual file - just metadata)
    INSERT INTO public.images (id, project_id, uploaded_by, storage_path, original_filename, mime_type)
    VALUES (
      gen_random_uuid(),
      test_project_id,
      test_user_id,
      'demo/sample-image.png',
      'sample-image.png',
      'image/png'
    )
    RETURNING id INTO test_image_id;

    -- Create demo generations
    INSERT INTO public.generations (project_id, user_id, type, status, prompt, output_text)
    VALUES
      (
        test_project_id,
        test_user_id,
        'text_extraction',
        'completed',
        NULL,
        'Sample extracted text from the demo image. This demonstrates the OCR capability of ImageLingo.'
      ),
      (
        test_project_id,
        test_user_id,
        'translation',
        'completed',
        'Translate to Spanish',
        'Texto de muestra extraído de la imagen de demostración. Esto demuestra la capacidad de OCR de ImageLingo.'
      ),
      (
        test_project_id,
        test_user_id,
        'text_extraction',
        'pending',
        NULL,
        NULL
      );

    RAISE NOTICE 'Seed data created successfully!';
    RAISE NOTICE 'Project ID: %', test_project_id;
    RAISE NOTICE 'Image ID: %', test_image_id;

  ELSE
    RAISE NOTICE 'No users found. Skipping demo data seed.';
    RAISE NOTICE 'To seed demo data:';
    RAISE NOTICE '  1. Sign up via the app, OR';
    RAISE NOTICE '  2. Create a user in Supabase Studio (localhost:54323)';
    RAISE NOTICE '  3. Then run: supabase db reset';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Static reference data (always safe to insert)
-- -----------------------------------------------------------------------------

-- Example: If you had a categories or languages table, you could seed it here:
--
-- INSERT INTO public.languages (code, name) VALUES
--   ('en', 'English'),
--   ('es', 'Spanish'),
--   ('fr', 'French'),
--   ('de', 'German'),
--   ('zh', 'Chinese'),
--   ('ja', 'Japanese'),
--   ('ko', 'Korean')
-- ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Verification queries (for debugging)
-- -----------------------------------------------------------------------------

-- Uncomment to verify seed data after running:
-- SELECT 'profiles' as table_name, count(*) as row_count FROM public.profiles
-- UNION ALL SELECT 'projects', count(*) FROM public.projects
-- UNION ALL SELECT 'images', count(*) FROM public.images
-- UNION ALL SELECT 'generations', count(*) FROM public.generations
-- UNION ALL SELECT 'subscriptions', count(*) FROM public.subscriptions;
