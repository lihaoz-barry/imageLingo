-- =============================================================================
-- Migration: Update credits system
-- =============================================================================
-- Changes:
-- 1. Set default credits to 20 for new users
-- 2. Update existing free tier users to have 20 credits
-- 3. Update the handle_new_user trigger
-- =============================================================================

-- Update default credits to 20 for new users
ALTER TABLE public.subscriptions
ALTER COLUMN generations_limit SET DEFAULT 20;

-- Update existing free tier users who have the old default (10) to have 20
UPDATE public.subscriptions
SET generations_limit = 20
WHERE plan = 'free' AND generations_limit = 10;

-- Update the handle_new_user trigger to explicitly set 20 credits
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

  -- Create a free subscription with 20 credits for the new user
  INSERT INTO public.subscriptions (user_id, plan, status, generations_limit, generations_used)
  VALUES (NEW.id, 'free', 'active', 20, 0);

  RETURN NEW;
END;
$$;
