/**
 * logbookTemplates.js
 *
 * All template definitions for the daily logbook entry system.
 * Imported by DailyEntryRow and any future component that needs
 * to know about template types (e.g. supervisor view, PDF export).
 */

export const TEMPLATE_OPTIONS = [
  { key: "standard",    label: "General",     description: "Free-form daily summary" },
  { key: "technical",   label: "Technical",   description: "Tasks · Learning · Blockers" },
  { key: "soft_skills", label: "Soft Skills", description: "Interactions · Growth · Reflection" },
];

export const TEMPLATE_ACCENT = {
  standard:    "brand",
  technical:   "violet",
  soft_skills: "teal",
};

export const TEMPLATE_FIELDS = {
  standard: [
    {
      key:         "activity_details",
      label:       "What did you do today?",
      placeholder: "Walk through your day — tasks completed, meetings attended, anything you worked on or observed…",
      rows:        5,
    },
  ],
  technical: [
    {
      key:         "tasks_completed",
      label:       "Tasks completed",
      placeholder: "List what you built, fixed, reviewed, or shipped. Be specific — feature names, bug IDs, PRs merged…",
      rows:        3,
    },
    {
      key:         "learning_outcomes",
      label:       "What did you learn?",
      placeholder: "New tools, APIs, patterns, or concepts you encountered today and what clicked for you…",
      rows:        3,
    },
    {
      key:         "challenges",
      label:       "Blockers & how you handled them",
      placeholder: "What slowed you down? Did you resolve it, escalate it, or is it still open? Be honest…",
      rows:        3,
    },
  ],
  soft_skills: [
    {
      key:         "activity_details",
      label:       "Activities & interactions",
      placeholder: "Meetings, presentations, client contact, team collaboration — describe the context and your role…",
      rows:        3,
    },
    {
      key:         "learning_outcomes",
      label:       "Professional growth",
      placeholder: "Which workplace skills did you consciously practice or develop today? Communication, leadership, planning?",
      rows:        3,
    },
    {
      key:         "challenges",
      label:       "Challenges & how you responded",
      placeholder: "Communication gaps, time pressure, conflicting priorities — what was hard and how did you handle it?",
      rows:        3,
    },
  ],
};