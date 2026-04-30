/**
 * StatusBadge — IAMS
 *
 * Single source of truth for every status label + colour in the system.
 * Covers logbook weeks, placements, supervisor reports, and invitations.
 *
 * Usage:
 *   <StatusBadge status="approved" />
 *   <StatusBadge status="action_needed" size="lg" dot={false} />
 *   <StatusBadge status="submitted" className="ml-2" />
 *
 * Props:
 *   status    — DB status string (unknown values fall back to "default")
 *   dot       — show coloured leading dot (default true)
 *   size      — "sm" | "md" | "lg"  (default "md")
 *   className — extra tailwind classes
 */

const CFG = {
  // ── Logbook week ────────────────────────────────────────────
  draft:          { label: "Draft",          dot: "bg-gray-400",    pill: "bg-gray-100   text-gray-700   ring-gray-200"      },
  submitted:      { label: "Pending Review", dot: "bg-amber-500",   pill: "bg-amber-100  text-amber-800  ring-amber-300"     },
  action_needed:  { label: "Action Needed",  dot: "bg-red-500",     pill: "bg-red-100    text-red-800    ring-red-300"       },
  approved:       { label: "Approved",       dot: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-800 ring-emerald-300" },

  // ── Student / placement ──────────────────────────────────────
  pending:        { label: "Pending",        dot: "bg-gray-400",    pill: "bg-gray-100   text-gray-700   ring-gray-200"      },
  matched:        { label: "Matched",        dot: "bg-blue-500",    pill: "bg-blue-100   text-blue-800   ring-blue-300"      },
  allocated:      { label: "Allocated",      dot: "bg-violet-500",  pill: "bg-violet-100 text-violet-800 ring-violet-300"    },
  completed:      { label: "Completed",      dot: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-800 ring-emerald-300" },
  active:         { label: "Active",         dot: "bg-brand-500",   pill: "bg-brand-100  text-brand-800  ring-brand-300"     },
  terminated:     { label: "Terminated",     dot: "bg-red-500",     pill: "bg-red-100    text-red-800    ring-red-300"       },

  // ── Supervisor report ────────────────────────────────────────
  sent:           { label: "Sent",           dot: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-800 ring-emerald-300" },
  failed:         { label: "Failed",         dot: "bg-red-500",     pill: "bg-red-100    text-red-800    ring-red-300"       },

  // ── Invitation ───────────────────────────────────────────────
  accepted:       { label: "Accepted",       dot: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-800 ring-emerald-300" },
  expired:        { label: "Expired",        dot: "bg-gray-400",    pill: "bg-gray-100   text-gray-500   ring-gray-200"      },

  // ── Vacancy ──────────────────────────────────────────────────
  open:           { label: "Open",           dot: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-800 ring-emerald-300" },
  closed:         { label: "Closed",         dot: "bg-gray-400",    pill: "bg-gray-100   text-gray-600   ring-gray-200"      },

  // ── Fallback ─────────────────────────────────────────────────
  default:        { label: "Unknown",        dot: "bg-gray-300",    pill: "bg-gray-100   text-gray-500   ring-gray-200"      },
};

const SIZE = {
  sm: { wrap: "text-[9px]  px-2   py-0.5 gap-1   tracking-[0.12em]", dot: "w-1 h-1"   },
  md: { wrap: "text-[10px] px-2.5 py-1   gap-1.5 tracking-[0.14em]", dot: "w-1.5 h-1.5" },
  lg: { wrap: "text-xs     px-3   py-1.5 gap-2   tracking-wide",      dot: "w-2 h-2"   },
};

export default function StatusBadge({ status, dot = true, size = "md", className = "" }) {
  const key = (status || "default").toLowerCase().replace(/[\s-]+/g, "_");
  const cfg = CFG[key] || CFG.default;
  const sz  = SIZE[size] || SIZE.md;

  return (
    <span className={`inline-flex items-center font-black uppercase rounded-full ring-1
      ${cfg.pill} ${sz.wrap} ${className}`}>
      {dot && <span className={`rounded-full shrink-0 ${cfg.dot} ${sz.dot}`} />}
      {cfg.label}
    </span>
  );
}