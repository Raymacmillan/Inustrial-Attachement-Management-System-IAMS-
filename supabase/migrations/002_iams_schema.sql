
-- ============================================================
-- IAMS Release 2.0 Migration
-- ============================================================

-- ── 1. EXTEND user_roles check constraint ──────────────────
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role = ANY (ARRAY[
    'student'::text,
    'org'::text,
    'coordinator'::text,
    'university_supervisor'::text,
    'industrial_supervisor'::text
  ]));

-- ── 2. ADD user_id to organization_supervisors ─────────────
ALTER TABLE public.organization_supervisors
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS org_supervisors_user_id_idx
  ON public.organization_supervisors(user_id)
  WHERE user_id IS NOT NULL;

-- ── 3. ADD user_id to university_supervisors ───────────────
ALTER TABLE public.university_supervisors
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uni_supervisors_user_id_idx
  ON public.university_supervisors(user_id)
  WHERE user_id IS NOT NULL;

-- ── 4. EXTEND daily_logs with structured template fields ───
ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS tasks_completed   text,
  ADD COLUMN IF NOT EXISTS learning_outcomes text,
  ADD COLUMN IF NOT EXISTS challenges        text;

-- ── 5. EXTEND logbook_weeks with submission tracking ───────
ALTER TABLE public.logbook_weeks
  ADD COLUMN IF NOT EXISTS due_date     date,
  ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone;

-- ── 6. SUPERVISOR INVITATIONS ──────────────────────────────
-- Token-based invite flow for both supervisor types
CREATE TABLE IF NOT EXISTS public.supervisor_invitations (
  id            uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  token         text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  email         text NOT NULL,
  supervisor_type text NOT NULL
    CHECK (supervisor_type IN ('industrial_supervisor', 'university_supervisor')),
  -- for industrial: links to the org; for university: null (coordinator invites)
  org_id        uuid REFERENCES public.organization_profiles(id) ON DELETE CASCADE,
  -- pre-link to the supervisor roster row so registration auto-fills
  org_supervisor_id  uuid REFERENCES public.organization_supervisors(id) ON DELETE SET NULL,
  uni_supervisor_id  uuid REFERENCES public.university_supervisors(id) ON DELETE SET NULL,
  invited_by    uuid NOT NULL REFERENCES auth.users(id),
  status        text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at    timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at    timestamp with time zone NOT NULL DEFAULT now()
);

-- ── 7. VISIT ASSESSMENTS ───────────────────────────────────
-- University supervisor conducts 2 physical visits per student
CREATE TABLE IF NOT EXISTS public.visit_assessments (
  id                    uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  placement_id          uuid NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
  university_supervisor_id uuid REFERENCES public.university_supervisors(id) ON DELETE SET NULL,
  visit_number          integer NOT NULL CHECK (visit_number IN (1, 2)),
  visit_date            date NOT NULL,
  -- scored criteria (each out of 10 for simplicity)
  punctuality_score     integer CHECK (punctuality_score BETWEEN 1 AND 10),
  professionalism_score integer CHECK (professionalism_score BETWEEN 1 AND 10),
  technical_score       integer CHECK (technical_score BETWEEN 1 AND 10),
  communication_score   integer CHECK (communication_score BETWEEN 1 AND 10),
  overall_score         integer CHECK (overall_score BETWEEN 1 AND 10),
  comments              text,
  status                text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted')),
  submitted_at          timestamp with time zone,
  created_at            timestamp with time zone NOT NULL DEFAULT now(),
  updated_at            timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (placement_id, visit_number)
);

-- ── 8. SUPERVISOR REPORTS (Industrial) ────────────────────
-- End-of-attachment performance report from industrial supervisor
CREATE TABLE IF NOT EXISTS public.supervisor_reports (
  id                       uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  placement_id             uuid NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE UNIQUE,
  industrial_supervisor_id uuid REFERENCES public.organization_supervisors(id) ON DELETE SET NULL,
  -- performance criteria (each out of 10)
  technical_competency     integer CHECK (technical_competency BETWEEN 1 AND 10),
  initiative_score         integer CHECK (initiative_score BETWEEN 1 AND 10),
  teamwork_score           integer CHECK (teamwork_score BETWEEN 1 AND 10),
  reliability_score        integer CHECK (reliability_score BETWEEN 1 AND 10),
  overall_performance      integer CHECK (overall_performance BETWEEN 1 AND 10),
  strengths                text,
  areas_for_improvement    text,
  general_comments         text,
  recommend_for_employment boolean DEFAULT false,
  status                   text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted')),
  submitted_at             timestamp with time zone,
  created_at               timestamp with time zone NOT NULL DEFAULT now(),
  updated_at               timestamp with time zone NOT NULL DEFAULT now()
);

