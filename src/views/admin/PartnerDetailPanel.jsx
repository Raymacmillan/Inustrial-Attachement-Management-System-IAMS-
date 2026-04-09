import {
  X, Building2, MapPin, Briefcase, Info,
  User, ShieldCheck, Mail, Phone, CheckCircle,
  AlertCircle, Loader2,
} from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { UserAuth } from "../../context/AuthContext";

export default function PartnerDetailPanel({ isOpen, onClose, partner }) {
  const { userRole } = UserAuth();

  // ── CRITICAL: Do NOT return null here ──
  // The panel shell must always stay in the DOM so the CSS
  // translate animation (translate-x-full → translate-x-0) works.
  // Content is guarded with {partner ? ... : <spinner />} below.

  const isOrganization = userRole === "org";
  const activeVacancies = partner?.organization_vacancies?.filter(v => v.is_active) || [];
  const totalSlots = partner?.organization_vacancies?.reduce(
    (acc, v) => acc + (v.available_slots || 0), 0
  ) || 0;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className={`fixed inset-0 bg-brand-950/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* ── Slide-over Panel ── */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-[110] transform transition-transform duration-500 ease-in-out flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}>

        {/* ── HEADER ── */}
        <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          {partner ? (
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-brand-900 text-white flex items-center justify-center shadow-xl shrink-0">
                {partner.avatar_url ? (
                  <img
                    src={partner.avatar_url}
                    alt={partner.org_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 size={28} />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-xl md:text-2xl text-brand-900 font-bold tracking-tight leading-tight truncate">
                  {partner.org_name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={partner.onboarding_complete ? "success" : "warning"}>
                    {partner.onboarding_complete ? "Verified Partner" : "Pending"}
                  </Badge>
                  {partner.industry && (
                    <span className="text-[10px] text-brand-400 font-black uppercase tracking-widest">
                      {partner.industry}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Skeleton while loading
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 animate-pulse shrink-0" />
              <div className="space-y-2">
                <div className="h-5 w-40 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-3 w-24 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-brand-900 cursor-pointer shrink-0 ml-4"
          >
            <X size={24} />
          </button>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {!partner ? (
            // Loading spinner while partner data is fetching
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="animate-spin text-brand-600" size={36} />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">
                Loading Partner Details...
              </p>
            </div>
          ) : (
            <div className="space-y-8">

              {/* ── Quick Stats ── */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-brand-50 rounded-2xl p-4">
                  <p className="text-2xl font-black text-brand-900">
                    {partner.organization_vacancies?.length || 0}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Listings</p>
                </div>
                <div className="bg-brand-50 rounded-2xl p-4">
                  <p className="text-2xl font-black text-brand-900">{totalSlots}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Slots</p>
                </div>
                <div className="bg-brand-50 rounded-2xl p-4">
                  <p className="text-2xl font-black text-brand-900">{activeVacancies.length}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Active Roles</p>
                </div>
              </div>

              {/* ── Company Overview ── */}
              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-brand-900 font-black uppercase text-[10px] tracking-[0.2em]">
                  <Info size={14} className="text-brand-400" /> Company Overview
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Location</p>
                    <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
                      <MapPin size={14} className="text-brand-300 shrink-0" />
                      {partner.location || "Not specified"}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Industry</p>
                    <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
                      <Briefcase size={14} className="text-brand-300 shrink-0" />
                      {partner.industry || "Not specified"}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Requires CV</p>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {partner.requires_cv
                        ? <><CheckCircle size={14} className="text-green-500" /><span className="text-green-700">Yes</span></>
                        : <><AlertCircle size={14} className="text-gray-300" /><span className="text-gray-400">No</span></>
                      }
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Requires Transcript</p>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {partner.requires_transcript
                        ? <><CheckCircle size={14} className="text-green-500" /><span className="text-green-700">Yes</span></>
                        : <><AlertCircle size={14} className="text-gray-300" /><span className="text-gray-400">No</span></>
                      }
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Administrative Contacts ── */}
              <section className="bg-brand-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <ShieldCheck className="absolute -right-4 -bottom-4 w-28 h-28 text-brand-800 opacity-40" />
                <h4 className="relative z-10 flex items-center gap-2 text-brand-300 font-black uppercase text-[10px] tracking-[0.2em] mb-5">
                  <User size={14} /> Administrative Contacts
                </h4>
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between py-2.5 border-b border-brand-800">
                    <span className="text-xs text-brand-400 font-bold">Contact Person</span>
                    <span className="text-sm font-bold text-white">{partner.contact_person || "Not provided"}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-b border-brand-800">
                    <span className="text-xs text-brand-400 font-bold flex items-center gap-1">
                      <Mail size={12} /> Email
                    </span>
                    <span className="text-sm font-bold text-white">{partner.email}</span>
                  </div>
                  {partner.supervisor_email && (
                    <div className="flex items-center justify-between py-2.5 border-b border-brand-800">
                      <span className="text-xs text-brand-400 font-bold flex items-center gap-1">
                        <Mail size={12} /> Supervisor
                      </span>
                      <span className="text-sm font-bold text-white">{partner.supervisor_email}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-xs text-brand-400 font-bold flex items-center gap-1">
                      <Phone size={12} /> Phone
                    </span>
                    <span className="text-sm font-bold text-white">
                      {partner.contact_phone || "Not provided"}
                    </span>
                  </div>
                </div>
              </section>

              {/* ── Vacancies ── */}
              <section className="space-y-4 pb-6">
                <h4 className="text-brand-900 font-black uppercase text-[10px] tracking-[0.2em]">
                  Active Vacancies for {new Date().getFullYear()}
                </h4>
                {partner.organization_vacancies?.length > 0 ? (
                  <div className="grid gap-4">
                    {partner.organization_vacancies.map((vac) => (
                      <div
                        key={vac.id}
                        className="p-5 border border-gray-100 rounded-2xl hover:border-brand-200 hover:bg-brand-50/20 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-bold text-brand-900 text-base">{vac.role_title}</h5>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-bold uppercase">
                              <span>{vac.available_slots} slot{vac.available_slots !== 1 ? "s" : ""}</span>
                              {vac.min_gpa_required > 0 && <span>Min GPA: {vac.min_gpa_required}</span>}
                              <span>{vac.work_mode || "On-site"}</span>
                            </div>
                          </div>
                          <Badge variant={vac.is_active ? "success" : "default"}>
                            {vac.is_active ? "Open" : "Closed"}
                          </Badge>
                        </div>
                        {vac.job_description && (
                          <p className="text-xs text-gray-500 mb-3 leading-relaxed italic">
                            {vac.job_description}
                          </p>
                        )}
                        {vac.required_skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {vac.required_skills.map((skill, i) => (
                              <span
                                key={i}
                                className="text-[9px] bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-brand-700 font-black uppercase"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                      No vacancies listed
                    </p>
                  </div>
                )}
              </section>

            </div>
          )}
        </div>

        {/* ── Footer (org users only) ── */}
        {isOrganization && partner && (
          <div className="p-6 md:p-8 border-t border-gray-100 bg-white shrink-0">
            <Button variant="primary" fullWidth size="lg">
              Update Organization Record
            </Button>
          </div>
        )}
      </div>
    </>
  );
}