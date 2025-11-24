-- 1. Create Store Credits table if it doesn't exist
CREATE TABLE IF NOT EXISTS store_credits (
  id TEXT PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  original_transaction_id TEXT REFERENCES transactions(id),
  is_used BOOLEAN DEFAULT FALSE,
  date_issued TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add returned_items column to transactions table if it doesn't exist
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS returned_items JSONB DEFAULT '[]'::jsonb;

-- 3. Enable RLS for store_credits
ALTER TABLE store_credits ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for store_credits (permissive for now as per other tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Enable all for users' 
        AND tablename = 'store_credits'
    ) THEN
        CREATE POLICY "Enable all for users" ON store_credits FOR ALL TO public USING (true);
    END IF;
END
$$;

-- 5. Create or replace the RPC function for creating store credits
CREATE OR REPLACE FUNCTION create_store_credit_rpc(
  p_amount DECIMAL,
  p_original_transaction_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_result JSONB;
BEGIN
  -- Generate code: SC-TIMESTAMP-RANDOM
  v_code := 'SC-' || to_char(now(), 'MSUS') || '-' || floor(random() * 1000)::text;

  INSERT INTO store_credits (id, amount, original_transaction_id, is_used, date_issued)
  VALUES (v_code, p_amount, p_original_transaction_id, false, now())
  RETURNING to_jsonb(store_credits.*) INTO v_result;

  RETURN v_result;
END;
$$;
