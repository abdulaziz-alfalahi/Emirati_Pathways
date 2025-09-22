
-- Check if we need to update the user_role enum type to include all roles
-- First, let's see the current enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'user_role'
);

-- If the enum doesn't include all the roles from our UserRole type, we need to add them
-- Add missing roles to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'platform_operator';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'administrator';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_user';
