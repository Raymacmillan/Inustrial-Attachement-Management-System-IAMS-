/* 
Description: This module implements the daily and weekly reporting 
system for the UB 8-week attachment. It ensures data integrity 
through foreign key relationships with the placements table.
*/

CREATE TABLE IF NOT EXISTS logbook_weeks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
  placement_id UUID REFERENCES placements(id) ON DELETE CASCADE NOT NULL, 
  
  -- UB Specific: Restricted to 8 weeks
  week_number INTEGER CHECK (week_number >= 1 AND week_number <= 8),
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Workflow Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'flagged')),
  
  supervisor_comments TEXT,
  total_hours DECIMAL DEFAULT 0, 
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate weeks for the same student
  UNIQUE(student_id, week_number)
);

-- 2. Daily Detailed Logs
-- This is where the actual "Activity Details" are stored for each day
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_id UUID REFERENCES logbook_weeks(id) ON DELETE CASCADE NOT NULL,
  
  log_date DATE NOT NULL,
  day_of_week TEXT CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  
  activity_details TEXT, 
  hours_worked DECIMAL DEFAULT 8.0 CHECK (hours_worked <= 24),
  is_absent BOOLEAN DEFAULT false,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one entry per day per week
  UNIQUE(week_id, log_date) 
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE logbook_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;


--- POLICIES FOR WEEKLY SUMMARIES ---


CREATE POLICY "Students manage own logbook weeks" 
ON logbook_weeks FOR ALL 
USING (auth.uid() = student_id);


CREATE POLICY "Organizations view assigned logbook weeks" 
ON logbook_weeks FOR SELECT 
USING (
  placement_id IN (
    SELECT id FROM placements WHERE organization_id = auth.uid()
  )
);


--- POLICIES FOR DAILY LOGS ---


CREATE POLICY "Students manage own daily logs" 
ON daily_logs FOR ALL 
USING (
  week_id IN (
    SELECT id FROM logbook_weeks WHERE student_id = auth.uid()
  )
);

-- Organizations can view daily logs for their interns
CREATE POLICY "Organizations view assigned daily logs" 
ON daily_logs FOR SELECT 
USING (
  week_id IN (
    SELECT lw.id 
    FROM logbook_weeks lw
    JOIN placements p ON lw.placement_id = p.id
    WHERE p.organization_id = auth.uid()
  )
);