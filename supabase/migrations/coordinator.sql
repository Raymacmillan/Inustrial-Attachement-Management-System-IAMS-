-- 1. Remove the old restrictive rule
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- 2. Add the new rule that includes 'coordinator'
ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('student', 'org', 'coordinator'));

--Drop EVERY policy on user_roles by name
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_roles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON user_roles', pol.policyname);
  END LOOP;
END $$;

-- Step 2: One simple policy — users read their own row only
-- No subqueries, no function calls, no recursion possible
CREATE POLICY "user_roles_read_own"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Step 3: Reload
NOTIFY pgrst, 'reload schema';