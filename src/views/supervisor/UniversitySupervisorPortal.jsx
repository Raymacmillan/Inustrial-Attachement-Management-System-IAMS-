import { useState, useEffect, useCallback } from "react";
import {
  Loader2, CheckCircle, AlertTriangle, Clock, BookOpen,
  ChevronLeft, ChevronRight, X, Send, Building2,
  MapPin, ClipboardList, Calendar, Search, SlidersHorizontal,
} from "lucide-react";
import { supervisorService } from "../../services/supervisorService";
import { UserAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import DigitalStamp from "../../components/ui/DigitalStamp";
import EmptyState from "../../components/ui/EmptyState";
import Textarea from "../../components/ui/Textarea";
import ConfirmModal from "../../components/ui/ConfirmModal";

// ── Score input ───────────────────────────────────────────────────────────────
function ScoreInput({ label, value, onChange, disabled }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
        {label}
      </label>
      <div className="flex gap-1.5 flex-wrap">
        {[...Array(10)].map((_, i) => {
          const score  = i + 1;
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

// ── Week logbook read-only modal ──────────────────────────────────────────────
function WeekViewModal({ weekId, studentName, onClose }) {
  const [week,    setWeek]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supervisorService.getWeekForReview(weekId)
      .then(setWeek)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [weekId]);

  const DAY_LABEL = { standard: "General", technical: "Technical", soft_skills: "Soft Skills" };

  return (
    <div className="fixed inset-0 bg-brand-900/55 backdrop-blur-sm z-50 flex
      items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col
        shadow-2xl animate-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-display text-xl font-bold text-brand-900">
              Week {week?.week_number} — {studentName}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">Read-only logbook view</p>
          </div>
          <div className="flex items-center gap-3">
            {week && <StatusBadge status={week.status} />}
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100
              hover:text-brand-900 transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-brand-500" size={28} />
            </div>
          ) : (
            <>
              {week?.signature && (
                <DigitalStamp
                  signerName={week.signature.signer_name}
                  signerTitle={week.signature.signer_title}
                  signerRole={week.signature.signer_role}
                  signedAt={week.signature.signed_at}
                />
              )}

              {week?.student_summary && (
                <div className="p-4 bg-brand-100 border border-brand-100 rounded-2xl">
                  <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1">
                    Student Weekly Summary
                  </p>
                  <p className="text-sm text-brand-900 leading-relaxed">{week.student_summary}</p>
                </div>
              )}

              {(week?.daily_logs || []).map((log) => {
                const hasContent = log.activity_details?.trim()
                  || log.tasks_completed?.trim()
                  || log.learning_outcomes?.trim()
                  || log.challenges?.trim();

                return (
                  <div key={log.id} className={`rounded-2xl border overflow-hidden
                    ${hasContent ? "border-gray-100" : "border-dashed border-gray-200 opacity-60"}`}>
                    <div className="flex items-center justify-between px-4 py-3
                      bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-black text-brand-900">{log.day_of_week}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(log.log_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        {log.template_type && (
                          <span className="text-[10px] font-black uppercase tracking-widest
                            px-2 py-0.5 rounded-full bg-brand-100 text-brand-600 border border-brand-100">
                            {DAY_LABEL[log.template_type] || log.template_type}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-gray-400">{log.hours_worked}h</span>
                    </div>
                    <div className="px-4 py-3 space-y-3">
                      {!hasContent ? (
                        <p className="text-xs text-gray-300 italic">No entry</p>
                      ) : (
                        <>
                          {log.activity_details && <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Activity</p><p className="text-sm text-gray-700 leading-relaxed">{log.activity_details}</p></div>}
                          {log.tasks_completed && <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tasks</p><p className="text-sm text-gray-700 leading-relaxed">{log.tasks_completed}</p></div>}
                          {log.learning_outcomes && <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Learning</p><p className="text-sm text-gray-700 leading-relaxed">{log.learning_outcomes}</p></div>}
                          {log.challenges && <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Challenges</p><p className="text-sm text-gray-700 leading-relaxed">{log.challenges}</p></div>}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// ── Visit assessment panel ────────────────────────────────────────────────────
function VisitAssessmentPanel({ placementId, supervisorId, studentName, onClose }) {
  const CRITERIA = [
    { key: "punctuality_score",     label: "Punctuality & Attendance" },
    { key: "professionalism_score", label: "Professionalism" },
    { key: "technical_score",       label: "Technical Competency" },
    { key: "communication_score",   label: "Communication Skills" },
    { key: "overall_score",         label: "Overall Impression" },
  ];

  const blankForm = () => ({
    visit_date:            new Date().toISOString().split("T")[0],
    punctuality_score:     null,
    professionalism_score: null,
    technical_score:       null,
    communication_score:   null,
    overall_score:         null,
    comments:              "",
  });

  const [visitNum,   setVisitNum]   = useState(1);
  const [forms,      setForms]      = useState({ 1: blankForm(), 2: blankForm() });
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved,      setSaved]      = useState({});
  const [error,      setError]      = useState("");

  useEffect(() => {
    supervisorService.getVisitAssessments(placementId).then((existing) => {
      if (existing.length > 0) {
        const updated = { ...forms };
        existing.forEach((a) => {
          updated[a.visit_number] = {
            visit_date:            a.visit_date,
            punctuality_score:     a.punctuality_score,
            professionalism_score: a.professionalism_score,
            technical_score:       a.technical_score,
            communication_score:   a.communication_score,
            overall_score:         a.overall_score,
            comments:              a.comments || "",
          };
        });
        setForms(updated);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [placementId]);

  const setScore = (key) => (val) =>
    setForms((f) => ({ ...f, [visitNum]: { ...f[visitNum], [key]: val } }));

  const handleSubmit = async () => {
    const form = forms[visitNum];
    const missing = CRITERIA.filter((c) => !form[c.key]);
    if (missing.length > 0) {
      setError(`Please score all criteria. Missing: ${missing.map((c) => c.label).join(", ")}`);
      return;
    }
    if (!form.visit_date) { setError("Please set a visit date."); return; }

    setSubmitting(true);
    setError("");
    try {
      await supervisorService.submitVisitAssessment(placementId, supervisorId, visitNum, form);
      setSaved((p) => ({ ...p, [visitNum]: true }));
      setTimeout(() => setSaved((p) => ({ ...p, [visitNum]: false })), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const form = forms[visitNum];

  return (
    <div className="fixed inset-0 bg-brand-900/55 backdrop-blur-sm z-50 flex
      items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col
        shadow-2xl animate-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-display text-xl font-bold text-brand-900">Visit Assessment</h2>
            <p className="text-sm text-gray-400 mt-0.5">{studentName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100
            hover:text-brand-900 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Visit selector */}
        <div className="flex gap-1 mx-6 mt-5 bg-gray-100 rounded-xl p-1 w-fit">
          {[1, 2].map((n) => (
            <button
              key={n}
              onClick={() => { setVisitNum(n); setError(""); }}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer
                ${visitNum === n ? "bg-white shadow-sm text-brand-900" : "text-gray-500 hover:text-gray-800"}`}
            >
              Visit {n}
              {saved[n] && <span className="ml-1.5 text-success text-xs">✓</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-brand-500" size={28} />
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Visit Date
                </label>
                <input
                  type="date"
                  value={form.visit_date}
                  onChange={(e) => setForms((f) => ({ ...f, [visitNum]: { ...f[visitNum], visit_date: e.target.value } }))}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm
                    font-semibold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                />
              </div>

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
                label="Observations & Comments"
                placeholder="Note what you observed during the visit — student's work environment, engagement, any concerns…"
                value={form.comments}
                onChange={(e) => setForms((f) => ({ ...f, [visitNum]: { ...f[visitNum], comments: e.target.value } }))}
                rows={4}
                maxLength={1000}
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

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button
            loading={submitting}
            onClick={handleSubmit}
            variant={saved[visitNum] ? "secondary" : "primary"}
            className="bg-brand-600 hover:bg-brand-700 border-brand-600 text-white"
          >
            {saved[visitNum]
              ? <><CheckCircle size={14} /> Visit {visitNum} Saved</>
              : <><Send size={14} /> Save Visit {visitNum}</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main portal ───────────────────────────────────────────────────────────────
export default function UniversitySupervisorPortal() {
  const { user } = UserAuth();

  const [data,             setData]             = useState({ supervisor: null, students: [] });
  const [loading,          setLoading]          = useState(true);
  const [selectedStudent,  setSelectedStudent]  = useState(null);
  const [viewWeekId,       setViewWeekId]       = useState(null);
  const [showAssessment,   setShowAssessment]   = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | pending | flagged | approved

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

  if (!data.supervisor) return (
    <div className="max-w-md mx-auto mt-20">
      <EmptyState
        icon={AlertTriangle}
        iconColor="text-amber-500 bg-amber-50"
        title="Account Not Linked"
        description="Your university supervisor account is not set up yet. Please contact the coordinator to complete your profile."
        bordered
      />
    </div>
  );

  const { supervisor, students } = data;
  const totalPending  = students.reduce((a, s) => a + s.pending, 0);
  const totalApproved = students.reduce((a, s) => a + s.approved, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4
        border-b border-gray-100 pb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-500 mb-1">
            {supervisor.department || "Computer Science"} · University Supervisor
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-900">
            Supervisor <span className="text-brand-600">Portal</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Welcome back, {supervisor.full_name}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap shrink-0">
          {totalPending > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              <div>
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Pending Review</p>
                <p className="text-xl font-black text-amber-700">{totalPending}</p>
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
          <div className="bg-brand-100 border border-brand-100 rounded-2xl px-4 py-3 flex items-center gap-2">
            <ClipboardList size={16} className="text-brand-500" />
            <div>
              <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Students</p>
              <p className="text-xl font-black text-brand-700">{students.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Student list or detail */}
      {!selectedStudent ? (
        students.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Students Assigned"
            description="Students will appear here once the coordinator assigns you as their university supervisor."
            bordered
          />
        ) : (
          <div className="space-y-4">
            {/* ── Search + filter bar ── */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name, student ID or organisation…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl
                    text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2 shrink-0">
                <SlidersHorizontal size={15} className="text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl text-sm px-3 py-2.5
                    focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                >
                  <option value="all">All Students</option>
                  <option value="pending">Has Pending Weeks</option>
                  <option value="flagged">Has Flagged Weeks</option>
                  <option value="approved">Fully Approved</option>
                  <option value="no_submissions">No Submissions Yet</option>
                </select>

                {/* Clear */}
                {(search || filter !== "all") && (
                  <button
                    onClick={() => { setSearch(""); setFilter("all"); }}
                    className="text-xs font-bold text-brand-600 hover:text-brand-800
                      transition-colors px-1 cursor-pointer whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Results count */}
            {(() => {
              const term = search.toLowerCase().trim();
              const filtered = students.filter((s) => {
                const matchSearch = !term
                  || s.student?.full_name?.toLowerCase().includes(term)
                  || s.student?.student_id?.toLowerCase().includes(term)
                  || s.org?.org_name?.toLowerCase().includes(term);

                const matchFilter =
                  filter === "all"            ? true
                  : filter === "pending"      ? s.pending > 0
                  : filter === "flagged"      ? s.flagged > 0
                  : filter === "approved"     ? s.approved === s.totalWeeks
                  : filter === "no_submissions" ? s.approved === 0 && s.pending === 0 && s.flagged === 0
                  : true;

                return matchSearch && matchFilter;
              });

              return (
                <>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {filtered.length} of {students.length} Student{students.length !== 1 ? "s" : ""}
                    {filter !== "all" || search ? " matching" : " under supervision"}
                  </p>

                  {filtered.length === 0 ? (
                    <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                      <p className="text-sm font-bold text-gray-400">No students match your search.</p>
                      <button
                        onClick={() => { setSearch(""); setFilter("all"); }}
                        className="mt-2 text-xs font-bold text-brand-600 hover:underline cursor-pointer"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    filtered.map((s) => (
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
                      {/* Student name is the primary identifier */}
                      <p className="font-bold text-brand-900 text-base truncate leading-tight">
                        {s.student?.full_name}
                      </p>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                        {s.student?.student_id}
                      </p>
                      {/* Org as supporting context — not the headline */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Building2 size={11} className="text-gray-400 shrink-0" />
                        <p className="text-[11px] text-gray-500 font-semibold">{s.org?.org_name}</p>
                        {s.positionTitle && (
                          <>
                            <span className="text-gray-300">·</span>
                            <p className="text-[11px] text-brand-500 font-bold">{s.positionTitle}</p>
                          </>
                        )}
                        {s.org?.location && (
                          <>
                            <MapPin size={10} className="text-gray-300 shrink-0" />
                            <p className="text-[11px] text-gray-400">{s.org.location}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

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
                      View Details <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>

                {/* Week strip */}
                <div className="px-5 pb-4 flex gap-1.5 flex-wrap">
                  {s.weeks.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        if (w.status !== "draft") {
                          setSelectedStudent(s);
                          setViewWeekId(w.id);
                        }
                      }}
                      title={`Week ${w.week_number} — ${w.status}`}
                      className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all
                        ${w.status === "approved"      ? "bg-success text-white cursor-pointer hover:bg-success"
                        : w.status === "submitted"     ? "bg-amber-400 text-white cursor-pointer hover:bg-amber-500 animate-pulse"
                        : w.status === "action_needed" ? "bg-red-500 text-white cursor-pointer"
                        : "bg-gray-100 text-gray-400 cursor-default"
                        }`}
                    >
                      {w.week_number}
                    </button>
                  ))}
                </div>
              </div>
            ))
                  )}
                </>
              );
            })()}
          </div>
        )
      ) : (
        /* Student detail */
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => { setSelectedStudent(null); setViewWeekId(null); setShowAssessment(false); }}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-brand-900
                  transition-colors cursor-pointer">
                <ChevronLeft size={18} />
              </button>
              <div>
                <h2 className="font-display text-xl font-bold text-brand-900">
                  {selectedStudent.student?.full_name}
                </h2>
                <p className="text-sm text-gray-400">
                  {selectedStudent.org?.org_name} · {selectedStudent.student?.student_id}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAssessment(true)}
              className="border-brand-100 text-brand-700 hover:bg-brand-100"
            >
              <Calendar size={14} /> Visit Assessments
            </Button>
          </div>

          {/* Logbook weeks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedStudent.weeks.map((w) => (
              <div key={w.id} className={`bg-white rounded-2xl border-2 p-5
                ${w.status === "approved"  ? "border-brand-100"
                : w.status === "submitted" ? "border-amber-200"
                : "border-dashed border-gray-200"
                }`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Week {w.week_number}
                  </p>
                  <StatusBadge status={w.status} size="sm" />
                </div>

                {w.status !== "draft" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => setViewWeekId(w.id)}
                  >
                    <BookOpen size={13} />
                    {w.status === "approved" ? "View Entry" : "View Logbook"}
                  </Button>
                ) : (
                  <p className="text-xs text-gray-400 italic">Not yet submitted</p>
                )}
              </div>
            ))}
          </div>
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
          studentName={selectedStudent.student?.full_name}
          onClose={() => setShowAssessment(false)}
        />
      )}
    </div>
  );
}