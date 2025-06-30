
-- Add super admin role for sdotsamuel@gmail.com
-- First, update the handle_new_user_and_role function to include the new email
CREATE OR REPLACE FUNCTION public.handle_new_user_and_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create a profile entry
  INSERT INTO public.profiles (id, artist_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'artist_name', NEW.email));

  -- Check if this should be a super admin (for specific emails)
  IF NEW.email = 'sarthakparikh20010409@gmail.com' OR NEW.email = 'sdotsamuel@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin');
  ELSE
    -- Assign default 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;

-- Add super admin role for sdotsamuel@gmail.com if the user already exists
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'
FROM auth.users u
WHERE u.email = 'sdotsamuel@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
