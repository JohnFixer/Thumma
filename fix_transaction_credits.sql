-- Add applied_store_credit column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS applied_store_credit JSONB;

-- Ensure store_credits table has correct columns (idempotent check)
DO $$
BEGIN
    -- Check for is_used column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_credits' AND column_name = 'is_used') THEN
        ALTER TABLE store_credits ADD COLUMN is_used BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
