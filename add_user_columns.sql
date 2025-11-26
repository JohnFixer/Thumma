-- Add missing columns to the users table if they don't exist

-- Role (as text array)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text[] DEFAULT '{}';

-- Permissions (as JSONB)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb;

-- Settings (as JSONB)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;

-- Salary (numeric)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS salary numeric;

-- Wage Type (text)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wage_type text;

-- Full Name (text)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name text;

-- Avatar URL (text)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;
