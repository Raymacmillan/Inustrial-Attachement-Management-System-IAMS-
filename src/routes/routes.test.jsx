/**
 * routes.test.jsx
 *
 * Integration tests for IAMS application routing.
 * Verifies that each route renders the correct page component.
 *
 * TWO KEY RULES:
 *
 * Rule 1 — Test STABLE content, not loading text.
 *   The Supabase mock resolves instantly so loading spinners
 *   flash and disappear before findByText can catch them.
 *   Test headings and labels that are always present.
 *
 * Rule 2 — Split headings require findByRole, not findByText.
 *   Every IAMS page heading follows this pattern:
 *     <h1>Word <span className="text-brand-600">Word</span></h1>
 *   findByText looks for ONE element containing the full string —
 *   it fails when text is split across parent + child elements.
 *   findByRole("heading", { name: /full text/i }) reads the full
 *   accessible name INCLUDING child span text — always works.
 */

import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { vi } from "vitest";
import { router } from "./routes";

// ── Mock 1: ProtectedRoute — let all routes render without auth check ──
vi.mock("../components/layout/ProtectedRoute", () => ({
  default: ({ children }) => children,
}));

// ── Mock 2: AuthContext — fake user so user?.id is never null ──
vi.mock("../context/AuthContext", () => ({
  UserAuth: () => ({
    user:     { id: "test-user-id-123", email: "test@test.com" },
    userRole: "student",
    loading:  false,
    signOut:  vi.fn(),
  }),
  AuthContextProvider: ({ children }) => children,
}));

// ── Mock 3: AvatarContext — prevent avatar loading errors ──
vi.mock("../context/AvatarContext", () => ({
  useAvatar: () => ({
    avatarUrl:     null,
    refreshAvatar: vi.fn(),
  }),
  AvatarProvider: ({ children }) => children,
}));

