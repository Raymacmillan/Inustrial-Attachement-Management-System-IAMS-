import { supabase } from "../lib/supabaseClient";

/**
 * LOGBOOK SERVICE (IAMS)
 * Handles the logic for the UB industrial attachment logbook.
 * Dynamic: Supports the standard 8 weeks but allows Admin extensions.
 */
export const logbookService = {
  
  /**
   * 1. Fetch the student's active placement
   * Now includes 'duration_weeks' for dynamic UI rendering.
   */
  getActivePlacement: async (studentId) => {
    const { data, error } = await supabase
      .from('placements')
      .select(`
        id,
        organization_id,
        start_date,
        end_date,
        status,
        duration_weeks,
        organization_profiles (org_name)
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error("Placement error:", error);
      throw new Error("No active placement found. Contact your coordinator.");
    }
    return data;
  },

  /**
   * 2. Initialize a New Week
   * Dynamically validates against the placement's allowed duration.
   */
  initializeWeek: async (studentId, placementId, weekNumber, startDate) => {
    const { data: placement, error: pError } = await supabase
      .from('placements')
      .select('duration_weeks')
      .eq('id', placementId)
      .single();

    if (pError || !placement) throw new Error("Could not verify placement duration.");

    // B. Validation: Dynamic limit
    if (weekNumber < 1 || weekNumber > placement.duration_weeks) {
      throw new Error(`Invalid week number. Your placement is set for ${placement.duration_weeks} weeks.`);
    }

    // C. Calculate dates (Monday to Friday)
    const start = new Date(startDate);
    const end = new Date(startDate);
    end.setDate(start.getDate() + 4); 

    const { data: week, error: weekError } = await supabase
      .from('logbook_weeks')
      .insert([{
        student_id: studentId,
        placement_id: placementId,
        week_number: weekNumber,
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        status: 'draft'
      }])
      .select()
      .single();

    if (weekError) {
       if (weekError.code === '23505') throw new Error(`Week ${weekNumber} has already been initialized.`);
       throw weekError;
    }

    // Generate Daily Log Placeholders (Mon-Fri)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dailyEntries = days.map((day, index) => {
      const logDate = new Date(start);
      logDate.setDate(start.getDate() + index);
      return {
        week_id: week.id,
        log_date: logDate.toISOString().split('T')[0],
        day_of_week: day,
        activity_details: '',
        hours_worked: 8.0
      };
    });

    const { error: dailyError } = await supabase
      .from('daily_logs')
      .insert(dailyEntries);

    if (dailyError) throw dailyError;

    return week;
  },

  /**
   * 3. Fetch Full Week Data
   */
  getWeekDetails: async (weekId) => {
    const { data, error } = await supabase
      .from('logbook_weeks')
      .select(`
        *,
        daily_logs (*)
      `)
      .eq('id', weekId)
      .single();

    if (error) throw error;
    
    // Ensure chronological order
    data.daily_logs.sort((a, b) => new Date(a.log_date) - new Date(b.log_date));
    return data;
  },

  /**
   * 4. Update Daily Entry
   */
  updateDailyLog: async (logId, updates) => {
    const { data, error } = await supabase
      .from('daily_logs')
      .update({ 
        activity_details: updates.activity_details,
        hours_worked: updates.hours_worked,
        updated_at: new Date().toISOString()
      })
      .eq('id', logId);

    if (error) throw error;
    return data;
  },

  /**
   * 5. Submit Week for Approval
   */
  submitWeek: async (weekId) => {
    const { data, error } = await supabase
      .from('logbook_weeks')
      .update({ 
        status: 'submitted',
        updated_at: new Date().toISOString()
      })
      .eq('id', weekId);

    if (error) throw error;
    return data;
  }
};