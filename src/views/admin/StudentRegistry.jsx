import { useState, useEffect } from "react";
import { Search, Loader2, Inbox, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { coordinatorService } from "../../services/coordinatorService";
import StudentAuditModal from "./StudentAuditModal";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

function StatusBadge({ status }) {
  if (status === "allocated" || status === "matched") return <Badge variant="success">Matched</Badge>;
  if (status === "pending") return <Badge variant="warning">Searching</Badge>;
  if (status === "completed") return <Badge variant="success">Completed</Badge>;
  return <Badge variant="default">{status || "inactive"}</Badge>;
}

function DocStatus({ hasCV, hasTranscript }) {
  const both = hasCV && hasTranscript;
  const none = !hasCV && !hasTranscript;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
      both ? "bg-green-100 text-green-700" : none ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${both ? "bg-green-500" : none ? "bg-red-500" : "bg-amber-500"}`} />
      {both ? "Complete" : none ? "Missing" : "Partial"}
    </span>
  );
}

function SortTh({ label, field, current, direction, onSort }) {
  const active = current === field;
  return (
    <th className="px-6 py-4 cursor-pointer select-none transition-colors hover:bg-brand-800 text-left" onClick={() => onSort(field)}>
      <span className="inline-flex items-center gap-1 text-white font-black text-[11px] uppercase tracking-widest">
        {label}
        {active
          ? direction === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
          : <ChevronDown size={11} className="opacity-40" />}
      </span>
    </th>
  );
}

function StudentCell({ student }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl overflow-hidden bg-brand-900 text-white flex items-center justify-center font-black text-sm shrink-0 border-2 border-brand-100">
        {student.avatar_url
          ? <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
          : <span>{student.full_name?.charAt(0)}</span>}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-brand-900 text-sm truncate leading-tight">{student.full_name}</p>
        <p className="text-[10px] font-mono text-gray-400">{student.student_id}</p>
      </div>
    </div>
  );
}

export default function StudentRegistry() {
  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("gpa");
  const [sortDir, setSortDir]     = useState("desc");
  const [filter, setFilter]       = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen]         = useState(false);

  useEffect(() => {
    coordinatorService.getStudentRegistryDeep()
      .then(data => setStudents(data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const openAudit = (student) => { setSelectedStudent(student); setIsModalOpen(true); };

  const handleStudentUpdate = (studentId, newStatus) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s));
    if (selectedStudent?.id === studentId) setSelectedStudent(prev => ({ ...prev, status: newStatus }));
  };

  const displayed = students
    .filter(s => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term ||
        s.full_name?.toLowerCase().includes(term) ||
        s.student_id?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term);

      const matchFilter =
        filter === "all" ||
        filter === s.status ||  // "pending", "matched", "allocated", "completed"
        (filter === "no_docs" && (!s.cv_url || !s.transcript_url));

      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "gpa")       return ((parseFloat(a.gpa) || 0) - (parseFloat(b.gpa) || 0)) * dir;
      if (sortField === "full_name") return (a.full_name?.localeCompare(b.full_name) || 0) * dir;
      return 0;
    });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-brand-600">
      <Loader2 className="animate-spin" size={40} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synchronizing Records...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-brand-900 font-bold">
            Student <span className="text-brand-600">Registry</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {displayed.length} of {students.length} students
          </p>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, student ID or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal size={15} className="text-gray-400" />
          <select
            className="bg-white border border-gray-200 rounded-xl text-sm px-3 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All Students</option>
            {/* value must match the DB enum — 'pending' not 'searching' */}
            <option value="pending">Searching</option>
            <option value="matched">Matched</option>
            <option value="no_docs">Missing Docs</option>
          </select>
          {(searchTerm || filter !== "all") && (
            <button
              onClick={() => { setSearchTerm(""); setFilter("all"); }}
              className="text-xs font-bold text-brand-600 hover:text-brand-800 whitespace-nowrap transition-colors px-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="py-24 flex flex-col items-center text-gray-300 gap-3">
          <Inbox size={44} strokeWidth={1} />
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">No students found</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {displayed.map(student => (
              <div key={student.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-900 text-white flex items-center justify-center font-black text-sm shrink-0">
                    {student.avatar_url
                      ? <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
                      : <span>{student.full_name?.charAt(0)}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-brand-900 text-sm leading-tight truncate">{student.full_name}</p>
                    <p className="text-[10px] font-mono text-gray-400 mt-0.5">{student.student_id}</p>
                    <div className="mt-1.5"><StatusBadge status={student.status} /></div>
                  </div>
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-gray-400">GPA <span className="font-black text-brand-900 text-sm">{student.gpa || "—"}</span></span>
                  <DocStatus hasCV={!!student.cv_url} hasTranscript={!!student.transcript_url} />
                </div>
                <Button size="sm" fullWidth onClick={() => openAudit(student)}>View Full Profile</Button>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-brand-900">
                <tr>
                  <SortTh label="Student" field="full_name" current={sortField} direction={sortDir} onSort={handleSort} />
                  <SortTh label="GPA" field="gpa" current={sortField} direction={sortDir} onSort={handleSort} />
                  <th className="px-6 py-4 text-white font-black text-[11px] uppercase tracking-widest">Documents</th>
                  <th className="px-6 py-4 text-white font-black text-[11px] uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-white font-black text-[11px] uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4"><StudentCell student={student} /></td>
                    <td className="px-6 py-4">
                      <span className="text-xl font-black text-brand-800">
                        {student.gpa ?? <span className="text-gray-300 text-sm font-normal">—</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4"><DocStatus hasCV={!!student.cv_url} hasTranscript={!!student.transcript_url} /></td>
                    <td className="px-6 py-4"><StatusBadge status={student.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" onClick={() => openAudit(student)}>Audit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <StudentAuditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        student={selectedStudent}
        onUpdate={handleStudentUpdate}
      />
    </div>
  );
}