-- ── 9. LOGBOOK SIGNATURES ─────────────────────────────────
-- Digital stamp record — DB source of truth for PDF rendering
CREATE TABLE IF NOT EXISTS public.logbook_signatures (
  id           uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  week_id      uuid NOT NULL REFERENCES public.logbook_weeks(id) ON DELETE CASCADE UNIQUE,
  signed_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  signer_name  text NOT NULL,
  signer_title text NOT NULL,
  signer_role  text NOT NULL
    CHECK (signer_role IN ('industrial_supervisor', 'university_supervisor', 'coordinator')),
  signed_at    timestamp with time zone NOT NULL DEFAULT now(),
  created_at   timestamp with time zone NOT NULL DEFAULT now()
);

-- ── 10. EMAIL QUEUE ────────────────────────────────────────
-- Persists email jobs for retry logic (Resend 100/day limit)
CREATE TABLE IF NOT EXISTS public.email_queue (
  id           uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  recipient    text NOT NULL,
  subject      text NOT NULL,
  body_html    text NOT NULL,
  email_type   text NOT NULL
    CHECK (email_type IN (
      'logbook_reminder',
      'supervisor_nudge',
      'supervisor_invitation',
      'placement_notification',
      'password_reset'
    )),
  -- optional: link to the entity that triggered this email
  placement_id uuid REFERENCES public.placements(id) ON DELETE SET NULL,
  week_id      uuid REFERENCES public.logbook_weeks(id) ON DELETE SET NULL,
  status       text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  attempts     integer NOT NULL DEFAULT 0,
  last_error   text,
  scheduled_for timestamp with time zone NOT NULL DEFAULT now(),
  sent_at      timestamp with time zone,
  created_at   timestamp with time zone NOT NULL DEFAULT now()
);

-- ── 11. RLS POLICIES ──────────────────────────────────────

-- supervisor_invitations: only coordinator can insert; token holder can read their own
ALTER TABLE public.supervisor_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coordinators can manage invitations"
  ON public.supervisor_invitations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'coordinator'
    )
  );

CREATE POLICY "Invitees can read their own invitation by token"
  ON public.supervisor_invitations
  FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- visit_assessments: university supervisors can manage their own; students/coordinators read
ALTER TABLE public.visit_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "University supervisors manage their visit assessments"
  ON public.visit_assessments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.university_supervisors us
      WHERE us.id = visit_assessments.university_supervisor_id
        AND us.user_id = auth.uid()
    )
  );

CREATE POLICY "Coordinators can read all visit assessments"
  ON public.visit_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'coordinator'
    )
  );

CREATE POLICY "Students can read their own visit assessments"
  ON public.visit_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.placements p
      JOIN public.student_profiles sp ON sp.id = p.student_id
      WHERE p.id = visit_assessments.placement_id
        AND sp.id = auth.uid()
    )
  );

-- supervisor_reports: industrial supervisor manages; coordinator/student read
ALTER TABLE public.supervisor_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Industrial supervisors manage their reports"
  ON public.supervisor_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_supervisors os
      WHERE os.id = supervisor_reports.industrial_supervisor_id
        AND os.user_id = auth.uid()
    )
  );

CREATE POLICY "Coordinators can read all supervisor reports"
  ON public.supervisor_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'coordinator'
    )
  );

CREATE POLICY "Students can read their own supervisor report"
  ON public.supervisor_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.placements p
      JOIN public.student_profiles sp ON sp.id = p.student_id
      WHERE p.id = supervisor_reports.placement_id
        AND sp.id = auth.uid()
    )
  );

-- logbook_signatures: supervisor/coordinator insert; all parties read
ALTER TABLE public.logbook_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisors and coordinators can create signatures"
  ON public.logbook_signatures
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('industrial_supervisor', 'university_supervisor', 'coordinator')
    )
  );

CREATE POLICY "All authenticated users can read signatures"
  ON public.logbook_signatures
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- email_queue: only service role and coordinators interact
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coordinators can view email queue"
  ON public.email_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'coordinator'
    )
  );
;