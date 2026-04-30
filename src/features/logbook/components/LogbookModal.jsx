import { useCallback, useEffect, useRef, useState } from "react";
import {
  X, Send, Clock, AlertTriangle, MessageSquare,
  ChevronLeft, ChevronRight, RotateCcw,
} from "lucide-react";
import { logbookService } from "../../../services/logbookService";
import { UserAuth } from "../../../context/AuthContext";
import Button from "../../../components/ui/Button";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import StatusBadge from "../../../components/ui/StatusBadge";
import TabBar from "../../../components/ui/TabBar";
import SaveIndicator from "../../../components/ui/SaveIndicator";
import DigitalStamp from "../../../components/ui/DigitalStamp";
import Textarea from "../../../components/ui/Textarea";
import DailyEntryRow from "./DailyEntryRow";


// 900ms debounce for auto-save
function useDebounce(fn, delay = 900) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn]);
}

const fmt = (d, opts) =>
  d ? new Date(d).toLocaleDateString("en-GB", opts || { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function LogbookModal({ week, onClose, onStatusUpdate }) {
  const { user } = UserAuth();

  const [days,          setDays]         = useState([]);
  const [signature,     setSignature]    = useState(null);
  const [loading,       setLoading]      = useState(true);
  const [activeDay,     setActiveDay]    = useState(0);
  const [summary,       setSummary]      = useState(week.student_summary || "");
  const [summaryOpen,   setSummaryOpen]  = useState(false);
  const [saveStatus,    setSaveStatus]   = useState(null);
  const [submitError,   setSubmitError]  = useState(null);
  const [submitting,    setSubmitting]   = useState(false);
  const [reopening,     setReopening]    = useState(false);
  const [confirmOpen,   setConfirmOpen]  = useState(false);

  const isLocked  = week.status === "submitted" || week.status === "approved";
  const isFlagged = week.status === "action_needed";
  const currentDay = days[activeDay] ?? null;

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await logbookService.getWeekDetails(week.id);
        if (!alive) return;
        setDays(data.daily_logs);
        setSignature(data.signature);
        setSummary(data.student_summary || "");
      } catch (e) {
        console.error("Week detail load failed:", e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [week.id]);

  // ── Auto-save daily log ───────────────────────────────────────────────────
  const persistDay = useCallback(async (logId, updated) => {
    setSaveStatus("saving");
    try {
      await logbookService.updateDailyLog(logId, updated);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, []);

  const debouncedSave = useDebounce(persistDay, 900);

  const handleUpdateDay = (logId, field, value) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== logId) return d;
        const updated = { ...d, [field]: value };
        debouncedSave(logId, updated);
        return updated;
      })
    );
  };

  const handleTemplateChange = async (logId, newType) => {
    try {
      await logbookService.changeDayTemplate(logId, newType);
      setDays((prev) =>
        prev.map((d) =>
          d.id === logId
            ? { ...d, template_type: newType, activity_details: "", tasks_completed: "", learning_outcomes: "", challenges: "" }
            : d
        )
      );
    } catch (e) {
      console.error("Template switch failed:", e.message);
    }
  };

  // ── Summary auto-save ─────────────────────────────────────────────────────
  const debouncedSummary = useDebounce(
    (val) => logbookService.saveStudentSummary(week.id, val),
    1200
  );
  const handleSummaryChange = (e) => {
    const val = e.target.value;
    setSummary(val);
    debouncedSummary(val);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await logbookService.submitWeek(week.id, summary);
      onStatusUpdate(week.id, "submitted");
      onClose();
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  };

  // ── Reopen flagged ────────────────────────────────────────────────────────
  const handleReopen = async () => {
    setReopening(true);
    try {
      await logbookService.reopenFlaggedWeek(week.id);
      onStatusUpdate(week.id, "draft");
      onClose();
    } catch (e) {
      console.error("Reopen failed:", e.message);
      setReopening(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalHours = days.reduce((a, d) => a + Number(d.hours_worked || 0), 0);
  // Per-day lock reasons (independent of week-level isLocked)
  //   "future"     — log_date is after today, student can't log ahead
  //   "pre-start"  — log_date is before the placement start date
  //   null         — day is writable (subject to isLocked)
  const getDayLockReason = (day) => {
    // Parse all dates as LOCAL midnight to avoid UTC offset treating
    // tomorrow's date as today (or today's as yesterday) in UTC+2.
    const parseLocal = (str) => {
      const [y, m, d] = String(str).split("T")[0].split("-").map(Number);
      return new Date(y, m - 1, d); // local midnight, no UTC shift
    };

    const today   = new Date();
    today.setHours(0, 0, 0, 0);

    const logDate = parseLocal(day.log_date);

    // Strictly tomorrow or later — student cannot log ahead
    if (logDate > today) return "future";

    // Before placement commencement — attachment hadn't begun yet
    if (week.start_date) {
      const startDate = parseLocal(week.start_date);
      if (logDate < startDate) return "pre-start";
    }

    return null;
  };

  const dayFilled     = (d) => !!(d?.activity_details?.trim() || d?.tasks_completed?.trim());
  const writableDays  = days.filter((d) => !getDayLockReason(d));
  const filledCount   = writableDays.filter(dayFilled).length;
  const writableCount = writableDays.length;

  // Week-level future check — summary should not be writable if week hasn't started
  const isWeekFuture = (() => {
    if (!week.start_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = week.start_date.split("-").map(Number);
    const startDay = new Date(y, m - 1, d);
    return startDay > today;
  })();

  const tabItems = days.map((d, i) => {
    const lockReason = getDayLockReason(d);
    const shortLabel = d.day_of_week?.slice(0, 3) || `D${i + 1}`;
    return {
      key:      String(i),
      label:    shortLabel,
      sublabel: fmt(d.log_date, { day: "numeric", month: "short" }),
      dot:      !lockReason && dayFilled(d),
      // Never set disabled=true on tabs — all days must be clickable
      // so students can see why a day is locked. Visual dimming is
      // handled inside DailyEntryRow via dayLockReason.
      locked:   !!lockReason, // passed as visual hint only, not HTML disabled
    };
  });

  return (
    <>
      <div
        className="fixed inset-0 bg-brand-950/55 backdrop-blur-sm z-50 flex items-center
          justify-center p-4 animate-in fade-in duration-200"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col
          shadow-2xl shadow-black/20 animate-in zoom-in-95 slide-in-from-bottom-3 duration-200">

          {/* ══ HEADER ═════════════════════════════════════════════════════ */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4
            border-b border-gray-200">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-display text-2xl font-bold text-brand-900">
                  Week {week.week_number}
                </h2>
                <StatusBadge status={week.status} />
              </div>
              <p className="text-sm text-gray-500 font-medium">
                {fmt(week.start_date)} – {fmt(week.end_date)}
                {week.due_date && !isLocked && (
                  <span className="ml-2 text-amber-600 font-semibold">
                    · Due {fmt(week.due_date)}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <SaveIndicator status={saveStatus} />
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-brand-900
                  hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* ══ SUPERVISOR FEEDBACK BANNER ════════════════════════════════ */}
          {isFlagged && week.supervisor_comments && (
            <div className="mx-6 mt-4 flex items-start gap-3 p-4 rounded-2xl
              bg-red-50 border border-red-200">
              <AlertTriangle size={15} className="text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-black text-red-700 uppercase tracking-widest mb-1">
                  Supervisor Feedback
                </p>
                <p className="text-sm text-red-800 leading-snug">
                  {week.supervisor_comments}
                </p>
              </div>
            </div>
          )}

          {/* ══ DIGITAL STAMP ════════════════════════════════════════════ */}
          {week.status === "approved" && signature && (
            <div className="mx-6 mt-4">
              <DigitalStamp
                signerName={signature.signer_name}
                signerTitle={signature.signer_title}
                signerRole={signature.signer_role}
                signedAt={signature.signed_at}
              />
            </div>
          )}

          {/* ══ BODY ══════════════════════════════════════════════════════ */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-500
                    border-t-transparent animate-spin mx-auto" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Loading entries…
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Stats + day tabs */}
                <div className="px-6 pt-5 pb-0 space-y-4">
                  {/* Quick stats */}
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Filled
                      </span>
                      <span className={`text-sm font-black
                        ${filledCount === writableCount ? "text-emerald-600" : "text-brand-700"}`}>
                        {filledCount}/{writableCount}
                      </span>
                    </div>
                    <div className="w-px h-3 bg-gray-200" />
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-sm font-black text-brand-700">{totalHours}</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        hrs
                      </span>
                    </div>
                  </div>

                  {/* Day tabs */}
                  <TabBar
                    tabs={tabItems}
                    activeKey={String(activeDay)}
                    onChange={(k) => setActiveDay(Number(k))}
                    fullWidth
                  />
                </div>

                {/* Day content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-4">
                  {/* Prev / next nav */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setActiveDay((p) => Math.max(0, p - 1))}
                      disabled={activeDay === 0}
                      className="flex items-center gap-1 text-xs font-bold text-gray-500
                        hover:text-brand-700 disabled:opacity-25 disabled:cursor-not-allowed
                        transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {days[activeDay]?.day_of_week?.slice(0, 3) || `Day ${activeDay + 1}`} · Day {activeDay + 1} of {days.length}
                    </p>
                    <button
                      onClick={() => setActiveDay((p) => Math.min(days.length - 1, p + 1))}
                      disabled={activeDay === days.length - 1}
                      className="flex items-center gap-1 text-xs font-bold text-gray-500
                        hover:text-brand-700 disabled:opacity-25 disabled:cursor-not-allowed
                        transition-colors cursor-pointer"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* Active day entry */}
                  {currentDay && (
                    <DailyEntryRow
                      day={currentDay}
                      onUpdate={handleUpdateDay}
                      onTemplateChange={handleTemplateChange}
                      isLocked={isLocked}
                      dayLockReason={isLocked ? null : getDayLockReason(currentDay)}
                    />
                  )}

                  {/* Weekly summary (collapsible) */}
                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setSummaryOpen((o) => !o)}
                      className="w-full flex items-center justify-between px-5 py-3
                        bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare size={13} className="text-gray-500" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-600">
                          Weekly Reflection
                        </span>
                        {summary?.trim() && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold">
                        {summaryOpen ? "Collapse ↑" : "Expand ↓"}
                      </span>
                    </button>

                    {summaryOpen && (
                      <div className="px-5 py-4">
                        <Textarea
                          label="Overall summary for this week"
                          placeholder={isWeekFuture ? "This week hasn't started yet." : "Reflect on the week as a whole — key achievements, what surprised you, what you'd do differently…"}
                          value={summary}
                          onChange={handleSummaryChange}
                          rows={4}
                          disabled={isLocked || isWeekFuture}
                          maxLength={1500}
                          showCount={!isLocked && !isWeekFuture}
                          helperText={isWeekFuture ? "Weekly reflection unlocks once this week begins." : undefined}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ══ FOOTER ════════════════════════════════════════════════════ */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-3xl">
            {submitError && (
              <div className="mb-3 flex items-start gap-2 p-3 bg-red-50 border
                border-red-200 rounded-xl">
                <AlertTriangle size={13} className="text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 leading-snug">{submitError}</p>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm">
                <Clock size={14} className="text-gray-400" />
                <span className="text-gray-500">Total:</span>
                <span className="font-black text-brand-900">{totalHours} hrs</span>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose}>
                  {isLocked ? "Close" : "Save & Exit"}
                </Button>

                {isFlagged && (
                  <Button variant="secondary" loading={reopening} onClick={handleReopen}>
                    <RotateCcw size={14} /> Edit & Resubmit
                  </Button>
                )}

                {!isLocked && !isFlagged && !isWeekFuture && (
                  <Button
                    variant="primary"
                    loading={submitting}
                    onClick={() => { setSubmitError(null); setConfirmOpen(true); }}
                  >
                    <Send size={14} /> Submit Week
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSubmit}
        title="Submit Week for Review?"
        message="Once submitted, entries are locked until your supervisor reviews them. Make sure every day has at least a brief entry."
        confirmText="Submit Week"
        type="warning"
      />
    </>
  );
}