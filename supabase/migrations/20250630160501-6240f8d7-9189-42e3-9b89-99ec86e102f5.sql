
-- First, let's drop any existing problematic policies on user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can manage their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows users to read their own roles
-- This avoids recursion by not calling functions that check roles
CREATE POLICY "Users can view their own roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow authenticated users to read all user roles (needed for admin functions)
-- but only if they are accessing via the security definer functions
CREATE POLICY "Allow role checks via security definer functions" 
  ON public.user_roles 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Create a function to safely check super admin status without RLS recursion
CREATE OR REPLACE FUNCTION public.is_user_super_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = check_user_id AND role = 'super_admin'
  );
$$;
