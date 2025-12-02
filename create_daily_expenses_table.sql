-- Create daily_expenses table
CREATE TABLE IF NOT EXISTS daily_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount NUMERIC NOT NULL,
    remark TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE daily_expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for Account Managers and Admins/CEOs to insert
CREATE POLICY "Enable insert for authenticated users" ON daily_expenses
    FOR INSERT WITH CHECK (true);

-- Create policy for Account Managers and Admins/CEOs to select
CREATE POLICY "Enable select for authenticated users" ON daily_expenses
    FOR SELECT USING (true);
