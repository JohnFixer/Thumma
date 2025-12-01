ALTER TABLE transactions ADD COLUMN payments JSONB DEFAULT '[]'::jsonb;
