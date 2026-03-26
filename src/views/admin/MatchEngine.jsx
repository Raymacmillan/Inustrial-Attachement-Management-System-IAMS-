import { useState } from "react";
import {
  Zap, CheckCircle2, Loader2,
  Award, MapPin, Brain,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";

export default function MatchingEngine() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [pendingMatch, setPendingMatch] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [resultModal, setResultModal] = useState({ open: false, success: true, message: "" });

  // ── CALLING THE EDGE FUNCTION ──
  const runEngine = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("match-engine");
      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      console.error("Engine Error:", err);
      setResultModal({
        open: true,
        success: false,
        message: err.message || "Failed to run matching engine.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClick = (match) => {
    setPendingMatch(match);
    setIsConfirmOpen(true);
  };

  // ── FINALIZING THE ALLOCATION ──
  const approvePlacement = async () => {
    const match = pendingMatch;
    if (!match) return;

    setProcessingId(`${match.student_id}-${match.vacancy_id}`);
    try {
      // 1. Check if student already has an active placement
      //    The DB constraint UNIQUE(student_id, status) would reject a second
      //    'active' row — we check first to give a clear error message instead
      const { data: existing } = await supabase
        .from("placements")
        .select("id")
        .eq("student_id", match.student_id)
        .eq("status", "active")
        .maybeSingle(); // maybeSingle returns null if 0 rows, no error

      if (existing) {
        throw new Error(
          `${match.student_name} already has an active placement. Complete or terminate it before allocating again.`
        );
      }

      // 2. Insert the placement
      const { error: pError } = await supabase.from("placements").insert({
        student_id: match.student_id,
        organization_id: match.org_id,
        position_title: match.role,
        status: "active",
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        duration_weeks: 8,
      });
      if (pError) throw pError;

      // 3. Update student status
      const { error: sError } = await supabase
        .from("student_profiles")
        .update({ status: "matched" })
        .eq("id", match.student_id);
      if (sError) throw sError;

      // 4. Decrement vacancy slots (non-critical)
      const { error: vError } = await supabase.rpc("decrement_vacancy_slots", {
        vacancy_id: match.vacancy_id,
      });
      if (vError) console.warn("Slot decrement failed:", vError.message);

      // 5. Remove allocated student from suggestions list
      setSuggestions((prev) =>
        prev.filter((s) => s.student_id !== match.student_id)
      );

      setResultModal({
        open: true,
        success: true,
        message: `${match.student_name} has been successfully allocated to ${match.org_name} as ${match.role}.`,
      });
    } catch (err) {
      console.error("Placement failed:", err);
      setResultModal({
        open: true,
        success: false,
        message: err.message || "Placement failed. Please try again.",
      });
    } finally {
      setProcessingId(null);
      setPendingMatch(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* ── Header ── */}
      <div className="bg-brand-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <Brain className="absolute right-10 bottom-[-20px] w-48 h-48 text-brand-800 opacity-50" />
        <div className="relative z-10 space-y-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">
              Heuristic Matching Engine
            </h2>
            <p className="text-brand-200 text-sm max-w-md mt-1 leading-relaxed">
              Analyzing student preferences, technical skills, and GPA against
              host requirements using weighted scoring.
            </p>
          </div>
          <Button
            onClick={runEngine}
            variant="secondary"
            size="lg"
            loading={loading}
            className="shadow-lg"
          >
            <Zap size={18} fill="currentColor" />
            {suggestions.length > 0 ? "Re-run Analysis" : "Generate Match Suggestions"}
          </Button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {suggestions.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-400">
          <Zap size={40} className="mx-auto mb-4 opacity-20" />
          <p className="text-[10px] font-black uppercase tracking-widest">
            Run the engine to generate pairings
          </p>
        </div>
      )}

      {/* ── Suggestions List ── */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 px-2">
            Top Recommended Pairings — {suggestions.length} matches
          </h3>
          {suggestions.map((match, idx) => (
            <div
              key={idx}
              className="group bg-white border border-gray-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl hover:border-brand-200 transition-all"
            >
              <div className="flex items-center gap-6 flex-1">
                {/* Score ring */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 font-black text-lg">
                    {match.total_score}%
                  </div>
                  <svg className="absolute inset-0 w-16 h-16 -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                      strokeDasharray="175.9"
                      strokeDashoffset={175.9 - (175.9 * match.total_score) / 100}
                      className="text-brand-500 transition-all duration-700"
                    />
                  </svg>
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-brand-900 text-lg leading-tight">{match.student_name}</h4>
                    <span className="text-gray-300">→</span>
                    <h4 className="font-bold text-brand-600 text-lg leading-tight">{match.org_name}</h4>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Award size={13} className="text-accent" /> {match.role}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> Location Match
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleConfirmClick(match)}
                loading={processingId === `${match.student_id}-${match.vacancy_id}`}
                className="w-full md:w-auto shrink-0"
              >
                <CheckCircle2 size={16} />
                Confirm Allocation
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* ── Confirm Allocation Modal ── */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => { setIsConfirmOpen(false); setPendingMatch(null); }}
        onConfirm={approvePlacement}
        title="Confirm Allocation?"
        message={
          pendingMatch
            ? `You are about to allocate ${pendingMatch.student_name} to ${pendingMatch.org_name} as ${pendingMatch.role}. This will create an active placement and update the student's status.`
            : ""
        }
        confirmText="Confirm Allocation"
        type="warning"
      />

      {/* ── Result Feedback Modal ── */}
      <ConfirmModal
        isOpen={resultModal.open}
        onClose={() => setResultModal((r) => ({ ...r, open: false }))}
        onConfirm={() => setResultModal((r) => ({ ...r, open: false }))}
        title={resultModal.success ? "Allocation Successful" : "Allocation Failed"}
        message={resultModal.message}
        confirmText="OK"
        type={resultModal.success ? "warning" : "danger"}
      />
    </div>
  );
}