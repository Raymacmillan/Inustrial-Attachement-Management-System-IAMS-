export default function StatCard({ title, value, icon: Icon, colorClass = "border-brand-600" }) {
  return (
    <div className={`card border-l-4 ${colorClass} p-5 flex items-center justify-between bg-white shadow-sm min-w-50`}>
      <div className="flex-1">
        <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1 whitespace-nowrap">
          {title}
        </h3>
        <p className="text-2xl font-display text-brand-900">{value}</p>
      </div>
     
      <div className="shrink-0 p-3 bg-gray-50 rounded-xl text-brand-600 ml-2">
        <Icon size={24} strokeWidth={2.5} />
      </div>
    </div>
  );
}