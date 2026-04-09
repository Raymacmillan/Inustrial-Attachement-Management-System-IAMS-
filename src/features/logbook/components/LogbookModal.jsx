import { useEffect, useState } from "react";
import { X, Send, Save, Clock, CheckCircle } from "lucide-react";
import { logbookService } from "../../../services/logbookService";
import Button from "../../../components/ui/Button";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import DailyEntryRow from "./DailyEntryRow";

export default function LogbookModal({ week, onClose, onStatusUpdate }) {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const isLocked = week.status === "submitted" || week.status === "approved";

  useEffect(() => {
    const fetchDays = async () => {
      try {
        const data = await logbookService.getWeekDetails(week.id);
        setDays(data.daily_logs);
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
        activity_details: currentDay.activity_details,
        hours_worked: currentDay.hours_worked,
      });
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await logbookService.submitWeek(week.id);
      onStatusUpdate(week.id, "submitted");
      onClose();
    } catch (err) {
      console.error("Submission failed:", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalHours = days.reduce(
    (acc, curr) => acc + Number(curr.hours_worked || 0),
    0
  );

  return (
    <>
      <div className="fixed inset-0 bg-brand-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">

          {/* ── Header ── */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-3xl">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="font-display text-2xl font-bold text-brand-900">
                  Week {week.week_number} Logbook
                </h2>
                {isLocked && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle size={10} /> {week.status}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 font-medium">
                {isLocked
                  ? "This week has been submitted and is read-only."
                  : "Log your daily activities. Changes are auto-saved."}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-400 hover:text-brand-900 cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>

          {/* ── Content ── */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-pulse text-brand-600 font-bold text-sm uppercase tracking-widest">
                  Loading entries...
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Column headers — desktop only */}
                <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] uppercase font-black text-gray-400 tracking-widest px-1 pb-2 border-b border-gray-100">
                  <div className="col-span-2">Day</div>
                  <div className="col-span-8">Activity & Tasks</div>
                  <div className="col-span-2 text-center">Hours</div>
                </div>
                {days.map((day) => (
                  <DailyEntryRow
                    key={day.id}
                    day={day}
                    onUpdate={handleUpdateDay}
                    isLocked={isLocked}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <Clock size={16} className="text-brand-400" />
              Weekly Total:
              <span className="font-black text-brand-900 text-base">
                {totalHours} hrs
              </span>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <Button
                variant="ghost"
                onClick={onClose}
                fullWidth
                className="md:w-auto"
              >
                <Save size={15} />
                Save & Exit
              </Button>

              {!isLocked && (
                <Button
                  variant="primary"
                  loading={submitting}
                  onClick={() => setIsConfirmOpen(true)}
                  fullWidth
                  className="md:w-auto"
                >
                  <Send size={15} />
                  Submit Week
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm Submit Modal ── */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSubmit}
        title="Submit Week for Review?"
        message="Once submitted you won't be able to edit this week until your supervisor reviews it. Make sure all entries are complete."
        confirmText="Submit Week"
        type="warning"
      />
    </>
  );
}