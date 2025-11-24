-- Create a stored procedure to handle store credit creation
-- This bypasses the PostgREST table schema cache issues
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
