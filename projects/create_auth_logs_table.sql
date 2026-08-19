-- Migration: Create auth_logs table in Supabase for tracking login attempts
CREATE TABLE IF NOT EXISTS public.auth_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    username text NOT NULL,
    status text NOT NULL, -- 'SUCCESS', 'FAILED', 'BLOCKED'
    ip_address text,
    user_agent text,
    failure_reason text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auth_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'auth_logs' AND policyname = 'Enable insert for all'
  ) THEN
    CREATE POLICY "Enable insert for all" ON public.auth_logs FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'auth_logs' AND policyname = 'Enable select for anon'
  ) THEN
    CREATE POLICY "Enable select for anon" ON public.auth_logs FOR SELECT USING (true);
  END IF;
END $$;
