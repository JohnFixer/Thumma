-- Reload the PostgREST schema cache
-- This is necessary when you add new tables or columns so the API knows about them.
NOTIFY pgrst, 'reload config';
