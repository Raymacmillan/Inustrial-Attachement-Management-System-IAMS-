import { useEffect, useState } from "react";
import { X, Send, Save, Clock, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { logbookService } from "../../../services/logbookService";
import Button from "../../../components/ui/Button";
import TabBar from "../../../components/ui/TabBar";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import DailyEntryRow from "./DailyEntryRow";

export default function LogbookModal({ week, onClose, onStatusUpdate }) {
  const [days,           setDays]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeIdx,      setActiveIdx]      = useState(0);
  const [submitting,     setSubmitting]     = useState(false);
  const [isConfirmOpen,  setIsConfirmOpen]  = useState(false);
  const [isWarningOpen,  setIsWarningOpen]  = useState(false);
  const [incompleteDays, setIncompleteDays] = useState([]);
  const [submitError,    setSubmitError]    = useState("");

  // Only approved is truly locked — submitted and action_needed stay editable
  const isLocked    = week.status === "approved";
  const isFlagged   = week.status === "action_needed";
  const canResubmit = week.status === "submitted" || isFlagged;

  useEffect(() => {
    const fetchDays = async () => {
      try {
        const data = await logbookService.getWeekDetails(week.id);
        setDays(data.daily_logs || []);
        setActiveIdx(0);
      } catch (err) {
        console.error("Failed to load days", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDays();
  }, [week.id]);

  const handleUpdateDay = async (logId, field, value) => {
    const updatedDays = days.map((d) =>
      d.id === logId ? { ...d, [field]: value } : d
    );
    setDays(updatedDays);
    try {
      const currentDay = updatedDays.find((d) => d.id === logId);
      await logbookService.updateDailyLog(logId, {
        activity_details:  currentDay.activity_details,
        tasks_completed:   currentDay.tasks_completed,
        learning_outcomes: currentDay.learning_outcomes,
        challenges:        currentDay.challenges,
        hours_worked:      currentDay.hours_worked,
        template_type:     currentDay.template_type,
      });
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  };

  // Check for incomplete writable days before showing submit modal
  const handleSubmitClick = () => {
    setSubmitError("");
    const missing = days.filter((d) => {
      const hasContent = d.activity_details?.trim() || d.tasks_completed?.trim();
      const logDate    = new Date(d.log_date + "T00:00:00");
      const today      = new Date(); today.setHours(0, 0, 0, 0);
      const isFuture   = logDate > today;
      const isPreStart = week.start_date
        ? logDate < new Date(week.start_date + "T00:00:00") : false;
      return !isFuture && !isPreStart && !hasContent;
    });

    if (missing.length > 0) {
      setIncompleteDays(missing.map((d) => d.day_of_week));
      setIsWarningOpen(true);
    } else {
      setIsConfirmOpen(true);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    setIsConfirmOpen(false);
    setIsWarningOpen(false);
    try {
      await logbookService.submitWeek(week.id);
      onStatusUpdate(week.id, "submitted");
      onClose();
    } catch (err) {
      setSubmitError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentDay = days[activeIdx];
  const totalHours = days.reduce((acc, d) => acc + Number(d.hours_worked || 0), 0);

  const fmt = (dateStr) => dateStr
    ? new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";

  // Build tab items with dot indicator for completion state
  const tabItems = days.map((d, i) => {
    const hasContent = !!(d.activity_details?.trim() || d.tasks_completed?.trim());
    const logDate    = new Date(d.log_date + "T00:00:00");
    const today      = new Date(); today.setHours(0, 0, 0, 0);
    const isFuture   = logDate > today;
    const isPreStart = week.start_date
      ? logDate < new Date(week.start_date + "T00:00:00") : false;
    const isWritable = !isFuture && !isPreStart;

    return {
      key:      String(i),
      label:    d.day_of_week?.slice(0, 3) || `D${i + 1}`,
      sublabel: new Date(d.log_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      dot:      isWritable ? hasContent : undefined,
      disabled: (!isWritable) && isLocked,
    };
  });

  return (
    <>
      <div className="fixed inset-0 bg-brand-900/60 backdrop-blur-sm flex items-center
        justify-center p-4 z-50 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col
          shadow-2xl animate-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center
            justify-between bg-gray-50 rounded-t-3xl">
            <div>
              <div className="flex items-center gap-2.5 mb-0.5">
                <h2 className="font-display text-xl font-bold text-brand-900">
                  Week {week.week_number} Logbook
                </h2>
                {week.status !== "draft" && (
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg
                    text-[10px] font-black uppercase tracking-widest border
                    ${isLocked
                      ? "bg-brand-100 border-brand-100 text-brand-600"
                      : isFlagged
                      ? "bg-red-50 border-red-100 text-red-600"
                      : "bg-amber-50 border-amber-100 text-amber-600"
                    }`}>
                    <CheckCircle size={9} />
                    {isLocked ? "Approved" : isFlagged ? "Needs Revision" : "Submitted"}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium">
                {fmt(week.start_date)} to {fmt(week.end_date)}
                {isLocked      ? " · Approved and locked"
                : isFlagged    ? " · Address supervisor feedback and resubmit"
                : canResubmit  ? " · You can still edit and resubmit"
                :                " · Auto-saves as you type"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-400
                hover:text-brand-900 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Supervisor feedback banner */}
          {isFlagged && week.supervisor_comments && (
            <div className="mx-6 mt-4 flex items-start gap-2.5 p-3.5 bg-red-50
              border border-red-100 rounded-2xl">
              <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-0.5">
                  Supervisor Feedback
                </p>
                <p className="text-sm text-red-700 leading-relaxed">{week.supervisor_comments}</p>
              </div>
            </div>
          )}

          {/* Day tabs */}
          {!loading && days.length > 0 && (
            <div className="px-6 pt-4">
              <TabBar
                tabs={tabItems}
                activeKey={String(activeIdx)}
                onChange={(key) => setActiveIdx(Number(key))}
                fullWidth
                size="sm"
              />
            </div>
          )}

          {/* Active day entry */}
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-pulse text-brand-600 font-bold text-sm uppercase tracking-widest">
                  Loading entries...
                </div>
              </div>
            ) : currentDay ? (
              <DailyEntryRow
                key={currentDay.id}
                day={currentDay}
                onUpdate={handleUpdateDay}
                isLocked={isLocked}
                weekStartDate={week.start_date}
              />
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl
            flex flex-col gap-3">

            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertTriangle size={13} className="text-danger shrink-0" />
                <p className="text-xs text-danger font-medium">{submitError}</p>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                {/* Total hours */}
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock size={15} className="text-brand-400" />
                  <span className="font-black text-brand-900">{totalHours}</span>
                  <span className="font-medium">hrs total</span>
                </div>
                {/* Prev / Next buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                    disabled={activeIdx === 0}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400
                      hover:text-brand-900 disabled:opacity-30 disabled:cursor-not-allowed
                      transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setActiveIdx((i) => Math.min(days.length - 1, i + 1))}
                    disabled={activeIdx === days.length - 1}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400
                      hover:text-brand-900 disabled:opacity-30 disabled:cursor-not-allowed
                      transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5">
                <Button variant="ghost" onClick={onClose}>
                  <Save size={14} /> Save & Exit
                </Button>
                {!isLocked && (
                  <Button variant="primary" loading={submitting} onClick={handleSubmitClick}>
                    <Send size={14} />
                    {canResubmit ? "Resubmit Week" : "Submit Week"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Standard confirm — all days filled */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSubmit}
        title={canResubmit ? "Resubmit Week for Review?" : "Submit Week for Review?"}
        message={canResubmit
          ? "Your updated logbook will be sent to your supervisor. You can still edit until they approve it."
          : "Your logbook will be sent to your supervisor. You can still edit and resubmit until they approve it."}
        confirmText={canResubmit ? "Resubmit Week" : "Submit Week"}
        type="warning"
      />

      {/* Incomplete warning — some writable days have no content */}
      <ConfirmModal
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        onConfirm={handleSubmit}
        title="Some Days Have No Entries"
        message={`The following days have no entries: ${incompleteDays.join(", ")}.\n\nThis logbook is part of your industrial attachment assessment and will be reviewed by your supervisor. Incomplete days may affect your evaluation.\n\nYou can go back and complete them, or submit as-is.`}
        confirmText="Submit Anyway"
        cancelText="Go Back & Complete"
        type="warning"
      />
    </>
  );
}