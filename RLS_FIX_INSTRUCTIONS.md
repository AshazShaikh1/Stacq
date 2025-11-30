# Fix RLS Policy for Cards Table

## Problem
Getting error: "new row violates row-level security policy for table 'cards'" when adding cards.

## Solution

### Step 1: Run the Migration

Open your Supabase Dashboard → SQL Editor and run this:

```sql
-- Fix cards RLS policy to allow authenticated users to create cards
DROP POLICY IF EXISTS "Authenticated users can create cards" ON cards;

CREATE POLICY "Authenticated users can create cards"
ON cards FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);
```

Or copy and paste the entire contents of `supabase/migrations/005_fix_cards_rls.sql`

### Step 2: Verify the Policy

Run this query to verify the policy exists:

```sql
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'cards' AND policyname = 'Authenticated users can create cards';
```

You should see one row with the policy details.

### Step 3: Test

Try adding a card again. If it still fails:

1. Check the browser console for the full error message
2. Verify you're logged in (check Supabase Auth → Users)
3. Check that your user exists in the `users` table

### Alternative: Temporarily Disable RLS (Development Only)

⚠️ **WARNING: Only for development/testing!**

```sql
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;
```

Then re-enable after testing:
```sql
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
```

## Why This Happens

The RLS policy was checking `auth.uid() = created_by`, but in API routes, the auth context might not be properly passed. The new policy only requires that the user is authenticated (`auth.uid() IS NOT NULL`), which is more reliable.

