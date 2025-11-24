-- Create Store Credits table
CREATE TABLE IF NOT EXISTS store_credits (
  id TEXT PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  original_transaction_id TEXT REFERENCES transactions(id),
  is_used BOOLEAN DEFAULT FALSE,
  date_issued TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add returned_items column to transactions table if it doesn't exist
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS returned_items JSONB DEFAULT '[]'::jsonb;

-- Add policies for store_credits (adjust based on your security model)
ALTER TABLE store_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON store_credits
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON store_credits
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON store_credits
    FOR UPDATE USING (auth.role() = 'authenticated');
