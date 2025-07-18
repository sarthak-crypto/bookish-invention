-- Fix infinite recursion issue in user_roles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow service role to manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow role checks via security definer functions" ON public.user_roles;
DROP POLICY IF EXISTS "Allow public read for dashboard" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create new simplified policies that avoid recursion
-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Allow service role to manage all user roles (for edge functions and admin operations)
CREATE POLICY "Service role can manage all user roles" ON public.user_roles
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow specific super admin emails to manage all user roles
CREATE POLICY "Specific super admins can manage user roles" ON public.user_roles
FOR ALL
USING (
  auth.email() IN ('sarthakparikh20010409@gmail.com', 'sdotsamuel@gmail.com')
);

-- Allow public read access for the admin functions (needed for role checking)
CREATE POLICY "Public read access for admin functions" ON public.user_roles
FOR SELECT
USING (true);