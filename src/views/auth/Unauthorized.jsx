import { useNavigate } from "react-router-dom";
import { ShieldX, ArrowLeft, LogIn } from "lucide-react";
import Button from "../../components/ui/Button";
import { UserAuth } from "../../context/AuthContext";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user, userRole, signOut } = UserAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleGoHome = () => {
    if (userRole === "student") navigate("/student/dashboard");
    else if (userRole === "org") navigate("/org/portal");
    else if (userRole === "coordinator") navigate("/coordinator/dashboard");
    else navigate("/login");
  };

  return (
    <div className="min-h-screen w-full bg-brand-950 flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-500">

        {/* Logo */}
        <div className="mb-10 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tighter text-white uppercase">
            IAMS
          </h2>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400">
            Industrial Attachment Portal
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl space-y-6">

          {/* Icon + Title */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
              <ShieldX size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-xl font-bold text-brand-900">
                Access Denied
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                You do not have permission to view this page. This area is
                restricted to a specific user role.
              </p>
            </div>
          </div>

          {user && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Current Session
              </p>
              <p className="text-sm font-bold text-brand-900 truncate">
                {user.email}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500">
                Role: {userRole || "Unknown"}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={handleSignOut}
                  className="order-2 sm:order-1"
                >
                  <ArrowLeft size={16} />
                  Sign Out
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleGoHome}
                  className="order-1 sm:order-2"
                >
                  <LogIn size={16} />
                  Go to My Portal
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate("/login")}
              >
                <LogIn size={16} />
                Return to Login
              </Button>
            )}
          </div>

        </div>

        <p className="text-center text-brand-600 text-[10px] font-black uppercase tracking-widest mt-8">
          University of Botswana · CS Department
        </p>
      </div>
    </div>
  );
}