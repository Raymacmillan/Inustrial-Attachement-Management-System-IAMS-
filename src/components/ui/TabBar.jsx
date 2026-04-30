/**
 * TabBar — IAMS
 *
 * Horizontal tab navigation rendered as a segmented pill container.
 * Each tab can carry an optional dot indicator (filled/empty) or
 * a numeric badge — used to show completion state per day in the logbook,
 * or pending counts in the supervisor portal.
 *
 * Usage:
 *   <TabBar
 *     tabs={[
 *       { key: "mon", label: "Mon", sublabel: "12 May", dot: true },
 *       { key: "tue", label: "Tue", sublabel: "13 May", dot: false },
 *       { key: "wed", label: "Wed", sublabel: "14 May", count: 2 },
 *     ]}
 *     activeKey={activeDay}
 *     onChange={setActiveDay}
 *     fullWidth
 *   />
 *
 * Tab shape:
 *   key       — unique key
 *   label     — main tab text
 *   sublabel  — optional smaller secondary line (e.g. date)
 *   dot       — boolean: show filled dot when true, empty ring when false
 *               omit entirely to show no indicator
 *   count     — number: show numeric badge (red if > 0)
 *   disabled  — prevents interaction
 *
 * Props:
 *   tabs      — tab array
 *   activeKey — controlled active key
 *   onChange  — (key) => void
 *   fullWidth — each tab stretches equally (default false)
 *   size      — "sm" | "md" (default "md")
 *   className — extra classes on wrapper
 */
export default function TabBar({
  tabs,
  activeKey,
  onChange,
  fullWidth = false,
  size = "md",
  className = "",
}) {
  const sm = size === "sm";

  return (
    <div className={`flex gap-0.5 bg-gray-100 rounded-2xl p-1
      ${fullWidth ? "w-full" : "w-fit"} ${className}`}>
      {tabs.map((tab) => {
        const isActive   = tab.key === activeKey;
        const isDisabled = !!tab.disabled;
        const hasDot     = tab.dot !== undefined;
        const hasCount   = tab.count !== undefined;

        return (
          <button
            key={tab.key}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(tab.key)}
            className={`
              flex flex-col items-center justify-center rounded-xl
              transition-all duration-150 cursor-pointer select-none
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-brand-500 focus-visible:ring-offset-1
              ${fullWidth ? "flex-1" : ""}
              ${sm ? "px-3 py-1.5 gap-0.5" : "px-4 py-2.5 gap-1"}
              ${isActive
                ? "bg-white shadow-sm text-brand-900"
                : isDisabled
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:text-gray-800 hover:bg-white/60"
              }
            `}
          >
            {/* Main label */}
            <span className={`font-bold leading-none ${sm ? "text-[11px]" : "text-xs"}`}>
              {tab.label}
            </span>

            {/* Sublabel (e.g. date) */}
            {tab.sublabel && (
              <span className={`font-medium leading-none
                ${isActive ? "text-gray-400" : "text-gray-400"}
                ${sm ? "text-[9px]" : "text-[10px]"}`}>
                {tab.sublabel}
              </span>
            )}

            {/* Dot indicator */}
            {hasDot && (
              <span className={`rounded-full transition-colors
                ${sm ? "w-1 h-1" : "w-1.5 h-1.5"}
                ${tab.dot
                  ? isActive ? "bg-brand-500" : "bg-brand-400"
                  : "bg-gray-300"
                }`}
              />
            )}

            {/* Count badge */}
            {hasCount && (
              <span className={`font-black leading-none rounded-full px-1.5 py-0.5
                ${sm ? "text-[8px]" : "text-[9px]"}
                ${tab.count > 0
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-200 text-gray-400"
                }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}