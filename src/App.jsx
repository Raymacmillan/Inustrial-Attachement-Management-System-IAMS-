import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// Views (Placeholder components for now)
import Login from "./views/auth/Login";
import StudentDashboard from "./views/student/Dashboard";
import OrgPortal from "./views/organization/Portal";
import Unauthorized from "./views/auth/Unauthorized";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "login", element: <Login /> },
      { path: "unauthorized", element: <Unauthorized /> },
      
      // Protected Student Routes (Release 1.0)
      {
        path: "student",
        element: (
          <ProtectedRoute allowedRoles={['student']}>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { path: "dashboard", element: <StudentDashboard /> },
          // Future T-03: Preference selection goes here
        ]
      },

      // Protected Org Routes (Release 1.0)
      {
        path: "org",
        element: (
          <ProtectedRoute allowedRoles={['org']}>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { path: "portal", element: <OrgPortal /> },
        ]
      }
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}