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

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, { 
      contentType: 'application/pdf', 
      upsert: true 
    });

  if (uploadError) {
    console.error(`Upload Error in ${bucketName}:`, uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return data.publicUrl;
};

/**
 * @description Uploads a profile picture to the 'avatars' bucket
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

  return data.publicUrl;
};
