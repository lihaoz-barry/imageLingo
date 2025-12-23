-- =============================================================================
-- ImageLingo Initial Schema Migration
-- =============================================================================
-- This migration creates the foundational schema for the ImageLingo application.
--
-- Tables created:
--   - public.profiles      : User profiles (extends auth.users)
--   - public.projects      : Workspaces/projects for organizing work
--   - public.images        : Uploaded images metadata
--   - public.generations   : AI generation runs (prompt-to-image, edits, etc.)
--   - public.subscriptions : User subscription/plan information
--
-- All tables include:
--   - UUID primary keys using gen_random_uuid()
--   - Timestamps in UTC (timestamptz)
--   - Foreign key constraints
--   - Row Level Security (RLS) policies
--   - Essential indexes for query performance
--
-- Assumptions:
--   - auth.users is managed by Supabase Auth (we only reference it)
--   - Storage bucket 'images' is created separately (via dashboard or storage migration)
--   - This migration runs once; it is NOT fully idempotent
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
-- gen_random_uuid() is available in Postgres 13+ by default (pgcrypto fallback)
-- moddatetime for automatic updated_at triggers

CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- -----------------------------------------------------------------------------
-- Helper Functions
-- -----------------------------------------------------------------------------

-- Function to get the current user's ID from JWT
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.uid(),
    '00000000-0000-0000-0000-000000000000'::uuid
  )
$$;

-- Function to automatically set updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- TABLE: public.profiles
-- =============================================================================
-- One row per authenticated user. Created automatically via trigger when a new
-- user signs up. Stores display information beyond what auth.users provides.
-- -----------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT NOW(),
  updated_at    timestamptz NOT NULL DEFAULT NOW()
);

-- Index for display_name searches (optional, for future user search feature)
CREATE INDEX idx_profiles_display_name ON public.profiles(display_name);

-- Auto-update updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can view any profile (for displaying user info in shared contexts)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for initial creation)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- TABLE: public.projects
-- =============================================================================
-- Workspaces that organize images and generations. Each project has one owner.
-- Future: Add project_members table for collaboration.
-- -----------------------------------------------------------------------------

CREATE TABLE public.projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  updated_at  timestamptz NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
-- Owners can view their projects
CREATE POLICY "Users can view their own projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Owners can create projects
CREATE POLICY "Users can create projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their projects
CREATE POLICY "Users can update their own projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners can delete their projects
CREATE POLICY "Users can delete their own projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- =============================================================================
-- TABLE: public.images
-- =============================================================================
-- Metadata for uploaded images. Actual files stored in Supabase Storage.
-- storage_path references the path in the 'images' storage bucket.
-- -----------------------------------------------------------------------------

