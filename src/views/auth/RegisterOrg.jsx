import { useState } from "react";
import { UserAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import SearchableSelect from "../../components/ui/SearchableSelect";
import PasswordStrengthMeter from "../../components/ui/PasswordStrengthMeter";
import { SUGGESTED_INDUSTRIES } from "../../constants/matchingOptions";
import { Building2, Mail, Lock, ArrowRight, MailCheck, AlertCircle } from "lucide-react";

export default function RegisterOrg() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const { signUpNewUser } = UserAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!industry) {
      setError("Please select your organization's primary industry.");
      return;
    }

    setError("");
    setLoading(true);

    const metadata = { full_name: orgName, role: "org", industry };
    const { success, error: authError } = await signUpNewUser(email, password, metadata, false);

    if (success) {
      setIsSent(true);
      setLoading(false);
    } else {
      setError(authError);
      setLoading(false);
    }
     if (password !== confirmPassword ) { 
                setError("Passwords do not match");
                  setLoading(false);
                return;}
            
  };

  // ── Email verification pending state ──
  if (isSent) {
    return (
      <div className="min-h-screen w-full bg-brand-950 flex items-center justify-center p-4 font-body">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <MailCheck size={40} strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-3xl text-brand-900 mb-3 font-bold">Verify Business</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            We've sent a link to{" "}
            <span className="font-bold text-brand-600">{email}</span>.{" "}
            Check your inbox to activate your employer account.
          </p>
          <Button onClick={() => navigate("/login")} fullWidth size="lg">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    // ── Outer shell: full screen, dark bg, centers the card ──
    <div className="min-h-screen w-full bg-brand-950 flex items-center justify-center p-4 font-body">

      {/* ── The card: two panels side by side, max width contained ── */}
      <div className="w-full max-w-5xl flex rounded-lg overflow-hidden shadow-2xl">

        {/* ── LEFT PANEL ── */}
        <div className="hidden lg:flex lg:w-1/2 bg-brand-900 items-center justify-center p-12 relative overflow-hidden">
          <div className="max-w-lg z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 bg-brand-800 text-brand-200 rounded-full text-xs font-bold uppercase tracking-widest border border-brand-700">
              Employer Portal
            </div>
<<<<<<< Updated upstream
            <h1 className="font-display text-6xl text-white mb-6 leading-tight tracking-tighter">
              Host Botswana's <span className="text-brand-500">Best Talent</span>
            </h1>
            <p className="text-brand-300 text-xl font-light leading-relaxed">
              Partner with UB to mentor the next generation of Computer Science leaders.
=======

            <Input
              label="Business Email"
              type="email"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="hr@company.co.bw"
            />

            <div className="relative space-y-2">
              <Input  
                label="Security Password"
                type="password"
                icon={<Lock size={18} />}
                value={password}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <PasswordStrengthMeter password={password} isFocused={isFocused} />
            </div>

 <div className="relative space-y-2">
              <Input
                label="Confirm Password"
                type="password"
                icon={<Lock size={18} />}
                value={confirmPassword}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
                           
            </div>
            
            <Button type="submit" loading={loading} className="w-full py-2.5! text-sm! flex items-center justify-center gap-2">
              <span>Register Organization</span>
              <ArrowRight size={16} strokeWidth={3} />
            </Button>
            
            <p className="text-center text-sm text-gray-500 font-medium">
              Are you a student? <Link to="/register/student" className="text-brand-600 font-bold hover:underline">Register here</Link>
>>>>>>> Stashed changes
            </p>
          </div>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] bg-size-[20px_20px]" />
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="font-display text-3xl text-brand-900 mb-2 font-bold tracking-tight">
                Partner Signup
              </h2>
              <p className="text-gray-500 font-medium">
                Register your organization with IAMS
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 animate-in">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <span className="text-sm font-bold">{error}</span>
                </div>
              )}

              <Input
                label="Organization Name"
                icon={<Building2 size={18} />}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                placeholder="Company Pty Ltd"
              />

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">
                  Primary Industry
                </label>
                <SearchableSelect
                  options={SUGGESTED_INDUSTRIES}
                  selected={industry ? [industry] : []}
                  onSelect={(item) => setIndustry(item)}
                  onRemove={() => setIndustry("")}
                  placeholder="Search or select industry..."
                />
              </div>

              <Input
                label="Business Email"
                type="email"
                icon={<Mail size={18} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="hr@company.co.bw"
              />

              <div className="space-y-2">
                <Input
                  label="Security Password"
                  type="password"
                  icon={<Lock size={18} />}
                  value={password}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <PasswordStrengthMeter password={password} isFocused={isFocused} />
              </div>

              <div className="pt-2">
                <Button type="submit" loading={loading} fullWidth size="lg">
                  <span>Register Organization</span>
                  <ArrowRight size={16} strokeWidth={3} />
                </Button>
              </div>

              <p className="text-center text-sm text-gray-500 font-medium">
                Are you a student?{" "}
                <Link to="/register/student" className="text-brand-600 font-bold hover:underline">
                  Register here
                </Link>
              </p>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}