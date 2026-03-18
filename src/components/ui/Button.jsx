/**
 * @description Massive Button Atom 
 */
export default function Button({ 
  children, 
  loading, 
  variant = 'primary', 
  className = '', 
  ...props 
}) {

  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost'
  };

  return (
    <button
      disabled={loading || props.disabled}
      className={`
        ${variants[variant]}
        w-full
        min-h-16      /* Massive touch target */
        text-xl sm:text-2xl /* Large, readable text */
        py-5              /* Deep vertical padding */
        px-8
        rounded-2xl
        shadow-xl
        flex items-center justify-center
        gap-3
        active:scale-95   /* Touch feedback */
        transition-all
        duration-150
        cursor-pointer
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-6 w-6 text-current" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}