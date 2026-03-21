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

  /**
   * Fetches the Registry for the Dashboard Table
   * Joins Profiles with Preferences to show 'Searching' status and Skills
   */
  getStudentRegistry: async () => {
    const { data, error } = await supabase
      .from("student_profiles")
      .select(`
        id,
        full_name,
        student_id,
        major,
        status,
        student_preferences (
          is_searching,
          technical_skills,
          industries
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }
};