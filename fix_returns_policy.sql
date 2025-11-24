-- Drop the restrictive policies created earlier
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON store_credits;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON store_credits;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON store_credits;

-- Create a permissive policy to allow the app to write to this table
-- (Matching the existing security model of the other tables in this prototype)
CREATE POLICY "Enable all for public" ON store_credits
    FOR ALL
    USING (true)
    WITH CHECK (true);
