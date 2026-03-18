import { useState } from "react";
import { UserAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import PasswordStrengthMeter from "../../components/ui/PasswordStrengthMeter";

export default function RegisterOrg() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const { signUpNewUser } = UserAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const metadata = {
      full_name: orgName,
      role: "org",
    };

    const { success, error: authError } = await signUpNewUser(
      email,
      password,
      metadata,
      false,
    );

    if (success) {
      setIsSent(true);
    } else {
      setError(authError);
      setLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="max-w-xl w-full bg-white p-12 rounded-3xl shadow-modal text-center">
          <div className="text-6xl mb-6">🏢</div>
          <h2 className="font-display text-4xl text-brand-900 mb-4">
            Verify Your Business
          </h2>
          <p className="text-xl text-gray-500 mb-8">
            We sent a link to <span className="font-bold">{email}</span>. Check
            your inbox to activate your account.
          </p>
          <Button onClick={() => navigate("/login")}>Back to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-body bg-white overflow-x-hidden">
      {/* Branding Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 items-center justify-center p-16 relative">
        <div className="max-w-lg z-10">
          <div className="hero-tag mb-4 bg-brand-400! text-brand-900!">
            Employer Portal
          </div>
          <h1 className="font-display text-6xl text-white mb-6 leading-tight">
            Host Botswana's Best Talent
          </h1>
          <p className="text-brand-400 text-2xl font-light">
            Partner with the University of Botswana to mentor the next
            generation of Computer Science leaders.
          </p>
        </div>
        <div className="absolute inset-0 bg-radial-gradient from-brand-600/20 to-transparent pointer-events-none" />
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white p-12 rounded-3xl shadow-modal border border-gray-100">
          <h2 className="font-display text-4xl text-brand-900 mb-8">
            Organization Signup
          </h2>
          <form onSubmit={handleRegister} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold">
                {error}
              </div>
            )}

            <Input
              label="Organization Name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
            <Input
              label="Business Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
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

            <Button type="submit" loading={loading}>
              Register Organization
            </Button>
            <p className="text-center pt-4">
              Are you a student?{" "}
              <Link to="/register/student" className="text-brand-600 font-bold">
                Register here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
