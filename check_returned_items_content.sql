
SELECT id, returned_items 
FROM transactions 
WHERE returned_items IS NOT NULL AND jsonb_array_length(returned_items) > 0;
