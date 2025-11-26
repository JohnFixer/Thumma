-- Enable Row Level Security on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON public.users;
DROP POLICY IF EXISTS "Allow public update access" ON public.users;
DROP POLICY IF EXISTS "Allow public insert access" ON public.users;
DROP POLICY IF EXISTS "Allow public delete access" ON public.users;

-- Create policies to allow full access to the users table for the application
-- Note: Since the application handles authentication internally with simulated users,
-- we need to allow the 'anon' role (used by the Supabase client) to modify the table.

CREATE POLICY "Allow public read access" ON public.users
FOR SELECT USING (true);

CREATE POLICY "Allow public update access" ON public.users
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public insert access" ON public.users
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON public.users
FOR DELETE USING (true);

-- Grant permissions to the anon and authenticated roles
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;
