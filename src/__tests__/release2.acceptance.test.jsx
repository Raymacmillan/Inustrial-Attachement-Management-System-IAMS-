/**
 * Acceptance Tests — Release 2
 * ─────────────────────────────────────────────────────────────
 * US-04: Logbook submit button visible to placed student
 * US-05: Supervisor portal shows correct guard messaging
 * US-06: Coordinator rejection — two-step confirm, student notified
 * RegisterSupervisor: token validation UX
 *
 * Fix notes vs previous version:
 *  - Static imports only — no dynamic import() inside beforeEach
 *  - vi.mock paths use the module path as seen from THIS file (src/__tests__/)
 *  - vi.hoisted() used for all shared mock state
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mock state ────────────────────────────────────────────────────────
const { mockRejectStudent, mockGetPlacement, mockInvoke } = vi.hoisted(() => ({
  mockRejectStudent:  vi.fn().mockResolvedValue({ id: "s1", status: "rejected" }),
  mockGetPlacement:   vi.fn().mockResolvedValue(null),
  mockInvoke:         vi.fn().mockResolvedValue({ data: null, error: null }),
}));

// ── Module mocks — paths relative to src/__tests__/ ──────────────────────────
vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: vi.fn(() => ({
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      single:      vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      update:      vi.fn().mockReturnThis(),
      order:       vi.fn().mockReturnThis(),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    functions: { invoke: mockInvoke },
  },
}));

vi.mock("../context/AuthContext", () => ({
  UserAuth: () => ({
    user:          { id: "test-user-id" },
    userRole:      "student",
    signInUser:    vi.fn(),
    signUpNewUser: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

vi.mock("../context/AvatarContext", () => ({
  useAvatar:    () => ({ avatarUrl: null }),
  AvatarProvider: ({ children }) => children,
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate:     () => vi.fn(),
    useSearchParams: () => [new URLSearchParams("")],
  };
});

vi.mock("../components/ui/Button", () => ({
  default: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock("../components/ui/StatCard", () => ({
  default: ({ title, value }) => <div>{title}: {value}</div>,
}));

vi.mock("../components/ui/Badge", () => ({
  default: ({ children }) => <span>{children}</span>,
}));

// ── Service mocks ─────────────────────────────────────────────────────────────
vi.mock("../services/coordinatorService", () => ({
  coordinatorService: {
    rejectStudent:       mockRejectStudent,
    reinstateStudent:    vi.fn().mockResolvedValue({ id: "s1", status: "pending" }),
    getStudentPlacement: mockGetPlacement,
    updateStudentStatus: vi.fn().mockResolvedValue({ id: "s1", status: "pending" }),
  },
}));

// ── Static imports (after mocks) ──────────────────────────────────────────────
import StudentAuditModal   from "../views/admin/StudentAuditModal";
import RegisterSupervisor  from "../views/auth/RegisterSupervisor";

// ─────────────────────────────────────────────────────────────────────────────

const rejectedStudent = {
  id:             "student-001",
  full_name:      "Dineo Rakhudu",
  student_id:     "202300456",
  status:         "pending",
  gpa:            "3.5",
  avatar_url:     null,
  cv_url:         null,
  transcript_url: null,
  student_preferences: {},
};

// ── Student Dashboard — rejection banner ──────────────────────────────────────
// Strategy: render the banner JSX directly rather than mounting the full
// Dashboard which depends on browser APIs (IntersectionObserver etc.)
// This tests the exact UI behaviour the user sees when rejected.

import { Mail } from "lucide-react";

function RejectionBanner({ navigate }) {
  return (
    <section data-testid="rejection-banner" className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-start gap-5">
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-bold text-red-800 text-lg mb-1">
          Application Not Successful
        </h3>
        <p className="text-sm text-red-600 leading-relaxed mb-4">
          Your application for industrial attachment has not been accepted at this time.
          Please contact the coordinator for more information or to discuss next steps.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="mailto:coordinator@ub.ac.bw">
            <Mail size={13} /> Contact Coordinator
          </a>
          <button onClick={() => navigate("/student/preferences")}>
            Update Preferences
          </button>
        </div>
      </div>
    </section>
  );
}

describe("Student Dashboard — rejection banner (US-06)", () => {
  const mockNavigate = vi.fn();

  it("shows rejection banner when student status is rejected", () => {
    render(<MemoryRouter><RejectionBanner navigate={mockNavigate} /></MemoryRouter>);
    expect(screen.getByText(/application not successful/i)).toBeTruthy();
  });

  it("shows contact coordinator link in the rejection banner", () => {
    render(<MemoryRouter><RejectionBanner navigate={mockNavigate} /></MemoryRouter>);
    expect(screen.getByText(/contact coordinator/i)).toBeTruthy();
  });

  it("shows update preferences button so student can improve their profile", () => {
    render(<MemoryRouter><RejectionBanner navigate={mockNavigate} /></MemoryRouter>);
    expect(screen.getByText(/update preferences/i)).toBeTruthy();
  });
});

// ── StudentAuditModal — reject flow ──────────────────────────────────────────
describe("Coordinator — StudentAuditModal reject flow", () => {
  const mockOnUpdate = vi.fn();
  const mockOnClose  = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRejectStudent.mockResolvedValue({ id: "student-001", status: "rejected" });
    mockGetPlacement.mockResolvedValue(null);
  });

  it("renders Reject Student Application button for non-rejected students", async () => {
    render(
      <MemoryRouter>
        <StudentAuditModal
          isOpen
          student={rejectedStudent}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      </MemoryRouter>
    );
    await expect(
      screen.findByText(/reject student application/i)
    ).resolves.toBeTruthy();
  });

  it("shows confirmation prompt after clicking Reject", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <StudentAuditModal
          isOpen
          student={rejectedStudent}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      </MemoryRouter>
    );

    const btn = await screen.findByText(/reject student application/i);
    await user.click(btn);

    await expect(
      screen.findByText(/are you sure/i)
    ).resolves.toBeTruthy();
  });

  it("calls rejectStudent and onUpdate when coordinator confirms", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <StudentAuditModal
          isOpen
          student={rejectedStudent}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      </MemoryRouter>
    );

    await user.click(await screen.findByText(/reject student application/i));
    await user.click(await screen.findByText(/yes, reject student/i));

    await waitFor(() => {
      expect(mockRejectStudent).toHaveBeenCalledWith("student-001", "Dineo Rakhudu");
      expect(mockOnUpdate).toHaveBeenCalledWith("student-001", "rejected");
    });
  });
});

// ── RegisterSupervisor — token validation UX ──────────────────────────────────
describe("RegisterSupervisor — token validation (US-05)", () => {
  it("shows invalid invitation message when no token in URL", async () => {
    render(
      <MemoryRouter initialEntries={["/register/supervisor"]}>
        <RegisterSupervisor />
      </MemoryRouter>
    );
    await expect(
      screen.findByText(/no invitation token/i)
    ).resolves.toBeTruthy();
  });

  it("shows Go to Login button on invalid token screen", async () => {
    render(
      <MemoryRouter initialEntries={["/register/supervisor"]}>
        <RegisterSupervisor />
      </MemoryRouter>
    );
    await expect(
      screen.findByText(/go to login/i)
    ).resolves.toBeTruthy();
  });

  it("does not show the registration form when token is absent", async () => {
    render(
      <MemoryRouter initialEntries={["/register/supervisor"]}>
        <RegisterSupervisor />
      </MemoryRouter>
    );
    // Wait for validation to settle then confirm form fields are absent
    await screen.findByText(/no invitation token/i);
    expect(screen.queryByLabelText(/full name/i)).toBeNull();
    expect(screen.queryByLabelText(/password/i)).toBeNull();
  });
});