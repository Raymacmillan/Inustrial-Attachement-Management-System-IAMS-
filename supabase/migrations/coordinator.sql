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



-- 1. Give Coordinators access to see ALL student profiles
CREATE POLICY "coordinators_view_all_profiles" 
ON student_profiles FOR SELECT 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'coordinator');

-- 2. Give Coordinators access to see ALL student preferences (Skills, Roles, etc.)
CREATE POLICY "coordinators_view_all_preferences" 
ON student_preferences FOR SELECT 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'coordinator');

-- 3. Give Coordinators access to see ALL placements
CREATE POLICY "coordinators_view_all_placements" 
ON placements FOR SELECT 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'coordinator');

-- 4. Refresh API cache
NOTIFY pgrst, 'reload schema';


-- Add coordinator read access without recursion
-- Uses JWT metadata instead of querying user_roles table
CREATE POLICY "coordinator_read_all_prefs"
ON student_preferences FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'coordinator'
);

NOTIFY pgrst, 'reload schema';


-- Drop and recreate handle_new_user_role to assign coordinator
-- when no role is present (i.e. manually created via dashboard)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger AS $$
DECLARE
  detected_role TEXT;
BEGIN
  -- If role exists in metadata use it, otherwise assume coordinator
  -- (students and orgs always have role set via registration form)
  detected_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'coordinator'  -- dashboard-created users default to coordinator
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, detected_role)
  ON CONFLICT (user_id) DO UPDATE SET role = detected_role;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. Allow Coordinators to UPDATE student profiles (for status changes)
CREATE POLICY "coordinators_update_student_status" 
ON student_profiles FOR UPDATE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'coordinator'
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'coordinator'
);

-- 2. Ensure the user_roles table is also accessible for the check
-- (Just in case the JWT check fails, this is a solid backup)
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Reload the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

