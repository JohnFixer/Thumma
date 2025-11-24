-- Fix missing categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_th TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert to categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update to categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete from categories" ON categories FOR DELETE USING (true);

-- Insert default categories if they don't exist
INSERT INTO categories (name_en, name_th, slug, parent_id, display_order) VALUES
    ('Building Materials', 'วัสดุก่อสร้าง', 'building_materials', NULL, 1),
    ('Tools & Equipment', 'เครื่องมือและอุปกรณ์', 'tools_equipment', NULL, 2),
    ('Hardware', 'ฮาร์ดแวร์', 'hardware', NULL, 3),
    ('Electrical', 'ไฟฟ้า', 'electrical', NULL, 4),
    ('Plumbing', 'ประปา', 'plumbing', NULL, 5)
ON CONFLICT (slug) DO NOTHING;

-- Fix store_credits table
CREATE TABLE IF NOT EXISTS store_credits (
  id TEXT PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  original_transaction_id TEXT REFERENCES transactions(id),
  is_used BOOLEAN DEFAULT FALSE,
  date_issued TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure is_used column exists (in case table existed but column didn't)
ALTER TABLE store_credits ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT FALSE;

-- Add returned_items to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS returned_items JSONB DEFAULT '[]'::jsonb;

-- RLS for store_credits
ALTER TABLE store_credits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'store_credits' AND policyname = 'Enable read access for authenticated users') THEN
        CREATE POLICY "Enable read access for authenticated users" ON store_credits FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'store_credits' AND policyname = 'Enable insert access for authenticated users') THEN
        CREATE POLICY "Enable insert access for authenticated users" ON store_credits FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'store_credits' AND policyname = 'Enable update access for authenticated users') THEN
        CREATE POLICY "Enable update access for authenticated users" ON store_credits FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
END
$$;
