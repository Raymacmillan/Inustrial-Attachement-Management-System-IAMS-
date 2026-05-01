import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Loader2, CheckCircle, AlertTriangle, Clock,
  ChevronRight, ChevronLeft, BookOpen, FileText,
  Star, X, MapPin, Calendar, Send,
} from "lucide-react";
import { supervisorService } from "../../services/supervisorService";
import { UserAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import DigitalStamp from "../../components/ui/DigitalStamp";
import EmptyState from "../../components/ui/EmptyState";
import Textarea from "../../components/ui/Textarea";

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

// -- Read-only week view modal (university supervisor) -------------------------
function WeekViewModal({ weekId, studentName, onClose }) {
  const [week,    setWeek]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    supervisorService.getWeekForReview(weekId).then((data) => {
      setWeek(data);
      setLoading(false);
    }).catch((e) => {
      setError(e.message);
      setLoading(false);
    });
  }, [weekId]);

  return (
    <div
      className="fixed inset-0 bg-brand-900/55 backdrop-blur-sm z-50 flex
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
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-brand-900 transition-colors cursor-pointer"
            >
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
          ) : error ? (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          ) : (
            <>
              {/* Draft banner */}
              {week?.status === "draft" && (
                <div className="flex items-start gap-3 p-4 bg-brand-100 border border-brand-100 rounded-2xl">
                  <Clock size={15} className="text-brand-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-brand-700 uppercase tracking-widest">
                      Live View — Not Yet Submitted
                    </p>
                    <p className="text-xs text-brand-600 mt-0.5">
                      The student is still working on this week. Review is read-only.
                    </p>
                  </div>
                </div>
              )}

              {/* Read-only info banner for university supervisors */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                <BookOpen size={15} className="text-gray-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-500">
                  You are viewing this logbook in read-only mode. Logbook approval is handled by the industrial supervisor.
                </p>
              </div>

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

              {/* Daily entries (read-only) */}
              <div className="space-y-3">
                {(week?.daily_logs || []).map((log) => {
                  const hasContent =
                    log.activity_details?.trim() ||
                    log.tasks_completed?.trim() ||
                    log.learning_outcomes?.trim() ||
                    log.challenges?.trim();

                  return (
                    <div
                      key={log.id}
                      className={`rounded-2xl border overflow-hidden
                        ${hasContent ? "border-gray-100" : "border-dashed border-gray-200 opacity-60"}`}
                    >
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <div>
                          <p className="text-sm font-black text-brand-900">{log.day_of_week}</p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {new Date(log.log_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-gray-400">{log.hours_worked}h</span>
                      </div>

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
            </>
          )}
        </div>

        {/* Footer — close only, no actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// -- Visit assessment panel ----------------------------------------------------
function VisitAssessmentPanel({ placementId, supervisorId, studentName, onClose }) {
  const CRITERIA = [
    { key: "punctuality_score",      label: "Punctuality & Attendance" },
    { key: "professionalism_score",  label: "Professionalism" },
    { key: "technical_score",        label: "Technical Progress" },
    { key: "communication_score",    label: "Communication" },
    { key: "overall_score",          label: "Overall Impression" },
  ];

  const emptyForm = {
    visit_date:             "",
    punctuality_score:      null,
    professionalism_score:  null,
    technical_score:        null,
    communication_score:    null,
    overall_score:          null,
    comments:               "",
  };

  const [activeVisit, setActiveVisit] = useState(1);
  const [forms,       setForms]       = useState({ 1: { ...emptyForm }, 2: { ...emptyForm } });
  const [submitted,   setSubmitted]   = useState({ 1: false, 2: false });
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    supervisorService.getVisitAssessments(placementId).then((existing) => {
      const updated = { 1: { ...emptyForm }, 2: { ...emptyForm } };
      const done    = { 1: false, 2: false };
      (existing || []).forEach((v) => {
        if (v.visit_number === 1 || v.visit_number === 2) {
          updated[v.visit_number] = v;
          done[v.visit_number]    = v.status === "submitted";
        }
      });
      setForms(updated);
      setSubmitted(done);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [placementId]);

  const setScore = (key) => (val) =>
    setForms((f) => ({ ...f, [activeVisit]: { ...f[activeVisit], [key]: val } }));

  const handleSubmit = async () => {
    const form    = forms[activeVisit];
    const missing = CRITERIA.filter((c) => !form[c.key]);
    if (!form.visit_date) { setError("Please set the visit date."); return; }
    if (missing.length)   { setError(`Score all criteria. Missing: ${missing.map(c => c.label).join(", ")}`); return; }

    setSaving(true);
    setError("");
    try {
      await supervisorService.submitVisitAssessment(placementId, supervisorId, activeVisit, form);
      setSubmitted((s) => ({ ...s, [activeVisit]: true }));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const form      = forms[activeVisit];
  const isDone    = submitted[activeVisit];

  return (
    <div
      className="fixed inset-0 bg-brand-900/55 backdrop-blur-sm z-50 flex
        items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col
        shadow-2xl animate-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-display text-xl font-bold text-brand-900">
              Visit Assessments — {studentName}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">Score each scheduled site visit</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100
            hover:text-brand-900 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Visit tabs */}
        <div className="flex gap-2 px-6 pt-4">
          {[1, 2].map((v) => (
            <button
              key={v}
              onClick={() => { setActiveVisit(v); setError(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black
                transition-all cursor-pointer
                ${activeVisit === v
                  ? "bg-brand-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
            >
              Visit {v}
              {submitted[v] && <CheckCircle size={12} className="text-success" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-brand-500" size={28} />
            </div>
          ) : isDone ? (
            <div className="flex flex-col items-center py-10 gap-4 text-center">
              <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center">
                <CheckCircle size={28} className="text-success" />
              </div>
              <div>
                <p className="font-black text-brand-900 text-lg">Assessment Submitted</p>
                <p className="text-sm text-gray-400 mt-1">
                  Visit {activeVisit} assessment has been recorded.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Visit date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Visit Date
                </label>
                <input
                  type="date"
                  value={form.visit_date}
                  onChange={(e) =>
                    setForms((f) => ({ ...f, [activeVisit]: { ...f[activeVisit], visit_date: e.target.value } }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                    text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

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
                  />
                ))}
              </div>

              <Textarea
                label="Comments"
                placeholder="Observations from the visit — what did you notice about the student's progress?"
                value={form.comments}
                onChange={(e) =>
                  setForms((f) => ({ ...f, [activeVisit]: { ...f[activeVisit], comments: e.target.value } }))
                }
                rows={4}
                maxLength={800}
                showCount
              />

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {!isDone && !loading && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSubmit}>
              <Send size={14} /> Submit Visit {activeVisit}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// -- Main portal ---------------------------------------------------------------
export default function UniversitySupervisorPortal() {
  const { user } = UserAuth();
  const location = useLocation();

  // /supervisor/university/dashboard    -> "dashboard"
  // /supervisor/university/logbooks     -> "logbooks"
  // /supervisor/university/assessments  -> "assessments"
  const view = location.pathname.split("/").pop() || "dashboard";

  const [data,            setData]            = useState({ supervisor: null, students: [] });
  const [loading,         setLoading]         = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewWeekId,      setViewWeekId]      = useState(null);
  const [showAssessment,  setShowAssessment]  = useState(false);
  const [searchQuery,     setSearchQuery]     = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const result = await supervisorService.getUniversitySupervisorDashboard(user.id);
      setData(result);
    } catch (e) {
      console.error("Portal load failed:", e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-brand-500" size={36} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
        Loading Supervisor Portal…
      </p>
    </div>
  );

  // ← THE FIX: this now correctly checks university_supervisors via getUniversitySupervisorDashboard
  if (!data.supervisor) return (
    <div className="max-w-md mx-auto mt-20">
      <EmptyState
        icon={AlertTriangle}
        iconColor="text-amber-500 bg-amber-50"
        title="Account Not Linked"
        description="Your university supervisor account has not been set up yet. Please contact the coordinator."
        bordered
      />
    </div>
  );

  const { supervisor, students } = data;
  const totalApproved = students.reduce((a, s) => a + s.approved, 0);
  const totalPending  = students.reduce((a, s) => a + s.pending, 0);

  const filteredStudents = students.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.student?.full_name?.toLowerCase().includes(q) ||
      s.student?.student_id?.toLowerCase().includes(q) ||
      s.org?.org_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4
        border-b border-gray-100 pb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 mb-1">
            {supervisor.department ? `${supervisor.department} · ` : ""}University Supervisor
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
          <div className="bg-brand-100 border border-brand-100 rounded-2xl px-4 py-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-success" />
            <div>
              <p className="text-[10px] font-black text-success uppercase tracking-widest">Weeks Approved</p>
              <p className="text-xl font-black text-success">{totalApproved}</p>
            </div>
          </div>
        </div>
      </header>

      {/* -- Dashboard -- */}
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
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Max Capacity</p>
            <p className="text-3xl font-black text-brand-900">
              {students.length}/{supervisor.max_students ?? "—"}
            </p>
          </div>
        </div>
      )}

      {/* -- Logbooks -- */}
      {view === "logbooks" && (
        <>
          {!selectedStudent ? (
            students.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No Students Assigned"
                description="Students will appear here once the coordinator assigns them to you."
                bordered
              />
            ) : (
              <div className="space-y-4">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search by name, student ID or organisation…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                    text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {filteredStudents.length} Student{filteredStudents.length !== 1 ? "s" : ""}
                </p>

                {filteredStudents.map((s) => (
                  <div
                    key={s.placementId}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm
                      hover:shadow-md transition-all overflow-hidden"
                  >
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
                          {s.org?.org_name && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin size={10} className="text-gray-300" />
                              <p className="text-[10px] text-gray-400">{s.org.org_name}</p>
                            </div>
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
                        <Button size="sm" onClick={() => setSelectedStudent(s)}>
                          View Logbooks <ChevronRight size={14} />
                        </Button>
                      </div>
                    </div>

                    {/* Mini week strip — all weeks clickable */}
                    <div className="px-5 pb-4 flex gap-1.5 flex-wrap">
                      {s.weeks.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => {
                            setSelectedStudent(s);
                            setViewWeekId(w.id);
                          }}
                          title={`Week ${w.week_number} - ${w.status}`}
                          className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all
                            ${w.status === "approved"      ? "bg-success text-white cursor-pointer hover:bg-success"
                            : w.status === "submitted"     ? "bg-amber-400 text-white cursor-pointer hover:bg-amber-500 animate-pulse"
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
            /* Student detail — week list */
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelectedStudent(null); setViewWeekId(null); }}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-brand-900
                    transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <div>
                  <h2 className="font-display text-xl font-bold text-brand-900">
                    {selectedStudent.student?.full_name}
                  </h2>
                  <p className="text-sm text-gray-400">{selectedStudent.student?.student_id}</p>
                </div>
                <div className="ml-auto">
                  <Button variant="secondary" size="sm" onClick={() => setShowAssessment(true)}>
                    <Star size={14} /> Manage Visits
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
                    <div
                      key={w.id}
                      className={`bg-white rounded-2xl border-2 p-5 transition-all
                        ${isPending  ? "border-amber-200 shadow-sm"
                        : isApproved ? "border-brand-100"
                        : isFlagged  ? "border-red-200"
                        : "border-dashed border-gray-200"
                        }`}
                    >
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
                          In progress — not yet submitted
                        </p>
                      )}

                      <Button
                        variant={isPending ? "primary" : "secondary"}
                        size="sm"
                        fullWidth
                        onClick={() => setViewWeekId(w.id)}
                      >
                        <BookOpen size={13} />
                        {isDraft ? "View Progress" : isApproved ? "View Entry" : "View Logbook"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* -- Assessments -- */}
      {view === "assessments" && (
        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Visit Assessments · {students.length} Student{students.length !== 1 ? "s" : ""}
          </p>
          {students.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Students Assigned"
              description="Students will appear here once the coordinator assigns them to you."
              bordered
            />
          ) : (
            students.map((s) => (
              <div
                key={s.placementId}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                  flex items-center justify-between gap-4 flex-wrap"
              >
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
                    {s.org?.org_name && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-gray-300" />
                        <p className="text-[10px] text-gray-400">{s.org.org_name}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => { setSelectedStudent(s); setShowAssessment(true); }}
                >
                  <Star size={13} /> Manage Visits
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Week view modal */}
      {viewWeekId && (
        <WeekViewModal
          weekId={viewWeekId}
          studentName={selectedStudent?.student?.full_name || "Student"}
          onClose={() => setViewWeekId(null)}
        />
      )}

      {/* Visit assessment modal */}
      {showAssessment && selectedStudent && (
        <VisitAssessmentPanel
          placementId={selectedStudent.placementId}
          supervisorId={data.supervisor?.id}
          studentName={selectedStudent.student?.full_name || "Student"}
          onClose={() => { setShowAssessment(false); setSelectedStudent(null); }}
        />
      )}
    </div>
  );
}