import { useState } from "react";
import { UserAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import PasswordStrengthMeter from "../../components/ui/PasswordStrengthMeter";

export default function RegisterStudent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const DEBUG_MODE = false;

  const [isPendingVerification, setIsPendingVerification] = useState(false);

  const { signUpNewUser } = UserAuth();
  const navigate = useNavigate();


  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const metadata = {
      full_name: fullName,
      student_id: studentId,
      role: "student",
    };

    const { success, error: authError } = await signUpNewUser(
      email,
      password,
      metadata,
      true,
    );

    if (success) {
      setLoading(false);
      if (DEBUG_MODE) {
        navigate("/login");
      } else {
        setIsPendingVerification(true);
      }
    } else {
      setLoading(false);
      setError(authError);
    }
  };

  if (isPendingVerification) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-2xl bg-white p-8 sm:p-16 rounded-3xl shadow-modal border border-gray-100 text-center animate-in fade-in zoom-in duration-500">
          <div className="mb-10 flex justify-center">
            <div className="h-24 w-24 bg-success/10 text-success rounded-full flex items-center justify-center animate-bounce">
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h2 className="font-display text-5xl text-brand-900 mb-4">
            Check Your Email
          </h2>
          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            We've sent an activation link to{" "}
            <span className="text-brand-600 font-bold">{email}</span>.
          </p>
          <Button variant="secondary" onClick={() => navigate("/login")}>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-body bg-white overflow-x-hidden">
      {/* ── LEFT PANEL: Responsive Scaling ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 items-center justify-center p-8 xl:p-16 relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <div className="hero-tag mb-4">University of Botswana</div>

          <h1 className="font-display text-5xl xl:text-7xl text-white mb-6 leading-tight">
            IAMS
          </h1>
          <p className="text-brand-400 text-lg xl:text-2xl font-light leading-relaxed">
            Digitizing the future of work for Botswana’s next generation of tech
            leaders.
          </p>
        </div>
        <div className="absolute inset-0 bg-radial-gradient from-brand-600/20 to-transparent pointer-events-none" />
      </div>

      {/* ── RIGHT PANEL: 100% Mobile, Scaled Desktop ── */}

      <div className="w-full lg:w-1/2 bg-gray-50 flex flex-col items-center">
        <div className="w-full min-h-screen lg:min-h-fit lg:my-auto lg:max-w-2xl bg-white p-6 sm:p-12 md:p-16 lg:rounded-3xl shadow-none lg:shadow-modal border-0 lg:border border-gray-100">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="font-display text-4xl sm:text-5xl text-brand-900 mb-3">
              Student Signup
            </h2>
            <p className="text-lg sm:text-xl text-gray-500 font-medium">
              Join the IAMS community
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6 sm:space-y-8">
            {error && (
              <div className="callout danger p-4 text-base">
                <span className="callout-icon">🚫</span>
                <div>{error}</div>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
              <Input
                label="Full Name"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="py-4 sm:py-5 text-lg"
              />
              <Input
                label="Student ID"
                placeholder="202012345"
                className="font-mono py-4 sm:py-5 text-lg"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                maxLength={9}
                required
              />
            </div>

            <Input
              label="UB Email Address"
              type="email"
              placeholder="id@ub.ac.bw"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="py-4 sm:py-5 text-lg"
            />

            <div className="space-y-4">
              <div className="relative">
                <Input
                  label="Security Password"
                  type="password"
                  value={password}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <PasswordStrengthMeter
                  password={password}
                  isFocused={isFocused}
                />
              </div>
            </div>

            <div className="pt-8 sm:pt-10">
              <Button type="submit" loading={loading}>
                Register Now
              </Button>
            </div>

            <div className="text-center pt-6 pb-8 lg:pb-0">
              <p className="text-gray-600 text-lg">
                Already registered?{" "}
                <Link
                  to="/login"
                  className="text-brand-600 font-extrabold hover:underline decoration-4 underline-offset-8"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
