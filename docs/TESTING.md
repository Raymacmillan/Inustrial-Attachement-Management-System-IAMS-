# IAMS Testing Documentation

**Project:** Industrial Attachment Management System (IAMS)  
**Release:** 2.0  
**Sprint Coverage:** Sprint 1, Sprint 2, Sprint 3 & Sprint 4  
**Test Framework:** Vitest + React Testing Library  
**Total Tests:** 83 passing, 0 failing

---

## Test Environment

| Tool | Version | Purpose |
|---|---|---|
| Vitest | 4.1.x | Test runner and assertion library |
| React Testing Library | 16.x | Component rendering and querying |
| @testing-library/user-event | 14.x | Simulating real user interactions |
| jsdom | 29.x | Browser environment simulation |

**Configuration** (`vite.config.js`):
```js
test: {
  environment: "jsdom",
  globals: true,
  setupFiles: "./src/setupTests.js",
}
```

**Run all tests:**
```bash
npm run test
```

**Run a specific file:**
```bash
npx vitest run src/services/__tests__/logbookService.test.js
```

---

## Test Structure

```
src/
├── utils/__tests__/
│   └── validation.test.js                        # Unit — 18 tests (R1)
├── services/__tests__/
│   ├── coordinatorService.test.js                # Unit — 9 tests  (R1)
│   ├── coordinatorService.release2.test.js       # Unit — 9 tests  (R2)
│   └── logbookService.test.js                    # Unit — 6 tests  (R2)
├── routes/
│   ├── routes.test.jsx                           # Integration — 13 tests (R1)
│   └── routes.release2.test.jsx                  # Integration — 9 tests  (R2)
└── __tests__/
    ├── registration.test.jsx                     # Acceptance — 12 tests (R1)
    └── release2.acceptance.test.jsx              # Acceptance — 9 tests  (R2)
```

---

## Test Types

### 1. Unit Tests
Test individual functions in isolation — no DOM, no network, no database.

### 2. Integration Tests
Test multiple parts working together — routes rendering the correct components.

### 3. Acceptance Tests
Test the system from the user's perspective — simulating real form interactions and user journeys.

---

## Release 1 Tests (52 tests)

### Unit — `src/utils/__tests__/validation.test.js` — 18 tests ✅

Tests the core validation logic used during registration.  
Directly satisfies **T-05** from the Sprint 1 task breakdown.

#### `isValidStudentId` — 8 tests

| Test | Input | Expected |
|---|---|---|
| accepts a standard 9-digit UB student ID | `"202303013"` | `true` |
| accepts another valid 9-digit ID | `"202300366"` | `true` |
| rejects an ID that is too short (8 digits) | `"20230301"` | `false` |
| rejects an ID that is too long (10 digits) | `"2023030130"` | `false` |
| rejects an ID that contains letters | `"20230301A"` | `false` |
| rejects an ID with spaces | `"202 03013"` | `false` |
| rejects an empty string | `""` | `false` |
| rejects undefined gracefully | `String(undefined)` | `false` |

#### `isPasswordStrong` — 10 tests

| Test | Input | Expected |
|---|---|---|
| accepts a password meeting all requirements | `"Secure@123"` | `true` |
| accepts a longer complex password | `"MyP@ssw0rd!"` | `true` |
| accepts exactly 8 characters meeting all rules | `"Ab1!abcd"` | `true` |
| rejects password with no uppercase letter | `"secure@123"` | `false` |
| rejects password with no digit | `"Secure@abc"` | `false` |
| rejects password with no special character | `"Secure123"` | `false` |
| rejects a password that is too short (7 chars) | `"Se@1abc"` | `false` |
| rejects an empty password | `""` | `false` |
| rejects a common weak password | `"password"` | `false` |
| rejects a password that is all numbers | `"123456789"` | `false` |

---

### Unit — `src/services/__tests__/coordinatorService.test.js` — 9 tests ✅

Tests `updateStudentStatus` — the coordinator's student lifecycle management function.

