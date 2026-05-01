import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

// Layouts
import RootLayout from "../components/layout/RootLayout";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import RouteErrorPage from "../components/ui/RouteErrorPage";

// Auth Views
import Login from "../views/auth/Login";
import RegisterStudent from "../views/auth/RegisterStudent";
import RegisterOrg from "../views/auth/RegisterOrg";
import Unauthorized from "../views/auth/Unauthorized";
import NotFound from "../views/auth/NotFound";
import ForgotPassword from "../views/auth/ForgetPassword";
import UpdatePassword from "../views/auth/UpdatePassword";

// Student Views (Release 1.0)
import StudentDashboard from "../views/student/Dashboard";
import StudentPreferences from "../views/student/Preferences";
import StudentProfile from "../views/student/Profile";
import StudentLayout from "../components/layout/StudentLayout";
import LogbookManager from "../features/logbook/LogbookManager";

// Organization Views (Release 1.0)
import OrgPortal from "../views/organization/Portal";
import OrgRequirements from "../views/organization/Requirements";
import OrgProfile from "../views/organization/OrgProfile";
import OrgApplications from "../views/organization/OrgApplications";
import DashboardLayout from "../components/layout/DashboardLayout";

// Coordinator Views (Release 1.0)
import CoordinatorDashboard from "../views/admin/CoordinatorDashboard";
import MatchingEngine from "../views/admin/MatchEngine";
import PartnerRegistry from "../views/admin/PartnerRegistry";
import StudentRegistry from "../views/admin/StudentRegistry";

import RegisterSupervisor from "../views/auth/RegisterSupervisor";
import IndustrialSupervisorPortal from "../views/supervisor/IndustrialSupervisorPortal";
import UniversitySupervisorPortal from "../views/supervisor/UniversitySupervisorPortal";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      // ── Public Routes ──
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "login", element: <Login /> },
      { path: "register/student", element: <RegisterStudent /> },
      { path: "register/org", element: <RegisterOrg /> },
      { path: "unauthorized", element: <Unauthorized /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "update-password", element: <UpdatePassword /> },

      // ── Student Routes (Release 1.0) ──
      {
        path: "student",
        element: (
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentLayout>
              <Outlet />
            </StudentLayout>
          </ProtectedRoute>
        ),
        children: [
          { path: "dashboard", element: <StudentDashboard /> },
          { path: "profile", element: <StudentProfile /> },
          { path: "preferences", element: <StudentPreferences /> },
          { path: "logbook", element: <LogbookManager /> },
        ],
      },

      // ── Organization Routes (Release 1.0) ──
      {
        path: "org",
        element: (
          <ProtectedRoute allowedRoles={["org"]}>
            <DashboardLayout>
              <Outlet />
            </DashboardLayout>
          </ProtectedRoute>
        ),
        children: [
          { path: "portal", element: <OrgPortal /> },
          { path: "profile", element: <OrgProfile /> },
          { path: "requirements", element: <OrgRequirements /> },
          { path: "applications", element: <OrgApplications /> },
        ],
      },

      // ── Coordinator Routes (Release 1.0) ──
      {
        path: "coordinator",
        element: (
          <ProtectedRoute allowedRoles={["coordinator"]}>
            <DashboardLayout>
              <Outlet />
            </DashboardLayout>
          </ProtectedRoute>
        ),
        children: [
          { path: "dashboard", element: <CoordinatorDashboard /> },
          { path: "matching", element: <MatchingEngine /> },
          { path: "organizations", element: <PartnerRegistry /> },
          { path: "students", element: <StudentRegistry /> },
        ],
      },
      // ── Supervisor Registration (public)
      { path: "register/supervisor", element: <RegisterSupervisor /> },

      // ── Industrial Supervisor
      {
        path: "supervisor/industrial",
        element: (
          <ProtectedRoute allowedRoles={["industrial_supervisor"]}>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true,       element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <IndustrialSupervisorPortal /> },
          { path: "logbooks",  element: <IndustrialSupervisorPortal /> },
          { path: "report",    element: <IndustrialSupervisorPortal /> },
        ],
      },

      // ── University Supervisor
      {
        path: "supervisor/university",
        element: (
          <ProtectedRoute allowedRoles={["university_supervisor"]}>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true,         element: <Navigate to="dashboard" replace /> },
          { path: "dashboard",   element: <UniversitySupervisorPortal /> },
          { path: "logbooks",    element: <UniversitySupervisorPortal /> },
          { path: "assessments", element: <UniversitySupervisorPortal /> },
        ],
      },


      { path: "*", element: <NotFound /> },
    ],
  },
]);