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
 * @description Updates organization profile details (Location, Skills, Slots).
 */
export const updateOrgProfile = async (orgId, updates) => {
  const { data, error } = await supabase
    .from('organization_profiles')
    .update({
      ...updates,
      onboarding_complete: true // Marks the profile as finished
    })
    .eq('id', orgId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * @description Fetches all organizations (Used by students during preference selection).
 */
export const getAllOrganizations = async () => {
  const { data, error } = await supabase
    .from('organization_profiles')
    .select('id, org_name, location, required_skills');

  if (error) throw error;
  return data;
};