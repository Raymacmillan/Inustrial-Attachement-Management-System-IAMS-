import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import PasswordStrengthMeter from "../../components/ui/PasswordStrengthMeter";

/**
 * RegisterSupervisor
 *
 * Reached via invitation link: /register/supervisor?token=<hex>
 *
 * Flow:
 *  1. Read token from URL
 *  2. Validate token against supervisor_invitations (not expired, not accepted)
 *  3. Pre-fill email from invitation row — non-editable
 *  4. Supervisor fills name, title, password
 *  5. Create auth account via supabase.auth.signUp
 *  6. Insert user_roles row with correct supervisor role
 *  7. Link user_id to organization_supervisors or university_supervisors row
 *  8. Mark invitation as accepted
 *  9. Redirect to appropriate portal
 */
export default function RegisterSupervisor() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get("token");

  // Invitation state
  const [invitation, setInvitation] = useState(null);
  const [tokenError, setTokenError] = useState("");
  const [validating, setValidating] = useState(true);

  // Form state
  const [form, setForm] = useState({
    full_name: "",
    job_title: "",
    password:  "",
  });
  const [showPassword,  setShowPassword]  = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState(false);

  // ── Validate token on mount ───────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setTokenError("No invitation token found. Please use the link from your invitation email.");
      setValidating(false);
      return;
    }

    const validate = async () => {
      const { data, error } = await supabase
        .from("supervisor_invitations")
        .select("id, email, supervisor_type, org_id, org_supervisor_id, uni_supervisor_id, status, expires_at")
        .eq("token", token)
        .single();

      if (error || !data) {
        setTokenError("This invitation link is invalid or has already been used.");
        setValidating(false);
        return;
      }

      if (data.status === "accepted") {
        setTokenError("This invitation has already been used. Please log in instead.");
        setValidating(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setTokenError("This invitation has expired. Please ask your coordinator to send a new one.");
        setValidating(false);
        return;
      }

      setInvitation(data);
      setValidating(false);
    };

    validate();
  }, [token]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const roleLabel = invitation?.supervisor_type === "industrial_supervisor"
    ? "Industrial Supervisor"
    : "University Supervisor";

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.full_name.trim()) { setError("Please enter your full name."); return; }
    if (!form.job_title.trim()) { setError("Please enter your job title."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setSubmitting(true);

    try {
      // 1. Create auth account.
      // supabase.auth.signUp does NOT create a session when email confirmation
      // is enabled — auth.uid() is null after this call, so all post-signup
      // DB writes go through the complete-supervisor-registration edge function
      // which uses the service role key and bypasses RLS.
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email:    invitation.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            role:      invitation.supervisor_type,
          },
        },
      });

      if (signUpError) throw signUpError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Account creation failed. Please try again.");

      // 2. Complete registration via edge function (service role — no RLS issues).
      //    Inserts user_roles, links user_id to roster row, marks invite accepted.
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "complete-supervisor-registration",
        {
          body: {
            userId,
            invitationId: invitation.id,
            fullName:     form.full_name,
            jobTitle:     form.job_title,
          },
        }
      );

      // supabase.functions.invoke wraps HTTP errors — extract the actual message
      if (fnError) throw new Error(fnError.message || "Registration could not be completed.");
      if (fnData?.error) throw new Error(fnData.error);

      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);

    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────
  if (validating) return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin text-brand-400 mx-auto" size={36} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 animate-pulse">
          Validating Invitation…
        </p>
      </div>
    </div>
  );

  // ── Invalid token state ───────────────────────────────────────────
  if (tokenError) return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <h2 className="font-display text-4xl font-bold text-white uppercase tracking-tighter">IAMS</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 mt-1">
            Industrial Attachment Portal
          </p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-2xl space-y-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-50 rounded-2xl shrink-0">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-brand-900">Invalid Invitation</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{tokenError}</p>
            </div>
          </div>
          <Button variant="primary" fullWidth onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    </div>
  );

  // ── Success state ─────────────────────────────────────────────────
  if (success) return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500 text-center space-y-6">
        <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={40} className="text-white" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-3xl font-bold text-white">Account Created</h3>
          <p className="text-brand-400 text-sm">Redirecting you to login…</p>
        </div>
      </div>
    </div>
  );

  // ── Registration form ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center p-6 font-body">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Logo */}
        <div className="text-center mb-8">
          <h2 className="font-display text-4xl font-bold text-white uppercase tracking-tighter">IAMS</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 mt-1">
            Industrial Attachment Portal
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header strip */}
          <div className="bg-brand-100 border-b border-brand-100 px-8 py-5 flex items-center gap-4">
            <div className="p-2.5 bg-brand-600 rounded-xl shrink-0">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-400">
                Invited as
              </p>
              <p className="text-sm font-black text-brand-900">{roleLabel}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">

            {/* Pre-filled email — read only */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block ml-1">
                Email Address
              </label>
              <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl
                text-sm font-semibold text-gray-500 select-none">
                {invitation.email}
              </div>
              <p className="text-[10px] text-gray-400 ml-1">
                This email was set by the coordinator and cannot be changed.
              </p>
            </div>

            <Input
              label="Full Name"
              placeholder="e.g. Dr. Jane Smith"
              value={form.full_name}
              onChange={set("full_name")}
              required
            />

            <Input
              label="Job Title"
              placeholder="e.g. Senior Software Engineer"
              value={form.job_title}
              onChange={set("job_title")}
              required
            />

            {/* Password */}
            <div className="space-y-1">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={set("password")}
                  onFocus={() => setPasswordFocus(true)}
                  onBlur={() => setPasswordFocus(false)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-brand-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrengthMeter password={form.password} isFocused={passwordFocus} />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={submitting}
            >
              Create Account
            </Button>

            <p className="text-center text-[11px] text-gray-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-bold text-brand-600 hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>

        <p className="text-center text-brand-600 text-[10px] font-black uppercase tracking-widest mt-8">
          University of Botswana · CS Department
        </p>
      </div>
    </div>
  );
}