import { CheckCircle } from "lucide-react";

/**
 * IAMS Reusable Selection Pill
 * Designed for Multi-select UIs (Locations, Skills, Roles)
 * * PROPS:
 * label      - String. The text to display.
 * isSelected - Boolean. Active/Selected state.
 * isDisabled - Boolean. Prevents selection (e.g., when 3-item limit is hit).
 * onClick    - Function.
 */
export default function Pill({ 
  label, 
  isSelected, 
  isDisabled = false, 
  onClick 
}) {
  
  const base = `
    inline-flex items-center justify-center gap-2
    px-4 py-2.5 rounded-xl text-xs font-bold
    transition-all duration-200 border select-none
    active:scale-[0.95] focus:outline-none focus:ring-2 focus:ring-brand-500
  `;

  const stateStyles = isSelected 
    ? "bg-brand-900 text-white border-brand-900 shadow-md transform scale-105 z-10" 
    : "bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-600 bg-gray-50/30";

  const disabledStyles = (isDisabled && !isSelected) 
    ? "opacity-30 cursor-not-allowed grayscale pointer-events-none" 
    : "cursor-pointer";

  return (
    <button
      type="button"
      disabled={isDisabled && !isSelected}
      onClick={onClick}
      className={`${base} ${stateStyles} ${disabledStyles}`}
    >
      {isSelected && (
        <CheckCircle 
          size={14} 
          className="shrink-0 animate-in zoom-in duration-300 text-brand-400" 
        />
      )}
      {label}
    </button>
  );
}