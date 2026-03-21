export default function Badge({ children, variant = "default" }) {
  const variants = {
    default: "bg-gray-100 text-gray-600",
    brand: "bg-brand-50 text-brand-700 border-brand-100",
    success: "bg-green-50 text-green-700 border-green-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${variants[variant]}`}>
      {children}
    </span>
  );
}