import { Building2, MapPin, Globe, ChevronRight } from "lucide-react";
import Badge from "./Badge";
import Button from "./Button";

export default function PartnerCard({ partner, onViewProfile }) {
  const totalSlots = partner.organization_vacancies?.reduce(
    (acc, v) => acc + (v.available_slots || 0), 
    0
  );
  const activeRoles = partner.organization_vacancies?.filter(v => v.is_active).length || 0;

  return (
    <div className="card bg-white border border-gray-100 p-8 rounded-3xl hover:shadow-2xl hover:border-brand-100 transition-all group flex flex-col h-full">
      {/* Top Section */}
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 group-hover:bg-brand-900 group-hover:text-white transition-all duration-300 shadow-sm">
          <Building2 size={28} />
        </div>
        <Badge variant={totalSlots > 0 ? "success" : "warning"}>
          {totalSlots} {totalSlots === 1 ? 'Slot' : 'Slots'} Open
        </Badge>
      </div>

      {/* Title & Industry */}
      <div className="space-y-1 mb-6">
        <h3 className="font-display text-2xl text-brand-900 font-bold leading-tight group-hover:text-brand-600 transition-colors">
          {partner.org_name}
        </h3>
        <p className="text-[10px] text-brand-500 font-black uppercase tracking-[0.2em]">
          {partner.industry || 'General Industry'}
        </p>
      </div>

      <div className="space-y-4 mb-8 border-y border-gray-50 py-6">
        <div className="flex items-center gap-3 text-gray-600">
          <MapPin size={18} className="text-brand-300 shrink-0" />
          <span className="text-sm font-medium">{partner.location || 'Location Pending'}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <Globe size={18} className="text-brand-300 shrink-0" />
          <span className="text-sm font-medium break-all">
            {partner.email}
          </span>
        </div>
      </div>

      {/* Vacancy Chips */}
      <div className="flex-1 space-y-3">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Available Positions ({activeRoles})
        </p>
        <div className="flex flex-wrap gap-2">
          {partner.organization_vacancies?.map((vacancy) => (
            <span 
              key={vacancy.id} 
              className="text-[9px] bg-brand-50 border border-brand-100 text-brand-700 px-3 py-1.5 rounded-lg font-bold uppercase tracking-tight"
            >
              {vacancy.role_title} <span className="opacity-50 ml-1">x{vacancy.available_slots}</span>
            </span>
          ))}
          {activeRoles === 0 && (
            <span className="text-[10px] italic text-gray-400">No active vacancies listed</span>
          )}
        </div>
      </div>
      
      {/* Functional UI Button */}
      <div className="mt-8">
        <Button 
          variant="secondary" 
          className="w-full text-[10px] font-black uppercase tracking-widest py-3 group/btn"
          onClick={() => onViewProfile(partner.id)}
        >
          <span>View Host Profile</span>
          <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}