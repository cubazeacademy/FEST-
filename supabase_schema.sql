-- Supabase Database Schema for Arts & Sports Fest Management Platform
-- Project URL: https://sebphzbptktohcisskht.supabase.co

CREATE TABLE IF NOT EXISTS public.fest_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.fest_state ENABLE ROW LEVEL SECURITY;

-- Policies for public / anon access
DROP POLICY IF EXISTS "Allow public read fest_state" ON public.fest_state;
DROP POLICY IF EXISTS "Allow public insert fest_state" ON public.fest_state;
DROP POLICY IF EXISTS "Allow public update fest_state" ON public.fest_state;
DROP POLICY IF EXISTS "Allow public delete fest_state" ON public.fest_state;

CREATE POLICY "Allow public read fest_state" ON public.fest_state FOR SELECT USING (true);
CREATE POLICY "Allow public insert fest_state" ON public.fest_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update fest_state" ON public.fest_state FOR UPDATE USING (true);
CREATE POLICY "Allow public delete fest_state" ON public.fest_state FOR DELETE USING (true);

-- Grant privileges
GRANT ALL ON public.fest_state TO anon, authenticated, service_role;

-- Enable Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.fest_state;
