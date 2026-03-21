import { supabase } from "../lib/supabaseClient";

export const coordinatorService = {
  /**
   * Fetches high-level overview stats using your schema logic
   */
  getDashboardStats: async () => {
    try {
      const [students, orgs, searching, placements] = await Promise.all([
        // Total Registered Students
        supabase.from("student_profiles").select("id", { count: "exact", head: true }),
        
        // Total Registered Organizations
        supabase.from("organization_profiles").select("id", { count: "exact", head: true }),
        
        // Students currently in the "Searching" state (from preferences table)
        supabase.from("student_preferences")
          .select("id", { count: "exact", head: true })
          .eq("is_searching", true),
        
        // Count of active placements in your 'placements' table
        supabase.from("placements")
          .select("id", { count: "exact", head: true })
          .eq("status", "active")
      ]);

      return {
        totalStudents: students.count || 0,
        totalOrgs: orgs.count || 0,
        searchingCount: searching.count || 0,
        placedCount: placements.count || 0,
      };
    } catch (error) {
      console.error("Error fetching IAMS stats:", error);
      throw error;
    }
  },

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

updateStudentStatus: async (studentId, newStatus) => {
  const sanitizedStatus = String(newStatus).toLowerCase().trim();
  
  console.log("SENDING TO DB:", sanitizedStatus); 

  const { data, error } = await supabase
    .from("student_profiles")
    .update({ status: sanitizedStatus }) 
    .eq("id", studentId)
    .select();

  if (error) throw error;
  return data;
},
  /**
   * Fetches the complete list of partner organizations and their current vacancies
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

