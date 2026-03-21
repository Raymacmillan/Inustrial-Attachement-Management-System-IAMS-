import { useState } from "react";
import { UserAuth } from "../../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import {
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signInUser } = UserAuth();

  const successMsg = location.state?.message;

  const [email, setEmail] = useState(
    localStorage.getItem("rememberedEmail") || "",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    !!localStorage.getItem("rememberedEmail"),
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    const { success, error: authError, data } = await signInUser(email, password);

    if (success && data?.user) {
      // ── Read role from user_metadata — no DB query needed, no recursion possible ──
      const role = data.user.user_metadata?.role;

      if (role === "coordinator") {
        navigate("/coordinator/dashboard");
      } else if (role === "org") {
        navigate("/org/portal");
      } else if (role === "student") {
        navigate("/student/dashboard");
      } else {
        navigate("/unauthorized");
      }
    } else {
      setLoading(false);
      setError(authError || "Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen w-full font-body bg-white overflow-x-hidden">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 bg-brand-800 text-brand-200 rounded-full text-xs font-bold uppercase tracking-widest border border-brand-700">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Official Portal
          </div>
          <h1 className="font-display text-6xl text-white mb-6 leading-tight tracking-tighter">
            IAMS <span className="text-brand-500">Gateway</span>
          </h1>
          <p className="text-brand-300 text-xl font-light leading-relaxed">
            The bridge between{" "}
            <span className="text-white font-medium">University of Botswana</span>{" "}
            talent and{" "}
            <span className="text-white font-medium">Global Industry</span>.
          </p>
        </div>
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] bg-size-[20px_20px]" />
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-brand-900/5 border border-gray-100">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="font-display text-4xl text-brand-900 mb-2 font-bold tracking-tight">
              Welcome Back
            </h2>
            <p className="text-gray-500 font-medium">
              Please enter your details to access your account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {successMsg && (
              <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 animate-in slide-in-from-top-2">
                <CheckCircle2 size={20} />
                <span className="text-sm font-bold">{successMsg}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
            />

            <div className="space-y-3">
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                  />
                  <span className="text-xs text-gray-500 font-bold group-hover:text-brand-900 transition-colors">
                    Remember email
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-brand-600 font-bold text-xs hover:text-brand-800 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 animate-in">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <span className="text-sm font-bold leading-tight">{error}</span>
              </div>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="lg"
              >
                <span>Sign In to Portal</span>
                {!loading && <ArrowRight size={16} strokeWidth={3} />}
              </Button>
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400 font-bold tracking-widest">
                  New User?
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/register/student"
                className="flex flex-col items-center p-3 rounded-2xl bg-brand-50 border border-brand-100 hover:bg-brand-100 transition-all"
              >
                <span className="text-brand-600 font-black text-sm">Student</span>
                <span className="text-[10px] text-brand-400 font-bold uppercase">Registration</span>
              </Link>
              <Link
                to="/register/org"
                className="flex flex-col items-center p-3 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all"
              >
                <span className="text-brand-900 font-black text-sm">Employer</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Partnership</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}