/*
  DESCRIPTION: 
    This table manages the dynamic intent data for the UB IAMS Matching Engine. 
    It separates 'Who the student is' (Profiles) from 'What the student wants' (Preferences).
    
  DISASTER MITIGATION FEATURES:
    - Referential Integrity: Linked to student_profiles via CASCADE for clean deletions.
    - Concurrency Control: 'version' column tracks modifications to prevent race conditions.
    - Matching Guardrails: 'is_searching' allows students to pause the heuristic engine.
    - RBAC: Enforced via Row Level Security (RLS) linked to the 'user_roles' table.
*/

CREATE TABLE IF NOT EXISTS student_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE UNIQUE, 
  
  -- Intent Data
  preferred_roles TEXT[] NOT NULL DEFAULT '{}', 
  preferred_locations TEXT[] NOT NULL DEFAULT '{}', -- Added to match IAMS geographic requirements
  industries TEXT[] NOT NULL DEFAULT '{}',    
  
  -- Matching Engine Logic
  is_searching BOOLEAN DEFAULT true,           -- Toggle to opt-out of matching if already placed
  urgency_level INT DEFAULT 1,                 -- 1: Normal, 2: High (near deadline), 3: Emergency
  
  -- Audit & Recovery
  version INT DEFAULT 1,                       
  last_updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE student_preferences 
ADD COLUMN IF NOT EXISTS technical_skills TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS min_stipend_expected INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_student_prefs_tech_skills ON student_preferences USING GIN (technical_skills);

ALTER TABLE student_preferences 
DROP CONSTRAINT IF EXISTS student_preferences_student_id_key,
ADD CONSTRAINT student_preferences_student_id_key UNIQUE (student_id);

-- 4. CRITICAL: Refresh the API cache
NOTIFY pgrst, 'reload schema';

-- ── ROLE-BASED ACCESS CONTROL (RBAC) ──

-- Helper function to verify user roles server-side
CREATE OR REPLACE FUNCTION current_user_has_role(target_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND LOWER(role) = LOWER(target_role) 
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Security
ALTER TABLE student_preferences ENABLE ROW LEVEL SECURITY;

-- POLICY: Students (Owner-only access)
-- Restricts students to only managing their own intent data.
CREATE POLICY "Students: Manage own preferences"
  ON student_preferences
  FOR ALL 
  USING (auth.uid() = student_id AND current_user_has_role('student'))
  WITH CHECK (auth.uid() = student_id);

-- POLICY: Coordinators (Read-only access)
-- Allows the Matching Engine and Admins to view all preferences for pairing.
CREATE POLICY "Coordinators: View all for matching"
  ON student_preferences
  FOR SELECT
  USING (current_user_has_role('coordinator'));

-- ── PERFORMANCE OPTIMIZATION ──
-- Indexes for the GIN (Generalized Inverted Index) to speed up array searches by the matching engine
CREATE INDEX IF NOT EXISTS idx_student_prefs_roles ON student_preferences USING GIN (preferred_roles);
CREATE INDEX IF NOT EXISTS idx_student_prefs_locations ON student_preferences USING GIN (preferred_locations);



/* Dropped these policies to fix the infinite recursion loop */
DROP POLICY IF EXISTS "Coordinators: View all for matching" ON student_preferences;
DROP POLICY IF EXISTS "Students: Manage own preferences" ON student_preferences;

CREATE POLICY "student_prefs_owner"
ON student_preferences FOR ALL
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

NOTIFY pgrst, 'reload schema'; ended up doing this to drop the recursion problem