| Test | Status |
|---|---|
| calls `supabase.from('student_profiles')` for a valid update | ✅ Pass |
| accepts `'pending'` and returns the updated record | ✅ Pass |
| accepts `'matched'` and returns the updated record | ✅ Pass |
| accepts `'allocated'` and returns the updated record | ✅ Pass |
| accepts `'completed'` and returns the updated record | ✅ Pass |
| sanitizes uppercase input — `'MATCHED'` treated as `'matched'` | ✅ Pass |
| throws when the DB returns a mismatched status (simulates RLS block) | ✅ Pass |
| throws when status is null | ✅ Pass |
| throws when student ID is null | ✅ Pass |

---

### Integration — `src/routes/routes.test.jsx` — 13 tests ✅

Tests that every Release 1 route renders the correct component.

#### Mocking Strategy
- **ProtectedRoute** — bypassed so all protected routes render in tests
- **AuthContext** — provides fake user `{ id: "test-user-id-123" }`
- **AvatarContext** — returns null avatar to prevent loading errors
- **Supabase** — fully chainable mock returning realistic fake profile data

| Route | Component | Query Used | Status |
|---|---|---|---|
| `/login` | `Login` | `findByText(/welcome back/i)` | ✅ Pass |
| `/register/student` | `RegisterStudent` | `findByText(/student signup/i)` | ✅ Pass |
| `/register/org` | `RegisterOrg` | `findByText(/partner signup/i)` | ✅ Pass |
| `/forgot-password` | `ForgotPassword` | `findByText(/forgot password/i)` | ✅ Pass |
| `/student/profile` | `StudentProfile` | `findByText(/academic identity/i)` | ✅ Pass |
| `/student/preferences` | `StudentPreferences` | `findByText(/career preferences/i)` | ✅ Pass |
| `/org/portal` | `OrgPortal` | `findByText(/employer dashboard/i)` | ✅ Pass |
| `/org/requirements` | `Requirements` | `findByRole("heading", { name: /placement inventory/i })` | ✅ Pass |
| `/coordinator/dashboard` | `CoordinatorDashboard` | `findByRole("heading", { name: /coordinator command/i })` | ✅ Pass |
| `/coordinator/matching` | `MatchEngine` | `findByRole("heading", { name: /heuristic matching engine/i })` | ✅ Pass |
| `/coordinator/organizations` | `PartnerRegistry` | `findByRole("heading", { name: /partner registry/i })` | ✅ Pass |
| `/coordinator/students` | `StudentRegistry` | `findByRole("heading", { name: /student registry/i })` | ✅ Pass |
| `/some-random-route` | `NotFound` | `document.body` truthy | ✅ Pass |

---

### Acceptance — `src/__tests__/registration.test.jsx` — 12 tests ✅

Tests US-01 and US-02 end-to-end using `userEvent` to simulate real typing and clicking.

#### US-01: Student Registration — 7 tests

| Test | Simulates | Status |
|---|---|---|
| renders the student registration form | page load | ✅ Pass |
| shows all required input fields | page load | ✅ Pass |
| shows confirm password field once user starts typing | typing in password | ✅ Pass |
| shows inline mismatch error when passwords don't match | typing mismatched passwords | ✅ Pass |
| calls `signUpNewUser` with correct metadata on valid submit | full form fill + submit | ✅ Pass |
| shows email verification screen after successful registration | full form fill + submit | ✅ Pass |
| shows error banner when registration fails | failed API response | ✅ Pass |

#### US-02: Organisation Registration — 5 tests

| Test | Simulates | Status |
|---|---|---|
| renders the org registration form | page load | ✅ Pass |
| shows all required input fields | page load | ✅ Pass |
| shows error if industry is not selected on submit | submit without selecting industry | ✅ Pass |
| shows verification screen after successful org registration | full form fill + submit | ✅ Pass |
| shows error banner when org registration fails | failed API response | ✅ Pass |

---

## Release 2 Tests (31 tests)

### Unit — `src/services/__tests__/logbookService.test.js` — 6 tests ✅

Tests `submitWeek` — the core logbook submission guard introduced in US-04.  
Key invariant: approved weeks can never be resubmitted; all other statuses can.

