/**
 * IAMS Button Component
 *
 * VARIANTS:
 *   primary   — brand blue, filled. Default. Use for main actions.
 *   secondary — white with border. Use for secondary actions alongside primary.
 *   danger    — red. Use for destructive actions (delete, remove).
 *   ghost     — no background. Use for subtle actions in dense UIs.
 *
 * SIZES:
 *   sm   — compact. Table actions, icon buttons, tight spaces.
 *   md   — default. Form submit buttons, modal actions.
 *   lg   — dashboard CTAs. "Update Profile", "Post Vacancy" style actions.
 *   xl   — hero / full-width CTAs. Register Now, Get Started.
 *
 * USAGE EXAMPLES:
 *
 *   Form submit:
 *     <Button type="submit" loading={saving}>Save Profile</Button>
 *
 *   Dashboard CTA (big, prominent):
 *     <Button size="lg"><Plus size={18} /> Post New Vacancy</Button>
 *
 *   Full-width hero CTA:
 *     <Button size="xl" fullWidth>Register Now</Button>
 *
 *   Danger action:
 *     <Button variant="danger" size="sm">Remove</Button>
 *
 *   Secondary alongside primary:
 *     <Button variant="secondary">Cancel</Button>
 *     <Button>Save</Button>
 */
export default function Button({
  children,
  loading = false,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  ...props
}) {
  const base = `
    inline-flex items-center justify-center gap-2
    font-semibold transition-all duration-150
    active:scale-[0.97] cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `;

  const variants = {
    primary:   "bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 focus:ring-brand-500 shadow-sm hover:shadow-md",
    secondary: "bg-white text-brand-700 border border-brand-600 hover:bg-brand-100 focus:ring-brand-500",
    danger:    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-sm",
    ghost:     "bg-transparent text-brand-600 hover:bg-brand-100 focus:ring-brand-500",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs rounded-lg",


    md: "h-10 px-5 text-sm rounded-lg",

 
    lg: "h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base rounded-xl",

   
    xl: "h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg font-bold rounded-xl w-full sm:w-auto",
  };

  return (
    <button
      disabled={loading || props.disabled}
      className={`
        cursor-pointer
        ${base}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : size === "xl" ? "" : "w-fit"}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}