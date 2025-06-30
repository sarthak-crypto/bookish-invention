
-- Update the handle_new_user_and_role function to only grant super admin to the specific email
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

  -- Check if this should be a super admin (only for the specific email)
  IF NEW.email = 'sarthakparikh20010409@gmail.com' THEN
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

-- Remove super admin role from any user that doesn't have the correct email
DELETE FROM public.user_roles 
WHERE role = 'super_admin' 
AND user_id IN (
  SELECT ur.user_id 
  FROM public.user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  WHERE ur.role = 'super_admin' 
  AND u.email != 'sarthakparikh20010409@gmail.com'
);

-- Add super admin role only to the specific email if it exists
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'
FROM auth.users u
WHERE u.email = 'sarthakparikh20010409@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
