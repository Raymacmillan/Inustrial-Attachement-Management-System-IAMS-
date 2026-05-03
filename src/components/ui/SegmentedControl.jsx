/**
 * SegmentedControl — IAMS
 *
 * A pill-shaped exclusive option toggle. Exactly one option active at a time.
 * Used for: logbook template selection, view-mode switches, filter toggles.
 *
 * Usage:
 *   <SegmentedControl
 *     options={[
 *       { key: "standard",    label: "General",     description: "Free-form summary" },
 *       { key: "technical",   label: "Technical",   description: "Tasks · Learning · Blockers" },
 *       { key: "soft_skills", label: "Soft Skills", description: "Interactions · Growth" },
 *     ]}
 *     value="standard"
 *     onChange={(key) => setTemplate(key)}
 *     accent="brand"
 *   />
 *
 * Props:
 *   options    — { key, label, description?, icon?, disabled? }[]
 *   value      — active key (controlled)
 *   onChange   — (key: string) => void
 *   accent     — "brand" | "violet" | "teal" | "amber" | "red"
 *   size       — "sm" | "md" (default "md")
 *   disabled   — disables all options (e.g. when form is locked)
 *   fullWidth  — stretches to fill container
 *   className  — extra classes on wrapper
 */

const ACCENTS = {
  brand:  "bg-brand-600  text-white",
  violet: "bg-violet-600 text-white",
  teal:   "bg-teal-600   text-white",
  amber:  "bg-amber-500  text-white",
  red:    "bg-red-600    text-white",
};

export default function SegmentedControl({
  options,
  value,
  onChange,
  accent = "brand",
  size = "md",
  disabled = false,
  fullWidth = false,
  className = "",
}) {
  const activeClass = ACCENTS[accent] || ACCENTS.brand;
  const sm = size === "sm";

  return (
    <div
      role="group"
      aria-label="Options"
      className={`inline-flex rounded-xl border border-gray-200 bg-gray-100 p-0.5 gap-0.5
        ${fullWidth ? "w-full" : "w-fit"} ${className}`}
    >
      {options.map((opt) => {
        const isActive   = opt.key === value;
        const isDisabled = disabled || !!opt.disabled;

        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={isDisabled}
            title={opt.description}
            onClick={() => !isDisabled && !isActive && onChange(opt.key)}
            className={`
              flex items-center gap-1.5 rounded-lg font-bold
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-brand-500 focus-visible:ring-offset-1
              ${fullWidth ? "flex-1 justify-center" : ""}
              ${sm ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-[11px]"}
              ${isActive
                ? `${activeClass} shadow-sm cursor-default`
                : isDisabled
                ? "text-gray-300 cursor-not-allowed opacity-60"
                : "text-gray-600 hover:text-gray-900 hover:bg-white cursor-pointer"
              }
            `}
          >
            {opt.icon && (
              <span className="shrink-0 flex items-center justify-center w-3.5 h-3.5">
                {opt.icon}
              </span>
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}