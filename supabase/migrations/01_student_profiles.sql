/* 
This document outlines the essential data fields required for the Industrial Attachment Management System (IAMS) 
database, specifically for student and organization profiles. It is necessary to ensure the "Intelligent Matching" 
heuristic engine can accurately pair students with host organizations based on their specific skills and location 
preferences as required by the project scope
*/


CREATE TYPE attachment_status AS ENUM ('pending', 'matched', 'allocated', 'completed');


CREATE TABLE student_profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  student_id text UNIQUE NOT NULL, 
  avatar_url text, 
  
  -- Matching Data
  major text DEFAULT 'Computer Science',
  location_preference text[],
  skills text[], 
  project_interests text[], 
  
  -- Allocation State (New)
  status attachment_status DEFAULT 'pending', 
  
  -- Metadata
  onboarding_complete boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- Policies 
CREATE POLICY "Students can view their own profile" 
  ON student_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Students can insert their own profile" 
  ON student_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Students can update their own profile" 
  ON student_profiles FOR UPDATE 
  USING (auth.uid() = id);