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
   * Updates a student's attachment status with full lifecycle handling:
   *
   * → pending:   Terminates any active placement (student is unmatched).
   *              Without this the matching engine blocks re-allocation due
   *              to UNIQUE(student_id, status='active') constraint.
   * → matched:   Status only — placement is created by the matching engine.
   * → allocated: Status only — confirms physical start of attachment.
   * → completed: Marks active placement as completed, then updates status.
   *
   * Uses is_coordinator() security-definer function in RLS (bypasses JWT
   * caching which caused silent 0-row updates with jwt()-based policies).
   */
  updateStudentStatus: async (studentId, newStatus) => {
    const sanitizedStatus = String(newStatus).toLowerCase().trim();

    // ── Revert to pending: terminate active placement ──
    if (sanitizedStatus === "pending") {
      const { data: activePlacement } = await supabase
        .from("placements")
        .select("id")
        .eq("student_id", studentId)
        .eq("status", "active")
        .maybeSingle();

      if (activePlacement) {
        const { error: deleteError } = await supabase
          .from("placements")
          .delete()
          .eq("id", activePlacement.id);

        if (deleteError) {
          throw new Error(`Could not terminate placement: ${deleteError.message}`);
        }
      }
    }

    // ── Mark completed: update placement status before student status ──
    if (sanitizedStatus === "completed") {
      const { error: placementError } = await supabase
        .from("placements")
        .update({ status: "completed" })
        .eq("student_id", studentId)
        .eq("status", "active");

      // Non-fatal — student may not have a placement (manual status change)
      if (placementError) {
        console.warn("Could not mark placement as completed:", placementError.message);
      }
    }

    // ── Update student status ──
    const { data, error } = await supabase
      .from("student_profiles")
      .update({ status: sanitizedStatus })
      .eq("id", studentId)
      .select("id, status")
      .single();

    if (error) throw error;

    // Verify the update actually persisted (catches silent RLS failures)
    if (data.status !== sanitizedStatus) {
      throw new Error(
        `Status update was blocked by the database. Expected "${sanitizedStatus}" but got "${data.status}". Check coordinator permissions.`
      );
    }

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