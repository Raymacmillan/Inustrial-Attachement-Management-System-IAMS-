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