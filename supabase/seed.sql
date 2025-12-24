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
--
-- TEST USER CREDENTIALS:
--   Email: test@test.com
--   Password: password123
--
-- To test with seed data:
--   1. Run this SQL in Supabase SQL Editor (for hosted) or `supabase db reset` (for local)
--   2. Login with test@test.com / password123
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CREATE TEST USER
-- -----------------------------------------------------------------------------
-- This creates a test user that can be used across all environments.
-- The password 'password123' is hashed using Supabase's crypt function.
-- -----------------------------------------------------------------------------

-- Fixed UUID for test user (consistent across environments)
DO $$
DECLARE
  test_user_id uuid := '11111111-1111-1111-1111-111111111111';
  test_project_id uuid;
  test_image_id uuid;
  encrypted_pw text;
BEGIN
  -- Check if test user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
    RAISE NOTICE 'Test user already exists, skipping user creation...';
  ELSE
    -- Generate encrypted password for 'password123'
    encrypted_pw := crypt('password123', gen_salt('bf'));

    -- Create the test user in auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at,
      is_anonymous
    ) VALUES (
      test_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'test@test.com',
      encrypted_pw,
      NOW(),  -- email_confirmed_at (pre-confirmed)
      NULL,
      '',
      NULL,
      '',
      NULL,
      '',
      '',
      NULL,
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Test User"}',
      FALSE,
      NOW(),
      NOW(),
      NULL,
      NULL,
      '',
      '',
      NULL,
      '',
      0,
      NULL,
      '',
      NULL,
      FALSE,
      NULL,
      FALSE
    );

    -- Create identity for email provider
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      test_user_id,
      jsonb_build_object('sub', test_user_id::text, 'email', 'test@test.com'),
      'email',
      test_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Test user created successfully!';
    RAISE NOTICE 'Email: test@test.com';
    RAISE NOTICE 'Password: password123';
  END IF;

  -- Now seed demo data for the test user
  -- Check if demo project already exists
  IF EXISTS (SELECT 1 FROM public.projects WHERE owner_id = test_user_id AND name = 'Demo Project') THEN
    RAISE NOTICE 'Demo data already exists, skipping...';
  ELSE
    -- Create a demo project for the test user
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

    RAISE NOTICE 'Demo data created successfully!';
    RAISE NOTICE 'Project ID: %', test_project_id;
    RAISE NOTICE 'Image ID: %', test_image_id;
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
