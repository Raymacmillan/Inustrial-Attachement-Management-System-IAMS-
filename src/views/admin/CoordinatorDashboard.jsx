import { useState, useEffect } from "react";
import { Users, Building2, Zap, Search, Filter, Loader2, AlertCircle, MapPin, GraduationCap } from "lucide-react";
import { coordinatorService } from "../../services/coordinatorService";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StudentAuditModal from "../admin/StudentAuditModal"; // Integrated the existing modal
import { useNavigate } from "react-router-dom";

export default function CoordinatorDashboard() {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ 
    totalStudents: 0, 
    totalOrgs: 0, 
    searchingCount: 0, 
    placedCount: 0 
  });
  const [loading, setLoading] = useState(true);
  const [alertsVisible, setAlertsVisible] = useState(true); 

  // ── MODAL STATE ──
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen]         = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, registryData] = await Promise.all([
          coordinatorService.getDashboardStats(),
          coordinatorService.getStudentRegistryDeep()
        ]);
        
        setStats(statsData);
        setStudents(registryData);
      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ── HANDLERS ──
  const openAudit = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleStudentUpdate = (studentId, newStatus) => {
    // Update local students list to reflect changes in the table immediately
    setStudents(prev => 
      prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s)
    );
    // Keep the selected student in sync if the modal is still open
    if (selectedStudent?.id === studentId) {
      setSelectedStudent(prev => ({ ...prev, status: newStatus }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand-600">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-bold animate-pulse uppercase tracking-widest text-[10px]">Syncing Command Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* ── HEADER ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
        <div>
          <h1 className="font-display text-4xl text-brand-900 font-bold tracking-tight uppercase">
            Coordinator <span className="text-brand-600">Command</span>
          </h1>
          <p className="text-gray-500 text-lg font-light">
            Overseeing UB Computer Science Attachments 2026
          </p>
        </div>
        <Button onClick={() => navigate('/coordinator/matching')} size="xl" className="shadow-brand-200 shadow-lg group">
          <Zap size={18} fill="currentColor" className="group-hover:animate-pulse" />
          <span>Run Matching Engine</span>
        </Button>
      </header>

      {/* ── STATS OVERVIEW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} />
        <StatCard title="Active Hosts" value={stats.totalOrgs} icon={Building2} colorClass="border-accent" />
        <StatCard title="Searching" value={stats.searchingCount} icon={Search} colorClass="border-warning" />
        <StatCard title="Matched" value={stats.placedCount} icon={Zap} colorClass="border-success" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* ── STUDENT REGISTRY TABLE ── */}
        <div className="xl:col-span-2 card bg-white border border-gray-100 shadow-sm overflow-hidden rounded-3xl transition-all hover:shadow-md">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-display text-xl text-brand-900 font-bold">Quick Registry</h3>
            <div className="flex gap-2">
               <Button variant="ghost" size="sm" onClick={() => navigate('/coordinator/students')} className="text-brand-600 font-bold">
                  View Full Registry
               </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Student & GPA</th>
                  <th className="px-6 py-4">Technical Skills</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.slice(0, 10).map((student) => {
                  const prefs = student.student_preferences || {};
                  return (
                    <tr key={student.id} className="hover:bg-brand-50/30 transition-colors group cursor-default">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-brand-900 leading-tight">{student.full_name}</span>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400 font-mono tracking-tighter">{student.student_id}</span>
                              <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-1 rounded flex items-center gap-0.5">
                                 <GraduationCap size={10} /> {student.gpa || 'N/A'}
                              </span>
                           </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {prefs.technical_skills?.slice(0, 2).map((skill, i) => (
                            <span key={i} className="text-[9px] bg-white text-brand-700 px-1.5 py-0.5 rounded border border-gray-100 uppercase font-bold tracking-tight">
                              {skill}
                            </span>
                          ))}
                          {prefs.technical_skills?.length > 2 && (
                            <span className="text-[9px] text-gray-400 font-medium italic">+{prefs.technical_skills.length - 2} more</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant={student.status === 'allocated' || student.status === 'matched' ? "success" : "warning"}>
                          {student.status}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openAudit(student)}
                          className="text-brand-600 font-black text-[10px] uppercase tracking-wider hover:underline opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          Audit Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SIDEBAR ALERTS ── */}
        <div className="space-y-6">
          {alertsVisible ? (
            <div className="card p-6 bg-brand-900 text-white border-0 shadow-xl rounded-3xl relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-700 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none" />

              <h3 className="font-display text-lg text-white mb-4 flex items-center gap-2 relative z-10">
                <AlertCircle size={20} className="text-accent shrink-0" />
                <span className="font-bold tracking-tight text-brand-50">System Alerts</span>
              </h3>

              <div className="space-y-4 relative z-10">
                <div className="flex gap-4 items-start p-4 bg-brand-800/40 hover:bg-brand-800/60 rounded-2xl border border-brand-700/50 transition-all">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent mt-1.5 shrink-0 animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-brand-300">
                      Deployment Readiness
                    </p>
                    <p className="text-xs text-brand-100 leading-relaxed">
                      <span className="font-bold text-white">{stats.totalOrgs} Host(s)</span> are currently registered. Run the matching heuristic to finalize the <span className="text-brand-300 font-medium">2026 allocations</span>.
                    </p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setAlertsVisible(false)}
                className="mt-6 w-full py-3 rounded-xl text-brand-200 hover:text-white text-[10px] font-black uppercase tracking-widest bg-brand-800/50 border border-brand-700/50 hover:bg-brand-800 transition-all cursor-pointer relative z-10"
              >
                Dismiss All Notifications
              </button>
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center">
               <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No Active Alerts</p>
               <button 
                onClick={() => setAlertsVisible(true)}
                className="mt-2 text-[10px] text-brand-600 font-black uppercase hover:underline cursor-pointer"
               >
                 Restore Panel
               </button>
            </div>
          )}
        </div>
      </div>

      {/* ── AUDIT MODAL ── */}
      <StudentAuditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        student={selectedStudent}
        onUpdate={handleStudentUpdate}
      />
    </div>
  );
}