import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Loader2, CheckCircle, AlertTriangle, Clock,
  ChevronRight, ChevronLeft, BookOpen, FileText,
  Send, Flag, RotateCcw, X, Star,
} from "lucide-react";
import { supervisorService } from "../../services/supervisorService";
import { UserAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import DigitalStamp from "../../components/ui/DigitalStamp";
import EmptyState from "../../components/ui/EmptyState";
import Textarea from "../../components/ui/Textarea";
import ConfirmModal from "../../components/ui/ConfirmModal";

// -- Score input (1–10) --------------------------------------------------------
function ScoreInput({ label, value, onChange, disabled }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
        {label}
      </label>
      <div className="flex gap-1.5 flex-wrap">
        {[...Array(10)].map((_, i) => {
          const score = i + 1;
          const active = value === score;
          return (
            <button
              key={score}
              type="button"
              disabled={disabled}
              onClick={() => onChange(score)}
              className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer
                ${active
                  ? "bg-brand-600 text-white shadow-sm"
                  : disabled
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                  : "bg-gray-100 text-gray-500 hover:bg-brand-100 hover:text-brand-600"
                }`}
            >
              {score}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -- Week review modal ---------------------------------------------------------
function WeekReviewModal({ weekId, studentName, onClose, onUpdated }) {
  const { user } = UserAuth();
  const [week,        setWeek]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [feedback,    setFeedback]    = useState("");
  const [acting,      setActing]      = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(null);
  const [error,       setError]       = useState("");

  useEffect(() => {
    supervisorService.getWeekForReview(weekId).then((data) => {
      setWeek(data);
      setLoading(false);
    }).catch((e) => {
      setError(e.message);
      setLoading(false);
    });
  }, [weekId]);

  const handleApprove = async () => {
    setActing("approve");
    setError("");
    try {
      const { supervisor } = await supervisorService.getIndustrialSupervisorDashboard(user.id);
      await supervisorService.approveWeek(
        weekId,
        user.id,
        supervisor?.full_name || user.email,
        supervisor?.role_title || "Industrial Supervisor",
        feedback.trim() || null,
      );
      onUpdated(weekId, "approved");
      onClose();
    } catch (e) {
      setError(e.message);
      setActing(null);
    }
  };

  const handleFlag = async () => {
    if (!feedback.trim()) { setError("Please write feedback before flagging."); return; }
    setActing("flag");
    setError("");
    try {
      await supervisorService.flagWeek(weekId, feedback);
      onUpdated(weekId, "action_needed");
      onClose();
    } catch (e) {
      setError(e.message);
      setActing(null);
    }
  };

  const DAY_TEMPLATE_LABEL = { standard: "General", technical: "Technical", soft_skills: "Soft Skills" };

  const isLocked = week?.status === "approved";
  const canAct   = week?.status === "submitted";

  return (
    <>
      <div className="fixed inset-0 bg-brand-900/55 backdrop-blur-sm z-50 flex
        items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col
          shadow-2xl animate-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
            <div>
              <h2 className="font-display text-xl font-bold text-brand-900">
                Week {week?.week_number} — {studentName}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {week?.start_date && new Date(week.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                {" – "}
                {week?.end_date && new Date(week.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {week && <StatusBadge status={week.status} />}
              <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100
                hover:text-brand-900 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-brand-500" size={28} />
              </div>
            ) : (
              <>
                {/* Draft banner - supervisor is viewing live progress */}
                {week?.status === "draft" && (
                  <div className="flex items-start gap-3 p-4 bg-brand-100 border border-brand-100 rounded-2xl">
                    <Clock size={15} className="text-brand-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-brand-700 uppercase tracking-widest">
                        Live View — Not Yet Submitted
                      </p>
                      <p className="text-xs text-brand-600 mt-0.5">
                        The student is still working on this week. You can monitor progress but cannot approve or flag until they submit.
                      </p>
                    </div>
                  </div>
                )}

                {/* Digital stamp */}
                {week?.signature && (
                  <DigitalStamp
                    signerName={week.signature.signer_name}
                    signerTitle={week.signature.signer_title}
                    signerRole={week.signature.signer_role}
                    signedAt={week.signature.signed_at}
                  />
                )}

                {/* Student summary */}
                {week?.student_summary && (
                  <div className="p-4 bg-brand-100 border border-brand-100 rounded-2xl">
                    <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1">
                      Student Weekly Summary
                    </p>
                    <p className="text-sm text-brand-900 leading-relaxed">{week.student_summary}</p>
                  </div>
                )}

                {/* Daily entries */}
                <div className="space-y-3">
                  {(week?.daily_logs || []).map((log) => {
                    const hasContent = log.activity_details?.trim()
                      || log.tasks_completed?.trim()
                      || log.learning_outcomes?.trim()
                      || log.challenges?.trim();

                    return (
                      <div key={log.id} className={`rounded-2xl border overflow-hidden
                        ${hasContent ? "border-gray-100" : "border-dashed border-gray-200 opacity-60"}`}>
                        {/* Day header */}
                        <div className="flex items-center justify-between px-4 py-3
                          bg-gray-50 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="text-sm font-black text-brand-900">{log.day_of_week}</p>
                              <p className="text-[10px] text-gray-400 font-medium">
                                {new Date(log.log_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              </p>
                            </div>
                            {log.template_type && (
                              <span className="text-[10px] font-black uppercase tracking-widest
                                px-2 py-0.5 rounded-full bg-brand-100 text-brand-600 border border-brand-100">
                                {DAY_TEMPLATE_LABEL[log.template_type] || log.template_type}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-gray-400">
                            {log.hours_worked}h
                          </span>
                        </div>

                        {/* Content */}
                        <div className="px-4 py-3 space-y-3">
                          {!hasContent ? (
                            <p className="text-xs text-gray-300 italic">No entry for this day</p>
                          ) : (
                            <>
                              {log.activity_details && (
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Activity</p>
                                  <p className="text-sm text-gray-700 leading-relaxed">{log.activity_details}</p>
                                </div>
                              )}
                              {log.tasks_completed && (
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tasks Completed</p>
                                  <p className="text-sm text-gray-700 leading-relaxed">{log.tasks_completed}</p>
                                </div>
                              )}
                              {log.learning_outcomes && (
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Learning</p>
                                  <p className="text-sm text-gray-700 leading-relaxed">{log.learning_outcomes}</p>
                                </div>
                              )}
                              {log.challenges && (
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Challenges</p>
                                  <p className="text-sm text-gray-700 leading-relaxed">{log.challenges}</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Previous supervisor comments — always shown when present */}
                {week?.supervisor_comments && (
                  <div className={`flex items-start gap-3 p-4 rounded-2xl border
                    ${week.status === "action_needed"
                      ? "bg-red-50 border-red-100"
                      : "bg-green-50 border-green-100"
                    }`}>
                    {week.status === "action_needed"
                      ? <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
                      : <CheckCircle size={15} className="text-green-600 mt-0.5 shrink-0" />
                    }
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1
                        ${week.status === "action_needed" ? "text-red-500" : "text-green-600"}`}>
                        {week.status === "action_needed" ? "Previous Feedback Sent" : "Supervisor Comments"}
                      </p>
                      <p className={`text-sm leading-relaxed
                        ${week.status === "action_needed" ? "text-red-700" : "text-green-800"}`}>
                        {week.supervisor_comments}
                      </p>
                    </div>
                  </div>
                )}

                {/* Comments / feedback textarea — available for submitted weeks */}
                {canAct && (
                  <Textarea
                    label={`Comments for student${week?.status === "action_needed" ? "" : " (optional — visible after approving)"}`}
                    placeholder="Positive feedback, suggestions, or corrections…"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    maxLength={800}
                    showCount
                  />
                )}

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {canAct && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex gap-3 justify-end">
              <Button
                variant="secondary"
                loading={acting === "flag"}
                onClick={() => setConfirmOpen("flag")}
              >
                <Flag size={14} /> Flag Week
              </Button>
              <Button
                variant="primary"
                loading={acting === "approve"}
                onClick={() => setConfirmOpen("approve")}
              >
                <CheckCircle size={14} /> Approve & Stamp
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen === "approve"}
        onClose={() => setConfirmOpen(null)}
        onConfirm={handleApprove}
        title="Approve this week?"
        message="This will digitally stamp the logbook. The student will be notified."
        confirmText="Approve & Stamp"
        type="warning"
      />
      <ConfirmModal
        isOpen={confirmOpen === "flag"}
        onClose={() => setConfirmOpen(null)}
        onConfirm={handleFlag}
        title="Flag week for revision?"
        message="The student will see your feedback and be asked to revise their entries."
        confirmText="Send Feedback"
        type="warning"
      />
    </>
  );
}

// -- Performance report panel --------------------------------------------------
function PerformanceReportPanel({ placementId, supervisorId, onClose }) {
  const CRITERIA = [
    { key: "technical_competency", label: "Technical Competency" },
    { key: "initiative_score",     label: "Initiative & Self-Drive" },
    { key: "teamwork_score",       label: "Teamwork & Collaboration" },
    { key: "reliability_score",    label: "Reliability & Punctuality" },
    { key: "overall_performance",  label: "Overall Performance" },
  ];

  const [form, setForm] = useState({
    technical_competency: null,
    initiative_score:     null,
    teamwork_score:       null,
    reliability_score:    null,
    overall_performance:  null,
    strengths:            "",
    areas_for_improvement: "",
    general_comments:     "",
    recommend_for_employment: false,
  });
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState("");
  const isSubmitted = saved;

  useEffect(() => {
    supervisorService.getPerformanceReport(placementId).then((existing) => {
      if (existing) setForm(existing);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [placementId]);

  const setScore = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    const missing = CRITERIA.filter((c) => !form[c.key]);
    if (missing.length > 0) {
      setError(`Please score all criteria. Missing: ${missing.map(c => c.label).join(", ")}`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await supervisorService.submitPerformanceReport(placementId, supervisorId, form);
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-900/55 backdrop-blur-sm z-50 flex
      items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col
        shadow-2xl animate-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-display text-xl font-bold text-brand-900">Performance Report</h2>
            <p className="text-sm text-gray-400 mt-0.5">End-of-attachment assessment</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100
            hover:text-brand-900 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-500" size={28} /></div>
          ) : saved ? (
            <div className="flex flex-col items-center py-10 gap-4 text-center">
              <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center">
                <CheckCircle size={28} className="text-success" />
              </div>
              <div>
                <p className="font-black text-brand-900 text-lg">Report Submitted</p>
                <p className="text-sm text-gray-400 mt-1">The performance report has been recorded.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Score criteria */}
              <div className="space-y-5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Score each criterion out of 10
                </p>
                {CRITERIA.map(({ key, label }) => (
                  <ScoreInput
                    key={key}
                    label={label}
                    value={form[key]}
                    onChange={setScore(key)}
                    disabled={isSubmitted}
                  />
                ))}
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-4">
                <Textarea label="Strengths" placeholder="What did this student do well?" value={form.strengths}
                  onChange={(e) => setForm(f => ({ ...f, strengths: e.target.value }))} rows={3} />
                <Textarea label="Areas for Improvement" placeholder="What could they improve?" value={form.areas_for_improvement}
                  onChange={(e) => setForm(f => ({ ...f, areas_for_improvement: e.target.value }))} rows={3} />
                <Textarea label="General Comments" placeholder="Any other observations…" value={form.general_comments}
                  onChange={(e) => setForm(f => ({ ...f, general_comments: e.target.value }))} rows={3} />

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.recommend_for_employment}
                    onChange={(e) => setForm(f => ({ ...f, recommend_for_employment: e.target.checked }))}
                    className="h-4 w-4 rounded text-brand-600 border-gray-300 focus:ring-brand-500"
                  />
                  <span className="text-sm font-bold text-gray-700 group-hover:text-brand-900 transition-colors">
                    I would recommend this student for employment
                  </span>
                </label>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {!saved && !loading && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" loading={submitting} onClick={handleSubmit}>
              <Send size={14} /> Submit Report
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// -- Main portal ---------------------------------------------------------------
export default function IndustrialSupervisorPortal() {
  const { user } = UserAuth();
  const location  = useLocation();

  // /supervisor/industrial/dashboard -> "dashboard"
  // /supervisor/industrial/logbooks  -> "logbooks"
  // /supervisor/industrial/report    -> "report"
  const view = location.pathname.split("/").pop() || "dashboard";

  const [data,          setData]          = useState({ supervisor: null, students: [] });
  const [loading,       setLoading]       = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reviewWeekId,  setReviewWeekId]  = useState(null);
  const [showReport,    setShowReport]    = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const result = await supervisorService.getIndustrialSupervisorDashboard(user.id);
      setData(result);
    } catch (e) {
      console.error("Portal load failed:", e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleWeekUpdated = (weekId, newStatus) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) => ({
        ...s,
        weeks: s.weeks.map((w) => w.id === weekId ? { ...w, status: newStatus } : w),
        approved: s.weeks.filter((w) => (w.id === weekId ? newStatus : w.status) === "approved").length,
        pending:  s.weeks.filter((w) => (w.id === weekId ? newStatus : w.status) === "submitted").length,
        flagged:  s.weeks.filter((w) => (w.id === weekId ? newStatus : w.status) === "action_needed").length,
      })),
    }));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-brand-500" size={36} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
        Loading Supervisor Portal…
      </p>
    </div>
  );

  if (!data.supervisor) return (
    <div className="max-w-md mx-auto mt-20">
      <EmptyState
        icon={AlertTriangle}
        iconColor="text-amber-500 bg-amber-50"
        title="Account Not Linked"
        description="Your supervisor account is not linked to an organisation yet. Please contact the coordinator."
        bordered
      />
    </div>
  );

  const { supervisor, students } = data;
  const totalPending  = students.reduce((a, s) => a + s.pending, 0);
  const totalApproved = students.reduce((a, s) => a + s.approved, 0);
  const totalFlagged  = students.reduce((a, s) => a + s.flagged, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 mb-1">
            {supervisor.orgName} · Industrial Supervisor
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-900">
            Supervisor <span className="text-brand-600">Portal</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Welcome back, {supervisor.full_name || user.email}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap shrink-0">
          {totalPending > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              <div>
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Awaiting Review</p>
                <p className="text-xl font-black text-amber-700">{totalPending}</p>
              </div>
            </div>
          )}
          {totalFlagged > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Flag size={16} className="text-red-500" />
              <div>
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Flagged</p>
                <p className="text-xl font-black text-red-600">{totalFlagged}</p>
              </div>
            </div>
          )}
          <div className="bg-brand-100 border border-brand-100 rounded-2xl px-4 py-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-success" />
            <div>
              <p className="text-[10px] font-black text-success uppercase tracking-widest">Approved</p>
              <p className="text-xl font-black text-success">{totalApproved}</p>
            </div>
          </div>
        </div>
      </header>

      {/* -- Dashboard: summary stats -- */}
      {view === "dashboard" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Students</p>
            <p className="text-3xl font-black text-brand-900">{students.length}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Weeks Approved</p>
            <p className="text-3xl font-black text-brand-900">{totalApproved}</p>
          </div>
          {totalPending > 0 && (
            <div className="bg-warning/10 border border-warning/20 rounded-2xl p-5">
              <p className="text-[10px] font-black text-warning uppercase tracking-widest mb-1">Pending Review</p>
              <p className="text-3xl font-black text-warning">{totalPending}</p>
            </div>
          )}
        </div>
      )}

      {/* -- Logbooks: student list + week review -- */}
      {view === "logbooks" && (
        <>
        {/* Student list or detail */}
        {!selectedStudent ? (
          students.length === 0 ? (
            <EmptyState
              icon={BookOpen}
            title="No Students Assigned"
            description="Students will appear here once the coordinator allocates them to your organisation."
            bordered
          />
        ) : (
          <div className="space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {students.length} Student{students.length !== 1 ? "s" : ""} Assigned
            </p>
            {students.map((s) => (
              <div key={s.placementId} className="bg-white rounded-2xl border border-gray-100
                shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="flex items-center justify-between p-5 flex-wrap gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-brand-900 text-white flex items-center
                      justify-center font-black text-sm shrink-0 overflow-hidden">
                      {s.student?.avatar_url
                        ? <img src={s.student.avatar_url} alt="" className="w-full h-full object-cover" />
                        : s.student?.full_name?.[0]
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-brand-900 text-sm truncate">{s.student?.full_name}</p>
                      <p className="text-[10px] font-mono text-gray-400">{s.student?.student_id}</p>
                      {s.positionTitle && (
                        <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider mt-0.5">
                          {s.positionTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-center">
                      <p className="text-xl font-black text-brand-700">{s.approved}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Approved</p>
                    </div>
                    {s.pending > 0 && (
                      <div className="text-center">
                        <p className="text-xl font-black text-amber-600">{s.pending}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
                      </div>
                    )}
                    {s.flagged > 0 && (
                      <div className="text-center">
                        <p className="text-xl font-black text-red-500">{s.flagged}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Flagged</p>
                      </div>
                    )}
                    <Button size="sm" onClick={() => setSelectedStudent(s)}>
                      View Logbooks <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>

                {/* Mini week strip */}
                <div className="px-5 pb-4 flex gap-1.5 flex-wrap">
                  {s.weeks.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setSelectedStudent(s);
                        setReviewWeekId(w.id);
                      }}
                      title={`Week ${w.week_number} - ${w.status}`}
                      className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all
                        ${w.status === "approved"      ? "bg-success text-white cursor-pointer hover:bg-success"
                        : w.status === "submitted"     ? "bg-amber-400  text-white cursor-pointer hover:bg-amber-500 animate-pulse"
                        : w.status === "action_needed" ? "bg-danger text-white cursor-pointer hover:bg-danger"
                        : "bg-gray-200 text-gray-500 cursor-pointer hover:bg-gray-300"
                        }`}
                    >
                      {w.week_number}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Student detail -- logbook weeks list */
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedStudent(null); setReviewWeekId(null); }}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-brand-900
                transition-colors cursor-pointer">
              <ChevronLeft size={18} />
            </button>
            <div>
              <h2 className="font-display text-xl font-bold text-brand-900">
                {selectedStudent.student?.full_name}
              </h2>
              <p className="text-sm text-gray-400">{selectedStudent.student?.student_id}</p>
            </div>
            <div className="ml-auto">
              <Button variant="secondary" size="sm" onClick={() => setShowReport(true)}>
                <FileText size={14} /> Performance Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedStudent.weeks.map((w) => {
              const isDraft    = w.status === "draft";
              const isPending  = w.status === "submitted";
              const isApproved = w.status === "approved";
              const isFlagged  = w.status === "action_needed";

              return (
                <div key={w.id} className={`bg-white rounded-2xl border-2 p-5 transition-all
                  ${isPending  ? "border-amber-200 shadow-sm"
                  : isApproved ? "border-brand-100"
                  : isFlagged  ? "border-red-200"
                  : "border-dashed border-gray-200"
                  }`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Week {w.week_number}
                    </p>
                    <StatusBadge status={w.status} size="sm" />
                  </div>

                  {isPending && (
                    <p className="text-xs text-amber-600 font-semibold mb-3">
                      Submitted {w.submitted_at
                        ? new Date(w.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                        : ""}
                    </p>
                  )}

                  {isDraft && (
                    <p className="text-xs text-gray-400 font-medium mb-3 italic">
                      In progress — student has not submitted yet
                    </p>
                  )}

                  <Button
                    variant={isPending ? "primary" : "secondary"}
                    size="sm"
                    fullWidth
                    onClick={() => setReviewWeekId(w.id)}
                  >
                    <BookOpen size={13} />
                    {isPending  ? "Review Logbook"
                    : isApproved ? "View Entry"
                    : isFlagged  ? "View Feedback"
                    : "View Progress"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </>
      )}

      {/* -- Report: performance reports for all students -- */}
      {view === "report" && (
        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Performance Reports · {students.length} Student{students.length !== 1 ? "s" : ""}
          </p>
          {students.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Students Assigned"
              description="Students will appear here once the coordinator allocates them to your organisation."
              bordered
            />
          ) : (
            students.map((s) => (
              <div key={s.placementId} className="bg-white rounded-2xl border border-gray-100
                shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-900 text-white flex items-center
                    justify-center font-black text-sm shrink-0 overflow-hidden">
                    {s.student?.avatar_url
                      ? <img src={s.student.avatar_url} alt="" className="w-full h-full object-cover" />
                      : s.student?.full_name?.[0]
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-brand-900 text-sm truncate">{s.student?.full_name}</p>
                    <p className="text-[10px] font-mono text-gray-400">{s.student?.student_id}</p>
                    <p className="text-[11px] text-gray-500 font-medium">{s.positionTitle}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => { setSelectedStudent(s); setShowReport(true); }}
                >
                  <FileText size={13} />
                  {s.reportSubmitted ? "View Report" : "Write Report"}
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Week review modal - logbooks view */}
      {reviewWeekId && (
        <WeekReviewModal
          weekId={reviewWeekId}
          studentName={selectedStudent?.student?.full_name || "Student"}
          onClose={() => setReviewWeekId(null)}
          onUpdated={handleWeekUpdated}
        />
      )}

      {/* Performance report modal - report view */}
      {showReport && selectedStudent && (
        <PerformanceReportPanel
          placementId={selectedStudent.placementId}
          supervisorId={data.supervisor?.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}