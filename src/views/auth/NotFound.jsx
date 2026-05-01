import { useNavigate, useLocation } from "react-router-dom";
import { Compass, ArrowLeft, LogIn } from "lucide-react";
import Button from "../../components/ui/Button";
import { UserAuth } from "../../context/AuthContext";

const ROLE_HOME = {
  student:               "/student/dashboard",
  org:                   "/org/portal",
  coordinator:           "/coordinator/dashboard",
  industrial_supervisor: "/supervisor/industrial/dashboard",
  university_supervisor: "/supervisor/university/dashboard",
};

export default function NotFound() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, userRole } = UserAuth();

  const handleGoHome = () => navigate(ROLE_HOME[userRole] ?? "/login");

  const handleGoBack = () => {
    if (window.history.length > 2) navigate(-1);
    else handleGoHome();
  };

  return (
    <div className="min-h-screen w-full bg-brand-950 flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-500">

        <div className="mb-10 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tighter text-white uppercase">IAMS</h2>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400">
            Industrial Attachment Portal
          </span>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl shrink-0">
              <Compass size={24} />
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl font-black text-brand-900 leading-none">404</span>
                <h3 className="font-display text-xl font-bold text-brand-900">Page Not Found</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                The page you are looking for does not exist or may have been moved.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Attempted Path</p>
            <p className="text-sm font-mono text-red-500 break-all">{location.pathname}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="ghost" fullWidth onClick={handleGoBack} className="order-2 sm:order-1">
              <ArrowLeft size={16} /> Go Back
            </Button>
            <Button variant="primary" fullWidth onClick={handleGoHome} className="order-1 sm:order-2">
              <LogIn size={16} /> {user ? "Go to My Portal" : "Return to Login"}
            </Button>
          </div>
        </div>

        <p className="text-center text-brand-600 text-[10px] font-black uppercase tracking-widest mt-8">
          University of Botswana · CS Department
        </p>
      </div>
    </div>
  );
}