export default function ScoreInput({ label, value, onChange, disabled }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
        {label}
      </label>
      <div className="flex gap-1.5 flex-wrap" role="group" aria-label={label}>
        {[...Array(10)].map((_, i) => {
          const score  = i + 1;
          const active = value === score;
          return (
            <button
              key={score}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              aria-label={`${score} out of 10`}
              onClick={() => onChange(score)}
              className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer
                ${active
                  ? "bg-brand-600 text-white shadow-sm"
                  : disabled
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                  : "bg-gray-100 text-gray-500 hover:bg-brand-100 hover:text-brand-600"
                }`}
            >
              {score}
            </button>
          );
        })}
      </div>
    </div>
  );
}
