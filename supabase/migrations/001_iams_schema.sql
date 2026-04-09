-- =============================================================================
-- IAMS — Industrial Attachment Management System
-- University of Botswana, Department of Computer Science
-- =============================================================================
--
-- Migration:   001_iams_schema.sql
-- Description: Full consolidated schema for Release 1.0
-- Authors:     Ray Mcmillan Gumbo, Kao Nyenye, Karabo Kapondorah,
--              Tetlanyo Jonathan Botlhole, Thebe Segootsane
-- Course:      CSI341 — Introduction to Software Engineering
-- Date:        April 2026
--
-- Covers:
--   1. Custom types (enums)
--   2. Core tables
--   3. Security definer helper functions
--   4. Auth triggers (handle_new_user, handle_new_user_role)
--   5. Business logic RPCs (decrement_vacancy_slots)
--   6. Row Level Security policies
--
-- Release 2.0 stubs included:
--   - university_supervisors table
--   - logbook_weeks and daily_logs tables
--   - placements.university_supervisor_id FK (nullable)
--
-- Run order: execute this entire file in one shot against a fresh Supabase
-- project. Extensions (uuid-ossp, pgcrypto) are assumed to already exist
-- under the 'extensions' schema as Supabase provides them by default.
-- =============================================================================


-- =============================================================================
-- SECTION 1: CUSTOM TYPES
-- =============================================================================

-- Attachment lifecycle status for student_profiles
-- pending    → registered, not yet matched
-- matched    → coordinator has assigned an org/vacancy
-- allocated  → offer confirmed, placement record created
-- completed  → attachment period finished
CREATE TYPE public.attachment_status AS ENUM (
  'pending',
  'matched',
  'allocated',
  'completed'
);


