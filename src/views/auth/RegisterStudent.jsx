import { useState } from "react";
import { UserAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import PasswordStrengthMeter from "../../components/ui/PasswordStrengthMeter";
import { User, Hash, Mail, Lock, ArrowRight, MailCheck, AlertCircle, GraduationCap } from "lucide-react";

export default function RegisterStudent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const { signUpNewUser } = UserAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const metadata = { full_name: fullName, student_id: studentId, role: "student" };
    const { success, error: authError } = await signUpNewUser(email, password, metadata, true);

    if (success) {
      setLoading(false);
      setIsPendingVerification(true);
    } else {
      setLoading(false);
      setError(authError);
    }
     if (password !== confirmPassword ) { 
                setError("Passwords do not match");
                  setLoading(false);
                return;
            };
  };

  // ── Email verification pending state ──
  if (isPendingVerification) {
    return (
      <div className="min-h-screen w-full bg-brand-950 flex items-center justify-center p-4 font-body">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-success/10 text-success rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MailCheck size={40} strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-3xl text-brand-900 mb-3 font-bold">Check Your Email</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Activation link sent to{" "}
            <span className="font-bold text-brand-600">{email}</span>.{" "}
            Use your UB student mail to verify.
          </p>
          <Button onClick={() => navigate("/login")} fullWidth size="lg">
            Return to Login
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
              <GraduationCap size={14} /> Student Portal
            </div>
            <h1 className="font-display text-6xl text-white mb-6 leading-tight tracking-tighter">
              IAMS <span className="text-brand-500">Network</span>
            </h1>
            <p className="text-brand-300 text-xl font-light leading-relaxed">
              Digitizing the future of work for Botswana's next generation of tech leaders.
            </p>
          </div>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] bg-size-[20px_20px]" />
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="font-display text-3xl text-brand-900 mb-2 font-bold tracking-tight">
                Student Signup
              </h2>
              <p className="text-gray-500 font-medium">
                Join the UB Industry Placement Network
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 animate-in">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <span className="text-sm font-bold">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Full Name"
                  icon={<User size={18} />}
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Input
                  label="Student ID"
                  icon={<Hash size={18} />}
                  placeholder="202300000"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  maxLength={9}
                  required
                />
              </div>

              <Input
                label="UB Email Address"
                type="email"
                icon={<Mail size={18} />}
                placeholder="id@ub.ac.bw"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                  <span>Create Student Account</span>
                  <ArrowRight size={16} strokeWidth={3} />
                </Button>
              </div>

              <p className="text-center text-sm text-gray-500 font-medium pt-2">
                Already registered?{" "}
                <Link to="/login" className="text-brand-600 font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}