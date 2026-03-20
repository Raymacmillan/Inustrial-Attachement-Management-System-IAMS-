/* INDUSTRIAL ATTACHMENT MANAGEMENT SYSTEM (IAMS) - PLACEMENT MODULE
Description: This table serves as the core relational bridge between 
student_profiles and organization_profiles. It is designed to facilitate 
the "Allocated" state of the attachment lifecycle for the 
University of Botswana (UB) 8-week industrial attachment period.
*/

CREATE TABLE IF NOT EXISTS placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign Key Relationships
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE NOT NULL, 
  
  -- Industrial Supervisor Details 
  supervisor_name TEXT, 
  supervisor_email TEXT, 
  
  -- UB 8-Week Window
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status & Job Title
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
  position_title TEXT DEFAULT 'Intern',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: A student can only have one 'active' placement
  UNIQUE(student_id, status) 
);

-- Flexible duration 
ALTER TABLE placements 
ALTER TABLE placements ADD COLUMN IF NOT EXISTS duration_weeks INTEGER DEFAULT 8;
ALTER TABLE logbook_weeks DROP CONSTRAINT IF EXISTS logbook_weeks_week_number_check;
ALTER TABLE logbook_weeks ADD CONSTRAINT logbook_weeks_week_number_min CHECK (week_number >= 1);


ALTER TABLE logbook_weeks 
DROP CONSTRAINT logbook_weeks_week_number_check;

ALTER TABLE logbook_weeks 
ADD CONSTRAINT logbook_weeks_week_number_check 
CHECK (week_number >= 1); 

-- Enable Security
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;

-- Access Control Policies
CREATE POLICY "Students can view their own placement" 
ON placements FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Organizations can view their interns" 
ON placements FOR SELECT USING (auth.uid() = organization_id);

CREATE POLICY "Only admins can manage placements" 
ON placements FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);