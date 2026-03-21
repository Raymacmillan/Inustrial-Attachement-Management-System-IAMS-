import { Zap, Construction } from "lucide-react";

export default function MatchingEngine() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
      <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center animate-bounce">
        <Zap size={40} fill="currentColor" />
      </div>
      <h2 className="font-display text-3xl text-brand-900 font-bold">Heuristic Engine</h2>
      <p className="text-gray-500 max-w-sm">
        The intelligent matching algorithm is currently being calibrated. 
        Soon, this will pair students with host organizations automatically.
      </p>
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-xs font-bold uppercase tracking-widest">
        <Construction size={14} />
        Under Development (Sprint 2)
      </div>
    </div>
  );
}