import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import * as studentService from "../../services/studentService";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import {
  User,
  Briefcase,
  ClipboardList,
  GraduationCap,
  ArrowRight,
  CheckCircle,
  FileWarning,
  LayoutDashboard,
  ExternalLink,
  Target,
} from "lucide-react";

export default function StudentDashboard() {
  const { user } = UserAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        // Fetch data from both Identity (Profile) and Intent (Preferences) tables
        const [profileData, prefData] = await Promise.all([
          studentService.getStudentProfile(user.id),
          studentService.getStudentPreferences(user.id),
        ]);

        setStudent(profileData);
        setPreferences(prefData);
      } catch (err) {
        console.error("Dashboard Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchPortalData();
  }, [user?.id]);

  const calculateProgress = () => {
    let p = 0;
    if (!student) return p;

    // Profile Data (60%)
    if (student.full_name) p += 15;
    if (student.avatar_url) p += 15;
    if (student.cv_url) p += 15;
    if (student.transcript_url) p += 15;

    // Preferences Data (40%)
    if (preferences?.technical_skills?.length > 0) p += 20;
    if (preferences?.preferred_roles?.length > 0) p += 10;
    if (preferences?.preferred_locations?.length > 0) p += 10;

    return p;
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-brand-600 font-black text-xl tracking-tighter">
          SYNCHRONIZING PORTAL...
        </div>
      </div>
    );

  const progress = calculateProgress();
  const isComplete = progress === 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8 md:space-y-10 pb-32 animate-in fade-in duration-700">
      {/* ── Welcome Hero ── */}
      <section className="relative overflow-hidden bg-brand-900 rounded-[1.5rem] md:rounded-[2rem] p-8 md:p-12 text-white shadow-xl border border-white/5">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-brand-200 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
              <GraduationCap size={14} className="text-brand-400" />
              {student?.major || "3rd Year Computer Science"}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-black tracking-tight text-white leading-tight">
                Dumelang, {student?.full_name?.split(" ")[0] || "Ray"}
              </h1>
              <p className="text-brand-100/80 font-medium text-sm md:text-lg max-w-md leading-relaxed">
                Track your matching status and log your attachment journey here.
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="group transition-all hover:scale-[1.02] border-none"
            onClick={() => navigate("/student/profile")}
          >
            <span className="font-bold text-[10px] uppercase tracking-widest">
              Manage Identity
            </span>
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Button>
        </div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px]" />
      </section>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          title="Placement Status"
          value={student?.status || "Pending"}
          icon={Briefcase}
          colorClass="border-brand-600"
        />
        <StatCard
          title="Skills Listed"
          value={`${preferences?.technical_skills?.length || 0} Tags`}
          icon={Target}
          colorClass="border-brand-200"
        />
        <StatCard
          title="Matching Tier"
          value={parseFloat(student?.gpa) >= 3.5 ? "Priority" : "Standard"}
          icon={LayoutDashboard}
          colorClass="border-brand-400"
        />
      </div>

      {/* ── Action Center ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Profile Strength & Preferences Cloud */}
        <div className="xl:col-span-2 card p-6 md:p-8 bg-white border border-gray-100 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm space-y-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-display font-bold text-brand-900">
                  Application Readiness
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Profile completeness and matching intent
                </p>
              </div>
              <span className="text-2xl font-black text-brand-600">
                {progress}%
              </span>
            </div>

            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 transition-all duration-1000 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DocStatus label="CV Document" uploaded={!!student?.cv_url} />
              <DocStatus
                label="Transcript"
                uploaded={!!student?.transcript_url}
              />
              <DocStatus
                label="Matching Intent"
                uploaded={preferences?.preferred_roles?.length > 0}
              />
              <DocStatus
                label="Target Locations"
                uploaded={preferences?.preferred_locations?.length > 0}
              />
            </div>
          </div>

          {/* ── Skills Overview from Preferences ── */}
          <div className="pt-6 border-t border-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-brand-600" />
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Your Expertise
                </h4>
              </div>
              <button
                onClick={() => navigate("/student/preferences")}
                className="text-[10px] font-bold text-brand-600 hover:underline cursor-pointer"
              >
                Edit Preferences
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences?.technical_skills?.length > 0 ? (
                preferences.technical_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg font-bold text-[9px] md:text-[10px] border border-brand-100"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-gray-400 italic">
                    No expertise added to your matching intent.
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate("/student/preferences")}
                  >
                    Add Skills Now
                  </Button>
                </div>
              )}
            </div>
          </div>

          {!isComplete && (
            <div className="p-4 md:p-5 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-4">
              <FileWarning
                size={18}
                className="text-orange-500 shrink-0 mt-0.5"
              />
              <p className="text-[11px] md:text-xs text-orange-900 leading-relaxed font-medium">
                Your portal is not fully synced. Complete your{" "}
                <span className="font-bold">Profile</span> and{" "}
                <span className="font-bold">Career Preferences</span> to
                increase your chances of placement.
              </p>
            </div>
          )}
        </div>

        {/* Resources Sidebar */}
        <div className="p-6 md:p-8 bg-gray-50 border border-gray-100 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col gap-6">
          <div className="space-y-3">
            <h3 className="text-xl md:text-2xl font-display font-bold text-brand-900">
              Resources
            </h3>
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-medium">
              UB departmental documents for your attachment phase.
            </p>
          </div>

          <div className="space-y-2 md:space-y-3">
            <ResourceButton label="Attachment Handbook" />
            <ResourceButton label="Logbook Template" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DocStatus({ label, uploaded }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 transition-colors">
      {uploaded ? (
        <CheckCircle size={14} className="text-green-500" />
      ) : (
        <FileWarning size={14} className="text-gray-300" />
      )}
      <span
        className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${uploaded ? "text-gray-800" : "text-gray-400"}`}
      >
        {label}
      </span>
    </div>
  );
}

function ResourceButton({ label }) {
  return (
    <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-brand-200 transition-all group cursor-pointer text-left">
      <span className="text-[11px] md:text-xs font-bold text-gray-700">
        {label}
      </span>
      <ExternalLink
        size={14}
        className="text-gray-400 group-hover:text-brand-600"
      />
    </button>
  );
}
