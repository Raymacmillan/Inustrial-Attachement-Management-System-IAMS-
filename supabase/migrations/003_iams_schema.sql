
-- ============================================================
-- IAMS Migration 003
-- ============================================================

-- ── Add template_type to daily_logs ───────────────────────────────────────────
-- Persists which logbook template the student selected for each day.
-- Defaults to 'standard' so existing rows are unaffected.
ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS template_type text NOT NULL DEFAULT 'standard'
    CHECK (template_type IN ('standard', 'technical', 'soft_skills'));
