# IAMS Testing Documentation

**Project:** Industrial Attachment Management System (IAMS)  
**Release:** 1.0 (MVP)  
**Sprint Coverage:** Sprint 1 & Sprint 2  
**Test Framework:** Vitest + React Testing Library  
**Total Tests:** 52 passing, 0 failing

---

## Test Environment

| Tool | Version | Purpose |
|---|---|---|
| Vitest | 4.1.x | Test runner and assertion library |
| React Testing Library | latest | Component rendering and querying |
| @testing-library/user-event | latest | Simulating real user interactions |
| jsdom | built-in | Browser environment simulation |

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

---

## Test Structure

```
src/
├── utils/__tests__/
│   └── validation.test.js           # Unit — 18 tests
├── services/__tests__/
│   └── coordinatorService.test.js   # Unit — 9 tests
├── routes/
│   └── routes.test.jsx              # Integration — 13 tests
└── __tests__/
    └── registration.test.jsx        # Acceptance — 12 tests
```

---

## Test Types

### 1. Unit Tests
Test individual functions in isolation — no DOM, no network, no database.

### 2. Integration Tests
Test multiple parts working together — routes rendering the correct components.

### 3. Acceptance Tests
Test the system from the user's perspective — simulating real form interactions.

---

## Unit Tests

### `src/utils/__tests__/validation.test.js` — 18 tests ✅

Tests the core validation logic used during registration (`AuthContext.jsx`).  
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

### `src/services/__tests__/coordinatorService.test.js` — 9 tests ✅

Tests the `updateStudentStatus` function used by the Coordinator Dashboard to manage student attachment status lifecycle.

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

## Integration Tests

### `src/routes/routes.test.jsx` — 13 tests ✅

Tests that every application route renders the correct page component.  
Uses mocked `ProtectedRoute`, `AuthContext`, `AvatarContext`, and Supabase to render all routes without a real session or database.

#### Mocking Strategy
- **ProtectedRoute** — bypassed so all protected routes render in tests
- **AuthContext** — provides fake user `{ id: "test-user-id-123" }` so `user?.id` is never null
- **AvatarContext** — returns null avatar to prevent loading errors
- **Supabase** — chainable mock returns realistic fake profile data so components don't crash accessing `profile.location`, `profile.avatar_url`, etc.

#### Results

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

**Note on `findByRole("heading")` vs `findByText`:**  
Several IAMS page headings follow the pattern `<h1>Word <span>Word</span></h1>`. `findByText` cannot find text split across parent and child elements. `findByRole("heading", { name: /.../ })` reads the full accessible name including child span text and is used for all split headings.

---

## Acceptance Tests

### `src/__tests__/registration.test.jsx` — 12 tests ✅

Tests the registration user journeys end-to-end from the user's perspective using `userEvent` to simulate real typing and clicking.  
Directly satisfies **US-01** and **US-02** from the Sprint Backlog.

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

## Issues Resolved During Testing

| Issue | Cause | Fix |
|---|---|---|
| `org/requirements` crashing with `null` user.id | `user?.id` not guarded before Supabase call | Added `if (!user?.id) return` guard in `Requirements.jsx` useEffect |
| `supabase.from().eq().order is not a function` | Shallow Supabase mock didn't cover all chain methods | Replaced with fully chainable mock object |
| Loading state text not found | Mock resolves instantly — loading text flashes before test catches it | Changed to test stable rendered content (headings) instead |
| Split heading text not found with `findByText` | `<h1>Word <span>Word</span></h1>` splits text across elements | Used `findByRole("heading", { name: /.../ })` which reads full accessible name |
| `coordinatorService` valid status tests failing | Mock returned `{ data: null }` — `data.status !== sanitizedStatus` always threw | Mock now returns `{ data: { status: mockReturnStatus } }` matching the passed status |

---

## Definition of Done — Testing Checklist

Per Section 3.7 of the Release and Sprint Planning document:

- ✅ **Unit tests** — validation logic and coordinator service logic tested in isolation
- ✅ **Integration tests** — all 13 application routes verified to render correctly
- ✅ **Acceptance tests** — US-01 (student registration) and US-02 (org registration) tested from user perspective
- ✅ **0 failing tests** — all 52 tests pass
- ✅ **Peer reviewed** — test files committed to `develop` branch alongside feature code

---

## Out of Scope for Release 1 (Planned for Release 2 / Sprint 3 & 4)

| Feature | Reason Deferred |
|---|---|
| Match engine scoring algorithm | Requires edge function mock — planned Sprint 2 retrospective |
| RLS policy enforcement tests | Requires real DB connection — integration environment test |
| Logbook submission | Release 2 feature (US-04) |
| Supervisor report submission | Release 2 feature (US-05) |
| Due date reminder notifications | Release 2 feature (US-06) |
| Password reset flow | Lower priority for Release 1 |