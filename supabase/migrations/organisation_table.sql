/* This table stores profile data for host organizations.
It includes supervisor contact details required for the unified assessment 
and industrial reporting modules of IAMS.
*/

CREATE TABLE organization_profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  org_name text NOT NULL,
  email text UNIQUE NOT NULL,
  
  -- Matching & Logistics
  location text,
  required_skills text[], 
  available_slots integer DEFAULT 1,
  
  -- Industrial Supervisor / Contact Data (New)
  contact_person text,      -- The person managing the student
  contact_phone text,       -- For university supervisor visits
  supervisor_email text,    -- For sending digital assessment links
  
  -- Metadata
  onboarding_complete boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;

-- Policies 
CREATE POLICY "Organizations can view their own profile" 
  ON organization_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Everyone can view organizations" 
  ON organization_profiles FOR SELECT 
  USING (true);

CREATE POLICY "Organizations can update their own profile" 
  ON organization_profiles FOR UPDATE 
  USING (auth.uid() = id);