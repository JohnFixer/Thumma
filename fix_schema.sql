-- Fix missing columns in products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Fix potentially missing columns in product_variants table (just in case)
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'In Stock';
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]';

-- Ensure RLS policies are applied (re-running this is safe)
SELECT create_policy_if_not_exists('Enable all for users', 'products', 'ALL', 'public');
SELECT create_policy_if_not_exists('Enable all for users', 'product_variants', 'ALL', 'public');
