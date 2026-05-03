import { Clock } from "lucide-react";
import SegmentedControl from "../../../components/ui/SegmentedControl";
import Textarea from "../../../components/ui/Textarea";
import {
  TEMPLATE_OPTIONS,
  TEMPLATE_ACCENT,
  TEMPLATE_FIELDS,
} from "../../../constants/logbooktemplates";

// ── Day lock reason labels ────────────────────────────────────────────────────
const DAY_LOCK_LABEL = {
  future:      { badge: "Not yet",      hint: "This day hasn't arrived yet. Come back then to fill in your entry." },
  "pre-start": { badge: "Before start", hint: "Your attachment hadn't started on this day. No entry needed."      },
};

/**
 * DailyEntryRow — IAMS Logbook
 *
 * Renders one day's entry inside LogbookModal.
 * Template drives which fields appear — one template active per day.
 * All fields map 1-to-1 to daily_logs columns in the DB.
 *
 * DB columns used per template:
 *   standard:    activity_details
 *   technical:   tasks_completed, learning_outcomes, challenges
 *   soft_skills: activity_details, learning_outcomes, challenges
 *
 * The other columns are kept empty (not deleted) so the row is always complete.
 */


export default function DailyEntryRow({ day, onUpdate, onTemplateChange, isLocked, dayLockReason }) {
  // dayLockReason: "future" | "pre-start" | null
  // isLocked:       week-level lock (submitted / approved)
  // effectiveLock:  fields are non-editable for any reason
  const effectiveLock = isLocked || !!dayLockReason;
  const lockInfo      = dayLockReason ? DAY_LOCK_LABEL[dayLockReason] : null;

  const fields  = TEMPLATE_FIELDS[day.template_type] || TEMPLATE_FIELDS.standard;
  const accent  = TEMPLATE_ACCENT[day.template_type] || "brand";

  const dateLabel = new Date(day.log_date).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  const handleField = (key, value) => {
    if (effectiveLock) return;
    onUpdate(day.id, key, value);
  };

  const handleTemplate = (key) => {
    if (effectiveLock || key === day.template_type) return;
    onTemplateChange(day.id, key);
  };

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-150
      ${dayLockReason
        ? "bg-gray-50/70 border-gray-100 opacity-75"
        : isLocked
        ? "bg-gray-50 border-gray-200"
        : "bg-white border-gray-200 hover:border-gray-300"
      }`}>

      {/* ── Day header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3
        px-5 py-4 border-b border-gray-200 bg-gray-50">

        {/* Day + date + lock badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <p className={`text-sm font-black ${dayLockReason ? "text-gray-400" : "text-brand-900"}`}>
              {day.day_of_week}
            </p>
            <p className="text-[11px] text-gray-500 font-medium">{dateLabel}</p>
          </div>

          {/* Day-level lock reason badge */}
          {lockInfo && (
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5
              rounded-full border
              ${dayLockReason === "future"
                ? "bg-blue-50 text-blue-600 border-blue-100"
                : "bg-gray-100 text-gray-500 border-gray-200"
              }`}>
              {lockInfo.badge}
            </span>
          )}
        </div>

        {/* Template + hours — hidden or muted when day is locked */}
        {!dayLockReason && (
          <div className="flex items-center gap-3 flex-wrap">
            <SegmentedControl
              options={TEMPLATE_OPTIONS}
              value={day.template_type || "standard"}
              onChange={handleTemplate}
              accent={accent}
              size="sm"
              disabled={effectiveLock}
            />
            <div className="flex items-center gap-2 bg-white border border-gray-200
              rounded-xl px-3 py-1.5">
              <Clock size={12} className="text-gray-400 shrink-0" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Hrs
              </span>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                disabled={effectiveLock}
                value={day.hours_worked ?? 8}
                onChange={(e) => handleField("hours_worked", e.target.value)}
                className={`w-10 text-sm font-black text-center bg-transparent outline-none
                  ${effectiveLock ? "text-gray-400 cursor-not-allowed" : "text-brand-900"}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Day-locked placeholder ──────────────────────── */}
      {lockInfo ? (
        <div className="px-5 py-6 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
            ${dayLockReason === "future" ? "bg-blue-50" : "bg-gray-100"}`}>
            <Clock size={15} className={dayLockReason === "future" ? "text-blue-400" : "text-gray-400"} />
          </div>
          <p className="text-sm text-gray-400 leading-snug">{lockInfo.hint}</p>
        </div>
      ) : (
        /* ── Editable / read-only fields ─────────────────── */
        <div className="px-5 py-4 space-y-4">
          {fields.map(({ key, label, placeholder, rows }) => (
            <Textarea
              key={key}
              label={label}
              placeholder={effectiveLock ? "—" : placeholder}
              value={day[key] || ""}
              onChange={(e) => handleField(key, e.target.value)}
              rows={rows}
              disabled={effectiveLock}
              maxLength={2000}
              showCount={!effectiveLock}
            />
          ))}
        </div>
      )}
    </div>
  );
}