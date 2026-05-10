import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

// Layouts
import RootLayout    from "../components/layout/RootLayout";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import RouteErrorPage from "../components/ui/RouteErrorPage";

// Auth Views
import Login           from "../views/auth/Login";
import RegisterStudent from "../views/auth/RegisterStudent";
import RegisterOrg     from "../views/auth/RegisterOrg";
import Unauthorized    from "../views/auth/Unauthorized";
import NotFound        from "../views/auth/NotFound";
import ForgotPassword  from "../views/auth/ForgetPassword";
import UpdatePassword  from "../views/auth/UpdatePassword";

// Landing
import LandingPage from "../views/LandingPage";

// Student Views
import StudentDashboard  from "../views/student/Dashboard";
import StudentPreferences from "../views/student/Preferences";
import StudentProfile    from "../views/student/Profile";
import StudentLayout     from "../components/layout/StudentLayout";
import LogbookManager      from "../features/logbook/LogbookManager";
import AssessmentReports   from "../views/student/AssessmentReports";

// Organization Views
import OrgPortal       from "../views/organization/Portal";
import OrgRequirements from "../views/organization/Requirements";
import OrgProfile      from "../views/organization/OrgProfile";
import OrgApplications from "../views/organization/OrgApplications";
import DashboardLayout from "../components/layout/DashboardLayout";

// Coordinator Views
import CoordinatorDashboard from "../views/admin/CoordinatorDashboard";
import MatchingEngine       from "../views/admin/MatchEngine";
import PartnerRegistry      from "../views/admin/PartnerRegistry";
import StudentRegistry      from "../views/admin/StudentRegistry";
import SupervisorManagement from "../views/admin/SupervisorManagement";

// Supervisor Views (Release 2)
import Register                  from "../views/auth/Register";
import RegisterSupervisor       from "../views/auth/RegisterSupervisor";
import IndustrialSupervisorPortal from "../views/supervisor/IndustrialSupervisorPortal";
import UniversitySupervisorPortal from "../views/supervisor/UniversitySupervisorPortal";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [

      // ── Landing (index) ──────────────────────────────────────────────────
      { index: true, element: <LandingPage /> },

      // ── Public Auth Routes ───────────────────────────────────────────────
      { path: "login",               element: <Login /> },
      { path: "register",            element: <Register /> },
      { path: "register/student",    element: <RegisterStudent /> },
      { path: "register/org",        element: <RegisterOrg /> },
      { path: "register/supervisor", element: <RegisterSupervisor /> },
      { path: "unauthorized",        element: <Unauthorized /> },
      { path: "forgot-password",     element: <ForgotPassword /> },
      { path: "update-password",     element: <UpdatePassword /> },

      // ── Student Routes ───────────────────────────────────────────────────
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
          { path: "dashboard",    element: <StudentDashboard /> },
          { path: "profile",      element: <StudentProfile /> },
          { path: "preferences",  element: <StudentPreferences /> },
          { path: "logbook",      element: <LogbookManager /> },
          { path: "assessments",  element: <AssessmentReports /> },
        ],
      },

      // ── Organisation Routes ──────────────────────────────────────────────
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
          { path: "portal",       element: <OrgPortal /> },
          { path: "profile",      element: <OrgProfile /> },
          { path: "requirements", element: <OrgRequirements /> },
          { path: "applications", element: <OrgApplications /> },
        ],
      },

      // ── Coordinator Routes ───────────────────────────────────────────────
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
          { path: "dashboard",   element: <CoordinatorDashboard /> },
          { path: "matching",    element: <MatchingEngine /> },
          { path: "organizations", element: <PartnerRegistry /> },
          { path: "students",    element: <StudentRegistry /> },
          { path: "supervisors", element: <SupervisorManagement /> },
        ],
      },

      // ── Industrial Supervisor Routes ─────────────────────────────────────
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

      // ── University Supervisor Routes ─────────────────────────────────────
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

      // ── 404 ─────────────────────────────────────────────────────────────
      { path: "*", element: <NotFound /> },
    ],
  },
]);