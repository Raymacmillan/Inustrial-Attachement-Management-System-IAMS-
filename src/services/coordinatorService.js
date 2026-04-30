import { supabase } from "../lib/supabaseClient";

export const coordinatorService = {

  // ─── DASHBOARD ───────────────────────────────────────────────────────────────

  getDashboardStats: async () => {
    const [students, orgs, searching, placements] = await Promise.all([
      supabase.from("student_profiles").select("id", { count: "exact", head: true }),
      supabase.from("organization_profiles").select("id", { count: "exact", head: true }),
      supabase.from("student_preferences").select("id", { count: "exact", head: true }).eq("is_searching", true),
      supabase.from("placements").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

    if (students.error)  throw students.error;
    if (orgs.error)      throw orgs.error;
    if (searching.error) throw searching.error;
    if (placements.error) throw placements.error;

    return {
      totalStudents: students.count  || 0,
      totalOrgs:     orgs.count      || 0,
      searchingCount: searching.count || 0,
      placedCount:   placements.count || 0,
    };
  },

  // ─── STUDENT REGISTRY ────────────────────────────────────────────────────────

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
      .order("gpa",       { ascending: false, nullsFirst: false })
      .order("full_name", { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Fetch the active placement for a student (used in StudentAuditModal).
   * Returns null if no active placement exists.
   */
  getStudentPlacement: async (studentId) => {
    const { data, error } = await supabase
      .from("placements")
      .select(`
        id,
        start_date,
        end_date,
        duration_weeks,
        position_title,
        industrial_supervisor_name,
        industrial_supervisor_email,
        university_supervisor_name,
        university_supervisor_email,
        organization_profiles (
          org_name,
          contact_person,
          supervisor_email
        )
      `)
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();

    // PGRST116 = no rows — not placed yet
    if (error && error.code !== "PGRST116") throw error;
    return data ?? null;
  },

  /**
   * Update attachment start/end dates and recalculate duration_weeks.
   * Called from StudentAuditModal "Attachment Dates" section.
   *
   * Guards:
   *  - end_date must be after start_date
   *  - duration_weeks calculated from the diff (min 1 week)
   */
  updatePlacementDates: async (placementId, startDate, endDate) => {
    if (!startDate || !endDate) {
      throw new Error("Both start and end dates are required.");
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);

    if (end <= start) {
      throw new Error("End date must be after start date.");
    }

    const durationWeeks = Math.max(
      Math.round((end - start) / (1000 * 60 * 60 * 24 * 7)),
      1
    );

    const { error } = await supabase
      .from("placements")
      .update({
        start_date:     startDate,
        end_date:       endDate,
        duration_weeks: durationWeeks,
      })
      .eq("id", placementId);

    if (error) throw error;
    return { durationWeeks };
  },

  /**
   * Update industrial and university supervisor details on a placement.
   * Called from StudentAuditModal "Supervisor Assignment" section.
   */
  updatePlacementSupervisors: async (placementId, supervisorData) => {
    const {
      industrial_supervisor_name,
      industrial_supervisor_email,
      university_supervisor_name,
      university_supervisor_email,
    } = supervisorData;

    const { error } = await supabase
      .from("placements")
      .update({
        industrial_supervisor_name,
        industrial_supervisor_email,
        university_supervisor_name,
        university_supervisor_email,
      })
      .eq("id", placementId);

    if (error) throw error;
    return true;
  },

  // ─── STUDENT STATUS ──────────────────────────────────────────────────────────

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

    if (data.status !== sanitizedStatus) {
      throw new Error(
        `Status update was blocked by the database. Expected "${sanitizedStatus}" but got "${data.status}". Check coordinator permissions.`
      );
    }

    return data;
  },

  // ─── PARTNER REGISTRY ────────────────────────────────────────────────────────

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

  getPartnerDetails: async (orgId) => {
    const { data, error } = await supabase
      .from("organization_profiles")
      .select(`*, organization_vacancies (*)`)
      .eq("id", orgId)
      .single();

    if (error) throw error;
    return data;
  },
};