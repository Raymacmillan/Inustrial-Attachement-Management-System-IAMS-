/**
 * Acceptance tests for student and org registration.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

// ── Mock AuthContext — control what signUpNewUser returns ──
const mockSignUpNewUser = vi.fn();

vi.mock("../context/AuthContext", () => ({
  UserAuth: () => ({
    signUpNewUser: mockSignUpNewUser,
    user:          null,
    userRole:      null,
    loading:       false,
  }),
  AuthContextProvider: ({ children }) => children,
}));

// ── Mock AvatarContext ──
vi.mock("../context/AvatarContext", () => ({
  useAvatar: () => ({ avatarUrl: null, refreshAvatar: vi.fn() }),
  AvatarProvider: ({ children }) => children,
}));

// ── Mock useNavigate ──
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

import RegisterStudent from "../views/auth/RegisterStudent";
import RegisterOrg     from "../views/auth/RegisterOrg";

// ── Helper: wrap in MemoryRouter for <Link> tags ──
const renderWithRouter = (Component) => {
  render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// US-01: Student Registration
// ─────────────────────────────────────────────────────────────────────────────

describe("US-01: Student Registration", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders the student registration form", () => {
    renderWithRouter(RegisterStudent);
    expect(screen.getByText(/student signup/i)).toBeInTheDocument();
  });

  test("shows all required input fields", () => {
    renderWithRouter(RegisterStudent);
    expect(screen.getByPlaceholderText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/202300000/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/id@ub\.ac\.bw/i)).toBeInTheDocument();
  });

  test("shows confirm password field once user starts typing a password", async () => {
    const user = userEvent.setup();
    renderWithRouter(RegisterStudent);

    const [passwordInput] = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInput, "S");

    const allDotInputs = screen.getAllByPlaceholderText("••••••••");
    expect(allDotInputs.length).toBeGreaterThan(1);
  });

  test("shows inline mismatch error when passwords don't match", async () => {
    const user = userEvent.setup();
    renderWithRouter(RegisterStudent);

    const [passwordInput] = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInput, "Secure@123");

    const allDotInputs = screen.getAllByPlaceholderText("••••••••");
    await user.type(allDotInputs[1], "WrongPassword1!");

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test("calls signUpNewUser with correct metadata on valid submit", async () => {
    const user = userEvent.setup();
    mockSignUpNewUser.mockResolvedValue({ success: true });
    renderWithRouter(RegisterStudent);

    await user.type(screen.getByPlaceholderText(/john doe/i), "Test Student");
    await user.type(screen.getByPlaceholderText(/202300000/i), "202300001");
    await user.type(screen.getByPlaceholderText(/id@ub\.ac\.bw/i), "202300001@ub.ac.bw");

    const [passwordInput] = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInput, "Secure@123");
    const allDotInputs = screen.getAllByPlaceholderText("••••••••");
    await user.type(allDotInputs[1], "Secure@123");

    await user.click(screen.getByRole("button", { name: /create student account/i }));

    await waitFor(() => {
      expect(mockSignUpNewUser).toHaveBeenCalledWith(
        "202300001@ub.ac.bw",
        "Secure@123",
        expect.objectContaining({
          full_name:  "Test Student",
          student_id: "202300001",
          role:       "student",
        }),
        true
      );
    });
  });

  test("shows email verification screen after successful registration", async () => {
    const user = userEvent.setup();
    mockSignUpNewUser.mockResolvedValue({ success: true });
    renderWithRouter(RegisterStudent);

    await user.type(screen.getByPlaceholderText(/john doe/i), "Test Student");
    await user.type(screen.getByPlaceholderText(/202300000/i), "202300001");
    await user.type(screen.getByPlaceholderText(/id@ub\.ac\.bw/i), "202300001@ub.ac.bw");

    const [passwordInput] = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInput, "Secure@123");
    const allDotInputs = screen.getAllByPlaceholderText("••••••••");
    await user.type(allDotInputs[1], "Secure@123");

    await user.click(screen.getByRole("button", { name: /create student account/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  test("shows error banner when registration fails", async () => {
    const user = userEvent.setup();
    mockSignUpNewUser.mockResolvedValue({
      success: false,
      error:   "Email already registered.",
    });
    renderWithRouter(RegisterStudent);

    await user.type(screen.getByPlaceholderText(/john doe/i), "Test Student");
    await user.type(screen.getByPlaceholderText(/202300000/i), "202300001");
    await user.type(screen.getByPlaceholderText(/id@ub\.ac\.bw/i), "202300001@ub.ac.bw");

    const [passwordInput] = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInput, "Secure@123");
    const allDotInputs = screen.getAllByPlaceholderText("••••••••");
    await user.type(allDotInputs[1], "Secure@123");

    await user.click(screen.getByRole("button", { name: /create student account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
    });
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// US-02: Organisation Registration
// ─────────────────────────────────────────────────────────────────────────────

describe("US-02: Organisation Registration", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders the org registration form", () => {
    renderWithRouter(RegisterOrg);
    expect(screen.getByText(/partner signup/i)).toBeInTheDocument();
  });

  test("shows all required input fields", () => {
    renderWithRouter(RegisterOrg);
    expect(screen.getByPlaceholderText(/company pty ltd/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/hr@company\.co\.bw/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search or select industry/i)).toBeInTheDocument();
  });

  test("shows error if industry is not selected on submit", async () => {
    const user = userEvent.setup();
    renderWithRouter(RegisterOrg);

    await user.type(screen.getByPlaceholderText(/company pty ltd/i), "Test Org");
    await user.type(screen.getByPlaceholderText(/hr@company\.co\.bw/i), "hr@testorg.com");

    const [passwordInput] = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInput, "Secure@123");
    const allDotInputs = screen.getAllByPlaceholderText("••••••••");
    await user.type(allDotInputs[1], "Secure@123");

    await user.click(screen.getByRole("button", { name: /register organization/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/please select your organization's primary industry/i)
      ).toBeInTheDocument();
    });
  });

  test("shows verification screen after successful org registration", async () => {
    const user = userEvent.setup();
    mockSignUpNewUser.mockResolvedValue({ success: true });
    renderWithRouter(RegisterOrg);

    await user.type(screen.getByPlaceholderText(/company pty ltd/i), "Test Org");

    // Type an industry in the SearchableSelect input, then click the + button
    // SearchableSelect shows a + button when query has text — clicking it calls onSelect(query)
    const industryInput = screen.getByPlaceholderText(/search or select industry/i);
    await user.type(industryInput, "Technology");
    const plusButton = screen.getByRole("button", { name: "" }); // + icon button
    await user.click(plusButton);

    await user.type(screen.getByPlaceholderText(/hr@company\.co\.bw/i), "hr@testorg.com");

    const [passwordInput] = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInput, "Secure@123");
    const allDotInputs = screen.getAllByPlaceholderText("••••••••");
    await user.type(allDotInputs[1], "Secure@123");

    await user.click(screen.getByRole("button", { name: /register organization/i }));

    await waitFor(() => {
      expect(screen.getByText(/verify business/i)).toBeInTheDocument();
    });
  });

  test("shows error banner when org registration fails", async () => {
    const user = userEvent.setup();
    mockSignUpNewUser.mockResolvedValue({
      success: false,
      error:   "Email already registered.",
    });
    renderWithRouter(RegisterOrg);

    await user.type(screen.getByPlaceholderText(/company pty ltd/i), "Test Org");

    const industryInput = screen.getByPlaceholderText(/search or select industry/i);
    await user.type(industryInput, "Technology");
    const plusButton = screen.getByRole("button", { name: "" });
    await user.click(plusButton);

    await user.type(screen.getByPlaceholderText(/hr@company\.co\.bw/i), "hr@testorg.com");

    const [passwordInput] = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInput, "Secure@123");
    const allDotInputs = screen.getAllByPlaceholderText("••••••••");
    await user.type(allDotInputs[1], "Secure@123");

    await user.click(screen.getByRole("button", { name: /register organization/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
    });
  });

});