-- =============================================================================
-- SECTION 2: CORE TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- user_roles
-- Stores the role for every auth user. Populated by handle_new_user_role
-- trigger on signup. Coordinators are created directly in Supabase Auth
-- dashboard and default to 'coordinator'.
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_roles (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT DEFAULT 'student' CHECK (role IN ('student', 'org', 'coordinator')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- student_profiles
-- One row per registered student. Created by handle_new_user trigger.
-- onboarding_complete flips true when name + student_id + major + gpa +
-- cv_url + transcript_url are all filled — required before matching.
-- ---------------------------------------------------------------------------
CREATE TABLE public.student_profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT NOT NULL,
  email                TEXT NOT NULL UNIQUE,
  student_id           TEXT NOT NULL UNIQUE,
  avatar_url           TEXT,
  major                TEXT DEFAULT 'Computer Science',
  status               public.attachment_status DEFAULT 'pending',
  onboarding_complete  BOOLEAN DEFAULT false,
  gpa                  NUMERIC,
  phone_number         TEXT,
  gender               TEXT,
  year_of_study        INTEGER DEFAULT 3,
  cv_url               TEXT,
  transcript_url       TEXT,
  bio                  TEXT,
  preferred_work_mode  TEXT DEFAULT 'On-site',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at           TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- organization_profiles
-- One row per registered organisation. Created by handle_new_user trigger.
-- onboarding_complete flips true when org_name + industry + location +
-- contact_person + supervisor_email are all filled.
-- requires_cv / requires_transcript default true — org can toggle these
-- off on their Requirements page. Affects match engine doc warnings and
-- coordinator allocation enforcement.
-- ---------------------------------------------------------------------------
CREATE TABLE public.organization_profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_name             TEXT NOT NULL,
  email                TEXT NOT NULL UNIQUE,
  location             TEXT,
  industry             TEXT,
  contact_person       TEXT,
  contact_phone        TEXT,
  supervisor_email     TEXT,
  avatar_url           TEXT,
  requires_cv          BOOLEAN DEFAULT true,
  requires_transcript  BOOLEAN DEFAULT true,
  onboarding_complete  BOOLEAN DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- student_preferences
-- Career preferences used as input to the matching engine.
-- technical_skills   → matched against vacancy.required_skills (50pts)
-- preferred_locations → matched against org.location (20pts)
-- ---------------------------------------------------------------------------
CREATE TABLE public.student_preferences (
  id                   UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  student_id           UUID UNIQUE REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  preferred_roles      TEXT[] DEFAULT '{}',
  preferred_locations  TEXT[] DEFAULT '{}',
  industries           TEXT[] DEFAULT '{}',
  technical_skills     TEXT[] DEFAULT '{}',
  is_searching         BOOLEAN DEFAULT true,
  urgency_level        INTEGER DEFAULT 1,
  min_stipend_expected INTEGER DEFAULT 0,
  version              INTEGER DEFAULT 1,
  last_updated_by      UUID REFERENCES auth.users(id),
  updated_at           TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- organization_vacancies
-- Each org can have multiple vacancies. available_slots is decremented by
-- decrement_vacancy_slots() RPC when a student is allocated.
-- available_slots minimum is 1 — enforced by CHECK constraint.
-- ---------------------------------------------------------------------------
CREATE TABLE public.organization_vacancies (
  id                UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  org_id            UUID REFERENCES public.organization_profiles(id) ON DELETE CASCADE,
  role_title        TEXT NOT NULL,
  job_description   TEXT,
  required_skills   TEXT[] DEFAULT '{}',
  available_slots   INTEGER DEFAULT 1 CHECK (available_slots >= 1),
  min_gpa_required  NUMERIC DEFAULT 2.0,
  work_mode         TEXT DEFAULT 'On-site',
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- university_supervisors
-- Roster of UB department lecturers available for supervision.
-- Release 1 stub — UI and assessment features built in Release 2.
-- max_students caps how many students each supervisor can be assigned.
-- ---------------------------------------------------------------------------
CREATE TABLE public.university_supervisors (
  id          UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  department  TEXT NOT NULL DEFAULT 'Computer Science',
  phone       TEXT,
  max_students INTEGER NOT NULL DEFAULT 10 CHECK (max_students >= 1),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.university_supervisors IS
  'Roster of UB department lecturers available for industrial attachment supervision. '
  'Each supervisor conducts two physical visit assessments per student.';

COMMENT ON COLUMN public.university_supervisors.max_students IS
  'Maximum number of students this supervisor can be assigned to in one cycle';

-- ---------------------------------------------------------------------------
-- placements
-- Created when coordinator allocates a student to an org vacancy.
-- industrial_supervisor_* auto-populated from org profile at allocation time.
-- university_supervisor_* filled in via Student Audit Modal.
-- university_supervisor_id FK is a Release 2 stub — nullable in Release 1.
-- ---------------------------------------------------------------------------
CREATE TABLE public.placements (
  id                           UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  student_id                   UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  organization_id              UUID NOT NULL REFERENCES public.organization_profiles(id) ON DELETE CASCADE,
  position_title               TEXT DEFAULT 'Intern',
  status                       TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
  start_date                   DATE NOT NULL,
  end_date                     DATE NOT NULL,
  duration_weeks               INTEGER DEFAULT 8,
  -- Industrial supervisor auto-filled from org.contact_person / org.supervisor_email
  industrial_supervisor_name   TEXT,
  industrial_supervisor_email  TEXT,
  -- University supervisor filled manually by coordinator via Student Audit Modal
  university_supervisor_name   TEXT,
  university_supervisor_email  TEXT,
  -- FK stub for Release 2 batch supervisor assignment feature
  university_supervisor_id     UUID REFERENCES public.university_supervisors(id) ON DELETE SET NULL,
  created_at                   TIMESTAMPTZ DEFAULT now()
);

COMMENT ON COLUMN public.placements.industrial_supervisor_name  IS 'Name of the supervisor at the host organization';
COMMENT ON COLUMN public.placements.industrial_supervisor_email IS 'Email of the supervisor at the host organization';
COMMENT ON COLUMN public.placements.university_supervisor_name  IS 'Name of the UB university supervisor assigned to this student';
COMMENT ON COLUMN public.placements.university_supervisor_email IS 'Email of the UB university supervisor — conducts two visit assessments';
COMMENT ON COLUMN public.placements.university_supervisor_id    IS
  'FK to university_supervisors — used in Release 2 for batch assignment and visit tracking. '
  'Release 1 uses university_supervisor_name/email text columns.';

-- ---------------------------------------------------------------------------
-- logbook_weeks
-- Weekly logbook container per student placement. Release 2 stub.
-- Students submit logs weekly; supervisors can approve/flag entries.
-- ---------------------------------------------------------------------------
CREATE TABLE public.logbook_weeks (
  id                   UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  student_id           UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  placement_id         UUID NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
  week_number          INTEGER CHECK (week_number >= 1),
  start_date           DATE NOT NULL,
  end_date             DATE NOT NULL,
  status               TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'flagged')),
  supervisor_comments  TEXT,
  total_hours          NUMERIC DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- daily_logs
-- Individual day entries within a logbook week. Release 2 stub.
-- ---------------------------------------------------------------------------
CREATE TABLE public.daily_logs (
  id               UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  week_id          UUID NOT NULL REFERENCES public.logbook_weeks(id) ON DELETE CASCADE,
  log_date         DATE NOT NULL,
  day_of_week      TEXT CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  activity_details TEXT,
  hours_worked     NUMERIC DEFAULT 8.0 CHECK (hours_worked <= 24),
  is_absent        BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);


-- =============================================================================
-- SECTION 3: SECURITY DEFINER HELPER FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- is_coordinator()
-- Used in RLS policies instead of checking JWT directly.
-- SECURITY DEFINER + reads auth.users directly to bypass JWT caching —
-- ensures a freshly-assigned coordinator role is respected immediately
-- without requiring the user to log out and back in.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_coordinator()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'coordinator'
  );
$$;


-- =============================================================================
-- SECTION 4: AUTH TRIGGERS
-- Fired on INSERT to auth.users on every new signup.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- handle_new_user()
-- Creates the role-specific profile row when a new user signs up.
-- ON CONFLICT DO NOTHING prevents silent failures on re-registration attempts.
-- industry is written from raw_user_meta_data — captured by RegisterOrg form.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'role' = 'org') THEN
    INSERT INTO public.organization_profiles (id, org_name, email, industry)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      NEW.raw_user_meta_data->>'industry'   -- null is fine, updated later in OrgProfile
    )
    ON CONFLICT (id) DO NOTHING;

  ELSIF (NEW.raw_user_meta_data->>'role' = 'student') THEN
    INSERT INTO public.student_profiles (id, full_name, email, student_id)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      NEW.raw_user_meta_data->>'student_id'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- handle_new_user_role()
-- Inserts the user's role into user_roles on signup.
-- Defaults to 'coordinator' if no role is in metadata — coordinators are
-- created directly in the Supabase Auth dashboard, not via the signup form.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  detected_role TEXT;
BEGIN
  detected_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'coordinator'   -- dashboard-created users default to coordinator
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, detected_role)
  ON CONFLICT (user_id) DO UPDATE SET role = detected_role;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();


