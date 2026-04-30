import { BookOpen, Plus, AlertTriangle, Lock, RotateCcw, Calendar } from "lucide-react";
import StatusBadge from "../../../components/ui/StatusBadge";

/**
 * WeekCard — IAMS Logbook
 *
 * One card per attachment week. Clicking the card triggers onAction.
 *
 * Future-week guard: weeks whose start_date is in the future cannot be
 * initialized or opened — the card renders as locked with a calendar icon.
 *
 * This guard runs from the placement start_date passed in via LogbookManager.
 * weekStartDate is a Date object computed there, not fetched from DB (because
 * uninitialized weeks have no DB row yet).
 */

// Accent bar colour per status — darker, not pastel
const ACCENT_BAR = {
  draft:         "bg-gray-400",
  submitted:     "bg-amber-500",
  action_needed: "bg-red-500",
  approved:      "bg-emerald-500",
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—";

export default function WeekCard({ weekNum, weekData, weekStartDate, onAction }) {
  const hasData   = !!weekData;
  const isLocked  = weekData?.status === "approved";
  const isFlagged = weekData?.status === "action_needed";

  // Future-week guard — cannot start a week that hasn't arrived yet
  const today      = new Date();
  today.setHours(0, 0, 0, 0);
  const isFuture   = weekStartDate instanceof Date && weekStartDate > today;

  const isOverdue  =
    hasData &&
    weekData.due_date &&
    weekData.status === "draft" &&
    new Date(weekData.due_date) < today;

  const accentBar  = hasData ? (ACCENT_BAR[weekData.status] || "bg-gray-300") : "bg-gray-200";

  // CTA label
  const ctaLabel =
    isFuture  ? "Not yet available"
    : !hasData ? "Begin week"
    : isLocked  ? "View entries"
    : isFlagged ? "Review feedback"
    :             "Open logbook";

  const CtaIcon =
    isFuture  ? Calendar
    : isFlagged ? RotateCcw
    : hasData   ? BookOpen
    :             Plus;

  return (
    <button
      type="button"
      onClick={() => !isFuture && onAction(weekNum, weekData)}
      disabled={isFuture}
      className={`
        group relative w-full text-left rounded-2xl border-2 overflow-hidden
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-brand-500 focus-visible:ring-offset-2
        ${isFuture
          ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
          : hasData
          ? `border-gray-200 bg-white hover:border-gray-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer`
          : "border-dashed border-gray-300 bg-white hover:border-brand-400 hover:bg-brand-50/20 hover:-translate-y-1 hover:shadow-md cursor-pointer"
        }
      `}
    >
      {/* Left accent bar — solid colour, visible against white */}
      <span className={`absolute left-0 inset-y-0 w-[3px] ${accentBar}`} />

      <div className="pl-5 pr-4 py-5">
        {/* Top: week label + status badge */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400">
            Week {String(weekNum).padStart(2, "0")}
          </span>

          {hasData ? (
            <StatusBadge status={weekData.status} size="sm" />
          ) : isFuture ? (
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-wider">
              Upcoming
            </span>
          ) : null}
        </div>

        {/* Hero number — dark enough to see on white */}
        <p className={`font-display text-[56px] font-black leading-none tracking-tight mb-3
          transition-colors duration-200
          ${isFuture
            ? "text-gray-200"
            : isFlagged
            ? "text-red-400"
            : isLocked
            ? "text-emerald-400"
            : hasData
            ? "text-brand-300 group-hover:text-brand-400"
            : "text-gray-200 group-hover:text-brand-300"
          }`}>
          {String(weekNum).padStart(2, "0")}
        </p>

        {/* Date range */}
        <p className="text-xs font-semibold text-gray-500 mb-0.5">
          {hasData
            ? `${fmt(weekData.start_date)} – ${fmt(weekData.end_date)}`
            : weekStartDate
            ? `${fmt(weekStartDate)} – ${fmt(new Date(+weekStartDate + 4 * 86400000))}`
            : "Not yet started"
          }
        </p>

        {/* Due / overdue */}
        {hasData && weekData.due_date && !isLocked && (
          <p className={`text-[11px] font-bold ${isOverdue ? "text-red-600" : "text-gray-400"}`}>
            {isOverdue ? "⚠ Overdue" : `Due ${fmt(weekData.due_date)}`}
          </p>
        )}

        {/* Stamp strip for approved */}
        {isLocked && weekData.stamped_by_name && (
          <p className="text-[11px] font-bold text-emerald-600 mt-1">
            ✓ {weekData.stamped_by_name}
          </p>
        )}

        {/* CTA row */}
        <div className={`mt-5 pt-4 border-t flex items-center justify-between
          ${hasData && !isFuture ? "border-gray-200" : "border-dashed border-gray-200"}`}>
          <span className={`text-xs font-bold transition-colors
            ${isFuture
              ? "text-gray-300"
              : isFlagged
              ? "text-red-600"
              : hasData
              ? "text-brand-700 group-hover:text-brand-800"
              : "text-gray-500 group-hover:text-brand-600"
            }`}>
            {ctaLabel}
          </span>

          <span className={`w-7 h-7 rounded-full flex items-center justify-center
            transition-all duration-200 shrink-0
            ${isFuture
              ? "bg-gray-100 text-gray-300"
              : isFlagged
              ? "bg-red-100 text-red-600 group-hover:bg-red-200"
              : hasData
              ? "bg-brand-100 text-brand-600 group-hover:bg-brand-200 group-hover:translate-x-0.5"
              : "bg-gray-100 text-gray-500 group-hover:bg-brand-100 group-hover:text-brand-600"
            }`}>
            <CtaIcon size={13} />
          </span>
        </div>
      </div>
    </button>
  );
}