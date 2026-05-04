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

    if (students.error)   throw students.error;
    if (orgs.error)       throw orgs.error;
    if (searching.error)  throw searching.error;
    if (placements.error) throw placements.error;

    return {
      totalStudents:  students.count  || 0,
      totalOrgs:      orgs.count      || 0,
      searchingCount: searching.count || 0,
      placedCount:    placements.count || 0,
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

  // ─── PLACEMENT MANAGEMENT ────────────────────────────────────────────────────

  /**
   * Fetch the active placement for a student, including the org's supervisor
   * roster so StudentAuditModal can present a dropdown instead of free text.
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
        organization_id,
        industrial_supervisor_name,
        industrial_supervisor_email,
        university_supervisor_name,
        university_supervisor_email,
        organization_profiles (
          org_name,
          contact_person,
          supervisor_email,
          organization_supervisors (
            id,
            full_name,
            email,
            role_title,
            user_id,
            is_active
          )
        )
      `)
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;
    return data ?? null;
  },

  /**
   * Update start/end dates. Recalculates duration_weeks automatically.
   */
  updatePlacementDates: async (placementId, startDate, endDate) => {
    if (!startDate || !endDate) throw new Error("Both start and end dates are required.");

    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (end <= start) throw new Error("End date must be after start date.");

    const durationWeeks = Math.max(
      Math.round((end - start) / (1000 * 60 * 60 * 24 * 7)),
      1
    );

    const { error } = await supabase
      .from("placements")
      .update({ start_date: startDate, end_date: endDate, duration_weeks: durationWeeks })
      .eq("id", placementId);

    if (error) throw error;
    return { durationWeeks };
  },

  /**
   * Assign an industrial supervisor from the org's existing roster.
   * Looks up the supervisor row by ID — coordinator picks from a dropdown,
   * no manual typing needed. Pre-fills name and email on the placement.
   */
  assignIndustrialSupervisor: async (placementId, orgSupervisorId) => {
    const { data: sup, error: supError } = await supabase
      .from("organization_supervisors")
      .select("id, full_name, email, role_title")
      .eq("id", orgSupervisorId)
      .single();

    if (supError || !sup) throw new Error("Supervisor not found in roster.");

    const { error } = await supabase
      .from("placements")
      .update({
        industrial_supervisor_name:  sup.full_name,
        industrial_supervisor_email: sup.email,
      })
      .eq("id", placementId);

    if (error) throw error;
    return sup;
  },

  /**
   * Assign a university supervisor by name + email.
   * Also looks up university_supervisors.id by email and sets the UUID FK —
   * this is what getUniversitySupervisorDashboard queries by so the portal
   * can retrieve assigned students. Without the UUID the portal returns empty.
   */
  assignUniversitySupervisor: async (placementId, name, email) => {
    if (!name?.trim() || !email?.trim()) {
      throw new Error("Both name and email are required for university supervisor.");
    }

    // Look up the university_supervisors row by email to get the UUID
    const { data: uniSup } = await supabase
      .from("university_supervisors")
      .select("id")
      .eq("email", email.trim())
      .maybeSingle();

    const { error } = await supabase
      .from("placements")
      .update({
        university_supervisor_name:  name.trim(),
        university_supervisor_email: email.trim(),
        // Critical — this UUID is what the university supervisor portal
        // queries by. If null the supervisor sees no students.
        ...(uniSup?.id ? { university_supervisor_id: uniSup.id } : {}),
      })
      .eq("id", placementId);

    if (error) throw error;
    return true;
  },

  /**
   * Update both supervisor fields at once (free-text fallback,
   * used when coordinator overrides the dropdown selection).
   * Also resolves university_supervisor_id by email so the portal stays linked.
   */
  updatePlacementSupervisors: async (placementId, supervisorData) => {
    const {
      industrial_supervisor_name,
      industrial_supervisor_email,
      university_supervisor_name,
      university_supervisor_email,
    } = supervisorData;

    // Resolve university supervisor UUID if email is provided
    let uniSupId = undefined;
    if (university_supervisor_email?.trim()) {
      const { data: uniSup } = await supabase
        .from("university_supervisors")
        .select("id")
        .eq("email", university_supervisor_email.trim())
        .maybeSingle();
      if (uniSup?.id) uniSupId = uniSup.id;
    }

    const { error } = await supabase
      .from("placements")
      .update({
        industrial_supervisor_name,
        industrial_supervisor_email,
        university_supervisor_name,
        university_supervisor_email,
        ...(uniSupId ? { university_supervisor_id: uniSupId } : {}),
      })
      .eq("id", placementId);

    if (error) throw error;
    return true;
  },

  // ─── STUDENT STATUS ──────────────────────────────────────────────────────────

  updateStudentStatus: async (studentId, newStatus) => {
    const sanitizedStatus = String(newStatus).toLowerCase().trim();

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

  /**
   * Reject a student — sets status to "rejected" and triggers a notification
   * email so the student knows immediately.
   */
  rejectStudent: async (studentId, studentName, reason = "") => {
    const { data, error } = await supabase
      .from("student_profiles")
      .update({ status: "rejected" })
      .eq("id", studentId)
      .select("id, status")
      .single();

    if (error) throw error;

    // Fire notification email — non-fatal
    supabase.functions.invoke("send-student-status-notification", {
      body: { studentId, status: "rejected", studentName, reason },
    }).catch((e) => console.warn("Rejection email failed:", e.message));

    return data;
  },

  /**
   * Reinstate a previously rejected student back to pending.
   */
  reinstateStudent: async (studentId) => {
    const { data, error } = await supabase
      .from("student_profiles")
      .update({ status: "pending" })
      .eq("id", studentId)
      .select("id, status")
      .single();

    if (error) throw error;
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

  // ─── SUPERVISOR MANAGEMENT ───────────────────────────────────────────────────

  /**
   * Fetch all orgs with their supervisor rosters and active placements.
   * Orgs with active students sorted first.
   */
  getOrgsWithSupervisors: async () => {
    const { data, error } = await supabase
      .from("organization_profiles")
      .select(`
        id,
        org_name,
        industry,
        location,
        organization_supervisors (
          id,
          full_name,
          email,
          role_title,
          is_active,
          user_id
        ),
        placements (
          id,
          status,
          student_profiles (
            full_name,
            student_id
          )
        )
      `)
      .order("org_name", { ascending: true });

    if (error) throw error;

    return (data || [])
      .map((org) => ({
        ...org,
        activePlacements: (org.placements || []).filter((p) => p.status === "active"),
        supervisors:      org.organization_supervisors || [],
      }))
      .sort((a, b) => b.activePlacements.length - a.activePlacements.length);
  },

};