CREATE TABLE public.images (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path      text NOT NULL,
  original_filename text,
  mime_type         text,
  file_size_bytes   bigint,
  width             integer,
  height            integer,
  created_at        timestamptz NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_images_project_id ON public.images(project_id);
CREATE INDEX idx_images_uploaded_by ON public.images(uploaded_by);
CREATE INDEX idx_images_created_at ON public.images(created_at DESC);

-- Enable RLS
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for images
-- Users can view images in projects they own
CREATE POLICY "Users can view images in their projects"
  ON public.images
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = images.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Users can upload images to their projects
CREATE POLICY "Users can upload images to their projects"
  ON public.images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Users can update images in their projects
CREATE POLICY "Users can update images in their projects"
  ON public.images
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = images.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Users can delete images in their projects
CREATE POLICY "Users can delete images in their projects"
  ON public.images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = images.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- TABLE: public.generations
-- =============================================================================
-- Records of AI generation runs: text extraction, translation, image generation.
-- Links to a project and optionally to input/output images.
-- -----------------------------------------------------------------------------

CREATE TYPE public.generation_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TYPE public.generation_type AS ENUM (
  'text_extraction',    -- OCR / text extraction from image
  'translation',        -- Text translation
  'image_generation',   -- AI image generation from prompt
  'image_edit'          -- AI image editing
);

CREATE TABLE public.generations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            public.generation_type NOT NULL DEFAULT 'text_extraction',
  status          public.generation_status NOT NULL DEFAULT 'pending',

  -- Input
  prompt          text,                    -- User prompt or instruction
  input_image_id  uuid REFERENCES public.images(id) ON DELETE SET NULL,
  source_language text,                    -- For translations
  target_language text,                    -- For translations

  -- Output
  output_text     text,                    -- Extracted or translated text
  output_image_id uuid REFERENCES public.images(id) ON DELETE SET NULL,

  -- Metadata
  error_message   text,                    -- Error details if failed
  model_used      text,                    -- AI model identifier
  tokens_used     integer,                 -- Token consumption for billing
  processing_ms   integer,                 -- Processing time in milliseconds

  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_generations_project_id ON public.generations(project_id);
CREATE INDEX idx_generations_user_id ON public.generations(user_id);
CREATE INDEX idx_generations_status ON public.generations(status);
CREATE INDEX idx_generations_type ON public.generations(type);
CREATE INDEX idx_generations_created_at ON public.generations(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER generations_updated_at
  BEFORE UPDATE ON public.generations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generations
-- Users can view generations in projects they own
CREATE POLICY "Users can view generations in their projects"
  ON public.generations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = generations.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Users can create generations in their projects
CREATE POLICY "Users can create generations in their projects"
  ON public.generations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Users can update generations in their projects
CREATE POLICY "Users can update generations in their projects"
  ON public.generations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = generations.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Users can delete generations in their projects
CREATE POLICY "Users can delete generations in their projects"
  ON public.generations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = generations.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- TABLE: public.subscriptions
-- =============================================================================
-- User subscription and billing information. Tracks plan tier and status.
-- Designed for integration with Stripe or similar payment providers.
-- -----------------------------------------------------------------------------

CREATE TYPE public.subscription_plan AS ENUM (
  'free',
  'starter',
  'pro',
  'enterprise'
);

CREATE TYPE public.subscription_status AS ENUM (
  'active',
  'canceled',
  'past_due',
  'trialing',
  'paused'
);

CREATE TABLE public.subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                  public.subscription_plan NOT NULL DEFAULT 'free',
  status                public.subscription_status NOT NULL DEFAULT 'active',

  -- Stripe integration fields (nullable for free tier)
  stripe_customer_id    text UNIQUE,
  stripe_subscription_id text UNIQUE,

  -- Billing period
  current_period_start  timestamptz,
  current_period_end    timestamptz,

  -- Usage tracking
  generations_used      integer NOT NULL DEFAULT 0,
  generations_limit     integer NOT NULL DEFAULT 10,  -- Free tier default

  created_at            timestamptz NOT NULL DEFAULT NOW(),
  updated_at            timestamptz NOT NULL DEFAULT NOW(),

  -- One subscription per user
  CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

-- Auto-update updated_at
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
-- Users can only view their own subscription
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own subscription (initial creation)
CREATE POLICY "Users can create their own subscription"
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription (for cancellation, etc.)
-- Note: Sensitive updates (plan changes) should go through server-side functions
CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- TRIGGER: Auto-create profile on user signup
-- =============================================================================
-- When a new user signs up via Supabase Auth, automatically create their profile.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Also create a free subscription for the new user
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');

  RETURN NEW;
END;
$$;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- GRANTS
-- =============================================================================
-- Grant appropriate permissions to roles
-- -----------------------------------------------------------------------------

-- Authenticated users can access public schema tables (RLS handles row-level)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Anonymous users have no access to app tables (must authenticate)
GRANT USAGE ON SCHEMA public TO anon;
-- No table grants for anon - they must sign in first

-- Service role bypasses RLS (for server-side operations)
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
