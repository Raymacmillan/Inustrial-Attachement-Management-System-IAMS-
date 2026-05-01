import { supabase } from "../lib/supabaseClient";

/**
 * SUPERVISOR SERVICE — IAMS Release 2.0
 *
 * Covers both industrial and university supervisors.
 * All Supabase calls isolated here — no raw queries in components.
 */
export const supervisorService = {

  // ─── INVITATIONS ─────────────────────────────────────────────────────────────

  /**
   * Send an invitation for an industrial supervisor.
   * Called by org admin from their dashboard.
   *
   * Creates a supervisor_invitations row — the edge function picks it up
   * and sends the email via Resend.
   *
   * @param {string} email        - Supervisor email address
   * @param {string} orgId        - Organization ID (from org_admin's profile)
   * @param {string} invitedBy    - auth.uid() of the org admin
   * @param {string|null} orgSupervisorId - optional pre-existing org_supervisors row to link
   */
  inviteIndustrialSupervisor: async (email, orgId, invitedBy, orgSupervisorId = null) => {
    // Check no pending invite already exists for this email + org
    const { data: existing } = await supabase
      .from("supervisor_invitations")
      .select("id, status")
      .eq("email", email)
      .eq("org_id", orgId)
      .eq("supervisor_type", "industrial_supervisor")
      .maybeSingle();

    if (existing && existing.status === "pending") {
      throw new Error(`An invitation has already been sent to ${email}. Check the invitations list.`);
    }

    const { data, error } = await supabase
      .from("supervisor_invitations")
      .insert([{
        email,
        supervisor_type:     "industrial_supervisor",
        org_id:              orgId,
        org_supervisor_id:   orgSupervisorId,
        invited_by:          invitedBy,
        status:              "pending",
      }])
      .select()
      .single();

    if (error) throw error;

    // Trigger the send-invite edge function
    const { error: fnError } = await supabase.functions.invoke("send-supervisor-invite", {
      body: { invitationId: data.id },
    });

    // Non-fatal — the row exists so coordinator can resend manually
    if (fnError) console.warn("Edge function error (invite row created):", fnError.message);

    return data;
  },

  /**
   * Send an invitation for a university supervisor.
   * Called by coordinator from their dashboard.
   */
  inviteUniversitySupervisor: async (email, invitedBy, uniSupervisorId = null) => {
    const { data: existing } = await supabase
      .from("supervisor_invitations")
      .select("id, status")
      .eq("email", email)
      .eq("supervisor_type", "university_supervisor")
      .maybeSingle();

    if (existing && existing.status === "pending") {
      throw new Error(`An invitation has already been sent to ${email}.`);
    }

    const { data, error } = await supabase
      .from("supervisor_invitations")
      .insert([{
        email,
        supervisor_type:    "university_supervisor",
        uni_supervisor_id:  uniSupervisorId,
        invited_by:         invitedBy,
        status:             "pending",
      }])
      .select()
      .single();

    if (error) throw error;

    const { error: fnError } = await supabase.functions.invoke("send-supervisor-invite", {
      body: { invitationId: data.id },
    });

    if (fnError) console.warn("Edge function error:", fnError.message);

    return data;
  },

  /**
   * List all invitations sent (for coordinator / org admin to track).
   */
  listInvitations: async (orgId = null) => {
    let query = supabase
      .from("supervisor_invitations")
      .select("id, email, supervisor_type, status, expires_at, created_at")
      .order("created_at", { ascending: false });

    if (orgId) query = query.eq("org_id", orgId);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  // ─── INDUSTRIAL SUPERVISOR PORTAL ────────────────────────────────────────────

  /**
   * Get the industrial supervisor's profile and their assigned students.
   * Joins through: org_supervisors → placements → students → logbook weeks
   */
  getIndustrialSupervisorDashboard: async (userId) => {
    // Find the supervisor roster row linked to this user
    const { data: supervisorRow, error: supError } = await supabase
      .from("organization_supervisors")
      .select("id, name, title, org_id, organization_profiles(org_name)")
      .eq("user_id", userId)
      .maybeSingle();

    if (supError) throw supError;
    if (!supervisorRow) return { supervisor: null, students: [] };

    // Find all active placements at this org
    const { data: placements, error: pError } = await supabase
      .from("placements")
      .select(`
        id,
        start_date,
        end_date,
        duration_weeks,
        position_title,
        student_id,
        student_profiles (
          id,
          full_name,
          student_id,
          avatar_url
        ),
        logbook_weeks (
          id,
          week_number,
          status,
          submitted_at,
          approved_at
        )
      `)
      .eq("organization_id", supervisorRow.org_id)
      .eq("status", "active");

    if (pError) throw pError;

    // Summarise logbook progress per student
    const students = (placements || []).map((p) => {
      const weeks     = p.logbook_weeks || [];
      const total     = p.duration_weeks || 8;
      const approved  = weeks.filter((w) => w.status === "approved").length;
      const pending   = weeks.filter((w) => w.status === "submitted").length;
      const flagged   = weeks.filter((w) => w.status === "action_needed").length;

      return {
        placementId:    p.id,
        student:        p.student_profiles,
        positionTitle:  p.position_title,
        startDate:      p.start_date,
        endDate:        p.end_date,
        totalWeeks:     total,
        approved,
        pending,
        flagged,
        weeks: weeks.sort((a, b) => a.week_number - b.week_number),
      };
    });

    return {
      supervisor: {
        ...supervisorRow,
        orgName: supervisorRow.organization_profiles?.org_name,
      },
      students,
    };
  },

  /**
   * Get full week detail for supervisor review (daily logs + existing signature).
   */
  getWeekForReview: async (weekId) => {
    const { data, error } = await supabase
      .from("logbook_weeks")
      .select(`
        *,
        daily_logs (*),
        logbook_signatures (id, signer_name, signer_title, signer_role, signed_at),
        student_profiles (full_name, student_id)
      `)
      .eq("id", weekId)
      .single();

    if (error) throw error;

    data.daily_logs = (data.daily_logs || []).sort(
      (a, b) => new Date(a.log_date) - new Date(b.log_date)
    );
    data.signature = data.logbook_signatures?.[0] ?? null;
    delete data.logbook_signatures;

    return data;
  },

  /**
   * Approve a submitted logbook week (industrial supervisor).
   * Creates the digital stamp and updates week status.
   */
  approveWeek: async (weekId, supervisorUserId, signerName, signerTitle) => {
    const { error: sigError } = await supabase
      .from("logbook_signatures")
      .insert([{
        week_id:      weekId,
        signed_by:    supervisorUserId,
        signer_name:  signerName,
        signer_title: signerTitle,
        signer_role:  "industrial_supervisor",
        signed_at:    new Date().toISOString(),
      }]);

    if (sigError && sigError.code !== "23505") throw sigError;

    const { error } = await supabase
      .from("logbook_weeks")
      .update({
        status:           "approved",
        stamped_by_name:  signerName,
        stamped_by_title: signerTitle,
        approved_at:      new Date().toISOString(),
        updated_at:       new Date().toISOString(),
      })
      .eq("id", weekId);

    if (error) throw error;
    return true;
  },

  /**
   * Flag a week as needing action with written feedback.
   */
  flagWeek: async (weekId, comments) => {
    if (!comments?.trim()) {
      throw new Error("Please provide feedback explaining what needs to be corrected.");
    }

    const { error } = await supabase
      .from("logbook_weeks")
      .update({
        status:              "action_needed",
        supervisor_comments: comments.trim(),
        updated_at:          new Date().toISOString(),
      })
      .eq("id", weekId);

    if (error) throw error;
    return true;
  },

  /**
   * Submit end-of-attachment performance report (industrial supervisor).
   */
  submitPerformanceReport: async (placementId, supervisorId, reportData) => {
    const {
      technical_competency,
      initiative_score,
      teamwork_score,
      reliability_score,
      overall_performance,
      strengths,
      areas_for_improvement,
      general_comments,
      recommend_for_employment,
    } = reportData;

    const { data, error } = await supabase
      .from("supervisor_reports")
      .upsert([{
        placement_id:             placementId,
        industrial_supervisor_id: supervisorId,
        technical_competency,
        initiative_score,
        teamwork_score,
        reliability_score,
        overall_performance,
        strengths,
        areas_for_improvement,
        general_comments,
        recommend_for_employment: !!recommend_for_employment,
        status:                   "submitted",
        submitted_at:             new Date().toISOString(),
        updated_at:               new Date().toISOString(),
      }], { onConflict: "placement_id" })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get existing performance report for a placement (for edit/view).
   */
  getPerformanceReport: async (placementId) => {
    const { data, error } = await supabase
      .from("supervisor_reports")
      .select("*")
      .eq("placement_id", placementId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;
    return data ?? null;
  },

  // ─── UNIVERSITY SUPERVISOR ──────────────────────────────────────────────────

  /**
   * Get the university supervisor's profile and their assigned students.
   * Joins through: university_supervisors → placements (by university_supervisor_id)
   */
  getUniversitySupervisorDashboard: async (userId) => {
    // Find the university supervisor row linked to this user
    const { data: supervisorRow, error: supError } = await supabase
      .from("university_supervisors")
      .select("id, full_name, email, department, max_students")
      .eq("user_id", userId)
      .maybeSingle();

    if (supError) throw supError;
    if (!supervisorRow) return { supervisor: null, students: [] };

    // Find all active placements assigned to this university supervisor
    const { data: placements, error: pError } = await supabase
      .from("placements")
      .select(`
        id,
        start_date,
        end_date,
        duration_weeks,
        position_title,
        student_id,
        organization_id,
        student_profiles (
          id,
          full_name,
          student_id,
          avatar_url
        ),
        organization_profiles (
          org_name,
          location
        ),
        logbook_weeks (
          id,
          week_number,
          status,
          submitted_at,
          approved_at
        )
      `)
      .eq("university_supervisor_id", supervisorRow.id)
      .eq("status", "active");

    if (pError) throw pError;

    const students = (placements || []).map((p) => {
      const weeks    = p.logbook_weeks || [];
      const total    = p.duration_weeks || 8;
      const approved = weeks.filter((w) => w.status === "approved").length;
      const pending  = weeks.filter((w) => w.status === "submitted").length;
      const flagged  = weeks.filter((w) => w.status === "action_needed").length;

      return {
        placementId:  p.id,
        student:      p.student_profiles,
        org:          p.organization_profiles,
        positionTitle: p.position_title,
        startDate:    p.start_date,
        endDate:      p.end_date,
        totalWeeks:   total,
        approved,
        pending,
        flagged,
        weeks: weeks.sort((a, b) => a.week_number - b.week_number),
      };
    });

    return { supervisor: supervisorRow, students };
  },

  /**
   * Submit or update a visit assessment for a student placement.
   * University supervisors conduct 2 visits per student.
   */
  submitVisitAssessment: async (placementId, supervisorId, visitNumber, assessmentData) => {
    const {
      visit_date,
      punctuality_score,
      professionalism_score,
      technical_score,
      communication_score,
      overall_score,
      comments,
    } = assessmentData;

    const { data, error } = await supabase
      .from("visit_assessments")
      .upsert([{
        placement_id:             placementId,
        university_supervisor_id: supervisorId,
        visit_number:             visitNumber,
        visit_date,
        punctuality_score,
        professionalism_score,
        technical_score,
        communication_score,
        overall_score,
        comments,
        status:       "submitted",
        submitted_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      }], { onConflict: "placement_id,visit_number" })
      .select()
      .single();

    if (error) throw error;

    // TODO (Release 3 / notification sprint):
    // After a visit is scheduled, trigger an email to the student notifying
    // them of the upcoming visit date and any notes from the supervisor.
    // Suggested edge function: send-visit-notification
    // Payload: { placementId, visitNumber, visitDate, supervisorName, comments }

    return data;
  },

  /**
   * Get existing visit assessments for a placement.
   */
  getVisitAssessments: async (placementId) => {
    const { data, error } = await supabase
      .from("visit_assessments")
      .select("*")
      .eq("placement_id", placementId)
      .order("visit_number", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },
};