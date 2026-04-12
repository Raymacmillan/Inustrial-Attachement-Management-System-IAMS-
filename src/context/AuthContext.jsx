import { useContext, useState, createContext, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext({
  session: null,
  userRole: null,
  loading: true,
  user: null,
  signInUser: async () => {},
  signUpNewUser: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
});

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const isPasswordStrong = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/-]).{8,}$/;
    return regex.test(password);
  };

  const isValidStudentId = (id) => /^\d{9}$/.test(id);

  // ── signUpNewUser ──────────────────────────────────────────────────────────
  // Every code path MUST return { success, error } or { success, data }.
  
  const signUpNewUser = async (email, password, metadata, restrictToUB = false) => {

    // 1. UB email restriction for students
    if (restrictToUB && !email.endsWith("@ub.ac.bw")) {
      return { success: false, error: "Please use your official @ub.ac.bw email." };
    }

    // 2. Student-specific validation
    if (metadata.role === "student") {
      const idFromEmail = email.split("@")[0];

      if (!isValidStudentId(metadata.student_id)) {
        return { success: false, error: "Student ID must be exactly 9 digits." };
      }
      if (idFromEmail !== metadata.student_id) {
        return { success: false, error: "Your Student ID must match the ID in your email address." };
      }
    }

    // 3. Password strength
    if (!isPasswordStrong(password)) {
      return { success: false, error: "Password too weak. Use uppercase, numbers, and symbols." };
    }

    // 4. Call Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name:  metadata.full_name,
          role:       metadata.role,
          student_id: metadata.student_id || null,
          industry:   metadata.industry   || null,
          avatar_url: metadata.avatar_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(metadata.full_name)}`,
        },
      },
    });

    // 5. Handle Supabase error
    if (error) return { success: false, error: error.message };

    // 6. Detect repeated signup — Supabase returns identities: [] when the
    //    email already exists (email enumeration protection).
    //    Without this check the frontend shows a fake verification screen.
    if (data?.user?.identities?.length === 0) {
      return {
        success: false,
        error: "An account with this email already exists. Please sign in instead.",
      };
    }

    // 7. Success
    return { success: true, data };
  };

  const signInUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { success: false, error: error.message } : { success: true, data };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
    if (error) console.error("Google Auth Error:", error.message);
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    return error ? { success: false, error: error.message } : { success: true };
  };

  const updatePassword = async (newPassword) => {
    if (!isPasswordStrong(newPassword)) {
      return { success: false, error: "New password does not meet security requirements." };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error ? { success: false, error: error.message } : { success: true };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setSession(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) setUserRole(session.user.user_metadata.role);
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUserRole(session?.user?.user_metadata?.role || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({
    session,
    user:     session?.user ?? null,
    userRole,
    loading,
    signInUser,
    signUpNewUser,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  }), [session, loading, userRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const UserAuth = () => useContext(AuthContext);