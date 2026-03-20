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

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        const data = await studentService.getStudentProfile(user.id);
        setStudent(data);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchPortal();
  }, [user?.id]);

  const calculateProgress = () => {
    if (!student) return 0;
    let p = 20;
    if (student.full_name) p += 20;
    if (student.avatar_url) p += 20;
    if (student.cv_url) p += 20;
    if (student.transcript_url) p += 20;
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
      <section className="relative overflow-hidden bg-brand-900 rounded-[1rem] p-8 md:p-12 text-white shadow-xl border border-white/5">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-brand-200 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
              <GraduationCap size={14} className="text-brand-400" />
              3rd Year Computer Science
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-black tracking-tight text-white leading-tight">
                Dumelang, {student?.full_name?.split(" ")[0] || "Ray"}
              </h1>
              <p className="text-brand-100/80 font-medium text-sm md:text-lg max-w-md leading-relaxed">
                Ready to start your attachment? Track your matching status and log your 14-week journey here.
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            className="rounded-xl h-9! md:h-10! w-auto! px-4! md:px-6! self-center font-bold text-[9px] md:text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group shadow-lg shadow-black/30 shrink-0 border-none transition-all hover:scale-[1.02]"
            onClick={() => navigate("/student/profile")}
          >
            <span className="whitespace-nowrap leading-none">Complete Profile</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform shrink-0" />
          </Button>
        </div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px]" />
      </section>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard title="Placement Status" value={student?.attachment_status || "Pending"} icon={Briefcase} colorClass="border-brand-600" />
        <StatCard title="Logbook Status" value="Week 0 / 14" icon={ClipboardList} colorClass="border-brand-200" />
        <StatCard title="Matching Tier" value={student?.gpa >= 3.5 ? "Priority" : "Standard"} icon={LayoutDashboard} colorClass="border-brand-400" />
      </div>

      {/* ── Action Center: LG:Grid-Cols-3 for better space management ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Profile Strength & Skills Cloud (Spans 2 columns) */}
        <div className="lg:col-span-2 card p-6 md:p-8 bg-white border border-gray-100 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm space-y-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-display font-bold text-brand-900">Profile Readiness</h3>
              <span className="text-2xl font-black text-brand-600">{progress}%</span>
            </div>

            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 transition-all duration-1000 ease-in-out" style={{ width: `${progress}%` }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DocStatus label="CV Document" uploaded={!!student?.cv_url} />
              <DocStatus label="Transcript" uploaded={!!student?.transcript_url} />
              <DocStatus label="Student ID" uploaded={!!student?.student_id} />
              <DocStatus label="Skills Tags" uploaded={student?.skills?.length > 0} />
            </div>
          </div>

          {/* ── Skills Overview ── */}
          <div className="pt-6 border-t border-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} className="text-brand-600" />
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Skill Set</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {student?.skills?.length > 0 ? (
                student.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg font-bold text-[9px] md:text-[10px] border border-brand-100">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-[10px] text-gray-400 italic">No technical skills added yet. Update your profile to appear in matches.</p>
              )}
            </div>
          </div>

          {!isComplete && (
            <div className="p-4 md:p-5 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-4">
              <FileWarning size={18} className="text-orange-500 shrink-0 mt-0.5" />
              <p className="text-[11px] md:text-xs text-orange-900 leading-relaxed font-medium">
                Ray, your profile is incomplete. Organizations at UB look for students with full documentation first.
              </p>
            </div>
          )}
        </div>

        {/* UB Resources Box */}
        <div className="p-6 md:p-8 bg-gray-50 border border-gray-100 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <h3 className="text-xl md:text-2xl font-display font-bold text-brand-900">Resources</h3>
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-medium">
              Access University of Botswana documents for CSI382.
            </p>
          </div>

          <div className="space-y-2 md:space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-brand-200 transition-all group cursor-pointer">
              <span className="text-[11px] md:text-xs font-bold text-gray-700">Attachment Handbook</span>
              <ExternalLink size={14} className="text-gray-400 group-hover:text-brand-600" />
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-brand-200 transition-all group cursor-pointer">
              <span className="text-[11px] md:text-xs font-bold text-gray-700">Logbook Template (PDF)</span>
              <ExternalLink size={14} className="text-gray-400 group-hover:text-brand-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocStatus({ label, uploaded }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 transition-colors">
      {uploaded ? <CheckCircle size={14} className="text-green-500" /> : <FileWarning size={14} className="text-gray-300" />}
      <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${uploaded ? "text-gray-800" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}