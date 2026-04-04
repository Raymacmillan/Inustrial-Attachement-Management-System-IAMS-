import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, FileText, ExternalLink,
  MapPin, Info, Edit3,
  Check, ChevronDown, ChevronUp, AlertCircle, Zap,
  User, Mail,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { coordinatorService } from "../../services/coordinatorService";
import { supabase } from "../../lib/supabaseClient";

// ── Section accordion ─────────────────────────────────────────────────
function Section({ title, icon: Icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest">
          <Icon size={15} className="text-brand-600" /> {title}
        </span>
        {open
          ? <ChevronUp size={16} className="text-gray-400" />
          : <ChevronDown size={16} className="text-gray-400" />
        }
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ── Document card ─────────────────────────────────────────────────────
function DocCard({ label, url }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${
      url ? "border-green-200 bg-green-50/40" : "border-red-100 bg-red-50/30"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${url ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-300"}`}>
          <FileText size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-brand-900">{label}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
            {url ? "Uploaded ✓" : "Missing — Action Required"}
          </p>
        </div>
      </div>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <Button variant="secondary" size="sm"><ExternalLink size={14} /> Open</Button>
        </a>
      ) : (
        <span className="text-[9px] font-black text-red-400 uppercase bg-red-100 px-2 py-1 rounded-lg">Missing</span>
      )}
    </div>
  );
}

// ── Supervisor input field ────────────────────────────────────────────
function SupervisorInput({ label, icon: Icon, value, onChange, type = "text", placeholder }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-3 text-gray-400" />
        <input
          type={type}
          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────
export default function StudentAuditModal({ isOpen, onClose, student, onUpdate }) {
  const navigate = useNavigate();
  const [status, setStatus]       = useState(student?.status || "pending");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [saveError, setSaveError] = useState("");

  // Placement + supervisor state
  const [placement, setPlacement]                 = useState(null);
  const [supervisorForm, setSupervisorForm]       = useState({
    industrial_supervisor_name:  "",
    industrial_supervisor_email: "",
    university_supervisor_name:  "",
    university_supervisor_email: "",
  });
  const [savingSupervisors, setSavingSupervisors] = useState(false);
  const [supervisorSaved, setSupervisorSaved]     = useState(false);

  useEffect(() => {
    if (!student) return;
    setStatus(student.status || "pending");
    setSaveError("");
    setSupervisorSaved(false);
    setPlacement(null);

    // Only fetch placement for matched/allocated students
    if (student.status === "matched" || student.status === "allocated") {
      supabase
        .from("placements")
        .select(`
          id,
          industrial_supervisor_name,
          industrial_supervisor_email,
          university_supervisor_name,
          university_supervisor_email,
          organization_profiles (
            contact_person,
            supervisor_email
          )
        `)
        .eq("student_id", student.id)
        .eq("status", "active")
        .maybeSingle()
        .then(({ data }) => {
          if (!data) return;
          setPlacement(data);

          const org = data.organization_profiles || {};

          // Auto-populate industrial supervisor from org profile if not already set.
          // The coordinator can override these values — they are just sensible defaults.
          setSupervisorForm({
            industrial_supervisor_name:
              data.industrial_supervisor_name || org.contact_person || "",
            industrial_supervisor_email:
              data.industrial_supervisor_email || org.supervisor_email || "",
            university_supervisor_name:
              data.university_supervisor_name || "",
            university_supervisor_email:
              data.university_supervisor_email || "",
          });
        });
    }
  }, [student]);

  if (!student || !isOpen) return null;

  const prefs = student.student_preferences || {};

  const handleStatusSave = async () => {
    if (status === student.status) return;
    setSaving(true);
    setSaveError("");
    try {
      await coordinatorService.updateStudentStatus(student.id, status);
      if (onUpdate) onUpdate(student.id, status);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err.message || "Status update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleMatchStudent = () => {
    onClose();
    navigate("/coordinator/matching");
  };

  const handleSupervisorSave = async () => {
    if (!placement?.id) return;
    setSavingSupervisors(true);
    try {
      const { error } = await supabase
        .from("placements")
        .update(supervisorForm)
        .eq("id", placement.id);
      if (error) throw error;
      setSupervisorSaved(true);
      setTimeout(() => setSupervisorSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save supervisors:", err.message);
    } finally {
      setSavingSupervisors(false);
    }
  };

  const isAlreadyPlaced = student.status === "matched" || student.status === "allocated";

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-gray-50 animate-in slide-in-from-bottom duration-300">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-8 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-900 text-white flex items-center justify-center font-black text-lg shrink-0">
          {student.avatar_url
            ? <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
            : student.full_name?.charAt(0)
          }
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-lg sm:text-2xl font-black text-brand-900 truncate">
            {student.full_name}
          </h2>
          <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest">
            {student.student_id} · {student.major || "CS"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-brand-900 shrink-0 cursor-pointer"
        >
          <X size={24} />
        </button>
      </header>

      {/* ── Body ── */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* Stats Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-black text-brand-900">{student.gpa || "—"}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">GPA</p>
            </div>
            <div>
              <p className="text-2xl font-black text-brand-900">{prefs.technical_skills?.length || 0}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Skills</p>
            </div>
            <div>
              <div className="flex justify-center mt-1">
                <Badge variant={isAlreadyPlaced ? "success" : "warning"}>{student.status}</Badge>
              </div>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Status</p>
            </div>
          </div>

          <Section title="Documents" icon={FileText} defaultOpen={true}>
            <div className="space-y-3">
              <DocCard label="Curriculum Vitae" url={student.cv_url} />
              <DocCard label="Academic Transcript" url={student.transcript_url} />
            </div>
          </Section>

          <Section title="Skill Matrix" icon={Info} defaultOpen={true}>
            {prefs.technical_skills?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {prefs.technical_skills.map((s, i) => (
                  <span key={i} className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-xl font-bold text-xs border border-brand-100 uppercase">{s}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No skills listed.</p>
            )}
          </Section>

          <Section title="Career Preferences" icon={MapPin} defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Preferred Locations</p>
                <div className="flex flex-wrap gap-2">
                  {prefs.preferred_locations?.length > 0
                    ? prefs.preferred_locations.map((loc, i) => (
                        <span key={i} className="text-xs bg-brand-100 text-brand-700 px-3 py-1 rounded-xl font-bold">{loc}</span>
                      ))
                    : <span className="text-sm text-gray-400 italic">Not specified</span>
                  }
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Preferred Roles</p>
                <div className="flex flex-wrap gap-2">
                  {prefs.preferred_roles?.length > 0
                    ? prefs.preferred_roles.map((r, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-xl font-bold">{r}</span>
                      ))
                    : <span className="text-sm text-gray-400 italic">Not specified</span>
                  }
                </div>
              </div>
            </div>
          </Section>

          {/* ── Supervisor Assignment — only for placed students ── */}
          {placement && (
            <Section title="Supervisor Assignment" icon={User} defaultOpen={true}>
              <div className="space-y-5">

                {/* Industrial supervisor — auto-filled from org, editable */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                      Industrial Supervisor
                    </p>
                    <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest bg-brand-50 px-2 py-0.5 rounded-lg">
                      Auto-filled from organisation
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SupervisorInput
                      label="Name"
                      icon={User}
                      placeholder="e.g. Mr John Doe"
                      value={supervisorForm.industrial_supervisor_name}
                      onChange={e => setSupervisorForm(f => ({ ...f, industrial_supervisor_name: e.target.value }))}
                    />
                    <SupervisorInput
                      label="Email"
                      icon={Mail}
                      type="email"
                      placeholder="supervisor@company.com"
                      value={supervisorForm.industrial_supervisor_email}
                      onChange={e => setSupervisorForm(f => ({ ...f, industrial_supervisor_email: e.target.value }))}
                    />
                  </div>
                </div>

                {/* University supervisor — manual entry */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    University Supervisor (UB Department)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SupervisorInput
                      label="Name"
                      icon={User}
                      placeholder="e.g. Dr Jane Smith"
                      value={supervisorForm.university_supervisor_name}
                      onChange={e => setSupervisorForm(f => ({ ...f, university_supervisor_name: e.target.value }))}
                    />
                    <SupervisorInput
                      label="Email"
                      icon={Mail}
                      type="email"
                      placeholder="lecturer@ub.ac.bw"
                      value={supervisorForm.university_supervisor_email}
                      onChange={e => setSupervisorForm(f => ({ ...f, university_supervisor_email: e.target.value }))}
                    />
                  </div>
                </div>

                <Button
                  size="sm"
                  loading={savingSupervisors}
                  variant={supervisorSaved ? "secondary" : "primary"}
                  onClick={handleSupervisorSave}
                >
                  {supervisorSaved
                    ? <span className="flex items-center gap-1"><Check size={14} /> Saved</span>
                    : "Save Supervisors"
                  }
                </Button>
              </div>
            </Section>
          )}

          <Section title="Coordinator Actions" icon={Edit3} defaultOpen={true}>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Update Attachment Status
              </label>
              <div className="flex gap-3">
                <select
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold px-3 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                  value={status}
                  onChange={e => { setStatus(e.target.value); setSaveError(""); }}
                >
                  <option value="pending">Pending</option>
                  <option value="matched">Matched</option>
                  <option value="allocated">Allocated</option>
                  <option value="completed">Completed</option>
                </select>
                <Button
                  size="sm"
                  loading={saving}
                  onClick={handleStatusSave}
                  variant={saved ? "secondary" : "primary"}
                  className="shrink-0"
                >
                  {saved
                    ? <span className="flex items-center gap-1"><Check size={14} /> Saved</span>
                    : "Save"
                  }
                </Button>
              </div>
              {saveError && (
                <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                  <p className="text-xs font-bold text-red-600">{saveError}</p>
                </div>
              )}
            </div>
          </Section>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 px-4 sm:px-8 py-4 flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button
          size="lg"
          onClick={handleMatchStudent}
          disabled={isAlreadyPlaced}
        >
          <Zap size={16} fill="currentColor" />
          {isAlreadyPlaced ? "Already Matched" : "Match Student"}
        </Button>
      </footer>
    </div>
  );
}