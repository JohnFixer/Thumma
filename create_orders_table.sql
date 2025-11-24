-- Create orders table for delivery and pickup orders

CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_type TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    items JSONB NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    transportation_fee DECIMAL(10, 2) DEFAULT 0,
    fulfillment_status TEXT NOT NULL DEFAULT 'Pending',
    order_type TEXT NOT NULL, -- 'Delivery' or 'Pickup'
    delivery_address TEXT,
    notes TEXT,
    payment_status TEXT NOT NULL DEFAULT 'Unpaid',
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL security;

-- Create policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Enable all access for orders" ON public.orders
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_date ON public.orders(date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
