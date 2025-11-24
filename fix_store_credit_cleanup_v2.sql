-- Fix store_credits table column names (camelCase vs snake_case) - V2 (Handles Orphan Records)

DO $$
BEGIN
    -- 0. Pre-cleanup: Remove orphan store credits that point to non-existent transactions
    -- This prevents foreign key violations during the migration
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_credits' AND column_name = 'originalTransactionId') THEN
        DELETE FROM store_credits 
        WHERE "originalTransactionId" IS NOT NULL 
        AND "originalTransactionId" NOT IN (SELECT id FROM transactions);
    END IF;

    -- 1. Handle originalTransactionId -> original_transaction_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_credits' AND column_name = 'originalTransactionId') THEN
        -- If snake_case version also exists (e.g. from previous fix), migrate data and drop camelCase
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_credits' AND column_name = 'original_transaction_id') THEN
            UPDATE store_credits SET original_transaction_id = "originalTransactionId" WHERE original_transaction_id IS NULL;
            ALTER TABLE store_credits DROP COLUMN "originalTransactionId";
        ELSE
            -- Otherwise just rename
            ALTER TABLE store_credits RENAME COLUMN "originalTransactionId" TO original_transaction_id;
        END IF;
    END IF;

    -- 2. Handle isUsed -> is_used
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_credits' AND column_name = 'isUsed') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_credits' AND column_name = 'is_used') THEN
            UPDATE store_credits SET is_used = "isUsed" WHERE is_used IS NULL;
            ALTER TABLE store_credits DROP COLUMN "isUsed";
        ELSE
            ALTER TABLE store_credits RENAME COLUMN "isUsed" TO is_used;
        END IF;
    END IF;

    -- 3. Handle dateIssued -> date_issued
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_credits' AND column_name = 'dateIssued') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_credits' AND column_name = 'date_issued') THEN
            UPDATE store_credits SET date_issued = "dateIssued" WHERE date_issued IS NULL;
            ALTER TABLE store_credits DROP COLUMN "dateIssued";
        ELSE
            ALTER TABLE store_credits RENAME COLUMN "dateIssued" TO date_issued;
        END IF;
    END IF;
END $$;

-- Ensure columns exist and have correct types (idempotent)
ALTER TABLE store_credits ADD COLUMN IF NOT EXISTS original_transaction_id TEXT REFERENCES transactions(id);
ALTER TABLE store_credits ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT FALSE;
ALTER TABLE store_credits ADD COLUMN IF NOT EXISTS date_issued TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Re-create the RPC to ensure it uses the correct snake_case columns
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
