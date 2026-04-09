import { useState } from "react";
import {
  Zap, CheckCircle2, Brain, AlertTriangle, FileWarning,
  Award, MapPin, ChevronDown, Play, SkipForward,
  CheckSquare, Square, Loader2, X, ShieldAlert,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Badge from "../../components/ui/Badge";

// ── Inline vacancy selector for manual allocation ─────────────────────
function ManualAllocateRow({ student, vacancies, onAllocate, processing }) {
  const [selectedVacancy, setSelectedVacancy] = useState("");
  const vacancy = vacancies.find(v => v.id === selectedVacancy);
  const hasDocBlock = Boolean(student.doc_warning);

  return (
    <div className={`border-2 border-dashed rounded-2xl p-5 transition-all ${
      hasDocBlock ? "border-red-200 bg-red-50/30" : "bg-white border-gray-200 hover:border-brand-200"
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-900 text-white flex items-center justify-center font-black text-sm shrink-0">
            {student.student_name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-brand-900 text-sm truncate">{student.student_name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {hasDocBlock ? (
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
              disabled={hasDocBlock}
            >
              <option value="">Pick a vacancy...</option>
              {vacancies.map(v => (
                <option key={v.id} value={v.id}>
                  {v.org_name} — {v.role_title} ({v.available_slots} slots)
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
          </div>
          <Button
            size="sm"
            disabled={!selectedVacancy || processing || hasDocBlock}
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
      {/* Full warning text for manual queue */}
      {hasDocBlock && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
          <ShieldAlert size={13} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-red-600">{student.doc_warning}</p>
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
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false);
  const [isBatchRunning, setIsBatchRunning]         = useState(false);
  const [batchLog, setBatchLog]                     = useState([]);
  const [batchDone, setBatchDone]                   = useState(false);
  const [processingId, setProcessingId]             = useState(null);
  const [resultModal, setResultModal]               = useState({ open: false, success: true, message: "" });

  // ── Derived state ──
  const placeableMatches    = suggestions.filter(s => !s.is_unplaceable && s.vacancy_id);
  const unplaceableStudents = suggestions.filter(s => s.is_unplaceable);

  // Students with doc warnings cannot be auto-allocated
  const selectableMatches = placeableMatches.filter(s => !s.doc_warning);
  const docBlockedMatches = placeableMatches.filter(s => s.doc_warning);

  const manualQueue = placeableMatches.filter(s => !selectedIds.has(s.student_id));
  const allSelected = selectableMatches.length > 0 && selectableMatches.every(s => selectedIds.has(s.student_id));

  // Unique vacancies for the manual picker
  const availableVacancies = placeableMatches.reduce((acc, s) => {
    if (!acc.find(v => v.id === s.vacancy_id)) {
      acc.push({
        id:              s.vacancy_id,
        org_id:          s.org_id,
        org_name:        s.org_name,
        role_title:      s.role,
        available_slots: "?",
      });
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
    // Never allow selecting a doc-blocked student
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
    // Only selects/deselects students WITHOUT doc warnings
    setSelectedIds(
      allSelected
        ? new Set()
        : new Set(selectableMatches.map(s => s.student_id))
    );
  };

  // ── Core allocation (shared by auto + manual) ──
  const allocateOne = async (match) => {
    // 1. Check student doesn't already have an active placement
    const { data: existing } = await supabase
      .from("placements").select("id")
      .eq("student_id", match.student_id).eq("status", "active").maybeSingle();
    if (existing) throw new Error(`${match.student_name} already has an active placement.`);

    // 2. Check vacancy still has slots
    const { data: vacancy } = await supabase
      .from("organization_vacancies")
      .select("available_slots")
      .eq("id", match.vacancy_id)
      .single();
    if (!vacancy || vacancy.available_slots < 1) {
      throw new Error(`No slots remaining for "${match.role}" at ${match.org_name}.`);
    }

    // 3. Fetch org profile — doc requirements + supervisor details
    const { data: org } = await supabase
      .from("organization_profiles")
      .select("requires_cv, requires_transcript, contact_person, supervisor_email")
      .eq("id", match.org_id)
      .single();

    // 4. Hard enforce org-specific document requirements.
    //    Blocked if org requires a doc the student doesn't have.
    //    If org toggled off the requirement, missing that doc is fine.
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
          `Cannot allocate ${match.student_name} — ${match.org_name} requires: ${missingDocs.join(" & ")}. ` +
          `Student has not uploaded ${missingDocs.length === 1 ? "this document" : "these documents"}.`
        );
      }
    }

    // 5. Create placement with industrial supervisor auto-filled from org
    const { error: pError } = await supabase.from("placements").insert({
      student_id:                  match.student_id,
      organization_id:             match.org_id,
      position_title:              match.role,
      status:                      "active",
      start_date:                  new Date().toISOString().split("T")[0],
      end_date:                    new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      duration_weeks:              8,
      industrial_supervisor_name:  org?.contact_person   || null,
      industrial_supervisor_email: org?.supervisor_email || null,
    });
    if (pError) throw pError;

    // 6. Update student status
    const { error: sError } = await supabase.from("student_profiles")
      .update({ status: "matched" }).eq("id", match.student_id);
    if (sError) throw sError;

    // 7. Decrement slots
    await supabase.rpc("decrement_vacancy_slots", { vacancy_id: match.vacancy_id });
  };

  // ── Auto-allocate batch ──
  const runBatchAllocation = async () => {
    setIsBatchConfirmOpen(false);
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
        await allocateOne(match);
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

  // ── Manual single allocation ──
  const handleManualAllocate = async (match) => {
    setProcessingId(match.student_id);
    try {
      await allocateOne(match);
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

      {/* ── Header ── */}
      <div className="bg-brand-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <Brain className="absolute right-10 bottom-[-20px] w-48 h-48 text-brand-800 opacity-50" />
        <div className="relative z-10 space-y-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">Heuristic Matching Engine</h2>
            <p className="text-brand-200 text-sm max-w-lg mt-1 leading-relaxed">
              Run the engine, check students for auto-allocation, then handle the rest manually.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={runEngine} variant="secondary" size="lg" loading={loading} className="shadow-lg">
              <Zap size={18} fill="currentColor" />
              {suggestions.length > 0 ? "Re-run Analysis" : "Generate Suggestions"}
            </Button>
            {selectedIds.size > 0 && !isBatchRunning && (
              <button
                onClick={() => setIsBatchConfirmOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white rounded-xl font-black text-sm transition-all shadow-lg cursor-pointer"
              >
                <Play size={15} fill="currentColor" />
                Auto-Allocate {selectedIds.size} Student{selectedIds.size !== 1 ? "s" : ""}
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

      {/* ── Suggestions with checkboxes ── */}
      {placeableMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                Engine Suggestions — {placeableMatches.length} match{placeableMatches.length !== 1 ? "es" : ""}
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Check students to auto-allocate. Students with missing docs cannot be selected.
              </p>
            </div>
            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 text-xs font-black text-brand-600 hover:text-brand-800 transition-colors cursor-pointer shrink-0"
            >
              {allSelected
                ? <><CheckSquare size={13} /> Deselect All</>
                : <><Square size={13} /> Select All</>
              }
            </button>
          </div>

          {placeableMatches.map((match) => {
            const isChecked   = selectedIds.has(match.student_id);
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

                  {/* Checkbox — disabled and visually blocked if doc warning */}
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

                  {/* Score ring */}
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

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-bold text-brand-900 text-base leading-tight">{match.student_name}</span>
                      <span className="text-gray-300">→</span>
                      <span className="font-bold text-brand-600 text-base leading-tight">{match.org_name}</span>
                      {isChecked && !isDocBlocked && (
                        <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest bg-brand-100 px-2 py-0.5 rounded-lg">
                          Auto
                        </span>
                      )}
                      {isDocBlocked && (
                        <span className="text-[9px] font-black text-red-600 uppercase tracking-widest bg-red-100 px-2 py-0.5 rounded-lg">
                          Blocked
                        </span>
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

                    {/* Doc warning — full red banner, not just amber text */}
                    {isDocBlocked && (
                      <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                        <ShieldAlert size={13} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black text-red-600 uppercase tracking-wide">Allocation Blocked</p>
                          <p className="text-xs font-medium text-red-600 mt-0.5">{match.doc_warning}</p>
                        </div>
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
              <p className="text-[10px] text-gray-400 mt-0.5">
                Pick a vacancy and allocate directly.
              </p>
            </div>
          </div>
          {manualQueue.map((student) => (
            <ManualAllocateRow
              key={student.student_id}
              student={student}
              vacancies={availableVacancies}
              onAllocate={handleManualAllocate}
              processing={processingId === student.student_id}
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
          {unplaceableStudents.map((s) => (
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
              <Badge variant="default">Needs Profile</Badge>
            </div>
          ))}
        </div>
      )}

      {/* ── Batch confirm ── */}
      <ConfirmModal
        isOpen={isBatchConfirmOpen}
        onClose={() => setIsBatchConfirmOpen(false)}
        onConfirm={runBatchAllocation}
        title={`Auto-Allocate ${selectedIds.size} Student${selectedIds.size !== 1 ? "s" : ""}?`}
        message={`The system will allocate ${selectedIds.size} selected student${selectedIds.size !== 1 ? "s" : ""} to their top-matched vacancies. Active placements will be created and statuses updated. This cannot be undone in bulk.`}
        confirmText="Run Auto-Allocation"
        type="warning"
      />

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