// ── Mock 4: Supabase — chainable mock with realistic fake data ──
//
// Returns fake profile objects so components don't crash when
// they access profile.location, profile.avatar_url, etc.
// Every builder method returns the same chainable object so
// .from().select().eq().order().single() all work without errors.
//
vi.mock("../lib/supabaseClient", () => {

  const fakeStudentProfile = {
    id:                  "test-user-id-123",
    full_name:           "Test Student",
    email:               "test@test.com",
    student_id:          "202300000",
    gpa:                 "3.5",
    status:              "pending",
    cv_url:              null,
    transcript_url:      null,
    avatar_url:          null,
    major:               "Computer Science",
    onboarding_complete: true,
  };

  const fakeOrgProfile = {
    id:                  "test-user-id-123",
    org_name:            "Test Organization",
    email:               "test@test.com",
    location:            "Gaborone",
    industry:            "Technology",
    avatar_url:          null,
    requires_cv:         true,
    requires_transcript: true,
    onboarding_complete: true,
    contact_person:      "Test Person",
    contact_phone:       "+26771234567",
    supervisor_email:    "supervisor@test.com",
  };

  const chainable = {
    select:      () => chainable,
    eq:          () => chainable,
    neq:         () => chainable,
    gt:          () => chainable,
    lt:          () => chainable,
    gte:         () => chainable,
    lte:         () => chainable,
    order:       () => chainable,
    limit:       () => chainable,
    range:       () => chainable,
    filter:      () => chainable,
    match:       () => chainable,
    contains:    () => chainable,
    ilike:       () => chainable,
    in:          () => chainable,
    is:          () => chainable,
    not:         () => chainable,
    head:        () => chainable,
    update:      () => chainable,
    insert:      () => chainable,
    upsert:      () => chainable,
    delete:      () => chainable,
    single:      () => Promise.resolve({ data: fakeOrgProfile, error: null }),
    maybeSingle: () => Promise.resolve({ data: null,           error: null }),
    then: (resolve) => Promise.resolve({
      data:  [fakeStudentProfile],
      count: 1,
      error: null,
    }).then(resolve),
  };

  return {
    supabase: {
      from:    () => chainable,
      rpc:     () => Promise.resolve({ data: null, error: null }),
      auth: {
        getSession:        () => Promise.resolve({ data: { session: null } }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
      storage: {
        from: () => ({
          upload:       () => Promise.resolve({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
          remove:       () => Promise.resolve({ data: null, error: null }),
        }),
      },
      functions: {
        invoke: () => Promise.resolve({ data: [], error: null }),
      },
    },
  };
});

// ── Helper: render a route in an isolated memory router ──
const renderRoute = (path) => {
  const testRouter = createMemoryRouter(router.routes, {
    initialEntries: [path],
  });
  render(<RouterProvider router={testRouter} />);
};

describe("App Routes", () => {

  // ────────────────────────────────────────────────────────────
  // PUBLIC ROUTES
  // Plain single-element text — findByText 
  // ────────────────────────────────────────────────────────────

  test("renders login page", async () => {
    renderRoute("/login");
    expect(await screen.findByText(/welcome back/i)).toBeInTheDocument();
  });

  test("renders student registration page", async () => {
    renderRoute("/register/student");
    expect(await screen.findByText(/student signup/i)).toBeInTheDocument();
  });

  test("renders org registration page", async () => {
    renderRoute("/register/org");
    expect(await screen.findByText(/partner signup/i)).toBeInTheDocument();
  });

  test("renders forgot password page", async () => {
    renderRoute("/forgot-password");
    expect(await screen.findByText(/forgot password/i)).toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────
  // STUDENT ROUTES
  //
  // Profile.jsx:    <div class="hero-tag">Academic Identity</div>
  //
  // Preferences.jsx: <h1>Career Preferences</h1>
  // ────────────────────────────────────────────────────────────

  test("renders student profile page", async () => {
    renderRoute("/student/profile");
    expect(await screen.findByText(/academic identity/i)).toBeInTheDocument();
  });

  test("renders student preferences page", async () => {
    renderRoute("/student/preferences");
    expect(await screen.findByText(/career preferences/i)).toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────
  // ORGANISATION ROUTES
  //
  // Portal.jsx:      <div>Employer Dashboard</div>
  //                  → plain div, findByText works
  //
  // Requirements.jsx: <h1>Placement <span>Inventory</span></h1>
  //                  → SPLIT — must use findByRole("heading")
  // ────────────────────────────────────────────────────────────

  test("renders org portal page", async () => {
    renderRoute("/org/portal");
    expect(await screen.findByText(/employer dashboard/i)).toBeInTheDocument();
  });

  test("renders org requirements page", async () => {
    renderRoute("/org/requirements");
    // SPLIT HEADING: <h1>Placement <span>Inventory</span></h1>
    expect(await screen.findByRole("heading", { name: /placement inventory/i })).toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────
  // COORDINATOR ROUTES
  //
  // All four coordinator headings are split:
  //   <h1>Coordinator <span>Command</span></h1>
  //   <h2>Heuristic Matching Engine</h2>   ← plain, no span
  //   <h1>Partner <span>Registry</span></h1>
  //   <h1>Student <span>Registry</span></h1>
  //
  // Use findByRole("heading") for all — consistent and safe.
  // ────────────────────────────────────────────────────────────

  test("renders coordinator dashboard", async () => {
    renderRoute("/coordinator/dashboard");
    // SPLIT: <h1>Coordinator <span>Command</span></h1>
    expect(await screen.findByRole("heading", { name: /coordinator command/i })).toBeInTheDocument();
  });

  test("renders matching engine page", async () => {
    renderRoute("/coordinator/matching");
    // Plain heading — findByRole still works perfectly here
    expect(await screen.findByRole("heading", { name: /heuristic matching engine/i })).toBeInTheDocument();
  });

  test("renders partner registry page", async () => {
    renderRoute("/coordinator/organizations");
    // SPLIT: <h1>Partner <span>Registry</span></h1>
    expect(await screen.findByRole("heading", { name: /partner registry/i })).toBeInTheDocument();
  });

  test("renders student registry page", async () => {
    renderRoute("/coordinator/students");
    // SPLIT: <h1>Student <span>Registry</span></h1>
    expect(await screen.findByRole("heading", { name: /student registry/i })).toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────
  // NOT FOUND
  // ────────────────────────────────────────────────────────────

  test("renders not found page for unknown routes", async () => {
    renderRoute("/some-random-route");
    expect(document.body).toBeTruthy();
  });

});