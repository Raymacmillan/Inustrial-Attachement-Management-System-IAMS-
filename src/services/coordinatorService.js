import { supabase } from "../lib/supabaseClient";

export const coordinatorService = {
  /**
   * Fetches high-level overview stats using parallel queries
   */
  getDashboardStats: async () => {
    const [students, orgs, searching, placements] = await Promise.all([
      supabase.from("student_profiles").select("id", { count: "exact", head: true }),
      supabase.from("organization_profiles").select("id", { count: "exact", head: true }),
      supabase.from("student_preferences").select("id", { count: "exact", head: true }).eq("is_searching", true),
      supabase.from("placements").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

    // Check each query individually so we know exactly which one failed
    if (students.error) throw students.error;
    if (orgs.error) throw orgs.error;
    if (searching.error) throw searching.error;
    if (placements.error) throw placements.error;

    return {
      totalStudents: students.count || 0,
      totalOrgs: orgs.count || 0,
      searchingCount: searching.count || 0,
      placedCount: placements.count || 0,
    };
  },

  /**
   * Fetches full student registry with preferences joined
   */
  getStudentRegistryDeep: async () => {
    const { data, error } = await supabase
      .from("student_profiles")
      .select(`
        *,
        student_preferences (
          is_searching,
          technical_skills,
          preferred_roles,
          preferred_locations
        )
      `)
      .order("gpa", { ascending: false, nullsFirst: false })
      .order("full_name", { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Updates a student's attachment status
   */
  updateStudentStatus: async (studentId, newStatus) => {
    const sanitizedStatus = String(newStatus).toLowerCase().trim();

    const { data, error } = await supabase
      .from("student_profiles")
      .update({ status: sanitizedStatus })
      .eq("id", studentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetches the complete list of partner organizations with their vacancies
   */
  getPartnerRegistry: async () => {
    const { data, error } = await supabase
      .from("organization_profiles")
      .select(`
        id,
        org_name,
        industry,
        email,
        location,
        organization_vacancies (
          id,
          role_title,
          available_slots,
          is_active
        )
      `)
      .order("org_name", { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Fetches full details for a specific organization
   */
  getPartnerDetails: async (orgId) => {
    const { data, error } = await supabase
      .from("organization_profiles")
      .select(`
        *,
        organization_vacancies (*)
      `)
      .eq("id", orgId)
      .single();

    if (error) throw error;
    return data;
  },
};