-- =============================================================================
-- SECTION 5: BUSINESS LOGIC RPCs
-- =============================================================================

-- ---------------------------------------------------------------------------
-- decrement_vacancy_slots(vacancy_id UUID)
-- Called by allocateOne in MatchEngine.jsx after a placement is created.
-- GREATEST(..., 0) prevents available_slots going negative in race conditions.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrement_vacancy_slots(vacancy_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.organization_vacancies
  SET available_slots = GREATEST(available_slots - 1, 0)
  WHERE id = vacancy_id;
END;
$$;


-- =============================================================================
-- SECTION 6: ROW LEVEL SECURITY POLICIES
-- All tables have RLS enabled. Enable it first, then add policies.
-- =============================================================================

ALTER TABLE public.user_roles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_preferences     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_vacancies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_supervisors  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_weeks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs              ENABLE ROW LEVEL SECURITY;

-- ── user_roles ────────────────────────────────────────────────────────────
-- Users can only read their own role — never write it directly.
-- Role assignment is handled by the handle_new_user_role trigger.
CREATE POLICY "user_roles_read_own"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- ── student_profiles ──────────────────────────────────────────────────────
CREATE POLICY "Students can view their own profile"
  ON public.student_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Students can insert their own profile"
  ON public.student_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Students can update their own profile"
  ON public.student_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Coordinators can read all student profiles
CREATE POLICY "coordinators_view_all_profiles"
  ON public.student_profiles FOR SELECT
  USING (is_coordinator());

-- Coordinators can update student status (matched, allocated, completed)
-- No WITH CHECK — prevents silent 0-row updates caused by RLS conflicts
CREATE POLICY "coordinators_update_student_status"
  ON public.student_profiles FOR UPDATE
  USING (is_coordinator());

-- Orgs can view profiles of students placed with them
CREATE POLICY "orgs_view_placed_student_profiles"
  ON public.student_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.placements
      WHERE placements.student_id    = student_profiles.id
        AND placements.organization_id = auth.uid()
        AND placements.status          = 'active'
    )
  );

