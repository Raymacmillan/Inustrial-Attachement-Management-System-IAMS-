import { Component } from "react";
import { AlertTriangle, LogIn } from "lucide-react";
import Button from "./Button"

/**
 * IAMS Error Boundary
 * Catches runtime errors anywhere in the component tree and renders
 * a clean, branded fallback instead of the React red-screen crash.
 *
 * Usage — wrap any subtree you want to protect:
 *
 *   <ErrorBoundary>
 *     <SomeFeature />
 *   </ErrorBoundary>
 *
 * Or wrap the entire app in main.jsx:
 *
 *   <ErrorBoundary>
 *     <RouterProvider router={router} />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you would send this to a logging service
    console.error("[IAMS Error Boundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Navigate to a safe route
    window.location.href = "/login";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <div className="min-h-screen bg-brand-900 flex items-center justify-center p-6 font-body">
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

          {/* Error Card */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl space-y-6">

            {/* Icon + Title */}
            <div className="flex items-start gap-5">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-brand-900">
                  Something went wrong
                </h3>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                  An unexpected error occurred in the portal. Your session data
                  is safe. Please return to the login page.
                </p>
              </div>
            </div>

            {/* Dev-only error detail — hidden in production */}
            {isDev && this.state.error && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Dev Info — hidden in production
                </p>
                <p className="text-xs font-mono text-red-600 break-all leading-relaxed">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Action */}
            <Button
              variant="primary"
              fullWidth
              onClick={this.handleReset}
            >
              <LogIn size={16} />
              Return to Login
            </Button>

          </div>

          <p className="text-center text-brand-600 text-[10px] font-bold uppercase tracking-widest mt-8">
            University of Botswana · CS Department
          </p>
        </div>
      </div>
    );
  }
}