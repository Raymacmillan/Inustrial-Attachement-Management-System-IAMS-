import { useState } from "react";
import { UserAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { updatePassword } = UserAuth();
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    const { success, error: authError } = await updatePassword(password);
    if (success) navigate("/login", { state: { message: "Security Updated!" } });
    else { setError(authError); setLoading(false); }
  };

  return (
    <div className="flex min-h-screen font-body bg-white overflow-x-hidden">
      {/* Branding Side (Added for consistency) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 items-center justify-center p-16">
        <h1 className="font-display text-6xl text-white">New Password</h1>
      </div>

      {/* Form Side: Fixed stretching */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex flex-col items-center">
        <div className="w-full min-h-screen lg:min-h-fit lg:my-auto lg:max-w-xl bg-white 
                        p-6 sm:p-12 md:p-16 
                        lg:rounded-3xl shadow-none lg:shadow-modal 
                        border-0 lg:border border-gray-100 flex flex-col justify-center">
          
          <h2 className="font-display text-4xl text-brand-900 mb-8 text-center lg:text-left">New Password</h2>
          
          <form onSubmit={handleUpdate} className="space-y-8 w-full">
            {error && <div className="callout danger p-4 text-base">{error}</div>}
            
            <Input 
              label="New Password" 
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="py-4 sm:py-5 text-lg"
            />
            <Input 
              label="Confirm Password" 
              type="password" 
              placeholder="••••••••"
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              className="py-4 sm:py-5 text-lg"
            />
            
            <Button type="submit" loading={loading}>Update Security</Button>
          </form>
        </div>
      </div>
    </div>
  );
}