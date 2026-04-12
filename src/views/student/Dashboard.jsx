import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import * as studentService from "../../services/studentService";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import {
  User, Briefcase, ClipboardList, GraduationCap, ArrowRight,
  CheckCircle, FileWarning, LayoutDashboard, ExternalLink, Target,
  Building2, MapPin, Calendar, Clock, UserCheck, Mail, Phone,
  BookOpen, Zap,
} from "lucide-react";

export default function StudentDashboard() {
  const { user }  = UserAuth();
  const navigate  = useNavigate();
  const [loading, setLoading]       = useState(true);
  const [student, setStudent]       = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [placement, setPlacement]   = useState(null);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const [profileData, prefData, placementData] = await Promise.all([
          studentService.getStudentProfile(user.id),
          studentService.getStudentPreferences(user.id),
          studentService.getStudentPlacement(user.id),
        ]);
        setStudent(profileData);
        setPreferences(prefData);
        setPlacement(placementData);
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
    if (student.full_name)      p += 15;
    if (student.avatar_url)     p += 15;
    if (student.cv_url)         p += 15;
    if (student.transcript_url) p += 15;
    if (preferences?.technical_skills?.length > 0)   p += 20;
    if (preferences?.preferred_roles?.length > 0)    p += 10;
    if (preferences?.preferred_locations?.length > 0) p += 10;
    return p;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse text-brand-600 font-black text-xl tracking-tighter">
        SYNCHRONIZING PORTAL...
      </div>
    </div>
  );

  const progress    = calculateProgress();
  const isComplete  = progress === 100;
  const isPlaced    = Boolean(placement);
  const org         = placement?.organization_profiles;

  // Format a date string to a readable format e.g. "09 Apr 2026"
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  // Calculate days remaining until end date
  const daysRemaining = () => {
    if (!placement?.end_date) return null;
    const diff = new Date(placement.end_date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const remaining = daysRemaining();

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
                Dumelang, {student?.full_name?.split(" ")[0] || "Student"}
              </h1>
              <p className="text-brand-100/80 font-medium text-sm md:text-lg max-w-md leading-relaxed">
                {isPlaced
                  ? `You are placed at ${org?.org_name}. Track your attachment journey below.`
                  : "Track your matching status and log your attachment journey here."
                }
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="lg"
            className="group transition-all hover:scale-[1.02] border-none"
            onClick={() => navigate("/student/profile")}
          >
            <span className="font-bold text-[10px] uppercase tracking-widest">Manage Identity</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
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

      {/* ── Placement Card — only shown when student is placed ── */}
      {isPlaced && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Zap size={14} className="text-brand-600" fill="currentColor" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              Active Placement
            </h2>
          </div>

          <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">

            {/* Org header */}
            <div className="bg-brand-900 px-6 md:px-8 py-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-brand-800 border border-brand-700 overflow-hidden flex items-center justify-center shrink-0">
                {org?.avatar_url
                  ? <img src={org.avatar_url} alt={org.org_name} className="w-full h-full object-cover" />
                  : <Building2 size={24} className="text-brand-400" />
                }
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-xl md:text-2xl font-bold text-white truncate">
                  {org?.org_name}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-brand-300 uppercase tracking-widest">
                    {placement.position_title}
                  </span>
                  {org?.industry && (
                    <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest bg-brand-800 px-2 py-0.5 rounded-lg">
                      {org.industry}
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-auto shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-500/30">
                  <CheckCircle size={11} /> Active
                </span>
              </div>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

              {/* ── Attachment dates ── */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={13} className="text-brand-600" /> Attachment Period
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Start Date</span>
                    <span className="text-sm font-black text-brand-900">{formatDate(placement.start_date)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">End Date</span>
                    <span className="text-sm font-black text-brand-900">{formatDate(placement.end_date)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</span>
                    <span className="text-sm font-black text-brand-900">{placement.duration_weeks} Weeks</span>
                  </div>
                  {remaining !== null && (
                    <div className={`flex items-center justify-between p-3 rounded-xl ${
                      remaining > 14 ? "bg-green-50" : remaining > 7 ? "bg-amber-50" : "bg-red-50"
                    }`}>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={11} /> Days Remaining
                      </span>
                      <span className={`text-sm font-black ${
                        remaining > 14 ? "text-green-700" : remaining > 7 ? "text-amber-700" : "text-red-700"
                      }`}>
                        {remaining > 0 ? `${remaining} days` : "Completed"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Location */}
                {org?.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium mt-2">
                    <MapPin size={14} className="text-brand-500 shrink-0" />
                    {org.location}, Botswana
                  </div>
                )}
              </div>

              {/* ── Supervisors ── */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <UserCheck size={13} className="text-brand-600" /> Your Supervisors
                </h4>

                {/* Industrial supervisor */}
                <div className="p-4 bg-brand-50 border border-brand-100 rounded-2xl space-y-2">
                  <p className="text-[9px] font-black text-brand-500 uppercase tracking-widest">
                    Industrial Supervisor
                  </p>
                  {placement.industrial_supervisor_name ? (
                    <>
                      <p className="font-bold text-brand-900 text-sm">
                        {placement.industrial_supervisor_name}
                      </p>
                      {placement.industrial_supervisor_email && (
                        <a
                          href={`mailto:${placement.industrial_supervisor_email}`}
                          className="flex items-center gap-1.5 text-xs text-brand-600 font-bold hover:underline"
                        >
                          <Mail size={11} /> {placement.industrial_supervisor_email}
                        </a>
                      )}
                      {org?.contact_phone && (
                        <a
                          href={`tel:${org.contact_phone}`}
                          className="flex items-center gap-1.5 text-xs text-brand-600 font-bold hover:underline"
                        >
                          <Phone size={11} /> {org.contact_phone}
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Not yet assigned</p>
                  )}
                </div>

                {/* University supervisor */}
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    University Supervisor (UB)
                  </p>
                  {placement.university_supervisor_name ? (
                    <>
                      <p className="font-bold text-brand-900 text-sm">
                        {placement.university_supervisor_name}
                      </p>
                      {placement.university_supervisor_email && (
                        <a
                          href={`mailto:${placement.university_supervisor_email}`}
                          className="flex items-center gap-1.5 text-xs text-brand-600 font-bold hover:underline"
                        >
                          <Mail size={11} /> {placement.university_supervisor_email}
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      Pending coordinator assignment
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Not yet placed — show matching nudge ── */}
      {!isPlaced && student?.status === "pending" && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
          <Briefcase size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900 text-sm">Awaiting Placement</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Your profile is in the matching queue. The coordinator will allocate you to an organisation.
              Make sure your profile and preferences are complete to improve your matching score.
            </p>
          </div>
        </div>
      )}

      {/* ── Action Center ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">

        {/* Profile Strength & Preferences */}
        <div className="xl:col-span-2 card p-6 md:p-8 bg-white border border-gray-100 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm space-y-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-display font-bold text-brand-900">Application Readiness</h3>
                <p className="text-xs text-gray-500 font-medium">Profile completeness and matching intent</p>
              </div>
              <span className="text-2xl font-black text-brand-600">{progress}%</span>
            </div>

            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 transition-all duration-1000 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DocStatus label="CV Document"      uploaded={!!student?.cv_url} />
              <DocStatus label="Transcript"       uploaded={!!student?.transcript_url} />
              <DocStatus label="Matching Intent"  uploaded={preferences?.preferred_roles?.length > 0} />
              <DocStatus label="Target Locations" uploaded={preferences?.preferred_locations?.length > 0} />
            </div>
          </div>

          {/* Skills */}
          <div className="pt-6 border-t border-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-brand-600" />
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Expertise</h4>
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
                  <span key={index} className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg font-bold text-[9px] md:text-[10px] border border-brand-100">
                    {skill}
                  </span>
                ))
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-gray-400 italic">No expertise added to your matching intent.</p>
                  <Button size="sm" variant="ghost" onClick={() => navigate("/student/preferences")}>
                    Add Skills Now
                  </Button>
                </div>
              )}
            </div>
          </div>

          {!isComplete && (
            <div className="p-4 md:p-5 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-4">
              <FileWarning size={18} className="text-orange-500 shrink-0 mt-0.5" />
              <p className="text-[11px] md:text-xs text-orange-900 leading-relaxed font-medium">
                Your portal is not fully synced. Complete your Profile and Career Preferences to increase your chances of placement.
              </p>
            </div>
          )}
        </div>

        {/* Resources Sidebar */}
        <div className="p-6 md:p-8 bg-gray-50 border border-gray-100 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col gap-6">
          <div className="space-y-3">
            <h3 className="text-xl md:text-2xl font-display font-bold text-brand-900">Resources</h3>
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
      {uploaded
        ? <CheckCircle size={14} className="text-green-500" />
        : <FileWarning size={14} className="text-gray-300" />
      }
      <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${uploaded ? "text-gray-800" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}

function ResourceButton({ label }) {
  return (
    <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-brand-200 transition-all group cursor-pointer text-left">
      <span className="text-[11px] md:text-xs font-bold text-gray-700">{label}</span>
      <ExternalLink size={14} className="text-gray-400 group-hover:text-brand-600" />
    </button>
  );
}