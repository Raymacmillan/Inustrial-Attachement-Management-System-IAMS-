import { X, Building2, MapPin, Briefcase, Info, User, ShieldCheck } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { UserAuth } from "../../context/AuthContext"; // Import Auth context

export default function PartnerDetailPanel({ isOpen, onClose, partner }) {
  const { userRole } = UserAuth(); // Get the current user's role

  if (!partner) return null;

  // Logic: Only show the footer/update button if the logged-in user is an organization
  const isOrganization = userRole === "org";

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`fixed inset-0 bg-brand-950/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-[110] transform transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* ── HEADER ── */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 relative">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-brand-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
              <Building2 size={28} />
            </div>
            <div>
              <h2 className="font-display text-2xl text-brand-900 font-bold tracking-tight leading-tight">
                {partner.org_name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="success" className="text-[9px] uppercase tracking-tighter">Verified Partner</Badge>
                <span className="text-[10px] text-brand-400 font-black uppercase tracking-widest">{partner.industry}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-brand-900 cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
          
          {/* Section: Overview */}
          <section className="space-y-4">
            <h4 className="flex items-center gap-2 text-brand-900 font-black uppercase text-[10px] tracking-[0.2em]">
              <Info size={16} className="text-brand-400" />
              Company Overview
            </h4>
            <p className="text-gray-600 leading-relaxed text-sm font-medium">
              {partner.bio || "This organization is a registered industry partner for the University of Botswana Industrial Attachment cycle."}
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-brand-200 transition-colors">
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-2">Location</p>
                <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
                  <MapPin size={16} className="text-brand-300" /> {partner.location || 'Botswana'}
                </div>
              </div>
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-brand-200 transition-colors">
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-2">Work Mode</p>
                <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
                  <Briefcase size={16} className="text-brand-300" /> {partner.work_mode || 'On-site'}
                </div>
              </div>
            </div>
          </section>

          {/* Section: Coordinator Only Details */}
          <section className="bg-brand-900 rounded-md p-8 text-white shadow-2xl relative overflow-hidden">
            <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-brand-800 opacity-50" />
            
            <h4 className="relative z-10 flex items-center gap-2 text-brand-300 font-black uppercase text-[10px] tracking-[0.2em] mb-6">
              <User size={16} />
              Administrative Contacts
            </h4>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-brand-800">
                <span className="text-xs text-brand-400 font-bold">Primary Email</span>
                <span className="text-sm font-bold text-white italic">{partner.email}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs text-brand-400 font-bold">Direct Line</span>
                <span className="text-sm font-bold text-white">{partner.phone_number || 'No contact provided'}</span>
              </div>
            </div>
          </section>

          {/* Section: Vacancies */}
          <section className="space-y-6 pb-10">
            <h4 className="text-brand-900 font-black uppercase text-[10px] tracking-[0.2em]">Active Vacancies for {new Date().getFullYear()}</h4>
            <div className="grid gap-4">
              {partner.organization_vacancies?.length > 0 ? (
                partner.organization_vacancies.map((vac) => (
                  <div key={vac.id} className="p-6 border border-gray-100 rounded-3xl hover:border-brand-200 hover:bg-brand-50/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h5 className="font-bold text-brand-900 text-lg group-hover:text-brand-600 transition-colors">{vac.role_title}</h5>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Available Slots: {vac.available_slots}</p>
                      </div>
                      <Badge variant="success">Open</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-5 leading-relaxed italic">
                      {vac.job_description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {vac.required_skills?.map((skill, i) => (
                        <span key={i} className="text-[9px] bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-brand-700 font-black uppercase tracking-tighter">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No active vacancies listed</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── FOOTER ACTIONS (Only visible to Org roles) ── */}
        {isOrganization && (
          <div className="p-8 border-t border-gray-100 bg-white">
            <Button 
              variant="primary" 
              className="w-full py-4 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-200"
              onClick={() => console.log("Navigate to edit page for:", partner.id)}
            >
              Update Organization Record
            </Button>
          </div>
        )}
      </div>
    </>
  );
}