import { useContext, useState, createContext, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext({
  session:        null,
  userRole:       null,
  loading:        true,
  user:           null,
  signInUser:     async () => {},
  signUpNewUser:  async () => {},
  signInWithGoogle: async () => {},
  signOut:        async () => {},
  resetPassword:  async () => {},
  updatePassword: async () => {},
});

export const AuthContextProvider = ({ children }) => {
  const [session,  setSession]  = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading,  setLoading]  = useState(true);

  // ── Role resolution ────────────────────────────────────────────────────────
  // Source of truth is the user_roles table, NOT user_metadata.role.
  // Coordinator and supervisor accounts are created without going through the
  // app's signup form, so their user_metadata.role is empty. The DB row is
  // always correct regardless of how the account was created.

  const fetchRole = async (userId) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      // Fall back to user_metadata for accounts created via signUpNewUser
      // (e.g. students/orgs who registered through the app before this fix)
      return null;
    }
    return data.role;
  };

  // ── Validation helpers ─────────────────────────────────────────────────────

  const isPasswordStrong = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/-]).{8,}$/;
    return regex.test(password);
  };

  const isValidStudentId = (id) => /^\d{9}$/.test(id);

  // ── signUpNewUser ──────────────────────────────────────────────────────────

  const signUpNewUser = async (email, password, metadata, restrictToUB = false) => {
    if (restrictToUB && !email.endsWith("@ub.ac.bw")) {
      return { success: false, error: "Please use your official @ub.ac.bw email." };
    }

    if (metadata.role === "student") {
      const idFromEmail = email.split("@")[0];
      if (!isValidStudentId(metadata.student_id)) {
        return { success: false, error: "Student ID must be exactly 9 digits." };
      }
      if (idFromEmail !== metadata.student_id) {
        return { success: false, error: "Your Student ID must match the ID in your email address." };
      }
    }

    if (!isPasswordStrong(password)) {
      return { success: false, error: "Password too weak. Use uppercase, numbers, and symbols." };
    }

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

    if (error) return { success: false, error: error.message };

    if (data?.user?.identities?.length === 0) {
      return {
        success: false,
        error: "An account with this email already exists. Please sign in instead.",
      };
    }

    return { success: true, data };
  };

  // ── Auth actions ───────────────────────────────────────────────────────────

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

  // ── Session initialisation ─────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const resolveRole = async (user) => {
      if (!user) return null;
      const dbRole = await fetchRole(user.id);
      return dbRole ?? user.user_metadata?.role ?? null;
    };

    // ── Initial session load ─────────────────────────────────────────
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(session);
      if (session?.user) {
        const role = await resolveRole(session.user);
        if (mounted) setUserRole(role);
      }
      if (mounted) setLoading(false);
    };

    initializeAuth();

    // ── Auth state changes (login / logout / token refresh) ──────────
    // Do NOT do async work that could trigger re-renders in here beyond
    // the bare minimum — just sync the session and kick off role fetch.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        setSession(session);

        if (!session?.user) {
          setUserRole(null);
          setLoading(false);
          return;
        }

        // Fire-and-forget role fetch — doesn't block the listener
        resolveRole(session.user).then((role) => {
          if (mounted) setUserRole(role);
        });
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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