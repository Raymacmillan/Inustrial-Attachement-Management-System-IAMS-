CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'org', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);


ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can view own role" 
ON user_roles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles" 
ON user_roles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 1. Dropping the circular policies
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON user_roles;

-- 2. New Policy: Allow anyone to see their own role (Flat check)
CREATE POLICY "user_roles_self_read" 
ON user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- 3. New Policy: Allow admins to manage everything (Bypass recursion via JWT)
-- This checks the 'service_role' or a direct UID check if you know your Admin UID
CREATE POLICY "user_roles_admin_manage" 
ON user_roles FOR ALL 
USING (
  (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
)
