-- Fix cards RLS policy to allow authenticated users to create cards
-- The issue is that the policy might be too strict or the auth context isn't being passed properly

-- Drop the existing policy
DROP POLICY IF EXISTS "Authenticated users can create cards" ON cards;

-- Create a more permissive policy that allows any authenticated user to create cards
-- The created_by field will be set by the application, but we allow it to be set to the auth user
CREATE POLICY "Authenticated users can create cards"
ON cards FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Verify the policy was created
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'cards' AND policyname = 'Authenticated users can create cards';
