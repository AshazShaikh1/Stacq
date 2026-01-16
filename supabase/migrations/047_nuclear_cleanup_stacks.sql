-- Nuclear Option: Dynamically find and drop ANY policy referencing 'stacks'
-- This ensures that no matter where the legacy reference is hiding, it gets destroyed.
-- Fixed: Uses 'qual' and 'with_check' columns instead of 'definition'

DO $$
DECLARE
  pol record;
BEGIN
  -- 1. DROP ALL POLICIES referencing 'from stacks' or '"stacks"'
  FOR pol IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies 
    WHERE 
      (cmd = 'SELECT' OR cmd = 'UPDATE' OR cmd = 'DELETE' OR cmd = 'INSERT')
      AND (
        COALESCE(qual, '') ILIKE '%stacks %' 
        OR COALESCE(qual, '') ILIKE '%"stacks"%'
        OR COALESCE(with_check, '') ILIKE '%stacks %'
        OR COALESCE(with_check, '') ILIKE '%"stacks"%'
      )
  LOOP
    RAISE NOTICE 'Dropping legacy policy: % on %.%', pol.policyname, pol.schemaname, pol.tablename;
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;

  -- 2. Clean up specific legacy RLS policies known to cause issues (redundant but safe)
  DROP POLICY IF EXISTS "Users and stack owners can delete comments" ON comments;
  DROP POLICY IF EXISTS "Stack owners can manage tags" ON collection_tags;

  -- 3. Fix broken functions that might reference stacks
  -- owns_stack is used by some legacy policies, so we patch it to use collections
  EXECUTE '
    CREATE OR REPLACE FUNCTION owns_stack(user_id uuid, stack_id uuid)
    RETURNS boolean AS $f$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM collections 
        WHERE id = stack_id AND owner_id = user_id
      );
    END;
    $f$ LANGUAGE plpgsql SECURITY DEFINER;
  ';

END $$;
