-- Enable Realtime for subscriptions table
-- This allows clients to subscribe to changes in real-time

-- First, ensure the supabase_realtime publication exists and add subscriptions table
DO $$
BEGIN
  -- Check if the publication exists
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add subscriptions table to the publication if not already added
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'subscriptions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
    END IF;
  END IF;
END
$$;

-- Enable replica identity for the table (needed for UPDATE/DELETE events)
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;
