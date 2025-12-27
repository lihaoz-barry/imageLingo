-- =============================================================================
-- Migration: Create feedback table
-- =============================================================================
-- Stores user feedback submissions for admin review.
-- Similar structure to beta_requests for consistency.
-- =============================================================================

-- Create feedback status enum
CREATE TYPE public.feedback_status AS ENUM (
  'unread',
  'read',
  'archived'
);

-- Create feedback table
CREATE TABLE public.feedback (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email           text,
  message         text NOT NULL,
  source          text DEFAULT 'feedback_button', -- 'feedback_button', 'contact_form', etc.
  status          public.feedback_status NOT NULL DEFAULT 'unread',
  created_at      timestamptz NOT NULL DEFAULT now(),
  read_at         timestamptz,
  read_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Admin can view all feedback
CREATE POLICY "Admin can view all feedback"
  ON public.feedback
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'lihaoz0214@gmail.com'
    )
  );

-- Admin can update feedback status
CREATE POLICY "Admin can update feedback"
  ON public.feedback
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'lihaoz0214@gmail.com'
    )
  );

-- Anyone can insert feedback (including anonymous)
CREATE POLICY "Anyone can submit feedback"
  ON public.feedback
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);
