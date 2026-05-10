# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Industrial Attachment Management System (IAMS)** — a full-stack platform for managing student industrial attachments at the University of Botswana. Frontend deployed on Vercel; backend on Supabase Cloud.

## Commands

```bash
npm run dev       # Dev server at http://localhost:5173
npm run build     # Production build → dist/
npm run lint      # ESLint
npm run test      # Run all 83 tests via Vitest
npm run preview   # Preview production build
```

Run a single test file:
```bash
npx vitest run src/services/__tests__/coordinatorService.test.js
```

Deploy an edge function:
```bash
supabase functions deploy <function-name>
```

## Architecture

**Stack:** React 19 + Vite 7 + React Router 7 + Tailwind CSS 4 (frontend) / Supabase (PostgreSQL, Auth, Storage, Edge Functions via Deno) / Resend (transactional email) / `@react-pdf/renderer` (PDF export)

### Frontend (`src/`)

- `context/` — `AuthContext` (resolves one of 5 roles: `student`, `org`, `coordinator`, `industrial_supervisor`, `university_supervisor`) and `AvatarContext`
- `services/` — all database access goes through service files (`coordinatorService.js`, `logbookService.js`, `studentService.js`, `orgService.js`, `supervisorService.js`). Service methods throw on failure; components catch and display errors.
- `features/logbook/` — self-contained logbook feature (manager + modal + PDF + week cards)
- `views/` — portal sections: `auth/`, `student/`, `organization/`, `admin/`, `supervisor/`
- `components/ui/` — shared primitives (Button, Input, Badge, StatusBadge, TabBar, ConfirmModal, EmptyState, DigitalStamp, etc.) using Lucide React icons
- `routes/routes.jsx` — full routing tree with nested layouts and `<ProtectedRoute allowedRoles={...}>`
- `lib/supabaseClient.js` — exports singleton `supabase` instance
- `index.css` - main styles used for thematic and uniformity in the project


### Backend (`supabase/`)

**Edge Functions** (Deno):
- `match-engine/` — scores students vs vacancies: Skills (50pt) + GPA (30pt) + Location (20pt), slot-aware deduplication, blocks if required docs missing
- `send-supervisor-invite/` — tokenized email invitations
- `complete-supervisor-registration/` — token validation & account linking
- `weekly-logbook-reminder/` — Monday 05:00 UTC cron
- `send-visit-notification/` — notifies students when supervisor schedules a visit
- `send-student-status-notification/` — rejection & status change emails

**Migrations** (`supabase/migrations/`):
- `001_iams_schema.sql` — initial schema (profiles, preferences, placements, logbooks)
- `002_iams_schema.sql` — release 2 additions (rejection status, visit assessments, supervisor reports)

### Key Patterns

**Auth & RLS:** Supabase JWT auth. RLS policies enforce per-role data isolation. `is_coordinator()` is a `SECURITY DEFINER` function to avoid JWT caching issues. Triggers `handle_new_user` and `handle_new_user_role` fire on signup.

**Logbook workflow:** weekly Mon–Fri entries with auto-save → student submits → supervisor approves or flags `action_needed` → PDF export includes UB letterhead + digital signature block. Approved weeks cannot be resubmitted.

**Email:** all email sent via Resend from edge functions. Secrets (`RESEND_API_KEY`, `APP_URL`, `FROM_EMAIL`) are set in Supabase Dashboard → Edge Functions → Secrets. `TEST_EMAIL_OVERRIDE` routes all mail to one address in dev.

### Environment Variables

Frontend (`.env`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_SERVICE_ROLE_KEY=
```

Edge function secrets are set in Supabase Dashboard, not `.env`.

### Testing

83 tests across 8 files (Vitest + React Testing Library, jsdom):
- Unit: `src/utils/__tests__/validation.test.js`, `src/services/__tests__/coordinatorService*.test.js`, `src/services/__tests__/logbookService.test.js`
- Integration: `src/routes/routes.test.jsx`, `src/routes/routes.release2.test.jsx`
- Acceptance: `src/__tests__/registration.test.jsx`, `src/__tests__/release2.acceptance.test.jsx`

Setup in `vite.config.js`: `environment: 'jsdom'`, `globals: true`, `setupFiles: ./src/setupTests.js`.

### Deployment

- **Frontend:** push to `main` → auto-deploys on Vercel (`vercel.json` rewrites all routes to `index.html` for SPA)
- **Edge functions:** `supabase functions deploy <function-name>`
- **DB migrations:** Supabase migrations system (apply via CLI or MCP)

- when making new page components, always add a link of that page in the header
