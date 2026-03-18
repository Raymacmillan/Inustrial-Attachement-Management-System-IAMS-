import { Navigate, useLocation } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";

/**
 * @description The security gatekeeper for IAMS.
 * Standardizes the loading experience and enforces role-based access.
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { session, userRole, loading } = UserAuth();
  const location = useLocation();

 
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="h-20 w-20 border-8 border-brand-100 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-brand-900 font-display text-2xl animate-pulse">
            Verifying Identity...
          </p>
        </div>
      </div>
    );
  }

  
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

 
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

 
  return children;
};

export default ProtectedRoute;