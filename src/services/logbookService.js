import { supabase } from "../lib/supabaseClient";

/**
 * LOGBOOK SERVICE (IAMS)
 * All methods are on a named export object so both
 * LogbookManager and LogbookModal can import as:
 *   import { logbookService } from '../../services/logbookService';
 */
export const logbookService = {

  /**
   * 1. Fetch the student's active placement.
   * Returns null if no placement exists — not a crash.
   */
  getActivePlacement: async (studentId) => {
    const { data, error } = await supabase
      .from("placements")
      .select(`
        id,
        organization_id,
        position_title,
        start_date,
        end_date,
        status,
        duration_weeks,
        industrial_supervisor_name,
        industrial_supervisor_email,
        university_supervisor_name,
        university_supervisor_email,
        organization_profiles (org_name, location)
      `)
      .eq("student_id", studentId)
      .eq("status", "active")
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  /**
   * 2. Initialize a new week with Mon–Fri daily log placeholders.
   */
  initializeWeek: async (studentId, placementId, weekNumber, startDate) => {
    const { data: placement, error: pError } = await supabase
      .from("placements")
      .select("duration_weeks")
      .eq("id", placementId)
      .single();

    if (pError) throw pError;
    if (!placement) throw new Error("Placement not found.");

    if (weekNumber < 1 || weekNumber > placement.duration_weeks) {
      throw new Error(
        `Invalid week number. Your placement is set for ${placement.duration_weeks} weeks.`
      );
    }

    const start = new Date(startDate);
    const end   = new Date(startDate);
    end.setDate(start.getDate() + 4);

    const { data: week, error: weekError } = await supabase
      .from("logbook_weeks")
      .insert([{
        student_id:   studentId,
        placement_id: placementId,
        week_number:  weekNumber,
        start_date:   start.toISOString().split("T")[0],
        end_date:     end.toISOString().split("T")[0],
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

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const dailyEntries = days.map((day, index) => {
      const logDate = new Date(start);
      logDate.setDate(start.getDate() + index);
      return {
        week_id:          week.id,
        log_date:         logDate.toISOString().split("T")[0],
        day_of_week:      day,
        activity_details: "",
        hours_worked:     8.0,
      };
    });

    const { error: dailyError } = await supabase
      .from("daily_logs")
      .insert(dailyEntries);

    if (dailyError) throw dailyError;

    return week;
  },

  /**
   * 3. Fetch full week data including daily logs sorted chronologically.
   */
  getWeekDetails: async (weekId) => {
    const { data, error } = await supabase
      .from("logbook_weeks")
      .select(`*, daily_logs (*)`)
      .eq("id", weekId)
      .single();

    if (error) throw error;

    data.daily_logs = (data.daily_logs || []).sort(
      (a, b) => new Date(a.log_date) - new Date(b.log_date)
    );
    return data;
  },

  /**
   * 4. Update a single daily log entry (auto-save on change).
   */
  updateDailyLog: async (logId, updates) => {
    const payload = { updated_at: new Date().toISOString() };
    if (updates.activity_details  !== undefined) payload.activity_details  = updates.activity_details;
    if (updates.tasks_completed   !== undefined) payload.tasks_completed   = updates.tasks_completed;
    if (updates.learning_outcomes !== undefined) payload.learning_outcomes = updates.learning_outcomes;
    if (updates.challenges        !== undefined) payload.challenges        = updates.challenges;
    if (updates.hours_worked      !== undefined) payload.hours_worked      = updates.hours_worked;
    if (updates.template_type     !== undefined) payload.template_type     = updates.template_type;

    const { error } = await supabase
      .from("daily_logs")
      .update(payload)
      .eq("id", logId);

    if (error) throw error;
    return true;
  },

  /**
   * 5. Fetch all logbook week summaries for a student.
   * Returns lightweight rows — no daily_logs included.
   * Used by LogbookManager to render the week grid and progress bar.
   */
  getStudentWeeks: async (studentId) => {
    const { data, error } = await supabase
      .from("logbook_weeks")
      .select(`
        id,
        week_number,
        start_date,
        end_date,
        status,
        submitted_at,
        approved_at,
        supervisor_comments,
        stamped_by_name,
        stamped_by_title
      `)
      .eq("student_id", studentId)
      .order("week_number", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * 6. Submit a week for supervisor approval.
   * .neq guard means approved weeks are silently skipped.
   */
  submitWeek: async (weekId) => {
    const { error } = await supabase
      .from("logbook_weeks")
      .update({
        status:       "submitted",
        submitted_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })
      .eq("id", weekId)
      .neq("status", "approved");

    if (error) throw error;
    return true;
  },
};