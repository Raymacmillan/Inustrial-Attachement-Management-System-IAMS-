import { supabase } from '../lib/supabaseClient';

/**
 * @description Fetches the profile for the currently logged-in organization.
 */
export const getOrgProfile = async (orgId) => {
  const { data, error } = await supabase
    .from('organization_profiles')
    .select('*')
    .eq('id', orgId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * @description Updates organization profile details (Location, Skills, Slots, Description).
 */
export const updateOrgProfile = async (orgId, updates) => {
  const cleanData = {
    location: updates.location,
    available_slots: updates.available_slots,
    work_mode: updates.work_mode,
    required_skills: updates.required_skills,
    job_description: updates.job_description,
    requires_cv: updates.requires_cv,
    requires_transcript: updates.requires_transcript,
    onboarding_complete: true,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('organization_profiles')
    .update(cleanData)
    .eq('id', orgId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * @description Fetches all organizations for the Student Matching Engine.
 * Now includes vacancy details and filters out organizations with 0 slots.
 */
export const getAllOrganizations = async () => {
  const { data, error } = await supabase
    .from('organization_profiles')
    .select(`
      id, 
      org_name, 
      location, 
      required_skills, 
      job_description, 
      available_slots, 
      work_mode,
      requires_cv,
      requires_transcript
    `)
    .gt('available_slots', 0) 
    .order('org_name', { ascending: true });

  if (error) throw error;
  return data;
};