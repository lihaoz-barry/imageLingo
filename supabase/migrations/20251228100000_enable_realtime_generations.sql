-- Enable Realtime for generations table
-- This allows clients to subscribe to changes in real-time for async processing

DO $$
BEGIN
  -- Check if the publication exists
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add generations table to the publication if not already added
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'generations'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.generations;
    END IF;
  END IF;
END
$$;

-- Enable replica identity for the table (needed for UPDATE/DELETE events)
ALTER TABLE public.generations REPLICA IDENTITY FULL;
