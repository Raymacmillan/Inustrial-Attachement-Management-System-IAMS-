import { useContext, useState, createContext, useEffect, useMemo } from "react"; 
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext({
  session: null,
  userRole: null, 
  loading: true,
  signInUser: async () => {},
  signUpNewUser: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
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

  const signUpNewUser = async (email, password, metadata, restrictToUB = false) => {
    if (restrictToUB && !email.endsWith("@ub.ac.bw")) {
      return { success: false, error: "Please use your official @ub.ac.bw email." };
    }
    
   
    if (metadata.role === 'student' && !isValidStudentId(metadata.student_id)) {
      return { success: false, error: "Student ID must be exactly 9 digits." };
    }
    
    
    if (!isPasswordStrong(password)) {
      return { success: false, error: "Password too weak. Use uppercase, numbers, and symbols." };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.full_name,
          role: metadata.role,
          student_id: metadata.student_id || null,
          avatar_url: metadata.avatar_url || `https://ui-avatars.com/api/?name=${metadata.full_name}`, 
        },
      },
    });

    return error ? { success: false, error: error.message } : { success: true, data };
  };

  const signInUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { success: false, error: error.message } : { success: true, data };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
    if (error) console.error("Google Auth Error:", error.message);
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
      if (session?.user) {
        setUserRole(session.user.user_metadata.role);
      }
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
    userRole,
    loading,
    signInUser,
    signUpNewUser,
    signInWithGoogle,
    signOut,
  }), [session, loading, userRole]);

  return <AuthContext value={value}>{children}</AuthContext>;
};

export const UserAuth = () => useContext(AuthContext);