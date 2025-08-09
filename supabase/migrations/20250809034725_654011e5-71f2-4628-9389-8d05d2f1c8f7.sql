
-- Add status and purchased columns to fan_cards table
ALTER TABLE public.fan_cards 
ADD COLUMN status text DEFAULT 'pending',
ADD COLUMN purchased boolean DEFAULT false;
