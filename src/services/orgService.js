import { supabase } from "../lib/supabaseClient";

/**
 * @description Fetches the base profile for the organization.
 */
export const getOrgProfile = async (orgId) => {
  const { data, error } = await supabase
    .from("organization_profiles")
    .select("*")
    .eq("id", orgId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * @description Updates organization identity and global requirements.
 */
export const updateOrgProfile = async (orgId, updates) => {
  const cleanData = {
    location: updates.location, 
    industry: updates.industry, // <--- ADD THIS LINE
    requires_cv: updates.requires_cv,
    requires_transcript: updates.requires_transcript,
    onboarding_complete: true,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('organization_profiles')
    .update(cleanData)
    .eq('id', orgId);

  if (error) throw error;
};

/**
 * @description Fetches all vacancies for a specific organization.
 */
export const getOrgVacancies = async (orgId) => {
  const { data, error } = await supabase
    .from("organization_vacancies")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * @description Standardized Vacancy Upsert - Stripped of updated_at
 */
export const upsertVacancy = async (orgId, vacancyData) => {
  const cleanData = {
    org_id: orgId,
    role_title: vacancyData.role_title || "General Internship",
    job_description: vacancyData.job_description || "",
    required_skills: vacancyData.required_skills || [],
    available_slots: vacancyData.available_slots || 1,
    work_mode: vacancyData.work_mode || "On-site",
    min_gpa_required: vacancyData.min_gpa_required || 2.0,
    is_active: true
  };

  if (vacancyData.id && vacancyData.id !== "") {
    cleanData.id = vacancyData.id;
  }

  const { data, error } = await supabase
    .from("organization_vacancies")
    .upsert(cleanData)
    .select()
    .single();

  if (error) throw error;
  return data;
};
