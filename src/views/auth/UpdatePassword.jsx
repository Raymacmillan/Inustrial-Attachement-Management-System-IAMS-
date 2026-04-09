import { useState, useEffect } from "react";
import { UserAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function UpdatePassword() {
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  // ready flips true once Supabase fires the PASSWORD_RECOVERY event
  // meaning the token from the email link has been exchanged for a session
  const [ready, setReady]                     = useState(false);
  const { updatePassword }                    = UserAuth();
  const navigate                              = useNavigate();

  useEffect(() => {
    // Supabase fires onAuthStateChange with event "PASSWORD_RECOVERY" when the
    // user lands on this page via the reset email link. The token in the URL hash
    // is automatically exchanged for a session at this point — we just need to
    // wait for it before showing the form.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { success, error: authError } = await updatePassword(password);
    setLoading(false);

    if (success) {
      navigate("/login", { state: { message: "Password updated successfully! Please sign in." } });
    } else {
      setError(authError || "Failed to update password. The link may have expired.");
    }
  };

  return (
    <div className="flex min-h-screen font-body bg-white overflow-x-hidden">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 items-center justify-center p-16 relative overflow-hidden">
        <div className="max-w-lg z-10">
          <h1 className="font-display text-6xl text-white mb-6 leading-tight tracking-tighter">
            New <span className="text-brand-500">Password</span>
          </h1>
          <p className="text-brand-300 text-xl font-light leading-relaxed">
            Choose a strong password to keep your IAMS account secure.
          </p>
        </div>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] bg-size-[20px_20px]" />
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">

          {/* Waiting for token exchange */}
          {!ready ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <Loader2 className="animate-spin text-brand-600" size={40} />
              <p className="font-bold text-brand-900">Verifying reset link...</p>
              <p className="text-sm text-gray-500">
                If this takes too long, your link may have expired.{" "}
                <button
                  onClick={() => navigate("/forgot-password")}
                  className="text-brand-600 font-bold hover:underline"
                >
                  Request a new one.
                </button>
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-4">
                  <Lock size={24} />
                </div>
                <h2 className="font-display text-3xl text-brand-900 font-bold tracking-tight">
                  Set New Password
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Must be at least 8 characters with uppercase, number and symbol.
                </p>
              </div>

              <form onSubmit={handleUpdate} className="space-y-5">
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span className="text-sm font-bold">{error}</span>
                  </div>
                )}

                <Input
                  label="New Password"
                  type="password"
                  icon={<Lock size={18} />}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  icon={<Lock size={18} />}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <div className="pt-2">
                  <Button type="submit" loading={loading} fullWidth size="lg">
                    <CheckCircle size={16} />
                    Update Password
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}