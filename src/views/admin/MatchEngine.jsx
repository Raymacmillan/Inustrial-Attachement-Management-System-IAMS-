import { useState } from "react";
import { Zap, CheckCircle2, AlertCircle, Loader2, Award, MapPin, Brain } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";

export default function MatchingEngine() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // ── CALLING THE EDGE FUNCTION ──
  const runEngine = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-engine');
      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      console.error("Engine Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── FINALIZING THE ALLOCATION ──
  const approvePlacement = async (match) => {
    setProcessingId(`${match.student_id}-${match.vacancy_id}`);
    try {
      const { error: pError } = await supabase.from('placements').insert({
        student_id: match.student_id,
        organization_id: match.org_id, 
        position_title: match.role,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000).toISOString() 
      });

      if (pError) throw pError;

      
      await supabase.from('student_profiles')
        .update({ status: 'matched' })
        .eq('id', match.student_id);

    
      setSuggestions(prev => prev.filter(s => s.student_id !== match.student_id));
      
      alert(`Successfully allocated ${match.student_name} to ${match.org_name}`);
    } catch (err) {
      alert("Placement failed. Check console.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-brand-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <Brain className="absolute right-10 bottom-[-20px] w-48 h-48 text-brand-800 opacity-50" />
        <div className="relative z-10">
          <h2 className="text-3xl font-display font-bold mb-2">Heuristic Matching Engine</h2>
          <p className="text-brand-200 max-w-md mb-6">
            Analyzing student preferences, technical skills, and GPA against host requirements using weighted scoring.
          </p>
          <Button 
            onClick={runEngine} 
            variant="secondary" 
            size="lg" 
            disabled={loading}
            className="shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Zap className="mr-2" fill="currentColor" />}
            {suggestions.length > 0 ? "Re-run Analysis" : "Generate Match Suggestions"}
          </Button>
        </div>
      </div>

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <div className="grid gap-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 px-2">Top Recommended Pairings</h3>
          {suggestions.map((match, idx) => (
            <div key={idx} className="group bg-white border border-gray-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl hover:border-brand-200 transition-all">
              
              <div className="flex items-center gap-6 flex-1">
                <div className="relative">
                   <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 font-bold text-xl">
                      {match.total_score}%
                   </div>
                   <svg className="absolute inset-0 w-16 h-16 -rotate-90">
                      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
                      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="188.5" strokeDashoffset={188.5 - (188.5 * match.total_score) / 100} className="text-brand-500" />
                   </svg>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-brand-900 text-lg">{match.student_name}</h4>
                    <span className="text-gray-300">→</span>
                    <h4 className="font-bold text-brand-600 text-lg">{match.org_name}</h4>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1"><Award size={14} className="text-accent" /> {match.role}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> Location Match</span>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto">
                <Button 
                  onClick={() => approvePlacement(match)}
                  disabled={processingId === `${match.student_id}-${match.vacancy_id}`}
                  className="w-full"
                >
                  {processingId === `${match.student_id}-${match.vacancy_id}` ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} className="mr-2" />}
                  Confirm Allocation
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}