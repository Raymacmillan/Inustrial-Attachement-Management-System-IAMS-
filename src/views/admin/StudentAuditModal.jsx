import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, FileText, ExternalLink, MapPin, Info, Edit3,
  Check, ChevronDown, ChevronUp, AlertCircle, Zap,
  Calendar, User, Mail, UserCheck, Save, ChevronRight,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { coordinatorService } from "../../services/coordinatorService";

// ── Section accordion ─────────────────────────────────────────────────────────
function Section({ title, icon: Icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer
          hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest">
          <Icon size={15} className="text-brand-600" /> {title}
        </span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ── Document card ─────────────────────────────────────────────────────────────
function DocCard({ label, url }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border-2
      ${url ? "border-green-200 bg-green-50/40" : "border-red-100 bg-red-50/30"}`}>
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
        <span className="text-[9px] font-black text-red-400 uppercase bg-red-100 px-2 py-1 rounded-lg">
          Missing
        </span>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function StudentAuditModal({ isOpen, onClose, student, onUpdate }) {
  const navigate = useNavigate();

  const [status,    setStatus]    = useState(student?.status || "pending");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [saveError, setSaveError] = useState("");

  const [placement,     setPlacement]     = useState(null);
  const [dateForm,      setDateForm]      = useState({ start_date: "", end_date: "" });
  const [savingDates,   setSavingDates]   = useState(false);
  const [datesSaved,    setDatesSaved]    = useState(false);

  // Industrial supervisor — dropdown from org roster + manual override
  const [selectedSupId,    setSelectedSupId]    = useState("");
  const [manualOverride,   setManualOverride]    = useState(false);
  const [indName,          setIndName]           = useState("");
  const [indEmail,         setIndEmail]          = useState("");
  const [savingInd,        setSavingInd]         = useState(false);
  const [indSaved,         setIndSaved]          = useState(false);

  // University supervisor — always free text
  const [uniName,          setUniName]           = useState("");
  const [uniEmail,         setUniEmail]          = useState("");
  const [savingUni,        setSavingUni]         = useState(false);
  const [uniSaved,         setUniSaved]          = useState(false);
  const [confirmReject,    setConfirmReject]      = useState(false);

  useEffect(() => {
    if (!student) return;
    setStatus(student.status || "pending");
    setSaveError("");
    setSaved(false);
    setDatesSaved(false);
    setIndSaved(false);
    setUniSaved(false);
    setConfirmReject(false);
    setPlacement(null);
    setSelectedSupId("");
    setManualOverride(false);

    if (student.status === "matched" || student.status === "allocated") {
      coordinatorService.getStudentPlacement(student.id).then((data) => {
        if (!data) return;
        setPlacement(data);
        setDateForm({ start_date: data.start_date || "", end_date: data.end_date || "" });
        setIndName(data.industrial_supervisor_name || "");
        setIndEmail(data.industrial_supervisor_email || "");
        setUniName(data.university_supervisor_name || "");
        setUniEmail(data.university_supervisor_email || "");
      }).catch((e) => setSaveError(e.message));
    }
  }, [student]);

  if (!student || !isOpen) return null;

  const prefs    = student.student_preferences || {};
  const isPlaced = student.status === "matched" || student.status === "allocated";

  // Org's supervisor roster for the dropdown
  const orgSupervisors = placement?.organization_profiles?.organization_supervisors || [];

  const calcWeeks = () => {
    if (!dateForm.start_date || !dateForm.end_date) return null;
    const diff = new Date(dateForm.end_date) - new Date(dateForm.start_date);
    return Math.max(Math.round(diff / (1000 * 60 * 60 * 24 * 7)), 1);
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const weeks = calcWeeks();

  // ── Save handlers ─────────────────────────────────────────────────────────

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
      setSaveError(err.message || "Status update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDatesSave = async () => {
    if (!placement?.id) return;
    setSavingDates(true);
    setSaveError("");
    try {
      await coordinatorService.updatePlacementDates(placement.id, dateForm.start_date, dateForm.end_date);
      setDatesSaved(true);
      setTimeout(() => setDatesSaved(false), 2500);
    } catch (err) {
      setSaveError(err.message || "Failed to update dates.");
    } finally {
      setSavingDates(false);
    }
  };

  const handleIndustrialSave = async () => {
    if (!placement?.id) return;
    setSavingInd(true);
    setSaveError("");
    try {
      if (!manualOverride && selectedSupId) {
        // Assign from roster dropdown — auto-fills name/email
        const sup = await coordinatorService.assignIndustrialSupervisor(placement.id, selectedSupId);
        setIndName(sup.full_name);
        setIndEmail(sup.email);
      } else {
        // Manual override — free text
        await coordinatorService.updatePlacementSupervisors(placement.id, {
          industrial_supervisor_name:  indName,
          industrial_supervisor_email: indEmail,
          university_supervisor_name:  uniName,
          university_supervisor_email: uniEmail,
        });
      }
      setIndSaved(true);
      setTimeout(() => setIndSaved(false), 2500);
    } catch (err) {
      setSaveError(err.message || "Failed to save industrial supervisor.");
    } finally {
      setSavingInd(false);
    }
  };

  const handleUniversitySave = async () => {
    if (!placement?.id) return;
    setSavingUni(true);
    setSaveError("");
    try {
      await coordinatorService.assignUniversitySupervisor(placement.id, uniName, uniEmail);
      setUniSaved(true);
      setTimeout(() => setUniSaved(false), 2500);
    } catch (err) {
      setSaveError(err.message || "Failed to save university supervisor.");
    } finally {
      setSavingUni(false);
    }
  };

  const handleReject = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await coordinatorService.updateStudentStatus(student.id, "rejected");
      if (onUpdate) onUpdate(student.id, "rejected");
      setStatus("rejected");
      setConfirmReject(false);
    } catch (err) {
      setSaveError(err.message || "Failed to reject student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-gray-50 animate-in slide-in-from-bottom duration-300">

      {/* Header */}
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
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400
            hover:text-brand-900 shrink-0 cursor-pointer"
        >
          <X size={24} />
        </button>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* Stats bar */}
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
                <Badge variant={isPlaced ? "success" : "warning"}>{student.status}</Badge>
              </div>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Status</p>
            </div>
          </div>

          {/* Error banner */}
          {saveError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs font-bold text-red-600 flex-1">{saveError}</p>
              <button onClick={() => setSaveError("")} className="text-red-400 hover:text-red-600 cursor-pointer">
                <X size={12} />
              </button>
            </div>
          )}

          <Section title="Documents" icon={FileText} defaultOpen>
            <div className="space-y-3">
              <DocCard label="Curriculum Vitae"    url={student.cv_url} />
              <DocCard label="Academic Transcript" url={student.transcript_url} />
            </div>
          </Section>

          <Section title="Skill Matrix" icon={Info}>
            {prefs.technical_skills?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {prefs.technical_skills.map((s, i) => (
                  <span key={i} className="px-3 py-1.5 bg-brand-100 text-brand-700 rounded-xl
                    font-bold text-xs border border-brand-100 uppercase">{s}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No skills listed.</p>
            )}
          </Section>

          <Section title="Career Preferences" icon={MapPin}>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Preferred Locations
                </p>
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
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Preferred Roles
                </p>
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

          {/* Attachment dates */}
          {placement && (
            <Section title="Attachment Dates" icon={Calendar} defaultOpen>
              <div className="space-y-4">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  Placement at {placement.organization_profiles?.org_name}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Start Date</label>
                    <input
                      type="date"
                      value={dateForm.start_date}
                      onChange={(e) => setDateForm((f) => ({ ...f, start_date: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                        text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">End Date</label>
                    <input
                      type="date"
                      value={dateForm.end_date}
                      min={dateForm.start_date}
                      onChange={(e) => setDateForm((f) => ({ ...f, end_date: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                        text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {weeks && (
                  <p className="text-xs font-bold text-brand-600 bg-brand-100 px-3 py-2 rounded-xl">
                    Duration: {weeks} week{weeks !== 1 ? "s" : ""}
                    <span className="text-gray-400 font-normal ml-2">
                      ({formatDate(dateForm.start_date)} → {formatDate(dateForm.end_date)})
                    </span>
                  </p>
                )}

                <Button size="sm" loading={savingDates} variant={datesSaved ? "secondary" : "primary"} onClick={handleDatesSave}>
                  {datesSaved ? <><Check size={14} /> Dates Saved</> : <><Save size={14} /> Save Dates</>}
                </Button>
              </div>
            </Section>
          )}

          {/* Industrial supervisor assignment */}
          {placement && (
            <Section title="Industrial Supervisor" icon={UserCheck} defaultOpen>
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    Select from {placement.organization_profiles?.org_name}'s roster
                  </p>
                  <button
                    onClick={() => setManualOverride((o) => !o)}
                    className="text-[10px] font-black text-brand-600 hover:underline uppercase tracking-widest cursor-pointer"
                  >
                    {manualOverride ? "← Use roster" : "Manual override →"}
                  </button>
                </div>

                {!manualOverride ? (
                  /* Roster dropdown */
                  orgSupervisors.length > 0 ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {orgSupervisors.filter((s) => s.is_active).map((sup) => (
                          <label
                            key={sup.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer
                              transition-all ${selectedSupId === sup.id
                                ? "border-brand-500 bg-brand-100"
                                : "border-gray-100 hover:border-gray-200"
                              }`}
                          >
                            <input
                              type="radio"
                              name="ind_supervisor"
                              value={sup.id}
                              checked={selectedSupId === sup.id}
                              onChange={() => setSelectedSupId(sup.id)}
                              className="text-brand-600 focus:ring-brand-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-brand-900 truncate">{sup.full_name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{sup.email}</p>
                              {sup.role_title && (
                                <p className="text-[10px] font-black text-brand-400 uppercase tracking-wider">
                                  {sup.role_title}
                                </p>
                              )}
                            </div>
                            {sup.user_id && (
                              <span className="text-[9px] font-black text-success bg-brand-100
                                px-1.5 py-0.5 rounded-full border border-brand-100 uppercase tracking-wider shrink-0">
                                Registered
                              </span>
                            )}
                          </label>
                        ))}
                      </div>

                      {/* Current assignment display */}
                      {(indName || indEmail) && (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                            Currently Assigned
                          </p>
                          <p className="text-sm font-bold text-brand-900">{indName || "—"}</p>
                          <p className="text-xs text-gray-500">{indEmail || "—"}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                      <p className="text-xs font-bold text-amber-700">
                        No supervisors on record for this organisation. Use manual override to enter details.
                      </p>
                    </div>
                  )
                ) : (
                  /* Manual override inputs */
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Name</label>
                      <input
                        type="text"
                        placeholder="Supervisor full name"
                        value={indName}
                        onChange={(e) => setIndName(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                          text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Email</label>
                      <input
                        type="email"
                        placeholder="supervisor@company.com"
                        value={indEmail}
                        onChange={(e) => setIndEmail(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                          text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                <Button
                  size="sm"
                  loading={savingInd}
                  variant={indSaved ? "secondary" : "primary"}
                  onClick={handleIndustrialSave}
                  disabled={!manualOverride && !selectedSupId}
                >
                  {indSaved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Assign Industrial Supervisor</>}
                </Button>
              </div>
            </Section>
          )}

          {/* University supervisor */}
          {placement && (
            <Section title="University Supervisor (UB)" icon={User} defaultOpen>
              <div className="space-y-3">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  UB department lecturer who will visit this student
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jane Smith"
                    value={uniName}
                    onChange={(e) => setUniName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                      text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Email</label>
                  <input
                    type="email"
                    placeholder="lecturer@ub.ac.bw"
                    value={uniEmail}
                    onChange={(e) => setUniEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                      text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <Button
                  size="sm"
                  loading={savingUni}
                  variant={uniSaved ? "secondary" : "primary"}
                  onClick={handleUniversitySave}
                >
                  {uniSaved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Assign University Supervisor</>}
                </Button>
              </div>
            </Section>
          )}

          {/* Coordinator actions */}
          <Section title="Coordinator Actions" icon={Edit3} defaultOpen>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Update Attachment Status
                </label>
                <div className="flex gap-3">
                  <select
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl text-sm
                      font-semibold px-3 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setSaveError(""); }}
                  >
                    <option value="pending">Pending</option>
                    <option value="matched">Matched</option>
                    <option value="allocated">Allocated</option>
                    <option value="completed">Completed</option>
                  </select>
                  <Button size="sm" loading={saving} onClick={handleStatusSave} variant={saved ? "secondary" : "primary"} className="shrink-0">
                    {saved ? <><Check size={14} /> Saved</> : "Save"}
                  </Button>
                </div>
              </div>

              {/* Reject — deliberate destructive action, separated visually */}
              {student.status !== "rejected" && student.status !== "completed" && (
                <div className="pt-3 border-t border-red-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Danger Zone
                  </p>
                  {!confirmReject ? (
                    <button
                      onClick={() => setConfirmReject(true)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-black text-red-600
                        border border-red-200 bg-red-50 rounded-xl hover:bg-red-100
                        hover:border-red-300 transition-all cursor-pointer w-full justify-center"
                    >
                      <AlertCircle size={15} /> Reject Student Application
                    </button>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3">
                      <p className="text-sm font-bold text-red-800">
                        Are you sure? This will remove the student from the matching pool and notify them.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleReject}
                          disabled={saving}
                          className="flex-1 py-2.5 text-xs font-black text-white bg-red-600
                            hover:bg-red-700 rounded-xl transition-colors cursor-pointer
                            disabled:opacity-50"
                        >
                          {saving ? "Rejecting…" : "Yes, Reject Student"}
                        </button>
                        <button
                          onClick={() => setConfirmReject(false)}
                          className="flex-1 py-2.5 text-xs font-black text-gray-600
                            bg-white border border-gray-200 rounded-xl hover:bg-gray-50
                            transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {student.status === "rejected" && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
                  <AlertCircle size={16} className="text-red-500 shrink-0" />
                  <p className="text-sm font-bold text-red-700">This student has been rejected.</p>
                  <button
                    onClick={() => { setStatus("pending"); handleStatusSave(); }}
                    className="ml-auto text-xs font-black text-brand-600 hover:underline cursor-pointer"
                  >
                    Reinstate
                  </button>
                </div>
              )}
            </div>
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 px-4 sm:px-8 py-4 flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button
          size="lg"
          onClick={() => { onClose(); navigate("/coordinator/matching"); }}
          disabled={isPlaced}
        >
          <Zap size={16} fill="currentColor" />
          {isPlaced ? "Already Matched" : "Match Student"}
        </Button>
      </footer>
    </div>
  );
}