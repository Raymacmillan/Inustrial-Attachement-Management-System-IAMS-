import { useState, useEffect } from "react";
import { UserAuth } from "../../context/AuthContext";
import * as studentService from "../../services/studentService";
import {
  ClipboardCheck, Calendar, CheckCircle, Clock, AlertTriangle,
  Building2, GraduationCap, ThumbsUp, Star, Zap, FileText,
} from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ label, score }) {
  if (score == null) return null;
  const pct   = (score / 10) * 100;
  const color  = score >= 8 ? "bg-green-500" : score >= 5 ? "bg-amber-500" : "bg-red-500";
  const text   = score >= 8 ? "text-green-700" : score >= 5 ? "text-amber-700" : "text-red-700";
  const bg     = score >= 8 ? "bg-green-50"    : score >= 5 ? "bg-amber-50"    : "bg-red-50";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${bg} ${text}`}>
          {score}/10
        </span>
      </div>
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Overall score badge ───────────────────────────────────────────────────────
function OverallBadge({ score }) {
  if (score == null) return null;
  const color = score >= 8 ? "bg-green-500" : score >= 5 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className={`w-14 h-14 rounded-2xl ${color} flex flex-col items-center justify-center shrink-0`}>
      <span className="text-white font-black text-lg leading-none">{score}</span>
      <span className="text-white/70 text-[8px] font-bold uppercase tracking-wider">/10</span>
    </div>
  );
}

// ── Pending placeholder card ──────────────────────────────────────────────────
function PendingCard({ label, hint }) {
  return (
    <div className="flex items-start gap-4 p-5 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
        <Clock size={18} className="text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-500">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{hint}</p>
      </div>
    </div>
  );
}

// ── Visit assessment card ─────────────────────────────────────────────────────
function VisitCard({ visit }) {
  const isSubmitted = visit.status === "submitted";
  const visitDate   = visit.visit_date
    ? new Date(visit.visit_date).toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
      })
    : "—";

  const avgScore = isSubmitted
    ? (
        (visit.punctuality_score     ?? 0) +
        (visit.professionalism_score ?? 0) +
        (visit.technical_score       ?? 0) +
        (visit.communication_score   ?? 0) +
        (visit.overall_score         ?? 0)
      ) / 5
    : null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      {/* Card header */}
      <div className={`px-6 py-4 flex items-center justify-between
        ${isSubmitted ? "bg-brand-900" : "bg-gray-50 border-b border-gray-100"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
            ${isSubmitted ? "bg-brand-800" : "bg-gray-100"}`}>
            <Calendar size={16} className={isSubmitted ? "text-brand-300" : "text-gray-400"} />
          </div>
          <div>
            <p className={`font-bold text-sm ${isSubmitted ? "text-white" : "text-brand-900"}`}>
              Visit {visit.visit_number}
            </p>
            <p className={`text-[11px] font-medium ${isSubmitted ? "text-brand-300" : "text-gray-500"}`}>
              {visitDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSubmitted && avgScore != null && (
            <OverallBadge score={Math.round(avgScore)} />
          )}
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest
            ${isSubmitted
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-amber-100 text-amber-700 border border-amber-200"
            }`}>
            {isSubmitted ? "Assessed" : "Scheduled"}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="px-6 py-5">
        {isSubmitted ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ScoreBar label="Punctuality"     score={visit.punctuality_score} />
              <ScoreBar label="Professionalism" score={visit.professionalism_score} />
              <ScoreBar label="Technical Skill" score={visit.technical_score} />
              <ScoreBar label="Communication"   score={visit.communication_score} />
            </div>
            <ScoreBar label="Overall Rating" score={visit.overall_score} />
            {visit.comments && (
              <div className="p-4 bg-brand-50 border border-brand-100 rounded-xl">
                <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1.5">
                  Supervisor Notes
                </p>
                <p className="text-sm text-brand-900 leading-relaxed">{visit.comments}</p>
              </div>
            )}
          </div>
        ) : (
          <PendingCard
            label="Assessment pending"
            hint="Your supervisor will fill in scores and feedback after the visit has taken place."
          />
        )}
      </div>
    </div>
  );
}