-- ── organization_profiles ─────────────────────────────────────────────────
-- Anyone can read basic org info (needed by students browsing, match engine)
CREATE POLICY "Public: View basic org info"
  ON public.organization_profiles FOR SELECT
  USING (true);

CREATE POLICY "Organizations can view their own profile"
  ON public.organization_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Organizations can update their own profile"
  ON public.organization_profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── student_preferences ───────────────────────────────────────────────────
CREATE POLICY "student_prefs_owner"
  ON public.student_preferences FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "coordinators_view_all_preferences"
  ON public.student_preferences FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'coordinator');

-- ── organization_vacancies ────────────────────────────────────────────────
-- Anyone can view active vacancies (match engine + student browsing)
CREATE POLICY "Public: View active vacancies"
  ON public.organization_vacancies FOR SELECT
  USING (is_active = true);

-- Org manages only their own vacancies
CREATE POLICY "org_manage_own_vacancies"
  ON public.organization_vacancies FOR ALL
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

-- Coordinators can audit all vacancies
CREATE POLICY "coordinators_audit_vacancies"
  ON public.organization_vacancies FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'coordinator');

-- ── placements ────────────────────────────────────────────────────────────
CREATE POLICY "Students can view their own placement"
  ON public.placements FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Organizations can view their interns"
  ON public.placements FOR SELECT
  USING (auth.uid() = organization_id);

-- Coordinators have full control — create, read, update, delete placements
CREATE POLICY "coordinators_manage_placements"
  ON public.placements FOR ALL
  USING (is_coordinator());

-- ── university_supervisors ────────────────────────────────────────────────
-- Everyone can read the supervisor roster
CREATE POLICY "all_can_view_supervisors"
  ON public.university_supervisors FOR SELECT
  USING (true);

-- Only coordinators can manage the roster
CREATE POLICY "coordinators_manage_supervisors"
  ON public.university_supervisors FOR ALL
  USING (is_coordinator());

-- ── logbook_weeks ─────────────────────────────────────────────────────────
CREATE POLICY "Students manage own logbook weeks"
  ON public.logbook_weeks FOR ALL
  USING (auth.uid() = student_id);

CREATE POLICY "Organizations view assigned logbook weeks"
  ON public.logbook_weeks FOR SELECT
  USING (
    placement_id IN (
      SELECT id FROM public.placements
      WHERE organization_id = auth.uid()
    )
  );

-- ── daily_logs ────────────────────────────────────────────────────────────
CREATE POLICY "Students manage own daily logs"
  ON public.daily_logs FOR ALL
  USING (
    week_id IN (
      SELECT id FROM public.logbook_weeks
      WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Organizations view assigned daily logs"
  ON public.daily_logs FOR SELECT
  USING (
    week_id IN (
      SELECT lw.id
      FROM public.logbook_weeks lw
      JOIN public.placements p ON lw.placement_id = p.id
      WHERE p.organization_id = auth.uid()
    )
  );


-- =============================================================================
-- END OF MIGRATION
-- To apply: run this entire file in Supabase SQL Editor on a fresh project.
-- represents schema only.
-- =============================================================================