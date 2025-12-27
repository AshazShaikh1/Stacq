-- Add onboarding_completed column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing users to have completed onboarding (Backfill)
-- This ensures we don't lock out current active users
UPDATE public.users 
SET onboarding_completed = TRUE 
WHERE onboarding_completed IS FALSE;

-- Update the handle_new_user trigger to set default to FALSE explicitly (redundant but safe)
-- The default on the column handles it, but good to be explicit if the function inserts it.
-- checking the function 'handle_new_user' shows it inserts specific columns. 
-- Since we added a DEFAULT constraint, we don't strictly need to modify the trigger unless we want to force it.
-- The DEFAULT FALSE will apply to new insertions that don't specify the column.
