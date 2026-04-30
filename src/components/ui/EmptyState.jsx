/**
 * EmptyState — IAMS
 *
 * Replaces the inline "no data" blocks scattered across every dashboard.
 * Consistent icon + title + description + optional CTA button.
 *
 * Usage:
 *   <EmptyState
 *     icon={ClipboardList}
 *     title="No Active Placement"
 *     description="Your logbook unlocks once the coordinator assigns you to a host organisation."
 *     action={{ label: "Update Preferences", onClick: () => navigate("/student/preferences") }}
 *     secondaryAction={{ label: "Back to Dashboard", onClick: () => navigate("/student/dashboard") }}
 *   />
 *
 * Props:
 *   icon             — lucide icon component (e.g. ClipboardList)
 *   iconColor        — tailwind text + bg pair e.g. "text-brand-600 bg-brand-50" (default brand)
 *   title            — heading string
 *   description      — body text (string or JSX)
 *   action           — { label, onClick, variant? } primary CTA
 *   secondaryAction  — { label, onClick } ghost CTA
 *   size             — "sm" | "md" | "lg" (default "md")
 *   bordered         — wrap in dashed border card (default true)
 *   className        — extra classes on wrapper
 */
import Button from "./Button";

export default function EmptyState({
  icon: Icon,
  iconColor = "text-brand-600 bg-brand-50",
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  bordered = true,
  className = "",
}) {
  const padding  = { sm: "p-8",  md: "p-12", lg: "p-16" }[size] || "p-12";
  const iconSize = { sm: 20,     md: 28,     lg: 36     }[size] || 28;
  const iconBox  = { sm: "w-10 h-10 rounded-xl", md: "w-14 h-14 rounded-2xl", lg: "w-18 h-18 rounded-2xl" }[size] || "w-14 h-14 rounded-2xl";
  const titleSz  = { sm: "text-lg", md: "text-xl", lg: "text-2xl" }[size] || "text-xl";

  return (
    <div className={`
      flex flex-col items-center justify-center text-center mx-auto
      max-w-md ${padding}
      ${bordered ? "bg-white border-2 border-dashed border-gray-200 rounded-3xl" : ""}
      ${className}
    `}>
      {/* Icon */}
      {Icon && (
        <div className={`${iconBox} ${iconColor} flex items-center justify-center mb-5 mx-auto`}>
          <Icon size={iconSize} strokeWidth={1.5} />
        </div>
      )}

      {/* Text */}
      <div className="space-y-2 mb-6">
        {title && (
          <h3 className={`font-display font-bold text-brand-900 ${titleSz}`}>
            {title}
          </h3>
        )}
        {description && (
          <p className="text-gray-400 text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button
              variant={action.variant || "primary"}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}