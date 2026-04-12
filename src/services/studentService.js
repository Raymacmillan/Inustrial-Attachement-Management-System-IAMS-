import { supabase } from "../lib/supabaseClient";

/**
 * @description Fetches the student profile
 */
export const getStudentProfile = async (userId) => {
  const { data, error } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * @description Updates student profile (GPA, Skills, Bio, etc.)
 */
export const updateStudentProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from("student_profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * @description Fetches the student's active placement with full org and supervisor details.
 * Returns null if the student has not yet been placed.
 *
 * Joins:
 *   organization_profiles — org name, location, industry, contact phone
 *
 * Supervisor fields come directly from the placements table:
 *   industrial_supervisor_name/email  — auto-filled from org at allocation time
 *   university_supervisor_name/email  — assigned by coordinator via Student Audit Modal
 */
export const getStudentPlacement = async (studentId) => {
  const { data, error } = await supabase
    .from("placements")
    .select(`
      id,
      position_title,
      status,
      start_date,
      end_date,
      duration_weeks,
      industrial_supervisor_name,
      industrial_supervisor_email,
      university_supervisor_name,
      university_supervisor_email,
      organization_profiles (
        org_name,
        location,
        industry,
        contact_phone,
        avatar_url
      )
    `)
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();

  // PGRST116 = no rows — student not yet placed, not an error
  if (error && error.code !== "PGRST116") throw error;
  return data;
};

/**
 * @description Uploads CV or Transcript to Supabase Storage
 */
export const uploadDocument = async (userId, file, bucketName) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${bucketName}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  if (!data?.publicUrl) throw new Error(`Failed to retrieve public URL for ${bucketName}`);

  return data.publicUrl;
};

/**
 * @description Uploads a profile picture to the 'avatars' bucket.
 * Cache-busting: appends ?t=<timestamp> to force browser re-fetch on update.
 */
export const uploadAvatar = async (userId, file) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
  if (!data?.publicUrl) throw new Error("Failed to retrieve avatar public URL");

  return `${data.publicUrl}?t=${Date.now()}`;
};

/**
 * @description Removes a document from storage and clears the DB link
 */
export const deleteDocument = async (userId, bucketName) => {
  const fileName = `${userId}-${bucketName}.pdf`;

  const { error: storageError } = await supabase.storage
    .from(bucketName)
    .remove([fileName]);

  if (storageError) throw storageError;

  const fieldName = bucketName === "cvs" ? "cv_url" : "transcript_url";
  const { error: dbError } = await supabase
    .from("student_profiles")
    .update({ [fieldName]: null })
    .eq("id", userId);

  if (dbError) throw dbError;

  return true;
};

/**
 * @description Fetches the student's internship preferences
 */
export const getStudentPreferences = async (studentId) => {
  const { data, error } = await supabase
    .from("student_preferences")
    .select("*")
    .eq("student_id", studentId)
    .single();

  // PGRST116 = no rows found — not an error, student just hasn't set prefs yet
  if (error && error.code !== "PGRST116") throw error;
  return data;
};

/**
 * @description Upserts student internship intent (creates or updates)
 */
export const updateStudentPreferences = async (studentId, preferences) => {
  const cleanData = {
    student_id: studentId,
    preferred_roles: preferences.preferred_roles || [],
    technical_skills: preferences.technical_skills || [],
    preferred_locations: preferences.preferred_locations || [],
    industries: preferences.industries || [],
    min_stipend_expected: preferences.min_stipend_expected || 0,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("student_preferences")
    .upsert(cleanData, { onConflict: "student_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
};