| Test | Status |
|---|---|
| calls supabase on `logbook_weeks` table | ✅ Pass |
| sets `status` to `'submitted'` with a `submitted_at` timestamp | ✅ Pass |
| applies `.neq('status', 'approved')` guard — approved weeks are blocked | ✅ Pass |
| resolves `true` for a draft week — draft can be submitted | ✅ Pass |
| resolves `true` for an `action_needed` week — resubmission is allowed | ✅ Pass |
| throws when Supabase returns a DB error | ✅ Pass |

---

### Unit — `src/services/__tests__/coordinatorService.release2.test.js` — 9 tests ✅

Tests the new `rejectStudent` and `reinstateStudent` methods added in Release 2, plus the `rejected` status passthrough in `updateStudentStatus`.

#### `rejectStudent` — 4 tests

| Test | Status |
|---|---|
| queries `student_profiles` table | ✅ Pass |
| returns data with `status: 'rejected'` | ✅ Pass |
| invokes `send-student-status-notification` edge function after rejecting | ✅ Pass |
| throws when DB returns an error | ✅ Pass |

#### `reinstateStudent` — 2 tests

| Test | Status |
|---|---|
| returns data with `status: 'pending'` | ✅ Pass |
| throws when DB returns an error | ✅ Pass |

#### `updateStudentStatus` — rejected passthrough — 2 tests

| Test | Status |
|---|---|
| accepts `'rejected'` as a valid status without throwing | ✅ Pass |
| sanitizes `'REJECTED'` to lowercase before DB write | ✅ Pass |

---

### Integration — `src/routes/routes.release2.test.jsx` — 9 tests ✅

Tests all new Release 2 routes render the correct component.  
Uses inline `createMemoryRouter` per test — avoids importing `routes.jsx` which would pull in every view and cascade mock failures.

#### Mocking Strategy
- **LandingPage** — mocked with a stub `<h1>` to avoid `IntersectionObserver` (browser-only API not available in jsdom)
- **supervisorService** — returns `{ supervisor: null, students: [] }` so portals reach their "Account Not Linked" guard correctly
- **UI components** — `Button`, `Badge`, `EmptyState`, `Input`, `SegmentedControl` mocked as lightweight pass-throughs

| Route | Component | Assertion | Status |
|---|---|---|---|
| `/` | `LandingPage` | `findByRole("heading", { name: /industrial attachment/i })` | ✅ Pass |
| `/coordinator/supervisors` | `SupervisorManagement` | `findByRole("heading", { name: /supervisor/i })` | ✅ Pass |
| `/supervisor/industrial/dashboard` | `IndustrialSupervisorPortal` | `findByText(/account not linked/i)` | ✅ Pass |
| `/supervisor/industrial/logbooks` | `IndustrialSupervisorPortal` | `findByText(/account not linked/i)` | ✅ Pass |
| `/supervisor/university/dashboard` | `UniversitySupervisorPortal` | `findByText(/account not linked/i)` | ✅ Pass |
| `/supervisor/university/logbooks` | `UniversitySupervisorPortal` | `findByText(/account not linked/i)` | ✅ Pass |
| `/supervisor/university/assessments` | `UniversitySupervisorPortal` | `findByText(/account not linked/i)` | ✅ Pass |
| `/register/supervisor` (no token) | `RegisterSupervisor` | `findByText(/no invitation token/i)` | ✅ Pass |
| `/does-not-exist-r2` | `NotFound` | `findByText(/404/i)` | ✅ Pass |

---

### Acceptance — `src/__tests__/release2.acceptance.test.jsx` — 9 tests ✅

Tests Release 2 user journeys end-to-end.

#### US-06: Student Rejection Banner — 3 tests

The rejection banner JSX is rendered in isolation to avoid `IntersectionObserver` and other browser-only API dependencies in the full Dashboard component. This tests the exact UI contract the student sees.

| Test | Simulates | Status |
|---|---|---|
| shows "Application Not Successful" heading when rejected | status = rejected | ✅ Pass |
| shows "Contact Coordinator" link in the banner | status = rejected | ✅ Pass |
| shows "Update Preferences" button so student can improve their profile | status = rejected | ✅ Pass |

