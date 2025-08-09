
-- Remove price field and add quantity field to fan_cards table
ALTER TABLE public.fan_cards DROP COLUMN IF EXISTS price;
ALTER TABLE public.fan_cards ADD COLUMN quantity integer NOT NULL DEFAULT 1;

-- Update orders table to remove total_amount dependency on fan card price
-- Since price is removed, we'll need to handle pricing differently in orders
ALTER TABLE public.orders ALTER COLUMN total_amount DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN total_amount SET DEFAULT 0.00;
