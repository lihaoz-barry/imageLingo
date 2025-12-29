-- Error Handling & Retry Tracking Schema
-- Adds error tracking to generations table and creates audit log for errors

-- 1. Add error tracking columns to generations table
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS error_code TEXT;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS is_retryable BOOLEAN DEFAULT FALSE;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS first_error_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE;

-- 2. Create error_logs table for detailed audit trail
CREATE TABLE IF NOT EXISTS public.error_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id       UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  error_code          TEXT NOT NULL,                -- Error classification (RATE_LIMIT, TIMEOUT, etc.)
  error_message       TEXT NOT NULL,                -- Full error message from API
  attempt_number      INTEGER NOT NULL,             -- Which attempt failed (1, 2, 3)
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT error_logs_attempt_check CHECK (attempt_number >= 1 AND attempt_number <= 3)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_generation_id ON public.error_logs(generation_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_code ON public.error_logs(error_code);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_error_code ON public.generations(error_code) WHERE status = 'failed';

-- 4. Enable RLS for error_logs table
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Users can view own error logs
CREATE POLICY "Users can view own error logs"
  ON public.error_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- 6. RLS Policy: Service role can insert error logs
CREATE POLICY "Service role can insert error logs"
  ON public.error_logs
  FOR INSERT
  WITH CHECK (true);

-- 7. Create view for error analytics
CREATE OR REPLACE VIEW public.error_analytics AS
SELECT
  DATE(created_at) AS error_date,
  error_code,
  COUNT(*) AS total_errors,
  COUNT(DISTINCT generation_id) AS unique_generations,
  COUNT(DISTINCT user_id) AS affected_users,
  MAX(created_at) AS last_occurrence
FROM public.error_logs
GROUP BY DATE(created_at), error_code
ORDER BY error_date DESC, total_errors DESC;

-- 8. Add comment for clarity
COMMENT ON TABLE public.error_logs IS 'Audit trail for all error attempts during image processing';
COMMENT ON COLUMN public.error_logs.attempt_number IS 'Which attempt failed: 1=initial, 2=first retry, 3=second retry';
COMMENT ON COLUMN public.error_logs.error_code IS 'Error classification: RATE_LIMIT, TIMEOUT, CONFIG_ERROR, NO_IMAGE, API_ERROR';
