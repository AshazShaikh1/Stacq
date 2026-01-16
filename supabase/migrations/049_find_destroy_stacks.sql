-- Nuclear Cleanup 2.0: Dynamic Function Purge
-- Finds and Drops any function that references the deleted 'stacks' table.
-- This handles legacy triggers/functions that weren't updated during the rename.

DO $$
DECLARE
  func record;
BEGIN
  FOR func IN 
    SELECT n.nspname, p.proname, p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE 
      n.nspname = 'public'
      AND (
        p.prosrc ILIKE '%FROM stacks%' 
        OR p.prosrc ILIKE '%JOIN stacks%' 
        OR p.prosrc ILIKE '%UPDATE stacks%' 
        OR p.prosrc ILIKE '%INSERT INTO stacks%'
        OR p.prosrc ILIKE '%"stacks"%'
      )
  LOOP
    RAISE NOTICE 'Dropping legacy function: %.% (OID: %)', func.nspname, func.proname, func.oid;
    -- Cascade drops the triggers that use this function
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 
      func.nspname, 
      func.proname, 
      pg_get_function_identity_arguments(func.oid)
    );
  END LOOP;
END $$;
