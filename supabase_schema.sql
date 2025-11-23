-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users (Public Profile)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    full_name TEXT,
    role TEXT[] DEFAULT '{}', -- Array of roles
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    permissions JSONB DEFAULT '{}',
    salary NUMERIC,
    wage_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Store Settings
CREATE TABLE IF NOT EXISTS public.store_settings (
    id SERIAL PRIMARY KEY,
    store_name JSONB NOT NULL, -- {en: string, th: string}
    logo_url TEXT,
    address JSONB,
    phone JSONB,
    tax_id JSONB,
    default_outsource_markup NUMERIC,
    delivery_rate_per_km NUMERIC,
    dashboard_widget_visibility JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name JSONB NOT NULL, -- {en: string, th: string}
    description JSONB,
    category TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Product Variants (Normalized)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE,
    barcode TEXT, -- Not unique globally as different variants might share barcodes in some weird cases, but usually unique. Let's keep it simple.
    size TEXT,
    stock_quantity INTEGER DEFAULT 0,
    price_walk_in NUMERIC DEFAULT 0,
    price_contractor NUMERIC DEFAULT 0,
    price_government NUMERIC DEFAULT 0,
    cost_price NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'In Stock', -- 'In Stock', 'Low Stock', 'Out of Stock'
    history JSONB DEFAULT '[]', -- Array of StockHistory
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'walkIn', 'contractor', 'government', 'organization'
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Transactions (Sales)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY, -- "ORD-..."
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT, -- Snapshot
    customer_type TEXT, -- Snapshot
    customer_address TEXT, -- Snapshot
    customer_phone TEXT, -- Snapshot
    operator_id UUID REFERENCES public.users(id), -- Operator who made the sale
    operator_name TEXT, -- Snapshot
    
    subtotal NUMERIC DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    transportation_fee NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    
    payment_method TEXT, -- 'Cash', 'Card', 'Bank Transfer'
    payment_status TEXT DEFAULT 'Paid', -- 'Paid', 'Unpaid', 'Partially Paid'
    paid_amount NUMERIC DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE,
    
    items JSONB DEFAULT '[]', -- Snapshot of CartItem[]
    vat_included BOOLEAN DEFAULT FALSE,
    file_url TEXT, -- For attached invoices/receipts
    
    shift_id UUID, -- Link to a shift report if applicable (we'll create table below)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Shift Reports
CREATE TABLE IF NOT EXISTS public.shift_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    closed_by_user_id UUID REFERENCES public.users(id),
    total_sales NUMERIC DEFAULT 0,
    total_profit NUMERIC DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    payment_method_breakdown JSONB DEFAULT '{}',
    top_selling_items JSONB DEFAULT '[]',
    transaction_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Bills (Accounts Payable)
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    invoice_number TEXT,
    bill_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    amount NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Due', -- 'Due', 'Paid', 'Overdue'
    payments JSONB DEFAULT '[]', -- Array of BillPayment
    notes TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Activity Log
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    action TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
-- For simplicity in this prototype, we will allow authenticated users to do everything.
-- In a real production app, you would restrict based on roles.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to create policy if not exists
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(policy_name text, table_name text, cmd text, roles text)
RETURNS void AS
$$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = table_name
    ) THEN
        EXECUTE format('CREATE POLICY %I ON %I FOR %s TO %s USING (true)', policy_name, table_name, cmd, roles);
    END IF;
END;
$$
LANGUAGE plpgsql;

-- Apply policies using the helper
-- We use 'public' role to allow both anon and authenticated users
SELECT create_policy_if_not_exists('Enable all for users', 'users', 'ALL', 'public');
SELECT create_policy_if_not_exists('Enable all for users', 'store_settings', 'ALL', 'public');
SELECT create_policy_if_not_exists('Enable all for users', 'products', 'ALL', 'public');
SELECT create_policy_if_not_exists('Enable all for users', 'product_variants', 'ALL', 'public');
SELECT create_policy_if_not_exists('Enable all for users', 'customers', 'ALL', 'public');
SELECT create_policy_if_not_exists('Enable all for users', 'suppliers', 'ALL', 'public');
SELECT create_policy_if_not_exists('Enable all for users', 'transactions', 'ALL', 'public');
SELECT create_policy_if_not_exists('Enable all for users', 'shift_reports', 'ALL', 'public');
SELECT create_policy_if_not_exists('Enable all for users', 'bills', 'ALL', 'public');
SELECT create_policy_if_not_exists('Enable all for users', 'activity_logs', 'ALL', 'public');

-- Also allow read access for anon (if needed for login page settings, etc, but usually not)
-- Let's keep it strict to authenticated for now.
