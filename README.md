# IAMS — Industrial Attachment Management System

> Digitizing the industrial attachment lifecycle for the University of Botswana, Department of Computer Science.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Team](#team)
3. [Tech Stack](#tech-stack)
4. [Features](#features)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
7. [Environment Variables](#environment-variables)
8. [Database](#database)
9. [Edge Functions](#edge-functions)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Release Roadmap](#release-roadmap)
13. [Contributing](#contributing)

---

## Project Overview

The Department of Computer Science at the University of Botswana currently manages student industrial attachments through a manual, paper-based system. IAMS replaces this with a centralized digital platform that handles the entire attachment lifecycle — from student registration and organisation onboarding, to automated matching, placement tracking, and supervisor coordination.

**Release 1.0 (MVP)** — April 2026
Covers authentication, registration, intelligent matching, and coordinator tools.

**Release 2.0 (Final)** — May 2026
Adds weekly logbooks, supervisor assessment portals, and automated reminders.

---

## Team

| Name | Student ID | Role |
|---|---|---|
| Ray Mcmillan Gumbo | 202303013 | Full Stack / Match Engine / Coordinator Dashboard |
| Kao Nyenye | 202300366 | Student Portal / Logbooks (R2) |
| Karabo Kapondorah | 202005663 | Database Schema / Student Registration |
| Tetlanyo Jonathan Botlhole | 202204728 | Org Registration / Notifications (R2) |
| Thebe Segootsane | 202306366 | Student Registration / Preferences |

**Course:** CSI341 — Introduction to Software Engineering
**Lecturer:** University of Botswana, Department of Computer Science

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, React Router 7 |
| Styling | Tailwind CSS v4, |
| Animations | Framer Motion |
| Backend / Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + JWT) |
| Edge Functions | Deno (Supabase Edge Runtime) |
| File Storage | Supabase Storage |
| Testing | Vitest, React Testing Library, @testing-library/user-event |
| Deployment | Vercel (frontend), Supabase (backend) |

---

## Features

### Student Portal
- Register with UB email (`@ub.ac.bw`) and student ID
- Upload CV and certified transcript (both required for matching eligibility)
- Set career preferences — skills, preferred locations, preferred roles
- View active placement and assigned supervisor details

### Organisation Portal
- Register and complete organisation profile
- Auto-verified ("Verified Partner") when all required fields are filled
- Create and manage internship vacancies with skill requirements and GPA minimum
- Toggle CV/transcript requirements per organisation
- View placed students and their logbook submissions (Release 2)

### Coordinator Dashboard
- View all students, organisations, and active placements
- Run the heuristic matching engine to generate placement suggestions
- Auto-allocate multiple students in a batch or manually assign individually
- Doc enforcement — allocation blocked if org requires a doc the student hasn't uploaded
- Assign industrial and university supervisors per placement
- Update student attachment status (pending → matched → allocated → completed)

### Matching Engine (Supabase Edge Function)
Scores every student against every active vacancy using three criteria:

| Criterion | Weight | Logic |
|---|---|---|
| Skills match | 50 pts | `matchedSkills / requiredSkills × 50` |
| GPA | 30 pts | `gpa / 5.0 × 30` (only if ≥ min_gpa_required) |
| Location | 20 pts | Flat 20pts if student's preferred location matches org location |

Returns one result per student (best vacancy match), sorted by score descending. Students with missing required documents are flagged with a `doc_warning` and blocked from allocation.

---

## Project Structure

```
src/
├── components/
│   ├── layout/          # RootLayout, StudentLayout, DashboardLayout, ProtectedRoute
│   └── ui/              # Button, Input, Badge, Pill, SearchableSelect, ConfirmModal ...
├── constants/           # matchingOptions (skills, locations, roles, industries)
├── context/
│   ├── AuthContext.jsx  # Auth state, signUpNewUser, signOut
│   └── AvatarContext.jsx
├── features/
│   └── logbook/         # LogbookManager (Release 2)
├── lib/
│   └── supabaseClient.js
├── routes/
│   └── routes.jsx       # All application routes
├── services/
│   ├── coordinatorService.js
│   ├── orgService.js
│   └── studentService.js
├── views/
│   ├── auth/            # Login, RegisterStudent, RegisterOrg, ForgotPassword, UpdatePassword
│   ├── admin/           # CoordinatorDashboard, MatchEngine, PartnerRegistry, StudentRegistry
│   ├── organization/    # Portal, OrgProfile, Requirements, OrgApplications
│   └── student/         # Dashboard, Profile, Preferences
├── __tests__/           # Acceptance tests (registration)
├── utils/
│   └── __tests__/       # Unit tests (validation)
└── setupTests.js

supabase/
└── functions/
    └── match-engine/    # Deno edge function — scoring and deduplication
└── migrations├── 001_iams_schema.sql  # Consolidated database migration

    

docs/
└── TESTING.md           # Full test suite documentation
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project (free tier is sufficient)

### Installation

```bash
# Clone the repository
git clone git@github.com:Raymacmillan/Inustrial-Attachement-Management-System-IAMS-.git

cd Inustrial-Attachement-Management-System-IAMS

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Fill in your Supabase credentials (see Environment Variables section)

# Start development server
npm run dev
```

### Running Tests

```bash
# Run all tests (52 tests across 4 files)
npm run test

# Watch mode
npm run test -- --watch
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key_here
```

These are available in your Supabase project under **Settings → API**.

> The `anon` key is safe to expose in frontend code — it is a public key. Data access is controlled by Row Level Security policies on the database, not by the key itself.

---

## Database

### Setup

Run the consolidated migration against a fresh Supabase project:

1. Open your Supabase project → **SQL Editor**
2. Paste the contents of `docs/001_iams_schema.sql`
3. Click **Run**

This creates all tables, functions, triggers, and RLS policies in one shot.

### Schema Overview

```
auth.users (Supabase managed)
    │
    ├── user_roles              — role per user (student | org | coordinator)
    ├── student_profiles        — student academic data, doc URLs, status
    ├── organization_profiles   — org details, doc requirements, verification status
    │
    ├── student_preferences     — skills, locations, roles for matching engine
    ├── organization_vacancies  — internship roles with skill requirements and slots
    │
    ├── placements              — active/completed student ↔ org assignments
    │       └── university_supervisors   — UB lecturer roster (Release 2)
    │
    ├── logbook_weeks           — weekly logbook containers (Release 2)
    └── daily_logs              — individual day entries (Release 2)
```

### Key Functions

| Function | Purpose |
|---|---|
| `is_coordinator()` | Security definer — used in RLS policies to check coordinator role without JWT caching issues |
| `handle_new_user()` | Trigger — creates student/org profile row on signup |
| `handle_new_user_role()` | Trigger — inserts role into user_roles on signup |
| `decrement_vacancy_slots(vacancy_id)` | RPC — reduces available_slots by 1 after allocation, floor 0 |

### Creating a Coordinator

Coordinators are not created through the public registration form. Create them directly in the Supabase Dashboard:

1. **Authentication → Users → Add User**
2. Set email and password
3. After creation, run this SQL in the **SQL Editor**:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "coordinator"}'::jsonb
WHERE email = 'coordinator@ub.ac.bw';
```

---

## Edge Functions

### match-engine (v4)

Deployed to Supabase Edge Functions. Scores all pending students against all active vacancies.

**Endpoint:** `POST /functions/v1/match-engine`
**Auth:** JWT not required (`verify_jwt: false`) — called server-side by coordinator only

**Response shape:**
```json
[
  {
    "student_id": "uuid",
    "student_name": "string",
    "vacancy_id": "uuid",
    "org_id": "uuid",
    "org_name": "string",
    "role": "string",
    "total_score": 85,
    "score_breakdown": { "skills": 50, "gpa": 25, "location": 10 },
    "matched_skills": ["React", "Python"],
    "doc_warning": "Missing: Transcript (required by Ryom)",
    "has_all_docs": false,
    "is_unplaceable": false,
    "unplaceable_reason": null
  }
]
```

**To redeploy:**
```bash
supabase functions deploy match-engine
```

---

## Testing

52 tests across 4 files. Full documentation in `docs/TESTING.md`.

| File | Type | Tests |
|---|---|---|
| `src/utils/__tests__/validation.test.js` | Unit | 18 |
| `src/services/__tests__/coordinatorService.test.js` | Unit | 9 |
| `src/routes/routes.test.jsx` | Integration | 13 |
| `src/__tests__/registration.test.jsx` | Acceptance | 12 |

Satisfies the Definition of Done (Section 3.7 of Release and Sprint Planning document):
> "Successfully Tested: Passes unit, integration, and acceptance tests."

---

## Deployment

### Frontend — Vercel

1. Push `main` branch to GitHub
2. Connect repo to [vercel.com](https://vercel.com)
3. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Build settings (auto-detected):
   - Framework: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`

### Backend — Supabase

No deployment needed — Supabase is already live. After getting your Vercel URL, update:

**Authentication → URL Configuration:**
```
Site URL:     https://your-app.vercel.app
Redirect URLs:
  https://your-app.vercel.app/**
  http://localhost:5173/**
```

---

## Release Roadmap

| Release | Date | Sprints | Key Features |
|---|---|---|---|
| **1.0 (MVP)** | April 10, 2026 | Sprint 1–2 | Auth, Registration, Matching Engine, Coordinator Dashboard |
| **2.0 (Final)** | May 4, 2026 | Sprint 3–4 | Weekly Logbooks, Supervisor Reports, Reminders |

### Release 2.0 — Planned Features

- **Weekly Logbook** (US-04) — Students submit daily activity logs per week; supervisors approve or flag
- **Supervisor Reports** (US-05) — Industrial supervisors submit end-of-attachment performance reports
- **Due Date Reminders** (US-06) — Automated email notifications for logbook deadlines and assessment submissions
- **Batch Supervisor Assignment** — Coordinator selects multiple students and assigns a UB supervisor in one action
- **Visit Assessment Module** — University supervisors record two physical visit assessments per student

---

## Contributing

This project follows a **feature-branch Git workflow**:

```
main      — production-ready, Release 1.0 merged here
develop   — integration branch, all features merged here
feature/* — individual feature branches cut from develop
```

**Branch naming:**
```
feature/match-engine-scoring
fix/rls-coordinator-update
test/registration-acceptance
```

**Commit message format:**
```
feat: add doc enforcement to allocateOne
fix: correct password confirm field visibility
test: add unit tests for isValidStudentId
chore: update TESTING.md with 52 test results
```

**Before merging to develop:**
- All tests must pass (`npm run test`)
- No TypeScript/ESLint errors (`npm run build`)
- Peer reviewed by at least one team member