-- =============================================================================
-- Migration: Add message column to beta_requests
-- =============================================================================
-- Adds optional message field for users to include with their beta request.
-- Uses IF NOT EXISTS to be idempotent (safe to run multiple times).
-- =============================================================================

ALTER TABLE public.beta_requests
ADD COLUMN IF NOT EXISTS message text;
