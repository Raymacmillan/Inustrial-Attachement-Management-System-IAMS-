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
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
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

  if (uploadError) {
    console.error(`Upload Error in ${bucketName}:`, uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return data.publicUrl;
};

/**
 * @description Uploads a profile picture to the 'avatars' bucket.
 *
 * Cache-busting strategy: Supabase Storage returns the same public URL
 * every time because the filename doesn't change (upsert overwrites the file
 * in place). The browser caches the old image against that URL and won't
 * re-fetch it even though the file on the server has changed.
 *
 * Fix: append `?t=<timestamp>` to the public URL before saving it to the DB.
 * Every upload produces a unique URL, forcing the browser to fetch fresh.
 * The `?t=` param is ignored by Supabase Storage — it just prevents caching.
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

  if (uploadError) {
    console.error("Supabase Storage Error:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

  const cacheBustedUrl = `${data.publicUrl}?t=${Date.now()}`;

  return cacheBustedUrl;
};

/**
 * @description Removes a document from storage and clears the DB link
 */
export const deleteDocument = async (userId, bucketName) => {
  const fileExt = "pdf"; 
  const fileName = `${userId}-${bucketName}.${fileExt}`;

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
 * @description Fetches the student's internship preferences (Skills, Roles, etc.)
 */
export const getStudentPreferences = async (studentId) => {
  const { data, error } = await supabase
    .from('student_preferences')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

/**
 * @description Updates or Creates student internship intent.
 */
export const updateStudentPreferences = async (studentId, preferences) => {
  const cleanData = {
    student_id: studentId,
    preferred_roles: preferences.preferred_roles || [],
    technical_skills: preferences.technical_skills || [], 
    preferred_locations: preferences.preferred_locations || [],
    industries: preferences.industries || [], 
    min_stipend_expected: preferences.min_stipend_expected || 0, 
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('student_preferences')
    .upsert(cleanData, { onConflict: 'student_id' }) 
    .select()
    .single();

  if (error) {
    console.error("Supabase Error Detail:", error.message, error.details);
    throw error;
  }
  return data;
};