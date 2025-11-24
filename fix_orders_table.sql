-- Fix orders table by adding missing columns

-- Add missing columns if they don't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_type TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total DECIMAL(10, 2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transportation_fee DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Unpaid';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for faster queries (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_orders_date ON public.orders(date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- Enable Row Level Security if not already enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Enable all access for orders" ON public.orders;

-- Create policy to allow all operations
CREATE POLICY "Enable all access for orders" ON public.orders
    FOR ALL
    USING (true)
    WITH CHECK (true);