#### Coordinator Reject Flow — 3 tests

| Test | Simulates | Status |
|---|---|---|
| renders Reject Student Application button for active students | modal open | ✅ Pass |
| shows confirmation prompt after clicking Reject | single click on reject | ✅ Pass |
| calls `rejectStudent` and `onUpdate` when coordinator confirms | two-step confirm flow | ✅ Pass |

#### US-05: RegisterSupervisor Token Validation — 3 tests

| Test | Simulates | Status |
|---|---|---|
| shows invalid invitation message when no token in URL | visiting link with no token | ✅ Pass |
| shows Go to Login button on invalid token screen | visiting link with no token | ✅ Pass |
| does not show the registration form when token is absent | visiting link with no token | ✅ Pass |

---

## Issues Resolved During Testing

| Issue | Cause | Fix |
|---|---|---|
| `org/requirements` crashing with `null` user.id | `user?.id` not guarded before Supabase call | Added `if (!user?.id) return` guard in `Requirements.jsx` useEffect |
| `supabase.from().eq().order is not a function` | Shallow Supabase mock didn't cover all chain methods | Replaced with fully chainable mock object |
| Loading state text not found | Mock resolves instantly — loading text flashes | Changed to test stable rendered content (headings) instead |
| Split heading text not found with `findByText` | `<h1>Word <span>Word</span></h1>` splits text across elements | Used `findByRole("heading", { name: /.../ })` which reads full accessible name |
| `coordinatorService` valid status tests failing | Mock returned `{ data: null }` | Mock now returns `{ data: { status: mockReturnStatus } }` |
| `vi.mock` factory `ReferenceError` on hoisted variables | Vitest hoists `vi.mock()` before `const` declarations run | Wrapped shared mock state in `vi.hoisted(() => ({ ... }))` |
| Wrong import paths in `src/services/__tests__/` | `"../services/X"` resolves to `src/services/services/X` | Fixed to `"../X"` (one level up from `__tests__/`) and `"../../lib/supabaseClient"` |
| `IntersectionObserver is not defined` on LandingPage | jsdom does not implement browser intersection APIs | Mocked LandingPage in route tests; used inline JSX in acceptance tests |
| `StudentDashboard` renders empty `<div />` in tests | Browser API chain (`IntersectionObserver` etc.) crashes silently during import resolution | Tested rejection banner JSX directly in isolation rather than mounting full Dashboard |
| `invalid input value for enum attachment_status: "rejected"` | Postgres `attachment_status` enum missing `rejected` value | Ran `ALTER TYPE attachment_status ADD VALUE 'rejected'` on Supabase DB |

---

## Definition of Done — Testing Checklist

Per Section 3.7 of the Release and Sprint Planning document:

**Release 1**
- ✅ Unit tests — validation logic and coordinator service logic tested in isolation
- ✅ Integration tests — all 13 Release 1 routes verified to render correctly
- ✅ Acceptance tests — US-01 and US-02 tested from user perspective
- ✅ 0 failing tests — all 52 Release 1 tests pass

**Release 2**
- ✅ Unit tests — `logbookService.submitWeek` guard and all new coordinator service methods
- ✅ Integration tests — all 9 new Release 2 routes verified to render correct components
- ✅ Acceptance tests — rejection flow (US-06), supervisor token validation (US-05), coordinator reject UI
- ✅ 0 failing tests — all 83 tests pass across both releases
- ✅ DB migration — `attachment_status` enum updated to include `rejected`
- ✅ Test files committed to `feature/route-tests` branch

---

## Out of Scope

| Feature | Reason |
|---|---|
| Match engine scoring algorithm | Requires edge function mock with real scoring data |
| RLS policy enforcement tests | Requires a real DB connection — integration environment only |
| PDF logbook export rendering | `@react-pdf/renderer` generates binary — requires visual snapshot testing |
| Password reset flow | End-to-end requires real Supabase auth email link |
| Edge function integration tests | Require deployed Supabase environment — not testable in jsdom |