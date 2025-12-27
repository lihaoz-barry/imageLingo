-- =============================================================================
-- Migration: Beta Token Request System
-- =============================================================================
-- This migration creates the infrastructure for users to request beta tokens
-- and for admin to approve those requests.
--
-- Tables created:
--   - public.beta_requests : Stores user beta token requests
--
-- Security:
--   - RLS policies ensure users can only view their own requests
--   - Admin access is controlled at the application level (API routes)
--   - Email and personal data are protected by RLS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: public.beta_requests
-- -----------------------------------------------------------------------------
-- Stores beta token requests from users. Each user can request only once.
-- Admin (lihaoz0214@gmail.com) can view and approve requests via admin API.
-- -----------------------------------------------------------------------------

CREATE TYPE public.beta_request_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TABLE public.beta_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL,
  message         text,
  status          public.beta_request_status NOT NULL DEFAULT 'pending',
  credits_granted integer DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW(),
  approved_at     timestamptz,
  approved_by     text,

  -- Ensure one request per user
  -- This constraint prevents duplicate requests and will cause INSERT operations
  -- to fail with error code 23505 if a user attempts to request multiple times
  CONSTRAINT unique_user_request UNIQUE (user_id)
);

-- Indexes
CREATE INDEX idx_beta_requests_user_id ON public.beta_requests(user_id);
CREATE INDEX idx_beta_requests_status ON public.beta_requests(status);
CREATE INDEX idx_beta_requests_created_at ON public.beta_requests(created_at DESC);
CREATE INDEX idx_beta_requests_email ON public.beta_requests(email);

-- Auto-update updated_at
CREATE TRIGGER beta_requests_updated_at
  BEFORE UPDATE ON public.beta_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.beta_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for beta_requests
-- Users can view only their own beta request
CREATE POLICY "Users can view their own beta request"
  ON public.beta_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own beta request (one time only, enforced by unique constraint)
CREATE POLICY "Users can create their own beta request"
  ON public.beta_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users cannot update their own requests (only admin can via service role)
-- No UPDATE policy for regular authenticated users

-- Users cannot delete their requests
-- No DELETE policy for regular authenticated users

-- =============================================================================
-- GRANTS
-- =============================================================================
-- Grant appropriate permissions
-- -----------------------------------------------------------------------------

-- Authenticated users can insert and select their own requests (RLS handles row-level)
GRANT SELECT, INSERT ON public.beta_requests TO authenticated;

-- Service role can do everything (for admin operations)
GRANT ALL ON public.beta_requests TO service_role;
