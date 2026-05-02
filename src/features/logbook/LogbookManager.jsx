import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ClipboardList, ArrowLeft, Sparkles, Clock, AlertTriangle, Eye } from "lucide-react";
import { logbookService } from "../../services/logbookService";
import { getStudentProfile } from "../../services/studentService";
import { UserAuth } from "../../context/AuthContext";
import EmptyState from "../../components/ui/EmptyState";
import WeekCard from "./components/WeekCard";
import LogbookModal from "./components/LogbookModal";
import { LogbookPDFDownload, LogbookPreviewModal, useLogbookWeeks } from "./components/LogbookPDF";

// Status → progress bar colour
const BAR_COLOR = {
  draft:         "bg-gray-300",
  submitted:     "bg-amber-500",
  action_needed: "bg-red-500",
  approved:      "bg-emerald-500",
};

export default function LogbookManager() {
  const { user }  = UserAuth();
  const navigate  = useNavigate();

  const [placement,    setPlacement]    = useState(null);
  const [student,      setStudent]      = useState(null);
  const [weeks,        setWeeks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [selectedWeek,  setSelectedWeek]  = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch all weeks with daily_logs for PDF export — runs after placement loads
  const { weeks: fullWeeks, loading: weeksLoading } = useLogbookWeeks(placement);

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let alive = true;

    (async () => {
      try {
        const [p, s] = await Promise.all([
          logbookService.getActivePlacement(user.id),
          getStudentProfile(user.id),
        ]);
        if (!alive) return;
        setPlacement(p);
        setStudent(s);
        if (p) {
          const w = await logbookService.getStudentWeeks(user.id);
          if (alive) setWeeks(w);
        }
      } catch (e) {
        console.warn("Logbook load:", e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [user]);

  // For week 1: pass the actual placement start date so initializeWeek
  // stores it as start_date (used by the pre-start lock).
  // For week 2+: pass the Monday of that calendar week.
  const getWeekStartDate = (weekNum) => {
    if (!placement?.start_date) return null;
    const [year, month, day] = placement.start_date.split("-").map(Number);
    const placementStart = new Date(year, month - 1, day);

    if (weekNum === 1) {
      placementStart.setHours(0, 0, 0, 0);
      return placementStart;
    }

    // Find the Monday of week 1, then add (weekNum-1)*7 days
    const dow = placementStart.getDay();
    const daysToMonday = dow === 0 ? -6 : 1 - dow;
    const week1Monday = new Date(placementStart);
    week1Monday.setDate(placementStart.getDate() + daysToMonday);
    week1Monday.setDate(week1Monday.getDate() + (weekNum - 1) * 7);
    week1Monday.setHours(0, 0, 0, 0);
    return week1Monday;
  };

  // ── Week card action ─────────────────────────────────────────────────────
  const handleWeekAction = async (weekNum, weekData) => {
    if (!weekData) {
      const startDate = getWeekStartDate(weekNum);
      try {
        const newWeek = await logbookService.initializeWeek(
          user.id, placement.id, weekNum, startDate
        );
        setWeeks((prev) => [...prev, newWeek]);
        setSelectedWeek(newWeek);
        setIsModalOpen(true);
      } catch (err) {
        console.error("Init failed:", err.message);
        // Race condition — week was initialized by another tab; reload
        if (err.message.includes("already been initialized")) {
          const fresh = await logbookService.getStudentWeeks(user.id);
          setWeeks(fresh);
        }
      }
    } else {
      setSelectedWeek(weekData);
      setIsModalOpen(true);
    }
  };

  const handleStatusUpdate = (weekId, newStatus) => {
    setWeeks((prev) =>
      prev.map((w) => (w.id === weekId ? { ...w, status: newStatus } : w))
    );
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedWeek(null);
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalWeeks   = placement?.duration_weeks || 8;
  const approved     = weeks.filter((w) => w.status === "approved").length;
  const pending      = weeks.filter((w) => w.status === "submitted").length;
  const flagged      = weeks.filter((w) => w.status === "action_needed").length;
  const progressPct  = Math.round((approved / totalWeeks) * 100);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-brand-500" size={36} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
        Syncing logbook…
      </p>
    </div>
  );

  // ── No placement ──────────────────────────────────────────────────────────
  if (!placement) return (
    <div className="max-w-md mx-auto mt-20">
      <EmptyState
        icon={ClipboardList}
        title="No Active Placement"
        description="Your logbook unlocks once the coordinator assigns you to a host organisation. Check back after allocation."
        secondaryAction={{ label: "Dashboard", onClick: () => navigate("/student/dashboard") }}
        action={{ label: "Update Preferences", onClick: () => navigate("/student/preferences") }}
      />
    </div>
  );

  const orgName = placement.organization_profiles?.org_name || "Host Organisation";

  return (
    <div className="animate-in fade-in duration-500 pb-24 space-y-10">

      {/* ══ PAGE HEADER ════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6
        border-b border-gray-200 pb-8">

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-500 mb-2">
            Industrial Attachment · {totalWeeks} Weeks
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-brand-900 leading-tight">
            Weekly{" "}
            <span className="text-brand-600">Logbook</span>
          </h1>
          <p className="text-gray-500 text-sm font-medium mt-2">
            {orgName}
            {placement.start_date && (
              <span className="text-gray-400 ml-1.5">
                · Started{" "}
                {new Date(placement.start_date).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
            )}
          </p>
        </div>

        {/* Stat cluster */}
        <div className="flex flex-wrap gap-3 shrink-0">
          {/* Approved */}
          <div className="bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4 min-w-[140px]">
            <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1">
              Approved
            </p>
            <p className="text-3xl font-black text-brand-700 leading-none">
              {approved}
              <span className="text-sm font-bold text-brand-300 ml-1">/ {totalWeeks}</span>
            </p>
            <div className="mt-2.5 h-1.5 rounded-full bg-brand-100 overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Pending review */}
          {pending > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
              <Clock size={18} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Pending</p>
                <p className="text-2xl font-black text-amber-700 leading-none">{pending}</p>
              </div>
            </div>
          )}

          {/* Action needed */}
          {flagged > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3">
              <AlertTriangle size={18} className="text-red-500 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Action Needed</p>
                <p className="text-2xl font-black text-red-600 leading-none">{flagged}</p>
              </div>
            </div>
          )}

          {/* Preview + Export — only show once at least one week exists */}
          {weeks.length > 0 && (
            <div className="flex flex-col gap-2 justify-center">
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200
                  bg-white hover:bg-gray-50 text-brand-900 font-black text-xs
                  rounded-xl transition-all uppercase tracking-wider cursor-pointer"
              >
                <Eye size={13} /> Preview Logbook
              </button>
              <LogbookPDFDownload
                student={student}
                placement={placement}
                weeks={fullWeeks}
                loading={weeksLoading}
              />
            </div>
          )}
        </div>
      </div>

      {/* ══ PROGRESS TIMELINE ══════════════════════════════════════════════ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Attachment Progress
          </p>
          <p className="text-[10px] font-bold text-gray-500">{progressPct}% complete</p>
        </div>

        {/* Segmented bar — one cell per week */}
        <div className="flex gap-1 h-2.5">
          {Array.from({ length: totalWeeks }, (_, i) => {
            const w = weeks.find((x) => x.week_number === i + 1);
            return (
              <div
                key={i}
                title={`Week ${i + 1}${w ? ` — ${w.status}` : " — not started"}`}
                className={`flex-1 rounded-full transition-colors duration-500
                  ${w ? (BAR_COLOR[w.status] || "bg-gray-300") : "bg-gray-100"}`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap pt-0.5">
          {[
            { color: "bg-gray-300",    label: "Not started" },
            { color: "bg-amber-500",   label: "Pending review" },
            { color: "bg-red-500",     label: "Action needed" },
            { color: "bg-emerald-500", label: "Approved" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-[10px] text-gray-500 font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ WEEK GRID ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((weekNum) => {
          const weekData     = weeks.find((w) => w.week_number === weekNum);
          const weekStartDate = getWeekStartDate(weekNum);
          return (
            <WeekCard
              key={weekNum}
              weekNum={weekNum}
              weekData={weekData}
              weekStartDate={weekStartDate}
              onAction={handleWeekAction}
            />
          );
        })}
      </div>

      {/* ══ LOGBOOK ENTRY MODAL ════════════════════════════════════════════ */}
      {isModalOpen && selectedWeek && (
        <LogbookModal
          week={selectedWeek}
          onClose={handleClose}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* ══ PREVIEW & EXPORT MODAL ═════════════════════════════════════════ */}
      {isPreviewOpen && (
        <LogbookPreviewModal
          student={student}
          placement={placement}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
}