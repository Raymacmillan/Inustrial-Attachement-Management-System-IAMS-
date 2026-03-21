import { supabase } from "../lib/supabaseClient";

export const getOrgDashboardData = async (orgId) => {
  const [profile, vacancies] = await Promise.all([
    supabase.from("organization_profiles").select("*").eq("id", orgId).single(),
    supabase.from("organization_vacancies").select("*").eq("org_id", orgId).order("created_at", { ascending: false })
  ]);

  if (profile.error) throw profile.error;
  return { 
    profile: profile.data, 
    vacancies: vacancies.data || [] 
  };
};

export const getOrgProfile = async (orgId) => {
  const { data, error } = await supabase
    .from("organization_profiles")
    .select("*")
    .eq("id", orgId)
    .single();
  if (error) throw error;
  return data;
};

export const updateOrgProfile = async (orgId, updates) => {
  const { data, error } = await supabase
    .from('organization_profiles')
    .update(updates)
    .eq("id", orgId)
    .select();
  if (error) throw error;
  return data[0];
};

export const getOrgVacancies = async (orgId) => {
  const { data, error } = await supabase
    .from("organization_vacancies")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const upsertVacancy = async (orgId, vacancyData) => {
  // CRITICAL: Ensure we don't send an empty string as a UUID
  const { id, ...payload } = vacancyData;
  const cleanData = { 
    ...payload, 
    org_id: orgId,
    // Ensure numbers are actually numbers or null, not empty strings
    available_slots: vacancyData.available_slots === "" ? 0 : parseInt(vacancyData.available_slots),
    min_gpa_required: vacancyData.min_gpa_required === "" ? 0 : parseFloat(vacancyData.min_gpa_required)
  };

  if (id && id !== "") {
    cleanData.id = id;
  }

  const { data, error } = await supabase
    .from("organization_vacancies")
    .upsert(cleanData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteVacancy = async (vacancyId) => {
  const { error } = await supabase
    .from("organization_vacancies")
    .delete()
    .eq("id", vacancyId);

  if (error) throw error;
  return true;
};