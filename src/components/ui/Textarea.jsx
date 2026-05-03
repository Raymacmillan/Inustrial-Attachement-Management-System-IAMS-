import { forwardRef, useId } from "react";

/**
 * Textarea — IAMS
 *
 * Labelled textarea that mirrors Input.jsx conventions exactly.
 * Same label style, same error/helper pattern, same focus ring.
 * Drop-in companion to Input wherever multi-line text is needed.
 *
 * Usage:
 *   <Textarea
 *     label="What did you do today?"
 *     placeholder="Walk through your day…"
 *     value={value}
 *     onChange={(e) => setValue(e.target.value)}
 *     rows={4}
 *     maxLength={1000}
 *     showCount
 *     error="This field is required"
 *     helperText="Auto-saved as you type"
 *   />
 *
 * Props:
 *   label      — string above field (omit to skip label)
 *   id         — explicit id; auto-generated if omitted
 *   value      — controlled value
 *   onChange   — change handler
 *   placeholder
 *   rows       — default 4
 *   maxLength  — enforces cap + powers showCount
 *   showCount  — show "N / maxLength" counter
 *   error      — red border + message
 *   helperText — subtle grey hint (hidden when error present)
 *   disabled
 *   required   — adds red asterisk to label
 *   resize     — "none" | "vertical" | "both" (default "none")
 *   className  — extra classes on <textarea>
 */
const Textarea = forwardRef(({
  label,
  id: idProp,
  value = "",
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  showCount = false,
  error,
  helperText,
  disabled = false,
  required = false,
  resize = "none",
  className = "",
  ...props
}, ref) => {
  const generatedId = useId();
  const fieldId     = idProp || generatedId;
  const charCount   = String(value).length;
  const nearLimit   = maxLength && charCount >= maxLength * 0.9;
  const overLimit   = maxLength && charCount > maxLength;
  const hasError    = !!error || overLimit;

  const resizeClass = { none: "resize-none", vertical: "resize-y", both: "resize" }[resize] ?? "resize-none";

  return (
    <div className="w-full space-y-1 sm:space-y-1.5">
      {/* Label — identical style to Input.jsx */}
      {label && (
        <label
          htmlFor={fieldId}
          className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block ml-1"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={fieldId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        className={`
          w-full bg-gray-50 border text-sm rounded-xl px-4 py-3
          leading-relaxed outline-none transition-all ${resizeClass}
          focus:ring-2 focus:ring-brand-500
          ${hasError
            ? "border-red-500 ring-1 ring-red-100 bg-red-50/20"
            : disabled
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-gray-200 hover:border-gray-300"
          }
          ${className}
        `}
        {...props}
      />

      {/* Footer: error/helper + count */}
      {(error || helperText || (showCount && maxLength)) && (
        <div className="flex items-start justify-between gap-2 ml-1">
          <p className={`text-[10px] font-bold leading-snug
            ${hasError ? "text-red-500" : "text-gray-500"}`}>
            {error || helperText}
          </p>

          {showCount && maxLength && (
            <p className={`text-[10px] font-bold shrink-0 tabular-nums
              ${overLimit ? "text-red-500" : nearLimit ? "text-amber-600" : "text-gray-400"}`}>
              {charCount} / {maxLength}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Textarea.displayName = "Textarea";
export default Textarea;