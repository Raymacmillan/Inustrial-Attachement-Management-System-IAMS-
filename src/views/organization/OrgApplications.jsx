import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import {
  Loader2,
  GraduationCap,
  FileText,
  ExternalLink,
  Briefcase,
  Calendar,
  Inbox,
  ArrowLeft,
} from "lucide-react";

/**
 * OrgApplications — Student Matches Page
 * Shows all students currently allocated to this organization.
 * Accessible via /org/applications from the org sidebar.
 */
export default function OrgApplications() {
  const { user, loading: authLoading } = UserAuth();
  const navigate = useNavigate();
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlacements = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("placements")
          .select(`
            id,
            position_title,
            start_date,
            end_date,
            status,
            industrial_supervisor_name,
            industrial_supervisor_email,
            university_supervisor_name,
            university_supervisor_email,
            student_profiles (
              id,
              full_name,
              gpa,
              major,
              avatar_url,
              cv_url,
              transcript_url,
              student_id
            )
          `)
          .eq("organization_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPlacements(data || []);
      } catch (err) {
        console.error("Failed to load matches:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) fetchPlacements();
  }, [user, authLoading]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-brand-600" size={40} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
        Loading Student Matches...
      </p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4">

      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-brand-900 font-bold">
            Student <span className="text-brand-600">Matches</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            {placements.length} student{placements.length !== 1 ? "s" : ""} currently allocated to your organization
          </p>
        </div>
        <button
          onClick={() => navigate("/org/portal")}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 transition-all cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Portal
        </button>
      </header>

      {/* ── Empty State ── */}
      {placements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="w-16 h-16 bg-brand-50 text-brand-300 rounded-2xl flex items-center justify-center">
            <Inbox size={32} />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-brand-900">No Matches Yet</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm">
              The coordinator hasn't allocated any students to your organization yet.
              Make sure your vacancies are posted and active.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate("/org/requirements")}
          >
            <Briefcase size={16} />
            Manage Vacancies
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {placements.map((placement) => {
            const student = placement.student_profiles;
            if (!student) return null;

            return (
              <div
                key={placement.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-100 transition-all p-6 space-y-5"
              >
                {/* ── Student Header ── */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-brand-900 text-white flex items-center justify-center font-black text-xl shrink-0 border-2 border-brand-100">
                    {student.avatar_url ? (
                      <img
                        src={student.avatar_url}
                        alt={student.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      student.full_name?.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-lg font-bold text-brand-900 leading-tight truncate">
                          {student.full_name}
                        </h3>
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                          {student.student_id}
                        </p>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                </div>

                {/* ── Academic Info ── */}
                <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-2xl p-4 text-center">
                  <div>
                    <p className="text-xl font-black text-brand-900">{student.gpa || "—"}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">GPA</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-900 leading-tight mt-1">
                      {placement.position_title || "Intern"}
                    </p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Role</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <GraduationCap size={12} className="text-brand-400" />
                      <p className="text-[10px] font-bold text-brand-700 leading-tight">
                        {student.major?.replace("B.Sc. ", "") || "CS"}
                      </p>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Major</p>
                  </div>
                </div>

                {/* ── Attachment Period ── */}
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <Calendar size={14} className="text-brand-400 shrink-0" />
                  <span>
                    {new Date(placement.start_date).toLocaleDateString("en-GB")}
                    {" – "}
                    {new Date(placement.end_date).toLocaleDateString("en-GB")}
                  </span>
                </div>

                {/* ── Supervisors ── */}
                {(placement.industrial_supervisor_name || placement.university_supervisor_name) && (
                  <div className="space-y-1.5 pt-2 border-t border-gray-50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supervisors</p>
                    {placement.industrial_supervisor_name && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-bold">Industrial</span>
                        <span className="text-brand-900 font-bold">{placement.industrial_supervisor_name}</span>
                      </div>
                    )}
                    {placement.university_supervisor_name && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-bold">University</span>
                        <span className="text-brand-900 font-bold">{placement.university_supervisor_name}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Documents ── */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                  <p className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Documents
                  </p>
                  {student.cv_url ? (
                    <a
                      href={student.cv_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 border border-brand-100 text-brand-700 rounded-lg text-[10px] font-black uppercase tracking-tight hover:bg-brand-100 transition-colors"
                    >
                      <FileText size={12} /> CV <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className="px-3 py-1.5 bg-red-50 border border-red-100 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-tight">
                      CV Missing
                    </span>
                  )}
                  {student.transcript_url ? (
                    <a
                      href={student.transcript_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 border border-brand-100 text-brand-700 rounded-lg text-[10px] font-black uppercase tracking-tight hover:bg-brand-100 transition-colors"
                    >
                      <FileText size={12} /> Transcript <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className="px-3 py-1.5 bg-red-50 border border-red-100 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-tight">
                      Transcript Missing
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}