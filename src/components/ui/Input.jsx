
import { forwardRef, useId } from "react";

const Input = forwardRef(({ label, error, helperText, className = "", ...props }, ref) => {
  const generatedId = useId();
  const inputId = props.id || generatedId;

  return (
    <div className="w-full space-y-1 sm:space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="label-base text-sm sm:text-base font-bold text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`
          input-base
          w-full
          min-h-12 sm:min-h-14
          text-sm sm:text-base
          px-4 sm:px-5
          rounded-lg sm:rounded-xl
          ${error ? "border-danger ring-red-100" : "border-gray-200"}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-danger font-bold mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";
export default Input;