
-- First, let's see what enum values exist and add 'user' if it's missing
DO $$ 
BEGIN
    -- Add 'user' to the app_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'user' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE app_role ADD VALUE 'user';
    END IF;
END $$;

-- Also ensure we have other common roles
DO $$ 
BEGIN
    -- Add 'admin' to the app_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE app_role ADD VALUE 'admin';
    END IF;
END $$;