// ── Industrial supervisor report card ────────────────────────────────────────
function SupervisorReportCard({ report }) {
  const isSubmitted = report?.status === "submitted";

  if (!report || !isSubmitted) {
    return (
      <PendingCard
        label="Report not yet submitted"
        hint="Your industrial supervisor will submit a final performance report at the end of your attachment."
      />
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-brand-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-800 flex items-center justify-center shrink-0">
            <FileText size={16} className="text-brand-300" />
          </div>
          <div>
            <p className="font-bold text-sm text-white">Performance Report</p>
            {report.submitted_at && (
              <p className="text-[11px] text-brand-300 font-medium">
                Submitted {new Date(report.submitted_at).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
        {report.overall_performance != null && (
          <OverallBadge score={report.overall_performance} />
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5">
        {/* Scores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ScoreBar label="Technical Competency" score={report.technical_competency} />
          <ScoreBar label="Initiative"            score={report.initiative_score} />
          <ScoreBar label="Teamwork"              score={report.teamwork_score} />
          <ScoreBar label="Reliability"           score={report.reliability_score} />
        </div>

        {/* Text feedback */}
        {(report.strengths || report.areas_for_improvement || report.general_comments) && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            {report.strengths && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1.5">
                  Strengths
                </p>
                <p className="text-sm text-green-900 leading-relaxed">{report.strengths}</p>
              </div>
            )}
            {report.areas_for_improvement && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5">
                  Areas for Improvement
                </p>
                <p className="text-sm text-amber-900 leading-relaxed">{report.areas_for_improvement}</p>
              </div>
            )}
            {report.general_comments && (
              <div className="p-4 bg-brand-50 border border-brand-100 rounded-xl">
                <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1.5">
                  General Comments
                </p>
                <p className="text-sm text-brand-900 leading-relaxed">{report.general_comments}</p>
              </div>
            )}
          </div>
        )}

        {/* Employment recommendation */}
        <div className={`flex items-center gap-3 p-4 rounded-xl border
          ${report.recommend_for_employment
            ? "bg-green-50 border-green-200"
            : "bg-gray-50 border-gray-200"
          }`}>
          <ThumbsUp
            size={18}
            className={report.recommend_for_employment ? "text-green-600" : "text-gray-400"}
          />
          <div>
            <p className={`text-xs font-black uppercase tracking-wider
              ${report.recommend_for_employment ? "text-green-700" : "text-gray-500"}`}>
              Employment Recommendation
            </p>
            <p className={`text-sm font-bold mt-0.5
              ${report.recommend_for_employment ? "text-green-900" : "text-gray-600"}`}>
              {report.recommend_for_employment
                ? "Your supervisor recommends you for employment."
                : "No employment recommendation at this time."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AssessmentReports() {
  const { user }  = UserAuth();
  const [loading,         setLoading]         = useState(true);
  const [placement,       setPlacement]       = useState(null);
  const [visitAssessments, setVisitAssessments] = useState([]);
  const [supervisorReport, setSupervisorReport] = useState(null);
  const [error,           setError]           = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const pl = await studentService.getStudentPlacement(user.id);
        setPlacement(pl);
        if (pl?.id) {
          const { visitAssessments: va, supervisorReport: sr } =
            await studentService.getStudentAssessments(pl.id);
          setVisitAssessments(va);
          setSupervisorReport(sr);
        }
      } catch (err) {
        setError(err.message || "Failed to load assessments.");
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) load();
  }, [user?.id]);

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-brand-600 font-black text-xl tracking-tighter">
          LOADING REPORTS...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-16">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!placement) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <EmptyState
          icon={ClipboardCheck}
          iconColor="text-brand-600 bg-brand-50"
          title="No Active Placement"
          description="Assessment reports will appear here once you have been allocated to an organisation by the coordinator."
        />
      </div>
    );
  }

  const org = placement.organization_profiles;

  // Merge scheduled visits with empty placeholders for visits not yet scheduled
  const visits = [1, 2].map((n) => {
    const found = visitAssessments.find((v) => v.visit_number === n);
    return found ?? { visit_number: n, status: "not_scheduled" };
  });

  const hasAnyData = visitAssessments.length > 0 || supervisorReport != null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-8 md:space-y-10 pb-32 animate-in fade-in duration-700">

      {/* ── Page hero ── */}
      <section className="relative overflow-hidden bg-brand-900 rounded-[1.5rem] md:rounded-[2rem] p-7 md:p-10 text-white shadow-xl border border-white/5">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-brand-200 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
              <ClipboardCheck size={13} className="text-brand-400" />
              Assessment Tracking
            </div>
            <h1 className="text-2xl md:text-4xl font-display font-black tracking-tight text-white leading-tight">
              My Assessment Reports
            </h1>
            <p className="text-brand-100/80 font-medium text-sm max-w-md leading-relaxed">
              Track your supervisor visit assessments and end-of-attachment performance report from{" "}
              <span className="text-white font-bold">{org?.org_name}</span>.
            </p>
          </div>
          {!hasAnyData && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-white/10 border border-white/20 rounded-xl">
              <Clock size={15} className="text-brand-300 shrink-0" />
              <p className="text-[11px] text-brand-200 font-medium leading-snug">
                Reports will appear here as your supervisors submit them.
              </p>
            </div>
          )}
        </div>
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-brand-500/10 rounded-full blur-[100px]" />
      </section>

      {/* ── Placement context ── */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm">
          <Building2 size={14} className="text-brand-600 shrink-0" />
          <span className="text-xs font-bold text-brand-900">{org?.org_name}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm">
          <Zap size={14} className="text-brand-600 shrink-0" fill="currentColor" />
          <span className="text-xs font-bold text-brand-900">{placement.position_title}</span>
        </div>
        {placement.university_supervisor_name && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm">
            <GraduationCap size={14} className="text-brand-600 shrink-0" />
            <span className="text-xs font-bold text-brand-900">{placement.university_supervisor_name}</span>
          </div>
        )}
      </div>

      {/* ── University supervisor visit assessments ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <GraduationCap size={14} className="text-brand-600" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            University Supervisor — Visit Assessments
          </h2>
        </div>
        <p className="text-xs text-gray-500 px-1 leading-relaxed">
          Your university supervisor conducts two physical visits during your attachment.
          Each visit results in a scored assessment across punctuality, professionalism, technical skill, and communication.
        </p>
        <div className="space-y-4">
          {visits.map((visit) =>
            visit.status === "not_scheduled" ? (
              <div key={visit.visit_number} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <Calendar size={15} className="text-gray-400" />
                  </div>
                  <p className="font-bold text-sm text-gray-400">
                    Visit {visit.visit_number}
                  </p>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 uppercase tracking-widest border border-gray-200">
                    Not yet scheduled
                  </span>
                </div>
                <PendingCard
                  label="Visit not yet scheduled"
                  hint="Your university supervisor has not scheduled this visit yet. You will be notified when a date is set."
                />
              </div>
            ) : (
              <VisitCard key={visit.visit_number} visit={visit} />
            )
          )}
        </div>
      </section>

      {/* ── Industrial supervisor performance report ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Building2 size={14} className="text-brand-600" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Industrial Supervisor — Performance Report
          </h2>
        </div>
        <p className="text-xs text-gray-500 px-1 leading-relaxed">
          Your industrial supervisor submits a final performance evaluation at the end of your attachment,
          covering technical competency, initiative, teamwork, and reliability.
        </p>
        <SupervisorReportCard report={supervisorReport} />
      </section>

      {/* ── Summary info banner ── */}
      {hasAnyData && (
        <div className="flex items-start gap-3 p-4 bg-brand-50 border border-brand-100 rounded-2xl">
          <Star size={15} className="text-brand-600 shrink-0 mt-0.5" />
          <p className="text-xs text-brand-800 leading-relaxed font-medium">
            These assessments form part of your official UB industrial attachment record.
            Contact your coordinator if you believe any assessment is incorrect.
          </p>
        </div>
      )}
    </div>
  );
}
