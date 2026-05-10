
# Industrial Attachment Management System

Digitizing the industrial attachment lifecycle for the University of Botswana.

<br />

<div align="center">

[Live Demo](https://iams-nine.vercel.app) · [Test Docs](docs/TESTING.md) · [Report a Bug](https://github.com/Raymacmillan/Inustrial-Attachement-Management-System-IAMS-/issues)

<br />

</div>

---

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Edge Functions](#edge-functions)
- [Testing](#testing)
- [Deployment](#deployment)
- [Release History](#release-history)
- [Future Improvements](#future-improvements)
- [Acknowledgements](#acknowledgements)
- [Contributing](#contributing)

---

## Overview

The Department of Computer Science at the University of Botswana manages hundreds of student industrial attachments annually through a fragmented, paper-based workflow. Coordinators manually match students to organisations, supervisors chase handwritten logbooks, and students receive no real-time feedback on their placement status.

**IAMS** replaces this entirely. It is a full-stack web platform that handles the complete industrial attachment lifecycle — from student onboarding and organisation registration, through intelligent algorithmic matching and placement management, to weekly digital logbooks, supervisor assessments, and legally-formatted PDF report generation.

### What Makes IAMS Different

| Traditional System | IAMS |
|---|---|
| Paper logbooks, prone to loss | Digital weekly logbook with auto-save and three structured templates |
| Manual matching by coordinator | Heuristic scoring engine with slot-aware deduplication |
| No document enforcement | Allocation blocked if required documents are missing |
| Supervisor visits uncoordinated | Two-phase visit scheduling with student email notification |
| No audit trail | Every approval digitally stamped with supervisor name, title, and timestamp |
| Physical PDF reports | Legally-formatted document with UB letterhead and signature blocks |

---

## Screenshots

### Landing Page
![Landing Page](docs/screenshots/landing.png)

### Coordinator — Heuristic Matching Engine
![Matching Engine](docs/screenshots/matching-engine.png)

### Student — Weekly Logbook
![Student Logbook](docs/screenshots/logbook.png)

### Industrial Supervisor — Week Review
![Supervisor Review](docs/screenshots/supervisor-review.png)

### University Supervisor — Visit Assessment
![Visit Assessment](docs/screenshots/visit-assessment.png)

### Official Logbook PDF Export
![Logbook PDF](docs/screenshots/logbook-pdf.png)

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| [React](https://react.dev) | 19.1.x | UI component framework with concurrent features |
| [Vite](https://vitejs.dev) | 7.1.x | Build tool and HMR dev server (SWC plugin) |
| [React Router](https://reactrouter.com) | 7.13.x | Client-side routing with nested layouts and `Outlet` |
| [Tailwind CSS](https://tailwindcss.com) | 4.2.x | Utility-first styling with custom design tokens |
| [@react-pdf/renderer](https://react-pdf.org) | 4.5.x | Legal-grade PDF generation entirely in the browser |
| [Lucide React](https://lucide.dev) | 0.577.x | Open-source SVG icon library |

### Backend

| Technology | Purpose |
|---|---|
| [Supabase](https://supabase.com) (PostgreSQL) | Primary database with Row Level Security |
| [Supabase Auth](https://supabase.com/auth) | JWT-based authentication and session management |
| [Supabase Edge Functions](https://supabase.com/edge-functions) | Deno serverless functions for email delivery and scoring |
| [Supabase Storage](https://supabase.com/storage) | CV, transcript, and avatar file storage |
| [Resend](https://resend.com) | Transactional email delivery |

### Testing & Tooling

| Tool | Version | Purpose |
|---|---|---|
| [Vitest](https://vitest.dev) | 4.1.x | Test runner compatible with Vite's plugin system |
| [React Testing Library](https://testing-library.com/react) | 16.3.x | Component rendering and accessible DOM assertions |
| [@testing-library/user-event](https://testing-library.com) | 14.6.x | Realistic user interaction simulation |
| [jsdom](https://github.com/jsdom/jsdom) | 29.x | Browser environment simulation for Vitest |
| [ESLint](https://eslint.org) | 9.36.x | Static code analysis with React hooks and refresh plugins |

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                          Browser (React 19)                         │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │ Student  │  │   Org    │  │ Coordinator │  │  Supervisors  │  │
│  │  Portal  │  │  Portal  │  │  Dashboard  │  │ (Ind. + Uni.) │  │
│  └────┬─────┘  └────┬─────┘  └──────┬──────┘  └───────┬───────┘  │
│       └─────────────┴────────────────┴──────────────────┘          │
│                    React Router 7 + AuthContext                     │
│              Navbar · Sidebar · ProtectedRoute guard                │
└────────────────────────────┬───────────────────────────────────────┘
                              │  @supabase/supabase-js SDK
┌────────────────────────────▼───────────────────────────────────────┐
│                         Supabase Platform                           │
│  ┌─────────────────┐  ┌────────────┐  ┌─────────────────────────┐ │
│  │   PostgreSQL     │  │  Supabase  │  │     Edge Functions       │ │
│  │   + RLS Policies │  │    Auth    │  │    (Deno Runtime)        │ │
│  └────────┬─────────┘  └────────────┘  │                         │ │
│           │                            │  match-engine (v8)       │ │
│  ┌────────▼─────────┐  ┌────────────┐  │  send-supervisor-invite  │ │
│  │   Supabase       │  │  pg_cron   │  │  complete-sup-reg        │ │
│  │   Storage        │  │ (Mon 05:00 │  │  weekly-logbook-reminder │ │
│  │  CVs / Transcripts│  │   UTC)     │  │  send-visit-notification │ │
│  │  Avatars         │  └────────────┘  │  send-status-notif.      │ │
│  └──────────────────┘                  └─────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Row Level Security everywhere** — no admin access from the frontend. Every query is scoped to the authenticated user's role via RLS policies and a `SECURITY DEFINER` helper function to avoid JWT caching issues on coordinator checks.
- **Five distinct user roles** — `student`, `org`, `coordinator`, `industrial_supervisor`, `university_supervisor` — each with a dedicated portal, nested route tree, and RLS-enforced data scope.
- **Service layer pattern** — all database access is isolated to `src/services/`. Components never call `supabase` directly; they call service methods that throw on failure, and components catch and display errors.
- **Edge functions for side effects** — email delivery, match scoring, and cron reminders all run in Deno at the edge, keeping the React client thin and avoiding API key exposure.
- **Invitation-based supervisor registration** — supervisors cannot self-register. A coordinator issues a tokenised email invitation which auto-links the new account to the correct organisation on first login.

---

## Features

### Landing Page
- Animated scroll-reveal sections using `IntersectionObserver`
- Problem statement, four-step attachment flow, all five role breakdowns, feature grid
- Direct CTAs to student and organisation registration

### Student Portal

| Feature | Details |
|---|---|
| Registration | UB email (`@ub.ac.bw`) required, 9-digit student ID validated, full name (two words minimum) enforced; real-time `PasswordStrengthMeter` feedback |
| Document upload | CV and transcript uploaded to Supabase Storage — both are required for matching eligibility |
| Career preferences | Technical skills, preferred locations, preferred roles, minimum stipend — multi-select with `SearchableSelect` |
| Dashboard | Live placement card with org, position, dates, days remaining, both supervisors with contact links |
| Rejection flow | Red banner with coordinator email link and Update Preferences CTA |
| Visit notifications | Scheduled supervisor visits with date-aware status (upcoming / today / passed / assessed) |
| Weekly logbook | Mon–Fri tabbed daily entries with three entry templates (Standard, Technical, Soft Skills), auto-save with `SaveIndicator`, progress bar, week grid |
| Logbook templates | **Standard** — general daily activities; **Technical** — tools, technologies, and problem-solving focus; **Soft Skills** — communication, teamwork, and professional growth focus |
| Supervisor feedback | Colour-coded comments — green approval, red action-needed flag visible on resubmission |
| PDF export | Full legal document with UB letterhead, tables, digital stamp, certification page |
| Assessment reports | View industrial supervisor performance scores and university supervisor visit assessment scores with colour-coded `ScoreBar` visualisations |

### Organisation Portal

| Feature | Details |
|---|---|
| Registration | Full org profile — industry, location, website, contact |
| Verification | Auto-verified when all required profile fields are complete |
| Vacancies | Required skills, GPA minimum, available slots per vacancy |
| Document requirements | Toggle CV/transcript requirement per organisation — enforced at allocation |
| Supervisor roster | Multiple supervisors per org with role titles; invitation-based account registration |
| Applications | View student applications and placement status per vacancy |

### Coordinator Dashboard

| Feature | Details |
|---|---|
| Overview stats | Summary `StatCard` widgets for students, placements, and organisations |
| Student registry | Full list with status filter, search, and audit modal per student |
| Student audit modal | View docs, assign supervisors, set placement dates, update status, reject with two-step confirm |
| Rejection flow | Sets `status = rejected`, fires email notification, student sees rejection banner immediately |
| Reinstatement | Return a rejected student to pending in one click |
| Partner registry | Browse all registered organisations with `PartnerDetailPanel` slide-out |
| Supervisor management | Invite supervisors by email via `InviteSupervisorModal` — generates tokenised registration link |
| Matching engine | Scored suggestions per student, slot-aware, document-enforced, reject directly from engine |

### Matching Engine (Edge Function v8)

```
Total Score (max 100 pts) = Skills + GPA + Location
```

| Criterion | Max | Formula |
|---|---|---|
| Skills match | 50 pts | `matched_skills / required_skills × 50` |
| GPA | 30 pts | `student_gpa / 5.0 × 30` — only applied if student GPA ≥ org minimum |
| Location | 20 pts | Flat 20 pts if student preferred location matches org location |

Slot-aware deduplication: each vacancy is offered to at most `available_slots` students. Highest scorers claim slots first; displaced students are redirected to the next-best match automatically.

**Allocation guard:** if the organisation requires a CV or transcript and the student has not uploaded it, the match engine returns a `missing_docs` warning and the coordinator cannot allocate that student until the documents are present.

### Industrial Supervisor Portal

| Feature | Details |
|---|---|
| Student list | All placed students linked to this supervisor's organisation |
| Week review | Full daily log display per student, student reflection, previous comments |
| Approve | Digital stamp written to `logbook_signatures` + `logbook_weeks` with optional comments |
| Flag | Sets `status: action_needed` with written feedback — student sees red banner and may resubmit |
| Performance report | End-of-attachment scoring — technical ability, initiative, teamwork, reliability, overall rating, strengths and areas for improvement, employment recommendation |

### University Supervisor Portal

| Feature | Details |
|---|---|
| Logbook monitoring | Read-only logbook view across all assigned students |
| Visit scheduling | Step 1: schedule with date + notes → student email sent; Step 2: fill scores only after visit date arrives |
| Date enforcement | Visit dates must fall within the student's placement period and cannot be in the past |
| Confirm modal | Explicit `ConfirmModal` before scheduling — prevents accidental email sends |
| Assessment lock | Score form is disabled until the visit date arrives; `SegmentedControl` for visit number selection |
| Score inputs | Five-criterion `ScoreInput` components per visit (preparation, engagement, progress, professionalism, overall) |

### Assessment Reports (Student View)

Students can view a dedicated **Assessment Reports** page (`/student/assessments`) which consolidates:
- Industrial supervisor performance report with five scored dimensions displayed as colour-coded `ScoreBar` visualisations (green ≥ 8, amber ≥ 5, red < 5)
- University supervisor visit assessments per visit with individual dimension breakdowns
- Employment recommendation flag from the industrial supervisor
- Strengths and areas-for-improvement narrative blocks

### Automated Emails

| Trigger | Edge Function | Recipient |
|---|---|---|
| Supervisor invited | `send-supervisor-invite` | Supervisor |
| Visit scheduled | `send-visit-notification` | Student |
| Student rejected | `send-student-status-notification` | Student |
| Monday 05:00 UTC | `weekly-logbook-reminder` | Students with unsubmitted logbook weeks |

### Logbook PDF Export

Three-section legal document generated client-side via `@react-pdf/renderer`:

1. **Cover** — UB letterhead, reference number `UB/CS/IA/YEAR/STUDENTID`, student particulars, placement details, weekly summary table
2. **Week pages** — daily log table (Day / Date / Activities / Hours), student reflection, supervisor feedback, digital stamp with seal (name, title, timestamp)
3. **Certification** — student declaration, industrial supervisor certification with company stamp box, university supervisor endorsement, formal signature lines

---

## Project Structure

```
IAMS/
├── src/
│   ├── App.jsx                        # Root component — wraps AuthContext + AvatarContext
│   ├── main.jsx                       # Vite entry point
│   ├── index.css                      # Global styles and Tailwind design tokens
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── RootLayout.jsx         # Top-level layout with Navbar
│   │   │   ├── Navbar.jsx             # Top navigation bar with avatar + notification bell
│   │   │   ├── Sidebar.jsx            # Role-specific sidebar navigation
│   │   │   ├── DashboardLayout.jsx    # Two-column dashboard shell (Sidebar + Outlet)
│   │   │   ├── StudentLayout.jsx      # Student portal shell with tab navigation
│   │   │   └── ProtectedRoute.jsx     # Role-gated route wrapper (allowedRoles prop)
│   │   │
│   │   └── ui/
│   │       ├── Badge.jsx              # Colour-coded inline label
│   │       ├── Button.jsx             # Primary / secondary / danger variants
│   │       ├── ConfirmModal.jsx       # Two-step destructive action confirmation overlay
│   │       ├── DigitalStamp.jsx       # Circular supervisor approval stamp with seal
│   │       ├── EmptyState.jsx         # Zero-data placeholder with icon + CTA
│   │       ├── ErrorBoundary.jsx      # React error boundary for graceful crash handling
│   │       ├── Input.jsx              # Labelled text input with error state
│   │       ├── NotificationBell.jsx   # Bell icon with unread count badge
│   │       ├── PartnerCard.jsx        # Organisation summary card for Partner Registry
│   │       ├── PasswordStrengthMeter.jsx  # Real-time password strength indicator
│   │       ├── Pill.jsx               # Removable tag chip for multi-select fields
│   │       ├── RouteErrorPage.jsx     # React Router error boundary page
│   │       ├── SaveIndicator.jsx      # Auto-save status indicator (saving / saved / error)
│   │       ├── ScoreInput.jsx         # 1–10 numeric score slider for assessments
│   │       ├── SearchableSelect.jsx   # Filterable dropdown with keyboard navigation
│   │       ├── SegmentedControl.jsx   # Button-group toggle (visit number, filters)
│   │       ├── StatCard.jsx           # KPI summary card for coordinator overview
│   │       ├── StatusBadge.jsx        # Placement status badge (pending / matched / …)
│   │       ├── TabBar.jsx             # Horizontal tab navigation bar
│   │       └── Textarea.jsx           # Labelled multi-line input with resize control
│   │
│   ├── constants/
│   │   ├── logbooktemplates.js        # Three structured logbook entry templates
│   │   │                              #   standard  — general daily activities
│   │   │                              #   technical — tools, tech, problem-solving
│   │   │                              #   soft_skills — communication, teamwork
│   │   ├── matchingOptions.js         # Skill tags, location options, role categories
│   │   └── navigation.jsx             # Per-role nav link definitions for Sidebar
│   │
│   ├── context/
│   │   ├── AuthContext.jsx            # Resolves JWT → one of 5 roles; exposes user + profile
│   │   └── AvatarContext.jsx          # Global avatar URL with sign-out isolation
│   │
│   ├── features/
│   │   └── logbook/
│   │       ├── LogbookManager.jsx     # Top-level logbook orchestrator (week selection, state)
│   │       └── components/
│   │           ├── LogbookModal.jsx   # Full-screen week editor modal
│   │           ├── LogbookPDF.jsx     # PDF layout + useLogbookWeeks hook + download link
│   │           ├── WeekCard.jsx       # Week summary card (status, dates, progress bar)
│   │           └── DailyEntryRow.jsx  # Single day row: template picker + text input + hours
│   │
│   ├── lib/
│   │   └── supabaseClient.js          # Singleton supabase-js client (anon key)
│   │
│   ├── routes/
│   │   ├── routes.jsx                 # Full route tree with nested layouts + ProtectedRoute
│   │   ├── routes.test.jsx            # Integration — 13 R1 route tests
│   │   └── routes.release2.test.jsx   # Integration — 9 R2 route tests
│   │
│   ├── services/
│   │   ├── coordinatorService.js      # updateStudentStatus, rejectStudent, reinstateStudent
│   │   ├── logbookService.js          # submitWeek, saveDailyLog, fetchWeeks
│   │   ├── orgService.js              # fetchOrgProfile, updateVacancies, fetchApplications
│   │   ├── studentService.js          # fetchProfile, uploadDocument, fetchAssessments
│   │   └── supervisorService.js       # fetchStudents, approveWeek, flagWeek, submitReport
│   │
│   ├── utils/
│   │   └── __tests__/
│   │       └── validation.test.js     # Unit — 18 tests for isValidStudentId, isPasswordStrong
│   │
│   ├── views/
│   │   ├── LandingPage.jsx            # Public marketing page with IntersectionObserver animations
│   │   │
│   │   ├── auth/
│   │   │   ├── Login.jsx              # Email + password sign-in
│   │   │   ├── Register.jsx           # Generic registration landing
│   │   │   ├── RegisterChoice.jsx     # Student vs Org fork page
│   │   │   ├── RegisterStudent.jsx    # UB email + student ID + password registration
│   │   │   ├── RegisterOrg.jsx        # Organisation registration with industry select
│   │   │   ├── RegisterSupervisor.jsx # Token-validated supervisor account creation
│   │   │   ├── ForgetPassword.jsx     # Password reset email trigger
│   │   │   ├── UpdatePassword.jsx     # New password form (from email link)
│   │   │   ├── Unauthorized.jsx       # 403 — role not permitted for this route
│   │   │   └── NotFound.jsx           # 404 — catch-all unknown routes
│   │   │
│   │   ├── admin/
│   │   │   ├── CoordinatorDashboard.jsx   # Overview with StatCards and quick links
│   │   │   ├── StudentRegistry.jsx        # Paginated student list with status filter
│   │   │   ├── StudentAuditModal.jsx      # Per-student detail, doc links, status update
│   │   │   ├── MatchEngine.jsx            # Scored student–vacancy suggestions UI
│   │   │   ├── PartnerRegistry.jsx        # Organisation list with slide-out detail panel
│   │   │   ├── PartnerDetailPanel.jsx     # Organisation detail slide-out (vacancies, supervisors)
│   │   │   ├── SupervisorManagement.jsx   # Supervisor roster + invite flow
│   │   │   └── InviteSupervisorModal.jsx  # Email invite modal with tokenised link generation
│   │   │
│   │   ├── organization/
│   │   │   ├── Portal.jsx             # Employer dashboard — placement summary
│   │   │   ├── OrgProfile.jsx         # Organisation profile editor
│   │   │   ├── Requirements.jsx       # Vacancy editor — skills, GPA, slots, doc requirements
│   │   │   └── OrgApplications.jsx    # Student applications per vacancy
│   │   │
│   │   ├── student/
│   │   │   ├── Dashboard.jsx          # Placement card, visit timeline, rejection banner
│   │   │   ├── Profile.jsx            # Academic identity — name, ID, GPA, document uploads
│   │   │   ├── Preferences.jsx        # Career preferences — skills, roles, locations, stipend
│   │   │   └── AssessmentReports.jsx  # Score visualisations — supervisor report + visit assessments
│   │   │
│   │   └── supervisor/
│   │       ├── IndustrialSupervisorPortal.jsx   # Week review, approve, flag, performance report
│   │       └── UniversitySupervisorPortal.jsx   # Logbook monitor, visit scheduling, assessments
│   │
│   ├── __tests__/
│   │   ├── registration.test.jsx              # Acceptance — 12 R1 registration journey tests
│   │   └── release2.acceptance.test.jsx       # Acceptance — 9 R2 rejection + supervisor tests
│   │
│   └── setupTests.js                          # Vitest global setup (@testing-library/jest-dom)
│
├── supabase/
│   ├── functions/
│   │   ├── match-engine/                      # Heuristic scoring + slot deduplication (v8)
│   │   ├── send-supervisor-invite/            # Tokenised email invitation (v4)
│   │   ├── complete-supervisor-registration/  # Token validation + account linking (v2)
│   │   ├── weekly-logbook-reminder/           # Monday 05:00 UTC cron email (v1)
│   │   ├── send-visit-notification/           # Visit scheduled → student email (v2)
│   │   └── send-student-status-notification/  # Rejection email (v1)
│   │
│   └── migrations/
│       ├── 001_iams_schema.sql  # Initial schema — profiles, preferences, placements, logbooks
│       ├── 002_iams_schema.sql  # R2 additions — rejection status, visit assessments, supervisor reports
│       └── 003_iams_schema.sql  # R3 addition — template_type column on daily_logs
│
├── docs/
│   ├── TESTING.md               # Full test documentation — strategies, test tables, issues resolved
│   └── screenshots/             # UI screenshots referenced in this README
│       ├── landing.png
│       ├── matching-engine.png
│       ├── logbook.png
│       ├── supervisor-review.png
│       ├── visit-assessment.png
│       └── logbook-pdf.png
│
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   └── apple-touch-icon.png
│
├── .env.example                 # Environment variable template
├── vercel.json                  # SPA rewrite rule for React Router
├── vite.config.js               # Vite config — React SWC plugin + Vitest setup
└── eslint.config.js             # ESLint flat config with react-hooks + react-refresh
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| Supabase account | free tier sufficient |
| Resend account | required for email notifications |

### Installation

```bash
# Clone the repository
git clone git@github.com:Raymacmillan/Inustrial-Attachement-Management-System-IAMS-.git
cd Inustrial-Attachement-Management-System-IAMS-

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and fill in your Supabase project URL and anon key

# Start the development server
npm run dev
```

The app runs at `http://localhost:5173`.

### Creating a Coordinator Account

Coordinators cannot self-register through the public form. The database trigger
`handle_new_user_role` runs automatically on every new user — if no role is set
in the metadata it defaults to `coordinator`, so creating a user directly in the
Supabase Dashboard is all you need.

**Step 1 — Create the auth account**

Go to **Supabase Dashboard → Authentication → Users → Add User → Create New User**, enter:
- Email: `coordinator@ub.ac.bw`
- Password: a strong password of your choice
- Check **Auto Confirm User** so the account is active immediately without an email link

The trigger fires on insert and writes `role = 'coordinator'` to `user_roles` automatically.

**Step 2 — Verify**

Log in at `/login` with the credentials from Step 1. You should land on the
Coordinator Dashboard immediately.

> **If login redirects to `/unauthorized`:** The trigger did not fire correctly.
> Run this in **SQL Editor** to fix it manually:
>
> ```sql
> INSERT INTO user_roles (user_id, role)
> SELECT id, 'coordinator'
> FROM auth.users
> WHERE email = 'coordinator@ub.ac.bw'
> ON CONFLICT (user_id) DO UPDATE SET role = 'coordinator';
> ```
>
> The `ON CONFLICT DO UPDATE` ensures it never duplicates — it either inserts
> or corrects an existing wrong role. Safe to run multiple times.

### Running Tests

```bash
# Full test suite (83 tests)
npm run test

# Watch mode
npm run test -- --watch

# Single file
npx vitest run src/services/__tests__/logbookService.test.js
```

---

## Environment Variables

```bash
cp .env.example .env
```

**`.env.example`**

```env
# ─── Supabase ─────────────────────────────────────────────────────────────────
# Supabase Dashboard → Settings → API

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_public_key_here
```

### Edge Function Secrets

Set in **Supabase Dashboard → Edge Functions → Secrets** — not in `.env`:

| Secret | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | ✅ | API key from resend.com |
| `APP_URL` | ✅ | Deployed frontend URL — e.g. `https://iams-nine.vercel.app` |
| `FROM_EMAIL` | ✅ | Verified sender — e.g. `IAMS <noreply@yourdomain.com>` |
| `TEST_EMAIL_OVERRIDE` | Dev only | Routes all emails to this address during local testing |

> **Local development:** Resend's `onboarding@resend.dev` sender only delivers to the Resend account owner's email. Set `TEST_EMAIL_OVERRIDE` to your own email to receive all notifications during testing. Remove it before deploying to production.

---

## Database

### Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Open **SQL Editor**
3. Run the migrations in order:
   - `supabase/migrations/001_iams_schema.sql`
   - `supabase/migrations/002_iams_schema.sql`
   - `supabase/migrations/003_iams_schema.sql`

### Schema

```
auth.users  (Supabase managed)
    │
    ├── user_roles                        student | org | coordinator
    │                                     industrial_supervisor | university_supervisor
    │
    ├── student_profiles                  full_name, student_id, gpa, cv_url,
    │                                     transcript_url, status (enum), avatar_url
    │
    ├── student_preferences               skills[], preferred_roles[], locations[],
    │                                     min_stipend
    │
    ├── organization_profiles             org_name, industry, location, website,
    │                                     contact_name, contact_email,
    │                                     requires_cv, requires_transcript
    │
    ├── organization_vacancies            role_title, required_skills[], min_gpa,
    │                                     available_slots, is_active
    │
    ├── organization_supervisors          full_name, role_title, org_id, user_id
    │
    ├── university_supervisors            full_name, email, department, user_id
    │
    ├── supervisor_invitations            token (uuid), role, email, org_id,
    │                                     expires_at, used_at
    │
    └── placements                        student_id, org_id, vacancy_id,
        │                                 ind_supervisor_id, uni_supervisor_id,
        │                                 start_date, end_date
        │
        ├── logbook_weeks                 week_number, status, supervisor_comments,
        │   │                             stamped_by_name, stamped_by_title,
        │   │                             approved_at, submitted_at
        │   │
        │   ├── daily_logs               day_of_week, log_date, activities,
        │   │                             hours_worked, reflection,
        │   │                             template_type (standard | technical | soft_skills)
        │   │
        │   └── logbook_signatures       signed_by (user_id), signer_name,
        │                                signer_title, signed_at
        │
        ├── visit_assessments            visit_number, visit_date, status,
        │                                preparation_score, engagement_score,
        │                                progress_score, professionalism_score,
        │                                overall_score, comments
        │
        └── supervisor_reports           technical_score, initiative_score,
                                         teamwork_score, reliability_score,
                                         overall_score, strengths,
                                         areas_for_improvement,
                                         recommend_for_employment
```

**`attachment_status` enum:** `pending | matched | allocated | completed | rejected`

### Migrations

| File | Release | Description |
|---|---|---|
| `001_iams_schema.sql` | R1 | Initial schema — all core tables, triggers, RLS policies, `is_coordinator()` function |
| `002_iams_schema.sql` | R2 | Added `rejected` to `attachment_status` enum; `visit_assessments` table; `supervisor_reports` table |
| `003_iams_schema.sql` | R3 | Added `template_type` column to `daily_logs` (standard / technical / soft_skills) with a safe default of `standard` |

### Key DB Objects

| Object | Type | Purpose |
|---|---|---|
| `is_coordinator()` | `SECURITY DEFINER` Function | RLS policy helper — avoids JWT caching delay on coordinator role checks |
| `handle_new_user()` | Trigger | Creates profile row (`student_profiles` or `organization_profiles`) on auth user insert |
| `handle_new_user_role()` | Trigger | Inserts into `user_roles` on auth user insert; defaults to `coordinator` if no role in metadata |
| `decrement_vacancy_slots(id)` | RPC | Reduces `available_slots` by 1 after allocation, floored at 0 |

### Weekly Logbook Reminder (pg_cron)

```sql
SELECT cron.schedule(
  'weekly-logbook-reminder',
  '0 5 * * 1',
  $$
    SELECT net.http_post(
      url := 'https://<PROJECT-REF>.supabase.co/functions/v1/weekly-logbook-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := '{}'::jsonb
    );
  $$
);
```

---

## Edge Functions

All functions are deployed on the Deno runtime and located in `supabase/functions/`.

| Function | Version | Trigger | Purpose |
|---|---|---|---|
| `match-engine` | v8 | Manual (coordinator) | Scores students vs vacancies, slot-aware deduplication, blocks on missing docs |
| `send-supervisor-invite` | v4 | On invite creation | Generates token, writes to `supervisor_invitations`, sends registration email |
| `complete-supervisor-registration` | v2 | On token form submit | Validates token expiry, creates auth user, links to org roster, marks token used |
| `weekly-logbook-reminder` | v1 | pg_cron Monday 05:00 UTC | Queries unsubmitted weeks, sends reminder email to each affected student |
| `send-visit-notification` | v2 | On visit schedule | Emails student — visit date, supervisor name, notes, and portal CTA |
| `send-student-status-notification` | v1 | On rejection | Emails student with rejection notice and next steps link |

### Deploying Edge Functions

```bash
supabase functions deploy match-engine
supabase functions deploy send-supervisor-invite
supabase functions deploy complete-supervisor-registration
supabase functions deploy weekly-logbook-reminder
supabase functions deploy send-visit-notification
supabase functions deploy send-student-status-notification
```

---

## Testing

83 tests across 8 files. Full documentation in [`docs/TESTING.md`](docs/TESTING.md).

| File | Type | Tests | Release | Covers |
|---|---|---|---|---|
| `src/utils/__tests__/validation.test.js` | Unit | 18 | R1 | `isValidStudentId` (8 cases), `isPasswordStrong` (10 cases) |
| `src/services/__tests__/coordinatorService.test.js` | Unit | 9 | R1 | `updateStudentStatus` — full lifecycle including RLS block simulation |
| `src/services/__tests__/coordinatorService.release2.test.js` | Unit | 9 | R2 | `rejectStudent`, `reinstateStudent`, `rejected` status passthrough |
| `src/services/__tests__/logbookService.test.js` | Unit | 6 | R2 | `submitWeek` guard — approved week protection, resubmission allowed |
| `src/routes/routes.test.jsx` | Integration | 13 | R1 | All R1 routes render correct component with mocked auth and Supabase |
| `src/routes/routes.release2.test.jsx` | Integration | 9 | R2 | All R2 routes, supervisor portal account-not-linked guard |
| `src/__tests__/registration.test.jsx` | Acceptance | 12 | R1 | Student registration (US-01) and org registration (US-02) journeys |
| `src/__tests__/release2.acceptance.test.jsx` | Acceptance | 9 | R2 | Rejection banner (US-06), coordinator reject flow, supervisor token (US-05) |

**Definition of Done (per Section 3.7 of Sprint Planning):**

- ✅ Unit, integration, and acceptance tests all passing
- ✅ 0 failing — `npm run test` passes clean
- ✅ Test files committed to feature branch alongside feature code
- ✅ `docs/TESTING.md` updated when new tests are added

### Mocking Strategy

| Concern | Strategy |
|---|---|
| Supabase client | Fully chainable mock using `vi.hoisted()` to avoid `ReferenceError` on hoisted `vi.mock()` calls |
| ProtectedRoute | Bypassed in integration tests — all routes render directly |
| AuthContext | Provides a fake `{ id: "test-user-id-123" }` user |
| LandingPage | Stubbed with a `<h1>` in route tests — avoids `IntersectionObserver` (browser-only API) |
| supervisorService | Returns `{ supervisor: null, students: [] }` so portals reach their guard state |

---

## Deployment

### Frontend — Vercel

1. Push `main` to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Build settings (auto-detected): Framework = **Vite**, Output = `dist`

`vercel.json` rewrite rule (required for React Router client-side routing):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Backend — Supabase Auth URL Configuration

After deploying, update **Authentication → URL Configuration**:

```
Site URL:      https://your-app.vercel.app
Redirect URLs: https://your-app.vercel.app/**
               http://localhost:5173/**
```

---

## Release History

| Version | Date | Deliverables |
|---|---|---|
| **1.0 (MVP)** | April 10, 2026 | Auth, registration (student + org), heuristic matching engine, coordinator dashboard, student and org portals |
| **2.0 (Final)** | May 4, 2026 | Weekly digital logbooks, industrial and university supervisor portals, PDF export, rejection flow, visit scheduling, performance reports, automated email notifications, 83 tests |
| **2.1 (Patch)** | May 2026 | Three structured logbook entry templates (standard / technical / soft_skills), student assessment reports page, UI polish |

---

## Future Improvements

### AI-Powered Document Validation

Currently any PDF can be uploaded as a CV or transcript — there is no check that the document is what it claims to be. A production extension would:

- Use a vision model (GPT-4o or a fine-tuned classifier) to verify that uploaded CVs contain expected sections (Contact, Experience, Education, Skills) and transcripts contain academic records, institution name, and student ID.
- Return a confidence score so coordinators can review borderline cases rather than applying a binary accept/reject.
- This makes the existing `has_all_docs` enforcement significantly more robust — currently it only checks for file presence.

### Business Licence Verification

Any person can register an organisation with any name. A production extension would:

- Require organisations to upload their certificate of incorporation or business registration number.
- Integrate with the Companies and Intellectual Property Authority (CIPA) of Botswana API to auto-verify registration numbers against the official register.
- Block student allocations to unverified organisations.

### Real-Time Notifications

Status changes (approval, flagging, visit scheduling) only surface when the student next loads the dashboard. A production extension would:

- Use Supabase Realtime subscriptions on `logbook_weeks.status` and `visit_assessments`.
- Show a notification badge in the nav and a toast popup when the week status changes.
- The `NotificationBell` component in the Navbar is already wired as a placeholder for this.

### Analytics Dashboard

The coordinator currently sees summary stats only. A production extension would surface:

- Placement rate by industry, location, and department over time.
- Logbook completion rates and submission timeliness by week.
- Supervisor approval turnaround times.
- Exportable CSV/PDF reports for departmental review.

### Mobile Application

The interface is responsive but browser-only. A production extension would include:

- React Native / Expo app sharing the same Supabase backend.
- Push notifications for logbook reminders, supervisor feedback, and visit confirmations.
- Offline-capable logbook entry with sync when connectivity returns — important for students in areas with intermittent network access.

### Multi-University Support

The schema is extendable for multi-tenancy:

- Add a `universities` table and scope all data to `university_id`.
- Shared organisation pool — a company with vacancies could accept students from multiple universities simultaneously.

### Two-Factor Authentication

Coordinator and supervisor accounts have elevated write access and should be better protected:

- TOTP-based 2FA via Supabase Auth.
- Mandatory for coordinators, optional for supervisors.

### Student Self-Assessment

At attachment end, a student self-assessment form would:

- Use criteria matching the industrial supervisor's performance report.
- Cross-reference student self-scores with supervisor scores to flag large discrepancies for coordinator review.

---

## Acknowledgements

### Open Source Libraries

| Library | Usage |
|---|---|
| [Lucide React](https://lucide.dev) | All icons throughout the UI — tabbed logbook, supervisor stamp, status badges, and navigation use Lucide exclusively. Chosen for its open-source licence, accessibility, and consistent visual language. |
| [React 19](https://react.dev) | Core UI framework. React 19's concurrent features and improved hooks power the auto-save logbook and real-time status updates. |
| [Vite 7](https://vitejs.dev) | Build tooling with SWC for fast transforms. HMR during development, optimised production bundles, and native ESM support. |
| [Tailwind CSS v4](https://tailwindcss.com) | The entire design system — brand tokens, spacing scale, dark surfaces — is built on Tailwind's utility classes. |
| [Supabase](https://supabase.com) | PostgreSQL with RLS, Auth, Storage, Edge Functions, and Realtime from a single SDK. |
| [@react-pdf/renderer](https://react-pdf.org) | The legal logbook document with UB letterhead, tables, and signature blocks is rendered entirely in the browser. |
| [Resend](https://resend.com) | All automated emails — supervisor invites, visit notifications, rejection alerts, logbook reminders. |
| [Vitest](https://vitest.dev) | Compatible with Vite's plugin system. `vi.hoisted()` was critical for mocking Supabase before module imports are resolved. |
| [React Testing Library](https://testing-library.com) | `findByRole("heading", { name: /.../ })` with accessible name matching enabled testing split headings without brittle text selectors. |
| [React Router 7](https://reactrouter.com) | Nested layout system with `Outlet` enabled the multi-panel coordinator and supervisor dashboards. |

### Design Inspiration

| Source | What We Took |
|---|---|
| [Linear](https://linear.app) | Dark editorial aesthetic, dense information display, status badge patterns |
| [Vercel Dashboard](https://vercel.com) | Monospace typography for technical values, deployment timeline UI |
| [Supabase Studio](https://app.supabase.com) | Tab-based navigation within a single page, empty state messaging |
| [Stripe Dashboard](https://dashboard.stripe.com) | Two-column detail views, "danger zone" pattern for destructive actions, inline confirmation |
| [GitHub](https://github.com) | README conventions, branch protection workflow, commit message format |

### Technical Documentation Referenced

| Resource | Applied To |
|---|---|
| [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security) | Multi-role RLS design and the `SECURITY DEFINER` coordinator role workaround |
| [Supabase Edge Functions](https://supabase.com/docs/guides/functions) | CORS handling, secret management, non-fatal error response patterns |
| [Vitest Mocking — vi.hoisted()](https://vitest.dev/guide/mocking.html) | Solution to `ReferenceError: Cannot access before initialization` in service tests |
| [RTL Queries Guide](https://testing-library.com/docs/queries/about) | `findByRole("heading")` for split heading text — documented in `TESTING.md` |
| [@react-pdf/renderer API](https://react-pdf.org/components) | `StyleSheet.create()`, `<Page>`, `<PDFDownloadLink>`, fixed footer with `render` prop |
| [Resend API Reference](https://resend.com/docs/api-reference/emails/send-email) | Email payload structure, error response handling |
| [pg_cron Documentation](https://github.com/citusdata/pg_cron) | Cron expression for Monday 05:00 UTC logbook reminder |
| [Postgres ALTER TYPE](https://www.postgresql.org/docs/current/sql-altertype.html) | `ALTER TYPE attachment_status ADD VALUE 'rejected'` without recreating the enum |

---

## Contributing

This project follows a **feature-branch Git workflow**.

### Branch Strategy

```
main      ── production (merged at each release)
  └── develop ── integration branch
        └── feature/* ── individual features, cut from develop
```

### Naming Conventions

```bash
feature/match-engine-scoring
feature/logbook-pdf-export
fix/rls-coordinator-update
test/logbook-service-unit
docs/readme-update
```

### Commit Format

```
feat(logbook):   add PDF export with UB letterhead
fix(auth):       resolve RLS policy for coordinator status check
test(service):   add unit tests for submitWeek guard
docs(readme):    update testing section for Release 2
chore(deps):     add @react-pdf/renderer
```

### Pre-Merge Checklist

- [ ] `npm run test` — all 83 tests pass
- [ ] `npm run build` — no build errors
- [ ] `npm run lint` — no ESLint errors
- [ ] Peer reviewed by at least one team member
- [ ] `docs/TESTING.md` updated if new tests were added

---

<div align="center">

<br />

Built with React, Supabase, and too much coffee

</div>
