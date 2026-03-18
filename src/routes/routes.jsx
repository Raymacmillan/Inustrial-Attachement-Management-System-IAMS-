import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

// Layouts
import RootLayout from "../layouts/RootLayout";
import ProtectedRoute from "../components/layout/ProtectedRoute";

// Auth Views
import Login from "../views/auth/Login";
import RegisterStudent from "../views/auth/RegisterStudent";
import RegisterOrg from "../views/auth/RegisterOrg";
import Unauthorized from "../views/auth/Unauthorized";
import NotFound from "../views/auth/NotFound";

// Student Views (Release 1.0)
import StudentDashboard from "../views/student/Dashboard";
import StudentPreferences from "../views/student/Preferences";
// import Logbook from "../views/student/Logbook"; // Release 2.0
// import StudentReport from "../views/student/Report"; // Release 2.0

// Organization Views (Release 1.0)
import OrgPortal from "../views/organization/Portal";
import OrgRequirements from "../views/organization/Requirements";
// import SupervisorAssessment from "../views/organization/Assessment"; // Release 2.0

// Coordinator Views (Release 1.0)
import MatchingEngine from "../views/coordinator/Matching";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // ── Public Routes ──
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "login", element: <Login /> },
      { path: "register/student", element: <RegisterStudent /> },
      { path: "register/org", element: <RegisterOrg /> },
      { path: "unauthorized", element: <Unauthorized /> },

      // ── Student Routes (Release 1.0) ──
      {
        path: "student",
        element: (
          <ProtectedRoute allowedRoles={['student']}>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { path: "dashboard", element: <StudentDashboard /> },
          { path: "preferences", element: <StudentPreferences /> }, 
          // { path: "logbook", element: <Logbook /> },
          // { path: "report", element: <StudentReport /> },
        ]
      },

      // ── Organization Routes (Release 1.0) ──
      {
        path: "org",
        element: (
          <ProtectedRoute allowedRoles={['org']}>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { path: "portal", element: <OrgPortal /> },
          { path: "requirements", element: <OrgRequirements /> }, 
          // { path: "assessments", element: <SupervisorAssessment /> },
        ]
      },

      // ── Coordinator Routes (Release 1.0) ──
      {
        path: "coordinator",
        element: (
          <ProtectedRoute allowedRoles={['coordinator']}>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { path: "matching", element: <MatchingEngine /> },
        ]
      },
      
      { path: "*", element: <NotFound /> }
    ],
  },
]);