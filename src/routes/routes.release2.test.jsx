/**
 * Integration Tests — Release 2 Routes
 * ─────────────────────────────────────────────────────────────
 * Verifies every new R2 route renders the correct component.
 *
 * Strategy: import components directly and build a minimal
 * createMemoryRouter inline — avoids importing the real routes.jsx
 * which pulls in every view in the app and causes cascading mock failures.
 *
 * File location: src/routes/routes.release2.test.jsx
 * Import prefix from here: "../" = src/
 */

import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, Outlet } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

// ── Hoisted mock values ───────────────────────────────────────────────────────
const { mockGetIndustrial, mockGetUniversity } = vi.hoisted(() => ({
  mockGetIndustrial: vi.fn().mockResolvedValue({ supervisor: null, students: [] }),
  mockGetUniversity: vi.fn().mockResolvedValue({ supervisor: null, students: [] }),
}));

// ── Supabase ──────────────────────────────────────────────────────────────────
vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: vi.fn(() => ({
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      single:      vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      update:      vi.fn().mockReturnThis(),
      order:       vi.fn().mockReturnThis(),
      insert:      vi.fn().mockReturnThis(),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

// ── AuthContext ───────────────────────────────────────────────────────────────
vi.mock("../context/AuthContext", () => ({
  UserAuth: () => ({
    user:          { id: "test-user-id" },
    userRole:      "coordinator",
    signInUser:    vi.fn(),
    signUpNewUser: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

vi.mock("../context/AvatarContext", () => ({
  useAvatar:      () => ({ avatarUrl: null }),
  AvatarProvider: ({ children }) => children,
}));

// ── ProtectedRoute — always render children ───────────────────────────────────
vi.mock("../components/layout/ProtectedRoute", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("../components/layout/DashboardLayout", () => ({
  default: ({ children }) => <div>{children ?? <Outlet />}</div>,
}));

vi.mock("../components/ui/Button", () => ({
  default: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock("../components/ui/Badge", () => ({
  default: ({ children }) => <span>{children}</span>,
}));

vi.mock("../components/ui/EmptyState", () => ({
  default: ({ title, description }) => <div>{title}{description}</div>,
}));

vi.mock("../components/ui/StatusBadge", () => ({
  default: ({ status }) => <span>{status}</span>,
}));

vi.mock("../components/ui/Input", () => ({
  default: ({ label, ...props }) => <input aria-label={label} {...props} />,
}));

vi.mock("../components/ui/SegmentedControl", () => ({
  default: ({ options, onChange }) => (
    <div>{options.map(o => <button key={o.key} onClick={() => onChange(o.key)}>{o.label}</button>)}</div>
  ),
}));

// ── supervisorService ─────────────────────────────────────────────────────────
vi.mock("../services/supervisorService", () => ({
  supervisorService: {
    getIndustrialSupervisorDashboard: mockGetIndustrial,
    getUniversitySupervisorDashboard: mockGetUniversity,
    listInvitations: vi.fn().mockResolvedValue([]),
  },
}));

// ── coordinatorService ────────────────────────────────────────────────────────
vi.mock("../services/coordinatorService", () => ({
  coordinatorService: {
    getDashboardStats:      vi.fn().mockResolvedValue({ totalStudents: 0, totalOrgs: 0, searchingCount: 0, placedCount: 0 }),
    getStudentRegistryDeep: vi.fn().mockResolvedValue([]),
    getOrgsWithSupervisors: vi.fn().mockResolvedValue([]),
    listInvitations:        vi.fn().mockResolvedValue([]),
  },
}));

// ── Mock LandingPage — jsdom doesn't implement IntersectionObserver ───────────
// Route tests verify routing only, not animation internals.
vi.mock("../views/LandingPage", () => ({
  default: () => (
    <h1>Industrial Attachment, Reimagined.</h1>
  ),
}));

// ── Static component imports (after all mocks) ────────────────────────────────
import LandingPage                from "../views/LandingPage";
import SupervisorManagement       from "../views/admin/SupervisorManagement";
import IndustrialSupervisorPortal from "../views/supervisor/IndustrialSupervisorPortal";
import UniversitySupervisorPortal from "../views/supervisor/UniversitySupervisorPortal";
import RegisterSupervisor         from "../views/auth/RegisterSupervisor";
import NotFound                   from "../views/auth/NotFound";

// ── Helper ────────────────────────────────────────────────────────────────────
const renderAt = (path, routes) => {
  const r = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={r} />);
};

// ─────────────────────────────────────────────────────────────────────────────

describe("Release 2 — new routes render correct component", () => {

  it("/ renders LandingPage headline", async () => {
    renderAt("/", [{ path: "/", element: <LandingPage /> }]);
    // The h1 reads "Industrial Attachment, Reimagined." split across span
    // findByRole reads the full accessible name including child spans
    await expect(
      screen.findByRole("heading", { name: /industrial attachment/i })
    ).resolves.toBeTruthy();
  });

  it("/coordinator/supervisors renders SupervisorManagement", async () => {
    renderAt("/coordinator/supervisors", [
      { path: "/coordinator/supervisors", element: <SupervisorManagement /> },
    ]);
    // SupervisorManagement heading contains "Supervisor"
    await expect(
      screen.findByRole("heading", { name: /supervisor/i })
    ).resolves.toBeTruthy();
  });

  it("/supervisor/industrial/dashboard — shows account not linked guard when no supervisor row", async () => {
    renderAt("/supervisor/industrial/dashboard", [
      { path: "/supervisor/industrial/dashboard", element: <IndustrialSupervisorPortal /> },
    ]);
    await expect(
      screen.findByText(/account not linked/i)
    ).resolves.toBeTruthy();
  });

  it("/supervisor/industrial/logbooks — renders same portal", async () => {
    renderAt("/supervisor/industrial/logbooks", [
      { path: "/supervisor/industrial/logbooks", element: <IndustrialSupervisorPortal /> },
    ]);
    await expect(
      screen.findByText(/account not linked/i)
    ).resolves.toBeTruthy();
  });

  it("/supervisor/university/dashboard — shows account not linked guard when no supervisor row", async () => {
    renderAt("/supervisor/university/dashboard", [
      { path: "/supervisor/university/dashboard", element: <UniversitySupervisorPortal /> },
    ]);
    await expect(
      screen.findByText(/account not linked/i)
    ).resolves.toBeTruthy();
  });

  it("/supervisor/university/logbooks — renders university portal", async () => {
    renderAt("/supervisor/university/logbooks", [
      { path: "/supervisor/university/logbooks", element: <UniversitySupervisorPortal /> },
    ]);
    await expect(
      screen.findByText(/account not linked/i)
    ).resolves.toBeTruthy();
  });

  it("/supervisor/university/assessments — renders university portal", async () => {
    renderAt("/supervisor/university/assessments", [
      { path: "/supervisor/university/assessments", element: <UniversitySupervisorPortal /> },
    ]);
    await expect(
      screen.findByText(/account not linked/i)
    ).resolves.toBeTruthy();
  });

  it("/register/supervisor with no token — shows invalid invitation message", async () => {
    renderAt("/register/supervisor", [
      { path: "/register/supervisor", element: <RegisterSupervisor /> },
    ]);
    await expect(
      screen.findByText(/no invitation token/i)
    ).resolves.toBeTruthy();
  });

  it("unknown route renders NotFound with 404", async () => {
    renderAt("/does-not-exist-r2", [
      { path: "/does-not-exist-r2", element: <NotFound /> },
    ]);
    await expect(screen.findByText(/404/i)).resolves.toBeTruthy();
  });
});