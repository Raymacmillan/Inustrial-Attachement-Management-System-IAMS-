import { useState } from "react";
import { UserAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { resetPassword } = UserAuth();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    const { success, error: authError } = await resetPassword(email);
    if (success) setMessage("Check your inbox for a recovery link.");
    else setError(authError);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen font-body bg-white overflow-x-hidden">
      {/* LEFT PANEL: Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 items-center justify-center p-16 relative">
        <div className="max-w-lg z-10">
          <h1 className="font-display text-6xl text-white mb-6">Reset Security</h1>
          <p className="text-brand-400 text-2xl font-light">Recovery made simple.</p>
        </div>
        <div className="absolute inset-0 bg-radial-gradient from-brand-600/20 to-transparent" />
      </div>

      {/* RIGHT PANEL: Fixed for No-Scroll Mobile */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex flex-col items-center overflow-y-auto">
        <div className="w-full min-h-screen lg:min-h-fit lg:my-auto lg:max-w-xl bg-white 
                        p-6 sm:p-12 md:p-16 
                        lg:rounded-3xl shadow-none lg:shadow-modal 
                        border-0 lg:border border-gray-100 flex flex-col justify-center">
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="font-display text-4xl sm:text-5xl text-brand-900 mb-2">Forgot Password?</h2>
            <p className="text-lg text-gray-500 font-medium">Enter email for recovery link.</p>
          </div>

          <form onSubmit={handleReset} className="space-y-8 w-full">
            {message && <div className="callout success p-4 text-base">{message}</div>}
            {error && <div className="callout danger p-4 text-base">{error}</div>}

            <Input 
              label="UB Email Address" 
              type="email" 
              placeholder="studentID@ub.ac.bw"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="py-4 sm:py-5 text-lg"
            />

            <Button type="submit" loading={loading}>Send Link</Button>

            <div className="text-center pt-4">
              <Link to="/login" className="text-brand-600 font-bold hover:underline decoration-2 underline-offset-8">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}