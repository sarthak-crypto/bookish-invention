
-- Add super admin role to your account
INSERT INTO public.user_roles (user_id, role) 
VALUES ('c8610297-fe51-44d1-bfb3-b9ede1f5af43', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
