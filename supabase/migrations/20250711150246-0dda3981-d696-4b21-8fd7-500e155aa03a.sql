-- Add payment tracking fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Create index for better query performance on payment fields
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);