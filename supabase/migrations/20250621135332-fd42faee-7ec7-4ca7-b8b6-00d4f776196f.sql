
-- First, let's drop the existing problematic policies on user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete their own roles" ON public.user_roles;

-- Create simpler, non-recursive policies for user_roles
CREATE POLICY "Allow authenticated users to view user roles" 
  ON public.user_roles 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow service role to manage user roles" 
  ON public.user_roles 
  FOR ALL 
  TO service_role 
  USING (true);

-- Also add RLS policies for the orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

-- Create new policies for orders table
CREATE POLICY "Users can view their own orders" 
  ON public.orders 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
  ON public.orders 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" 
  ON public.orders 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);
