---
name: Recurring Accessibility and Consistency Violations
description: Systemic issues found across student portal, logbook feature, and supervisor portals during initial audit
type: project
---

## Systemic accessibility gaps
1. Icon-only buttons (close X, back chevron, prev/next navigation) universally missing `aria-label` — affects LogbookModal, WeekViewModal, WeekReviewModal, UniversitySupervisorPortal, IndustrialSupervisorPortal
2. Modal dialogs missing `role="dialog"`, `aria-modal="true"`, `aria-labelledby` — all four modal components affected
3. Loading spinners with no `role="status"` or `aria-live` — screen readers receive no announcement
4. Student avatars in supervisor portals rendered as initials (text nodes, not `<img>`) with `alt=""` — acceptable, but the conditional `<img>` branch also uses `alt=""` which loses student name context for supervisors
5. `window.confirm()` used in Profile.jsx line 98 for document deletion — bypasses `ConfirmModal` pattern used everywhere else

## Visual consistency gaps
1. Bottom page padding inconsistent: `pb-32` (Dashboard, AssessmentReports), `pb-24` (Profile, LogbookManager, Preferences), `pb-20` (both supervisor portals)
2. Placement card in Dashboard.jsx uses `rounded-lg` (line 200) instead of `rounded-2xl` — breaks card pattern
3. Preferences.jsx uses `window.innerWidth < 768` for responsive fullWidth Button (line 370) — not SSR-safe; should use CSS responsive classes
4. `ScoreInput` component is copy-pasted identically in both UniversitySupervisorPortal.jsx and IndustrialSupervisorPortal.jsx — should be extracted to `src/components/ui/`

## UX flow gaps
1. Profile.jsx handleDeleteDoc uses native `window.confirm` instead of `ConfirmModal` — inconsistent with all other destructive actions
2. Preferences.jsx "Back to Dashboard" uses a raw `<button>` instead of the `Button` component with ghost variant — inconsistent with Profile.jsx which also uses raw `<button>` for the same action
3. LogbookManager.jsx progress bar legend color dots (line 277-280) are `<span>` with only color as the differentiator — WCAG 1.3.1 failure, no text label is paired within the dot element itself (text is adjacent, so partially mitigated)

**Why:** These are the most impactful issues to fix first in future sessions.
**How to apply:** Prioritize modal ARIA, icon-only aria-labels, window.confirm replacement, and the rounded-lg card anomaly.
