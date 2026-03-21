/* 
  DESCRIPTION: 
    This table stores the specific internship opportunities offered by host organizations.
    It acts as the 'Requirement Side' of the Intelligent Matching Engine.
    
  DISASTER MITIGATION & ENGINEERING FEATURES:
    - One-to-Many Architecture: Allows a single Organization Profile to host multiple distinct roles.
    - Performance Indexing: Uses a GIN index on 'required_skills' for millisecond-speed matching across arrays.
    - Heuristic Guardrails: Includes 'min_gpa_required' and 'is_active' to automate candidate filtering.
    - Referential Integrity: Linked via 'org_id' with CASCADE delete to ensure no orphaned vacancies exist.
    - RBAC: Enforced via Row Level Security (RLS) and the 'current_user_has_role' helper function.
*/

CREATE TABLE IF NOT EXISTS organization_vacancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
  
  role_title TEXT NOT NULL,         
  job_description TEXT,         
  required_skills TEXT[] DEFAULT '{}',
  available_slots INTEGER DEFAULT 1,
  
  -- Heuristic Constraints for the Matching Engine
  min_gpa_required NUMERIC(3,2) DEFAULT 2.0,
  work_mode TEXT DEFAULT 'On-site', 
  
  -- Status & Metadata
  is_active BOOLEAN DEFAULT true,    
  created_at TIMESTAMPTZ DEFAULT now()
);


CREATE INDEX IF NOT EXISTS idx_vacancies_skills ON organization_vacancies USING GIN (required_skills);


ALTER TABLE organization_vacancies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations: Manage own vacancies"
  ON organization_vacancies
  FOR ALL
  USING (org_id = auth.uid() AND current_user_has_role('organization'))
  WITH CHECK (org_id = auth.uid());

CREATE POLICY "Public: View active vacancies"
  ON organization_vacancies
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Coordinators: View all for auditing"
  ON organization_vacancies
  FOR SELECT
  USING (current_user_has_role('coordinator'));


--Dropped the problematic policies of infinite recursive loop
DROP POLICY IF EXISTS "Organizations: Manage own vacancies" ON organization_vacancies;
DROP POLICY IF EXISTS "Coordinators: View all for auditing" ON organization_vacancies;

-- This checks if the user's ID matches the vacancy's org_id directly
CREATE POLICY "org_manage_own_vacancies"
ON organization_vacancies
FOR ALL
USING (auth.uid() = org_id)
WITH CHECK (auth.uid() = org_id);

-- Create a clean policy for Coordinators using JWT Metadata
-- This avoids querying the user_roles table entirely during the check
CREATE POLICY "coordinators_audit_vacancies"
ON organization_vacancies
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'coordinator'
);

-- Ensure RLS is active
ALTER TABLE organization_vacancies ENABLE ROW LEVEL SECURITY;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';