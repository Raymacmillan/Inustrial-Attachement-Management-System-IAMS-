import { useRouteError, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, LogIn } from "lucide-react";
import Button from "./Button";

export default function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center p-6 font-body">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-500">

        {/* Logo — matches Sidebar exactly */}
        <div className="mb-10 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tighter text-white uppercase">
            IAMS
          </h2>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400">
            Industrial Attachment Portal
          </span>
        </div>

        {/* Card — same pattern as ConfirmModal */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl space-y-6">

          {/* Icon + Title — same layout as ConfirmModal */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-xl font-bold text-brand-900">
                Something went wrong
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                An unexpected error occurred in the portal. Your session data
                is safe. Please return to the login page.
              </p>
            </div>
          </div>

          {/* Dev-only error detail — hidden in production builds */}
          {isDev && error && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Dev Info — hidden in production
              </p>
              <p className="text-xs font-mono text-red-600 break-all leading-relaxed">
                {error?.message || error?.statusText || String(error)}
              </p>
            </div>
          )}

          {/* Actions — using your Button component */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => navigate(-1)}
              className="order-2 sm:order-1"
            >
              <ArrowLeft size={16} />
              Go Back
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => window.location.href = "/login"}
              className="order-1 sm:order-2"
            >
              <LogIn size={16} />
              Return to Login
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