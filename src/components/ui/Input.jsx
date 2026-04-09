import { forwardRef, useId } from "react";

const Input = forwardRef(({ label, error, helperText, icon, className = "", ...props }, ref) => {
  const generatedId = useId();
  const inputId = props.id || generatedId;

  return (
    <div className="w-full space-y-1 sm:space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block ml-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`
            w-full
            bg-gray-50
            border
            text-sm
            rounded-xl
            transition-all
            outline-none
            focus:ring-2
            focus:ring-brand-500
            /* Add padding-left if an icon exists */
            ${icon ? "pl-10" : "px-4"}
            /* Remove hardcoded min-h to allow py-2! to work */
            ${error ? "border-red-500 ring-red-100" : "border-gray-200"}
            ${className}
          `}
          {...props}
        />
      </div>

      {error && (
        <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-[10px] text-gray-500 mt-1 ml-1">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";
export default Input;