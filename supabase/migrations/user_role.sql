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