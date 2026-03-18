import { useState, useEffect } from "react";
import { UserAuth } from "../../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signInUser } = UserAuth();

  // 1. Get messages passed from Registration or Password Reset
  const successMsg = location.state?.message;

  // Check for remembered email on mount
  const [email, setEmail] = useState(localStorage.getItem("rememberedEmail") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem("rememberedEmail"));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    const { success, error: authError } = await signInUser(email, password);

    if (success) {
      setLoading(false);
      // ProtectedRoute handles the specific role-based redirect, 
      // but /dashboard is our neutral starting point
      navigate("/dashboard");
    } else {
      setLoading(false);
      setError(authError);
    }
  };

  return (
    <div className="flex min-h-screen font-body bg-white overflow-x-hidden">
      {/* ── LEFT PANEL: Neutral Brand Identity ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 items-center justify-center p-8 xl:p-16 relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <div className="hero-tag mb-4 bg-accent! text-brand-900!">Portal Access</div>
          <h1 className="font-display text-5xl xl:text-7xl text-white mb-6 leading-tight">
            IAMS Portal
          </h1>
          <p className="text-brand-400 text-lg xl:text-2xl font-light leading-relaxed">
            Connecting Botswana's <span className="text-white font-medium">Top Talent</span> with 
            leading <span className="text-white font-medium">Industry Partners</span>.
          </p>
        </div>
        <div className="absolute inset-0 bg-radial-gradient from-brand-600/20 to-transparent pointer-events-none" />
      </div>

      {/* ── RIGHT PANEL: Neutral Login Form ── */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex flex-col">
        <div className="w-full min-h-screen lg:min-h-fit lg:my-auto lg:mx-auto lg:max-w-xl bg-white p-8 sm:p-12 md:p-16 lg:rounded-3xl shadow-none lg:shadow-modal border-0 lg:border border-gray-100 flex flex-col justify-center">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="font-display text-4xl sm:text-5xl text-brand-900 mb-3">
              Sign In
            </h2>
            <p className="text-lg sm:text-xl text-gray-500 font-medium">
              Access the Industrial Attachment Management System
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            {/* SUCCESS & ERROR CALLOUTS */}
            {successMsg && (
              <div className="p-4 bg-success/10 text-success rounded-xl font-bold border border-success/20 animate-in fade-in slide-in-from-top-1">
                {successMsg}
              </div>
            )}
            
            {error && (
              <div className="callout danger p-4 text-base">
                <span className="callout-icon">🚫</span>
                <div>{error}</div>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="py-4 sm:py-5 text-lg"
            />

            <div className="space-y-4">
              <Input
                label="Security Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="py-4 sm:py-5 text-lg"
              />

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-gray-600 text-sm sm:text-base font-medium group-hover:text-brand-700 transition-colors">
                    Remember me
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-brand-600 text-sm sm:text-base font-bold hover:underline underline-offset-4"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" loading={loading}>
                Access Portal
              </Button>
            </div>

           
            <div className="text-center pt-8 border-t border-gray-100">
              <p className="text-gray-500 mb-6 font-medium">New to IAMS? Create an account:</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register/student"
                  className="px-6 py-3 bg-brand-50 text-brand-600 font-black rounded-xl hover:bg-brand-100 transition-colors"
                >
                  Student
                </Link>
                <Link
                  to="/register/org"
                  className="px-6 py-3 bg-gray-100 text-brand-900 font-black rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Organization
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}