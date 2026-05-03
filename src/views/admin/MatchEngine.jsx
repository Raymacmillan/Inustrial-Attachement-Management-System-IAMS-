import { useState, useEffect } from "react";
import {
  Zap, CheckCircle2, Brain, AlertTriangle, FileWarning,
  Award, MapPin, ChevronDown, Play, SkipForward,
  CheckSquare, Square, Loader2, X, Calendar, User,
  Mail, UserCheck, ShieldAlert, ChevronRight,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { coordinatorService } from "../../services/coordinatorService";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Badge from "../../components/ui/Badge";

// ── Batch Allocation Panel ────────────────────────────────────────────
// Slides in from the right when students are selected.
// Coordinator sets: start date, end date, university supervisor,
// and optionally overrides the industrial supervisor.
// Industrial supervisor options are loaded from organization_supervisors
// for each org represented in the selected batch.
function BatchPanel({ selectedMatches, onClose, onAllocate, isRunning }) {
  const year = new Date().getFullYear();
  const [startDate, setStartDate]     = useState(`${year}-06-01`);
  const [endDate, setEndDate]         = useState(`${year}-07-27`);
  const [uniSupervisorName, setUniSupervisorName]   = useState("");
  const [uniSupervisorEmail, setUniSupervisorEmail] = useState("");
  const [orgSupervisors, setOrgSupervisors]         = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [error, setError]             = useState("");

  // Unique org IDs in the selected batch
  const orgIds = [...new Set(selectedMatches.map(m => m.org_id).filter(Boolean))];

  useEffect(() => {
    if (orgIds.length === 0) return;
    // Load supervisor roster for all orgs in the selection
    supabase
      .from("organization_supervisors")
      .select("id, full_name, email, phone, role_title, org_id, organization_profiles(org_name)")
      .in("org_id", orgIds)
      .eq("is_active", true)
      .order("role_title")
      .then(({ data }) => setOrgSupervisors(data || []));
  }, [selectedMatches.length]);

  const weeks = startDate && endDate
    ? Math.max(Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24 * 7)), 1)
    : 8;

  const selectedOrgSupervisor = orgSupervisors.find(s => s.id === selectedSupervisorId);

  const handleConfirm = () => {
    setError("");
    if (!startDate || !endDate) { setError("Both dates are required."); return; }
    if (new Date(endDate) <= new Date(startDate)) { setError("End date must be after start date."); return; }
    onAllocate({
      startDate,
      endDate,
      durationWeeks: weeks,
      universitySupervisorName:  uniSupervisorName.trim()  || null,
      universitySupervisorEmail: uniSupervisorEmail.trim() || null,
      // Industrial supervisor override — only applied if coordinator picks one.
      // If left blank, allocateOne falls back to the org's contact_person.
      industrialSupervisorName:  selectedOrgSupervisor?.full_name  || null,
      industrialSupervisorEmail: selectedOrgSupervisor?.email      || null,
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full sm:w-[480px] bg-white shadow-2xl border-l border-gray-100 flex flex-col animate-in slide-in-from-right duration-300">

      {/* Header */}
      <div className="bg-brand-900 px-6 py-5 flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-display text-lg font-bold text-white">Batch Allocation</h3>
          <p className="text-brand-300 text-xs mt-0.5">
            {selectedMatches.length} student{selectedMatches.length !== 1 ? "s" : ""} selected
          </p>
        </div>
        <button onClick={onClose} className="text-brand-300 hover:text-white cursor-pointer">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Selected students summary */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Students</p>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {selectedMatches.map(m => (
              <div key={m.student_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-900 truncate">{m.student_name}</p>
                  <p className="text-[10px] text-gray-400 font-semibold truncate">{m.org_name} · {m.role}</p>
                </div>
                <span className="text-xs font-black text-brand-600 ml-2 shrink-0">{m.total_score}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attachment dates */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Calendar size={12} /> Attachment Period
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
              />
            </div>
          </div>
          {startDate && endDate && new Date(endDate) > new Date(startDate) && (
            <p className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-2 rounded-xl">
              Duration: {weeks} week{weeks !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Industrial supervisor selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <UserCheck size={12} /> Industrial Supervisor
            </p>
            <span className="text-[9px] text-gray-400 font-semibold">
              From organisation roster
            </span>
          </div>

          {orgSupervisors.length > 0 ? (
            <div className="space-y-2">
              {/* Show "Auto (from org)" option + all org supervisors */}
              <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                !selectedSupervisorId
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200"
              }`}>
                <input
                  type="radio"
                  name="org_supervisor"
                  value=""
                  checked={!selectedSupervisorId}
                  onChange={() => setSelectedSupervisorId("")}
                  className="accent-brand-600"
                />
                <div>
                  <p className="text-sm font-bold text-brand-900">Auto — from org profile</p>
                  <p className="text-[10px] text-gray-400">Uses each org's default contact person</p>
                </div>
              </label>

              {orgSupervisors.map(sup => (
                <label
                  key={sup.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedSupervisorId === sup.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-gray-100 bg-gray-50 hover:border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="org_supervisor"
                    value={sup.id}
                    checked={selectedSupervisorId === sup.id}
                    onChange={() => setSelectedSupervisorId(sup.id)}
                    className="accent-brand-600"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-brand-900 truncate">{sup.full_name}</p>
                      <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest bg-brand-100 px-1.5 py-0.5 rounded-lg shrink-0">
                        {sup.role_title}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">{sup.email}</p>
                    {/* Show org name if multiple orgs in batch */}
                    {orgIds.length > 1 && sup.organization_profiles?.org_name && (
                      <p className="text-[9px] text-gray-300 font-semibold">{sup.organization_profiles.org_name}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic p-3 bg-gray-50 rounded-xl">
              No supervisor roster found. Each org's contact person will be used automatically.
            </p>
          )}
        </div>

        {/* University supervisor */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <User size={12} /> University Supervisor (UB)
          </p>
          <p className="text-[10px] text-gray-400">
            Assign one UB lecturer to oversee this entire batch. You can update per-student later.
          </p>
          <div className="space-y-2">
            <div className="relative">
              <User size={13} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Dr Jane Smith"
                value={uniSupervisorName}
                onChange={e => setUniSupervisorName(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                placeholder="lecturer@ub.ac.bw"
                value={uniSupervisorEmail}
                onChange={e => setUniSupervisorEmail(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
            {error}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-100 space-y-3 shrink-0">
        <Button
          fullWidth
          size="lg"
          loading={isRunning}
          onClick={handleConfirm}
        >
          <Play size={15} fill="currentColor" />
          Allocate {selectedMatches.length} Student{selectedMatches.length !== 1 ? "s" : ""}
        </Button>
        <Button fullWidth variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Inline vacancy selector for manual allocation ─────────────────────
function ManualAllocateRow({ student, vacancies, onAllocate, onReject, processing, rejecting }) {
  const [selectedVacancy, setSelectedVacancy] = useState("");
  const vacancy = vacancies.find(v => v.id === selectedVacancy);
  const isDocBlocked = Boolean(student.doc_warning);

  return (
    <div className={`border-2 border-dashed rounded-2xl p-5 transition-all ${
      isDocBlocked ? "border-red-200 bg-red-50/30" : "bg-white border-gray-200 hover:border-brand-200"
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-900 text-white flex items-center justify-center font-black text-sm shrink-0">
            {student.student_name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-brand-900 text-sm truncate">{student.student_name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {isDocBlocked ? (
                <span className="text-[9px] text-red-600 font-black uppercase flex items-center gap-1">
                  <ShieldAlert size={10} /> Cannot allocate — missing required docs
                </span>
              ) : (
                <span className="text-[9px] text-gray-400 font-bold uppercase">Awaiting manual assignment</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold px-3 py-2.5 pr-8 focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              value={selectedVacancy}
              onChange={e => setSelectedVacancy(e.target.value)}
              disabled={isDocBlocked}
            >
              <option value="">Pick a vacancy...</option>
              {vacancies.map(v => (
                <option key={v.id} value={v.id}>
                  {v.org_name} — {v.role_title}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
          </div>
          <Button
            size="sm"
            disabled={!selectedVacancy || processing || isDocBlocked}
            loading={processing}
            onClick={() => vacancy && onAllocate({
              student_id:   student.student_id,
              student_name: student.student_name,
              vacancy_id:   vacancy.id,
              org_id:       vacancy.org_id,
              org_name:     vacancy.org_name,
              role:         vacancy.role_title,
            })}
          >
            Allocate
          </Button>
        </div>
      </div>
      {isDocBlocked && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
          <ShieldAlert size={13} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-red-600 flex-1">{student.doc_warning}</p>
          <button
            onClick={() => onReject(student)}
            disabled={rejecting}
            className="shrink-0 text-[10px] font-black text-white bg-red-500 hover:bg-red-600
              px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {rejecting ? "Rejecting…" : "Reject Student"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Batch progress log item ───────────────────────────────────────────
function ProgressItem({ item }) {
  return (
    <div className={`flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 text-sm ${
      item.status === "success" ? "text-green-700"
      : item.status === "error"   ? "text-red-600"
      : "text-gray-400"
    }`}>
      {item.status === "success" && <CheckCircle2 size={14} className="shrink-0 text-green-500" />}
      {item.status === "error"   && <X size={14} className="shrink-0 text-red-500" />}
      {item.status === "running" && <Loader2 size={14} className="shrink-0 animate-spin text-brand-500" />}
      <span className="font-medium">{item.message}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function MatchingEngine() {
  const [suggestions, setSuggestions]               = useState([]);
  const [loading, setLoading]                       = useState(false);
  const [selectedIds, setSelectedIds]               = useState(new Set());
  const [isBatchPanelOpen, setIsBatchPanelOpen]     = useState(false);
  const [isBatchRunning, setIsBatchRunning]         = useState(false);
  const [batchLog, setBatchLog]                     = useState([]);
  const [batchDone, setBatchDone]                   = useState(false);
  const [processingId, setProcessingId]             = useState(null);
  const [rejectingId,  setRejectingId]              = useState(null);
  const [resultModal, setResultModal]               = useState({ open: false, success: true, message: "" });

  // ── Reject from engine ──
  const handleEngineReject = async (student) => {
    setRejectingId(student.student_id);
    try {
      await coordinatorService.rejectStudent(student.student_id, student.student_name);
      setSuggestions(prev => prev.filter(s => s.student_id !== student.student_id));
      setResultModal({ open: true, success: true, message: `${student.student_name} has been rejected and notified.` });
    } catch (err) {
      setResultModal({ open: true, success: false, message: err.message || "Rejection failed." });
    } finally {
      setRejectingId(null);
    }
  };

  // ── Derived state ──
  const placeableMatches    = suggestions.filter(s => !s.is_unplaceable && s.vacancy_id);
  const unplaceableStudents = suggestions.filter(s => s.is_unplaceable);
  const selectableMatches   = placeableMatches.filter(s => !s.doc_warning);
  const manualQueue         = placeableMatches.filter(s => !selectedIds.has(s.student_id));
  const allSelected         = selectableMatches.length > 0 && selectableMatches.every(s => selectedIds.has(s.student_id));

  const selectedMatches = placeableMatches.filter(s => selectedIds.has(s.student_id));

  // Unique vacancies for the manual picker
  const availableVacancies = placeableMatches.reduce((acc, s) => {
    if (!acc.find(v => v.id === s.vacancy_id)) {
      acc.push({ id: s.vacancy_id, org_id: s.org_id, org_name: s.org_name, role_title: s.role, available_slots: "?" });
    }
    return acc;
  }, []);

  // ── Run engine ──
  const runEngine = async () => {
    setLoading(true);
    setSelectedIds(new Set());
    setBatchLog([]);
    setBatchDone(false);
    try {
      const { data, error } = await supabase.functions.invoke("match-engine");
      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      setResultModal({ open: true, success: false, message: err.message || "Failed to run matching engine." });
    } finally {
      setLoading(false);
    }
  };

  // ── Checkbox helpers ──
  const toggleSelect = (studentId) => {
    const match = placeableMatches.find(s => s.student_id === studentId);
    if (match?.doc_warning) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(studentId) ? next.delete(studentId) : next.add(studentId);
      return next;
    });
  };

  const toggleAll = (e) => {
    e.stopPropagation();
    setSelectedIds(allSelected ? new Set() : new Set(selectableMatches.map(s => s.student_id)));
  };

  // ── Core allocation ──
  const allocateOne = async (match, config) => {
    // 1. Duplicate check
    const { data: existing } = await supabase
      .from("placements").select("id")
      .eq("student_id", match.student_id).eq("status", "active").maybeSingle();
    if (existing) throw new Error(`${match.student_name} already has an active placement.`);

    // 2. Slot check
    const { data: vacancy } = await supabase
      .from("organization_vacancies")
      .select("available_slots")
      .eq("id", match.vacancy_id)
      .single();
    if (!vacancy || vacancy.available_slots < 1) {
      throw new Error(`No slots remaining for "${match.role}" at ${match.org_name}.`);
    }

    // 3. Org profile — doc requirements + default supervisor
    const { data: org } = await supabase
      .from("organization_profiles")
      .select("requires_cv, requires_transcript, contact_person, supervisor_email")
      .eq("id", match.org_id)
      .single();

    // 4. Doc enforcement
    if (org) {
      const { data: student } = await supabase
        .from("student_profiles")
        .select("cv_url, transcript_url")
        .eq("id", match.student_id)
        .single();

      const missingDocs = [];
      if (org.requires_cv         && !student?.cv_url?.trim())         missingDocs.push("CV");
      if (org.requires_transcript && !student?.transcript_url?.trim()) missingDocs.push("Transcript");
      if (missingDocs.length > 0) {
        throw new Error(
          `Cannot allocate ${match.student_name} — ${match.org_name} requires: ${missingDocs.join(" & ")}.`
        );
      }
    }

    // 5. Resolve dates and supervisors
    const year       = new Date().getFullYear();
    const startDate  = config?.startDate     || `${year}-06-01`;
    const endDate    = config?.endDate       || `${year}-07-27`;
    const durationWeeks = config?.durationWeeks || 8;

    // Industrial supervisor: use coordinator's selection if provided,
    // otherwise fall back to org's contact_person
    const industrialName  = config?.industrialSupervisorName  || org?.contact_person   || null;
    const industrialEmail = config?.industrialSupervisorEmail || org?.supervisor_email || null;

    // University supervisor from batch config
    const universityName  = config?.universitySupervisorName  || null;
    const universityEmail = config?.universitySupervisorEmail || null;

    // 6. Create placement
    const { error: pError } = await supabase.from("placements").insert({
      student_id:                  match.student_id,
      organization_id:             match.org_id,
      position_title:              match.role,
      status:                      "active",
      start_date:                  startDate,
      end_date:                    endDate,
      duration_weeks:              durationWeeks,
      industrial_supervisor_name:  industrialName,
      industrial_supervisor_email: industrialEmail,
      university_supervisor_name:  universityName,
      university_supervisor_email: universityEmail,
    });
    if (pError) throw pError;

    // 7. Update student status
    const { error: sError } = await supabase.from("student_profiles")
      .update({ status: "matched" }).eq("id", match.student_id);
    if (sError) throw sError;

    // 8. Decrement slots
    await supabase.rpc("decrement_vacancy_slots", { vacancy_id: match.vacancy_id });
  };

  // ── Batch allocation ──
  const runBatchAllocation = async (config) => {
    setIsBatchPanelOpen(false);
    setIsBatchRunning(true);
    setBatchLog([]);
    setBatchDone(false);

    const toProcess = placeableMatches.filter(s => selectedIds.has(s.student_id));
    const log = [];
    const successIds = new Set();

    for (const match of toProcess) {
      log.push({ id: match.student_id, status: "running", message: `Allocating ${match.student_name} → ${match.org_name}...` });
      setBatchLog([...log]);
      try {
        await allocateOne(match, config);
        log[log.length - 1] = { id: match.student_id, status: "success", message: `${match.student_name} → ${match.org_name} as ${match.role}` };
        successIds.add(match.student_id);
      } catch (err) {
        log[log.length - 1] = { id: match.student_id, status: "error", message: `${match.student_name}: ${err.message}` };
      }
      setBatchLog([...log]);
    }

    setSuggestions(prev => prev.filter(s => !successIds.has(s.student_id)));
    setSelectedIds(new Set());
    setIsBatchRunning(false);
    setBatchDone(true);
  };

  // ── Manual single allocation — uses defaults ──
  const handleManualAllocate = async (match) => {
    setProcessingId(match.student_id);
    try {
      await allocateOne(match, null);
      setSuggestions(prev => prev.filter(s => s.student_id !== match.student_id));
      setResultModal({ open: true, success: true, message: `${match.student_name} allocated to ${match.org_name} as ${match.role}.` });
    } catch (err) {
      setResultModal({ open: true, success: false, message: err.message || "Allocation failed." });
    } finally {
      setProcessingId(null);
    }
  };

  const successCount = batchLog.filter(l => l.status === "success").length;
  const errorCount   = batchLog.filter(l => l.status === "error").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* ── Batch Panel ── */}
      {isBatchPanelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[99] bg-brand-950/40 backdrop-blur-sm"
            onClick={() => setIsBatchPanelOpen(false)}
          />
          <BatchPanel
            selectedMatches={selectedMatches}
            onClose={() => setIsBatchPanelOpen(false)}
            onAllocate={runBatchAllocation}
            isRunning={isBatchRunning}
          />
        </>
      )}

      {/* ── Header ── */}
      <div className="bg-brand-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <Brain className="absolute right-10 bottom-[-20px] w-48 h-48 text-brand-800 opacity-50" />
        <div className="relative z-10 space-y-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">Heuristic Matching Engine</h2>
            <p className="text-brand-200 text-sm max-w-lg mt-1 leading-relaxed">
              Run the engine, select students for batch allocation, set dates and supervisors — then confirm.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={runEngine} variant="secondary" size="lg" loading={loading} className="shadow-lg">
              <Zap size={18} fill="currentColor" />
              {suggestions.length > 0 ? "Re-run Analysis" : "Generate Suggestions"}
            </Button>
            {selectedIds.size > 0 && !isBatchRunning && (
              <button
                onClick={() => setIsBatchPanelOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white rounded-xl font-black text-sm transition-all shadow-lg cursor-pointer"
              >
                <Calendar size={15} />
                Allocate {selectedIds.size} Student{selectedIds.size !== 1 ? "s" : ""}
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Batch progress log ── */}
      {(isBatchRunning || batchDone) && batchLog.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-brand-900 flex items-center gap-2">
              {isBatchRunning
                ? <><Loader2 size={16} className="animate-spin text-brand-500" /> Allocation in Progress...</>
                : <><CheckCircle2 size={16} className="text-green-500" /> Batch Complete</>
              }
            </h3>
            {batchDone && (
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="text-green-600">{successCount} succeeded</span>
                {errorCount > 0 && <span className="text-red-500">{errorCount} failed</span>}
              </div>
            )}
          </div>
          <div className="px-6 py-3 max-h-52 overflow-y-auto">
            {batchLog.map((item, i) => <ProgressItem key={i} item={item} />)}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {suggestions.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-400">
          <Zap size={40} className="mx-auto mb-4 opacity-20" />
          <p className="text-[10px] font-black uppercase tracking-widest">Run the engine to generate suggestions</p>
        </div>
      )}

      {/* ── Suggestions ── */}
      {placeableMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                Engine Suggestions — {placeableMatches.length} match{placeableMatches.length !== 1 ? "es" : ""}
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Select students then click Allocate to set dates and supervisors for the batch.
              </p>
            </div>
            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 text-xs font-black text-brand-600 hover:text-brand-800 transition-colors cursor-pointer shrink-0"
            >
              {allSelected ? <><CheckSquare size={13} /> Deselect All</> : <><Square size={13} /> Select All</>}
            </button>
          </div>

          {placeableMatches.map(match => {
            const isChecked    = selectedIds.has(match.student_id);
            const isDocBlocked = Boolean(match.doc_warning);

            return (
              <div
                key={match.student_id}
                onClick={() => !isDocBlocked && toggleSelect(match.student_id)}
                className={`border-2 rounded-3xl p-5 transition-all select-none ${
                  isDocBlocked
                    ? "border-red-200 bg-red-50/20 cursor-not-allowed"
                    : isChecked
                      ? "border-brand-500 bg-brand-50/20 shadow-md cursor-pointer"
                      : "border-gray-100 hover:border-gray-200 cursor-pointer bg-white"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-1 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      isDocBlocked
                        ? "bg-red-100 border-red-300 cursor-not-allowed"
                        : isChecked
                          ? "bg-brand-600 border-brand-600 cursor-pointer"
                          : "border-gray-300 cursor-pointer"
                    }`}
                    onClick={e => { e.stopPropagation(); !isDocBlocked && toggleSelect(match.student_id); }}
                  >
                    {isDocBlocked && <ShieldAlert size={10} className="text-red-500" />}
                    {!isDocBlocked && isChecked && <CheckCircle2 size={11} className="text-white" />}
                  </div>

                  <div className="relative shrink-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-base ${
                      isDocBlocked ? "bg-red-50 text-red-400" : "bg-brand-50 text-brand-600"
                    }`}>
                      {match.total_score}%
                    </div>
                    <svg className="absolute inset-0 w-14 h-14 -rotate-90">
                      <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-100" />
                      <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="3" fill="transparent"
                        strokeDasharray="150.8"
                        strokeDashoffset={150.8 - (150.8 * match.total_score) / 100}
                        className={isDocBlocked ? "text-red-300" : "text-brand-500 transition-all duration-700"}
                      />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-bold text-brand-900 text-base leading-tight">{match.student_name}</span>
                      <span className="text-gray-300">→</span>
                      <span className="font-bold text-brand-600 text-base leading-tight">{match.org_name}</span>
                      {isChecked && !isDocBlocked && (
                        <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest bg-brand-100 px-2 py-0.5 rounded-lg">Selected</span>
                      )}
                      {isDocBlocked && (
                        <span className="text-[9px] font-black text-red-600 uppercase tracking-widest bg-red-100 px-2 py-0.5 rounded-lg">Blocked</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Award size={12} className="text-accent" />{match.role}</span>
                      {match.score_breakdown?.location > 0 && (
                        <span className="flex items-center gap-1"><MapPin size={12} className="text-green-500" />Location Match</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[["Skills", match.score_breakdown?.skills], ["GPA", match.score_breakdown?.gpa], ["Location", match.score_breakdown?.location]].map(([label, pts]) => (
                        <span key={label} className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                          isDocBlocked ? "bg-red-50 text-red-400" : "bg-brand-50 text-brand-600"
                        }`}>
                          {label} {pts || 0}pts
                        </span>
                      ))}
                    </div>
                    {match.matched_skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-gray-50">
                        <span className="text-[9px] font-black text-gray-400 uppercase self-center">Matched:</span>
                        {match.matched_skills.map((skill, i) => (
                          <span key={i} className="text-[9px] bg-green-50 border border-green-100 text-green-700 px-2 py-0.5 rounded-lg font-black uppercase">{skill}</span>
                        ))}
                      </div>
                    )}
                    {isDocBlocked && (
                      <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                        <ShieldAlert size={13} className="text-red-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-black text-red-600 uppercase tracking-wide">Allocation Blocked</p>
                          <p className="text-xs font-medium text-red-600 mt-0.5">{match.doc_warning}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEngineReject(match); }}
                          disabled={rejectingId === match.student_id}
                          className="shrink-0 text-[10px] font-black text-white bg-red-500
                            hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors cursor-pointer
                            disabled:opacity-50 whitespace-nowrap"
                        >
                          {rejectingId === match.student_id ? "Rejecting…" : "Reject Student"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Manual queue ── */}
      {manualQueue.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <SkipForward size={13} className="text-gray-400" />
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                Manual Queue — {manualQueue.length} student{manualQueue.length !== 1 ? "s" : ""}
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Pick a vacancy and allocate directly.</p>
            </div>
          </div>
          {manualQueue.map(student => (
            <ManualAllocateRow
              key={student.student_id}
              student={student}
              vacancies={availableVacancies}
              onAllocate={handleManualAllocate}
              onReject={handleEngineReject}
              processing={processingId === student.student_id}
              rejecting={rejectingId === student.student_id}
            />
          ))}
        </div>
      )}

      {/* ── Unplaceable ── */}
      {unplaceableStudents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 px-1">
            Needs Attention — {unplaceableStudents.length} student{unplaceableStudents.length !== 1 ? "s" : ""}
          </h3>
          {unplaceableStudents.map(s => (
            <div key={s.student_id} className="bg-white border-2 border-dashed border-red-100 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-2.5 bg-red-50 text-red-400 rounded-xl shrink-0">
                <AlertTriangle size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-brand-900 text-sm">{s.student_name}</p>
                <p className="text-xs text-red-600 font-medium mt-0.5">{s.unplaceable_reason}</p>
                {s.doc_warning && (
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wide mt-0.5">{s.doc_warning}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="default">Needs Profile</Badge>
                <button
                  onClick={() => handleEngineReject(s)}
                  disabled={rejectingId === s.student_id}
                  className="text-[10px] font-black text-white bg-red-500 hover:bg-red-600
                    px-3 py-1.5 rounded-lg transition-colors cursor-pointer
                    disabled:opacity-50 whitespace-nowrap"
                >
                  {rejectingId === s.student_id ? "Rejecting…" : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Result modal ── */}
      <ConfirmModal
        isOpen={resultModal.open}
        onClose={() => setResultModal(r => ({ ...r, open: false }))}
        onConfirm={() => setResultModal(r => ({ ...r, open: false }))}
        title={resultModal.success ? "Allocation Successful" : "Allocation Failed"}
        message={resultModal.message}
        confirmText="OK"
        type={resultModal.success ? "warning" : "danger"}
      />
    </div>
  );
}