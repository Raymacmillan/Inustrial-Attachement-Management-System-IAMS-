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

ALTER TABLE organization_profiles 
ADD COLUMN IF NOT EXISTS job_description TEXT,
ADD COLUMN IF NOT EXISTS requires_cv BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS requires_transcript BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Remove the columns that now live in the 'vacancies' table
ALTER TABLE organization_profiles 
DROP COLUMN IF EXISTS required_skills,
DROP COLUMN IF EXISTS available_slots,
DROP COLUMN IF EXISTS job_description;


COMMENT ON COLUMN organization_profiles.job_description IS 'Detailed vacancy information for the matching engine';


-- Add industry to organization_profiles
ALTER TABLE organization_profiles 
ADD COLUMN IF NOT EXISTS industry TEXT; 

-- Create an index to speed up matching queries
CREATE INDEX IF NOT EXISTS idx_org_industry ON organization_profiles(industry);