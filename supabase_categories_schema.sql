-- Categories Table Schema
-- Supports hierarchical category structure with localized names

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

-- Create index for faster parent lookups
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories
CREATE POLICY "Allow public read access to categories"
    ON categories FOR SELECT
    USING (true);

-- Allow authenticated users to insert categories
CREATE POLICY "Allow authenticated insert to categories"
    ON categories FOR INSERT
    WITH CHECK (true);

-- Allow authenticated users to update categories
CREATE POLICY "Allow authenticated update to categories"
    ON categories FOR UPDATE
    USING (true);

-- Allow authenticated users to delete categories
CREATE POLICY "Allow authenticated delete from categories"
    ON categories FOR DELETE
    USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

-- Insert some default categories
INSERT INTO categories (name_en, name_th, slug, parent_id, display_order) VALUES
    ('Building Materials', 'วัสดุก่อสร้าง', 'building_materials', NULL, 1),
    ('Tools & Equipment', 'เครื่องมือและอุปกรณ์', 'tools_equipment', NULL, 2),
    ('Hardware', 'ฮาร์ดแวร์', 'hardware', NULL, 3),
    ('Electrical', 'ไฟฟ้า', 'electrical', NULL, 4),
    ('Plumbing', 'ประปา', 'plumbing', NULL, 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert sub-categories for Building Materials
INSERT INTO categories (name_en, name_th, slug, parent_id, display_order)
SELECT 
    'Cement & Aggregates', 'ปูนซีเมนต์และมวลรวม', 'cement_aggregates',
    (SELECT id FROM categories WHERE slug = 'building_materials'), 1
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'cement_aggregates');

INSERT INTO categories (name_en, name_th, slug, parent_id, display_order)
SELECT 
    'Steel & Rebar', 'เหล็กและเหล็กเส้น', 'steel_rebar',
    (SELECT id FROM categories WHERE slug = 'building_materials'), 2
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'steel_rebar');

INSERT INTO categories (name_en, name_th, slug, parent_id, display_order)
SELECT 
    'Bricks & Blocks', 'อิฐและบล็อก', 'bricks_blocks',
    (SELECT id FROM categories WHERE slug = 'building_materials'), 3
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'bricks_blocks');
