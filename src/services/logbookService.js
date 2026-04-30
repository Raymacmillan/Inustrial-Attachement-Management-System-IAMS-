import { supabase } from "../lib/supabaseClient";

/**
 * LOGBOOK SERVICE — IAMS Release 2.0
 */
export const logbookService = {

  // ─── PLACEMENT ──────────────────────────────────────────────────────────────

  getActivePlacement: async (studentId) => {
    const { data, error } = await supabase
      .from("placements")
      .select(`
        id, organization_id, start_date, end_date, status, duration_weeks,
        industrial_supervisor_name, industrial_supervisor_email,
        university_supervisor_name, university_supervisor_email,
        organization_profiles (org_name, location, industry, avatar_url)
      `)
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;
    return data ?? null;
  },

  // ─── WEEK MANAGEMENT ────────────────────────────────────────────────────────

  /**
   * Initialize a new logbook week.
   *
   * Guards:
   *  - weekNumber must be within placement duration
   *  - Week start date must not be in the future (students can't log ahead)
   */
  initializeWeek: async (studentId, placementId, weekNumber, startDate) => {
    // Future-week guard
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(startDate);
    weekStart.setHours(0, 0, 0, 0);

    if (weekStart > today) {
      throw new Error(
        `Week ${weekNumber} hasn't started yet. You can only log weeks that have already begun.`
      );
    }

    const { data: placement, error: pError } = await supabase
      .from("placements")
      .select("duration_weeks")
      .eq("id", placementId)
      .single();

    if (pError) throw pError;
    if (!placement) throw new Error("Placement not found.");

    if (weekNumber < 1 || weekNumber > placement.duration_weeks) {
      throw new Error(
        `Week ${weekNumber} is out of range. Your placement runs for ${placement.duration_weeks} weeks.`
      );
    }

    // Parse startDate as local midnight — avoids UTC-offset shifting the date
    const parseLocal = (d) => {
      const [year, month, day] = String(d).split("T")[0].split("-").map(Number);
      return new Date(year, month - 1, day);
    };

    // Format a local Date to YYYY-MM-DD without UTC conversion
    const toLocalISO = (d) => {
      const y  = d.getFullYear();
      const m  = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    };

    const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

    // Always seed a full Mon–Fri week. For the week containing startDate,
    // find the Monday of that week, then seed all 5 days Mon–Fri.
    // Days before the placement start_date are created in the DB but will be
    // displayed as disabled ("pre-start") in the UI — student sees the full
    // week but can only write from their actual start day onwards.
    const placementStart = parseLocal(startDate);
    const dayOfWeek = placementStart.getDay(); // 0=Sun,1=Mon,...,6=Sat
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // back to Monday
    const monday = new Date(placementStart);
    monday.setDate(placementStart.getDate() + daysToMonday);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const placementStartISO = toLocalISO(placementStart); // actual commencement date
    const weekStartISO      = toLocalISO(monday);          // Monday for display/seeding
    const weekEndISO        = toLocalISO(friday);

    const { data: week, error: weekError } = await supabase
      .from("logbook_weeks")
      .insert([{
        student_id:   studentId,
        placement_id: placementId,
        week_number:  weekNumber,
        // start_date = placement commencement (used by pre-start lock in UI)
        // For week 1 this is the actual start day (e.g. Thursday).
        // For week 2+ this is the Monday of that week since it's a full week.
        start_date:   weekNumber === 1 ? placementStartISO : weekStartISO,
        end_date:     weekEndISO,
        due_date:     weekEndISO,
        status:       "draft",
      }])
      .select()
      .single();

    if (weekError) {
      if (weekError.code === "23505") {
        throw new Error(`Week ${weekNumber} has already been initialized.`);
      }
      throw weekError;
    }

    // Seed Mon–Fri daily log stubs.
    // day_of_week is derived from getDay() on the actual local Date object —
    // NOT from toISOString() which would convert back to UTC and potentially
    // shift the date in timezones east of UTC.
    const dailyEntries = Array.from({ length: 5 }, (_, i) => {
      const logDate = new Date(monday);
      logDate.setDate(monday.getDate() + i);
      return {
        week_id:           week.id,
        log_date:          toLocalISO(logDate),
        day_of_week:       DAY_NAMES[logDate.getDay()],
        template_type:     "standard",
        activity_details:  "",
        tasks_completed:   "",
        learning_outcomes: "",
        challenges:        "",
        hours_worked:      8.0,
      };
    });

    const { error: dailyError } = await supabase.from("daily_logs").insert(dailyEntries);
    if (dailyError) throw dailyError;

    return week;
  },

  getWeekDetails: async (weekId) => {
    const { data, error } = await supabase
      .from("logbook_weeks")
      .select(`
        *,
        daily_logs (*),
        logbook_signatures (id, signer_name, signer_title, signer_role, signed_at)
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

  getStudentWeeks: async (studentId) => {
    const { data, error } = await supabase
      .from("logbook_weeks")
      .select("*")
      .eq("student_id", studentId)
      .order("week_number", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  // ─── DAILY LOG UPDATES ──────────────────────────────────────────────────────

  updateDailyLog: async (logId, updates) => {
    const { error } = await supabase
      .from("daily_logs")
      .update({
        template_type:     updates.template_type,
        activity_details:  updates.activity_details  ?? "",
        tasks_completed:   updates.tasks_completed   ?? "",
        learning_outcomes: updates.learning_outcomes ?? "",
        challenges:        updates.challenges        ?? "",
        hours_worked:      updates.hours_worked      ?? 8.0,
        updated_at:        new Date().toISOString(),
      })
      .eq("id", logId);

    if (error) throw error;
    return true;
  },

  changeDayTemplate: async (logId, newTemplateType) => {
    const { error } = await supabase
      .from("daily_logs")
      .update({
        template_type:     newTemplateType,
        activity_details:  "",
        tasks_completed:   "",
        learning_outcomes: "",
        challenges:        "",
        updated_at:        new Date().toISOString(),
      })
      .eq("id", logId);

    if (error) throw error;
    return true;
  },

  // ─── WEEK SUBMISSION ────────────────────────────────────────────────────────

  /**
   * Submit a week for supervisor approval.
   *
   * Guards:
   *  - Won't re-submit an already submitted/approved week
   *  - Won't submit if week end_date is in the future (can't submit for next week)
   *  - Validates every day has at least one filled field
   */
  submitWeek: async (weekId, studentSummary = "") => {
    const { data: week, error: fetchErr } = await supabase
      .from("logbook_weeks")
      .select("status, start_date, end_date")
      .eq("id", weekId)
      .single();

    if (fetchErr) throw fetchErr;

    if (week.status === "submitted" || week.status === "approved") {
      throw new Error(`This week is already ${week.status} and cannot be re-submitted.`);
    }

    // Future-week guard — can't submit a week that hasn't started yet
    if (week.end_date) {
      const today    = new Date();
      today.setHours(0, 0, 0, 0);
      const startDay = new Date(week.start_date);
      startDay.setHours(0, 0, 0, 0);

      if (startDay > today) {
        throw new Error(
          "This week hasn't started yet. You can only submit weeks that have already begun."
        );
      }
    }

    // Validate entries — but only for days on or after the placement start.
    // Pre-start days (Mon/Tue/Wed when placement starts Thursday) are seeded
    // empty by design and must not block submission.
    const { data: logs, error: logsErr } = await supabase
      .from("daily_logs")
      .select("day_of_week, log_date, activity_details, tasks_completed")
      .eq("week_id", weekId);

    if (logsErr) throw logsErr;

    // Parse week.start_date as local midnight for comparison
    const [sy, sm, sd] = week.start_date.split("-").map(Number);
    const commencementDate = new Date(sy, sm - 1, sd);

    const emptyDays = logs.filter((l) => {
      const [ly, lm, ld] = l.log_date.split("-").map(Number);
      const logDate = new Date(ly, lm - 1, ld);
      // Skip pre-start days — they are intentionally empty
      if (logDate < commencementDate) return false;
      // Skip future days — student can't fill what hasn't happened yet
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (logDate > today) return false;
      return !l.activity_details?.trim() && !l.tasks_completed?.trim();
    });

    if (emptyDays.length > 0) {
      const names = emptyDays.map((d) => d.day_of_week).join(", ");
      throw new Error(
        `The following days have no entries: ${names}. Please complete them before submitting.`
      );
    }

    const { error } = await supabase
      .from("logbook_weeks")
      .update({
        status:          "submitted",
        student_summary: studentSummary.trim() || null,
        submitted_at:    new Date().toISOString(),
        updated_at:      new Date().toISOString(),
      })
      .eq("id", weekId);

    if (error) throw error;
    return true;
  },

  saveStudentSummary: async (weekId, summary) => {
    // Guard: don't auto-save summary for a week that hasn't started yet
    const { data: week, error: fetchErr } = await supabase
      .from("logbook_weeks")
      .select("start_date")
      .eq("id", weekId)
      .single();

    if (fetchErr) throw fetchErr;

    if (week.start_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [y, m, d] = week.start_date.split("-").map(Number);
      const startDay = new Date(y, m - 1, d);
      if (startDay > today) return true; // silently skip, don't throw
    }

    const { error } = await supabase
      .from("logbook_weeks")
      .update({ student_summary: summary, updated_at: new Date().toISOString() })
      .eq("id", weekId);

    if (error) throw error;
    return true;
  },

  // ─── SUPERVISOR ACTIONS ─────────────────────────────────────────────────────

  approveWeek: async (weekId, supervisorUserId, signerName, signerTitle, signerRole) => {
    const { error: sigError } = await supabase
      .from("logbook_signatures")
      .insert([{
        week_id:      weekId,
        signed_by:    supervisorUserId,
        signer_name:  signerName,
        signer_title: signerTitle,
        signer_role:  signerRole,
        signed_at:    new Date().toISOString(),
      }]);

    // 23505 = already signed — idempotent
    if (sigError && sigError.code !== "23505") throw sigError;

    const { error: weekError } = await supabase
      .from("logbook_weeks")
      .update({
        status:           "approved",
        stamped_by_name:  signerName,
        stamped_by_title: signerTitle,
        approved_at:      new Date().toISOString(),
        updated_at:       new Date().toISOString(),
      })
      .eq("id", weekId);

    if (weekError) throw weekError;
    return true;
  },

  flagWeek: async (weekId, supervisorComments) => {
    if (!supervisorComments?.trim()) {
      throw new Error("Please provide feedback explaining what needs to be corrected.");
    }

    const { error } = await supabase
      .from("logbook_weeks")
      .update({
        status:              "action_needed",
        supervisor_comments: supervisorComments.trim(),
        updated_at:          new Date().toISOString(),
      })
      .eq("id", weekId);

    if (error) throw error;
    return true;
  },

  reopenFlaggedWeek: async (weekId) => {
    const { data: week, error: fetchErr } = await supabase
      .from("logbook_weeks")
      .select("status")
      .eq("id", weekId)
      .single();

    if (fetchErr) throw fetchErr;

    if (week.status !== "action_needed") {
      throw new Error("Only weeks flagged as 'Action Needed' can be reopened.");
    }

    const { error } = await supabase
      .from("logbook_weeks")
      .update({
        status:              "draft",
        supervisor_comments: null,
        submitted_at:        null,
        updated_at:          new Date().toISOString(),
      })
      .eq("id", weekId);

    if (error) throw error;
    return true;
  },
};