import { useState, useEffect } from "react";
import {
  Building2, MapPin, Camera, CheckCircle, AlertCircle,
  Loader2, ArrowLeft, Mail, Phone, UserCheck, X,
  Plus, Trash2, Save, User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as orgService from "../../services/orgService";
import { UserAuth } from "../../context/AuthContext";
import { useAvatar } from "../../context/AvatarContext";
import { supabase } from "../../lib/supabaseClient";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import SearchableSelect from "../../components/ui/SearchableSelect";
import { SUGGESTED_INDUSTRIES, BOTSWANA_LOCATIONS } from "../../constants/matchingOptions";

// ── Fields required for org to be "Verified Partner" ──────────────────
const isProfileComplete = (p) =>
  Boolean(
    p.org_name?.trim()        &&
    p.industry?.trim()        &&
    p.location?.trim()        &&
    p.contact_person?.trim()  &&
    p.supervisor_email?.trim()
  );


const newSupervisor = () => ({
  id:         null,         // null = not yet saved to DB
  full_name:  "",
  email:      "",
  phone:      "",
  role_title: "Industrial Supervisor",
  is_active:  true,
  isNew:      true,         // UI flag — shows save button
  isDirty:    false,
});

export default function OrgProfile() {
  const { user }              = UserAuth();
  const { refreshAvatar }     = useAvatar() || {};
  const navigate              = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profile, setProfile] = useState({
    org_name:            "",
    industry:            "",
    location:            "",
    avatar_url:          "",
    contact_person:      "",
    contact_phone:       "",
    supervisor_email:    "",
    requires_cv:         true,
    requires_transcript: true,
    onboarding_complete: false,
  });

  // Supervisor roster
  const [supervisors, setSupervisors]         = useState([]);
  const [savingSup, setSavingSup]             = useState(null); 
  const [deletingSup, setDeletingSup]         = useState(null); 

  // Auto-clear toast
  useEffect(() => {
    if (!message.text) return;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  // Load profile + supervisor roster
  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      orgService.getOrgProfile(user.id),
      supabase
        .from("organization_supervisors")
        .select("*")
        .eq("org_id", user.id)
        .eq("is_active", true)
        .order("created_at"),
    ])
      .then(([profileData, { data: supData }]) => {
        if (profileData) setProfile(profileData);
        setSupervisors(supData || []);
      })
      .catch(err => setMessage({ type: "error", text: err.message }))
      .finally(() => setLoading(false));
  }, [user]);

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    try {
      const fileExt  = file.name.split(".").pop();
      const filePath = `${user.id}/logo.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setProfile(p => ({ ...p, avatar_url: url }));
      refreshAvatar?.(url);
      setMessage({ type: "success", text: "Logo updated!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Upload failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedProfile = {
        ...profile,
        onboarding_complete: isProfileComplete(profile),
      };
      await orgService.updateOrgProfile(user.id, updatedProfile);
      setProfile(updatedProfile);
      setMessage({
        type: "success",
        text: updatedProfile.onboarding_complete
          ? "Profile saved — organisation is now verified! ✓"
          : "Profile saved. Fill in all required fields to become a Verified Partner.",
      });
      setTimeout(() => navigate("/org/portal"), 1500);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to save profile." });
    } finally {
      setSaving(false);
    }
  };

  // ── Supervisor roster handlers ─────────────────────────────────────

  const handleAddSupervisor = () => {
    setSupervisors(prev => [...prev, newSupervisor()]);
  };

  const handleSupervisorChange = (index, field, value) => {
    setSupervisors(prev => prev.map((s, i) =>
      i === index ? { ...s, [field]: value, isDirty: true } : s
    ));
  };

  const handleSaveSupervisor = async (index) => {
    const sup = supervisors[index];
    if (!sup.full_name.trim() || !sup.email.trim()) {
      setMessage({ type: "error", text: "Supervisor name and email are required." });
      return;
    }

    setSavingSup(index);
    try {
      if (sup.isNew || !sup.id) {
        // INSERT new supervisor
        const { data, error } = await supabase
          .from("organization_supervisors")
          .insert({
            org_id:     user.id,
            full_name:  sup.full_name.trim(),
            email:      sup.email.trim(),
            phone:      sup.phone?.trim() || null,
            role_title: sup.role_title || "Industrial Supervisor",
          })
          .select()
          .single();
        if (error) throw error;
        setSupervisors(prev => prev.map((s, i) =>
          i === index ? { ...data, isNew: false, isDirty: false } : s
        ));
      } else {
        // UPDATE existing supervisor
        const { error } = await supabase
          .from("organization_supervisors")
          .update({
            full_name:  sup.full_name.trim(),
            email:      sup.email.trim(),
            phone:      sup.phone?.trim() || null,
            role_title: sup.role_title || "Industrial Supervisor",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sup.id);
        if (error) throw error;
        setSupervisors(prev => prev.map((s, i) =>
          i === index ? { ...s, isDirty: false } : s
        ));
      }
      setMessage({ type: "success", text: "Supervisor saved." });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to save supervisor." });
    } finally {
      setSavingSup(null);
    }
  };

  const handleDeleteSupervisor = async (index) => {
    const sup = supervisors[index];
    // If not yet saved to DB, just remove from local state
    if (sup.isNew || !sup.id) {
      setSupervisors(prev => prev.filter((_, i) => i !== index));
      return;
    }
    if (!window.confirm(`Remove ${sup.full_name} from the supervisor roster?`)) return;

    setDeletingSup(index);
    try {
      // Soft delete — set is_active = false so existing placements still reference the name
      const { error } = await supabase
        .from("organization_supervisors")
        .update({ is_active: false })
        .eq("id", sup.id);
      if (error) throw error;
      setSupervisors(prev => prev.filter((_, i) => i !== index));
      setMessage({ type: "success", text: "Supervisor removed." });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to remove supervisor." });
    } finally {
      setDeletingSup(null);
    }
  };

  const missingFields = [
    !profile.org_name?.trim()        && "Organisation Name",
    !profile.industry?.trim()        && "Industry",
    !profile.location?.trim()        && "Location",
    !profile.contact_person?.trim()  && "Contact Person",
    !profile.supervisor_email?.trim() && "Supervisor Email",
  ].filter(Boolean);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-brand-600" size={40} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 px-4 pb-20">

      {/* ── Toast ── */}
      {message.text && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 pointer-events-none">
          <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm shadow-xl border animate-in slide-in-from-bottom-4 duration-300 ${
            message.type === "success"
              ? "bg-white text-green-700 border-green-200"
              : "bg-white text-red-700 border-red-200"
          }`}>
            {message.type === "success"
              ? <CheckCircle size={18} className="text-green-500 shrink-0" />
              : <AlertCircle size={18} className="text-red-500 shrink-0" />
            }
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage({ type: "", text: "" })} className="text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="border-b border-gray-100 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-brand-900 leading-tight">
            Partner <span className="text-brand-600">Identity</span>
          </h1>
          <p className="text-gray-500 text-sm">Administrative & Branding Setup</p>
        </div>
        <button
          onClick={() => navigate("/org/portal")}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Portal
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

        {/* ── Branding column ── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="aspect-square bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
            {profile.avatar_url
              ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Logo" />
              : <Building2 size={48} className="text-gray-200" />
            }
            <label className="absolute inset-0 bg-brand-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
              <Camera size={24} />
              <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Upload Logo</span>
              <input type="file" className="hidden" onChange={handleUploadAvatar} accept="image/*" />
            </label>
          </div>

          {/* Verification badge */}
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
            profile.onboarding_complete ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
          }`}>
            <CheckCircle
              className={profile.onboarding_complete ? "text-green-500" : "text-amber-500"}
              size={20}
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-brand-900">
                {profile.onboarding_complete ? "Verified Partner" : "Pending Verification"}
              </p>
              {!profile.onboarding_complete && missingFields.length > 0 && (
                <p className="text-[10px] text-amber-600 font-semibold mt-0.5 leading-tight">
                  Missing: {missingFields.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Data column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic details */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-600 flex items-center gap-2">
              <Building2 size={14} /> Basic Details
            </h3>
            <Input
              label="Organization Name"
              value={profile.org_name || ""}
              onChange={e => setProfile({ ...profile, org_name: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Industry</label>
                <SearchableSelect
                  options={SUGGESTED_INDUSTRIES}
                  selected={profile.industry ? [profile.industry] : []}
                  onSelect={item => setProfile({ ...profile, industry: item })}
                  onRemove={() => setProfile({ ...profile, industry: "" })}
                  placeholder="Search industry..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Location</label>
                <SearchableSelect
                  options={BOTSWANA_LOCATIONS}
                  selected={profile.location ? [profile.location] : []}
                  onSelect={item => setProfile({ ...profile, location: item })}
                  onRemove={() => setProfile({ ...profile, location: "" })}
                  placeholder="Search location..."
                />
              </div>
            </div>
          </div>

          {/* Primary contact */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 space-y-6">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-600 flex items-center gap-2">
                <UserCheck size={14} /> Primary Contact
              </h3>
              <p className="text-[10px] text-gray-400 mt-1">
                The main contact for IAMS coordinator communications.
              </p>
            </div>
            <Input
              label="Contact Person"
              value={profile.contact_person || ""}
              onChange={e => setProfile({ ...profile, contact_person: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone"
                icon={<Phone size={14} />}
                value={profile.contact_phone || ""}
                onChange={e => setProfile({ ...profile, contact_phone: e.target.value })}
              />
              <Input
                label="Supervisor Email"
                icon={<Mail size={14} />}
                value={profile.supervisor_email || ""}
                onChange={e => setProfile({ ...profile, supervisor_email: e.target.value })}
              />
            </div>
            <Button onClick={handleSave} loading={saving} fullWidth size="lg">
              Save Identity
            </Button>
          </div>

          {/* ── Supervisor Roster ── */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-600 flex items-center gap-2">
                  <User size={14} /> Supervisor Roster
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">
                  Add all supervisors who can oversee students
                </p>
              </div>
              <button
                onClick={handleAddSupervisor}
                className="flex items-center gap-1.5 text-xs font-black text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {supervisors.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl">
                <User size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">No supervisors added yet.</p>
                <p className="text-[10px] text-gray-300 mt-0.5">
                  Click Add to build your roster.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {supervisors.map((sup, index) => (
                  <div
                    key={sup.id || `new-${index}`}
                    className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${
                      sup.isNew || sup.isDirty
                        ? "border-brand-200 bg-brand-50/30"
                        : "border-gray-100 bg-gray-50/40"
                    }`}
                  >
                    {/* Role title + delete */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          placeholder="Role title e.g. Technical Supervisor"
                          value={sup.role_title}
                          onChange={e => handleSupervisorChange(index, "role_title", e.target.value)}
                          className="w-full text-xs font-black uppercase tracking-widest text-brand-600 bg-transparent border-none outline-none placeholder-gray-300"
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteSupervisor(index)}
                        disabled={deletingSup === index}
                        className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                      >
                        {deletingSup === index
                          ? <Loader2 size={15} className="animate-spin" />
                          : <Trash2 size={15} />
                        }
                      </button>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <User size={13} className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Full name"
                          value={sup.full_name}
                          onChange={e => handleSupervisorChange(index, "full_name", e.target.value)}
                          className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                      </div>
                      <div className="relative">
                        <Mail size={13} className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="email"
                          placeholder="Email address"
                          value={sup.email}
                          onChange={e => handleSupervisorChange(index, "email", e.target.value)}
                          className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                      </div>
                      <div className="relative sm:col-span-2">
                        <Phone size={13} className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="Phone (optional)"
                          value={sup.phone || ""}
                          onChange={e => handleSupervisorChange(index, "phone", e.target.value)}
                          className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Save button — shown when new or dirty */}
                    {(sup.isNew || sup.isDirty) && (
                      <button
                        onClick={() => handleSaveSupervisor(index)}
                        disabled={savingSup === index}
                        className="flex items-center gap-1.5 text-xs font-black text-brand-600 hover:text-brand-800 cursor-pointer"
                      >
                        {savingSup === index
                          ? <><Loader2 size={13} className="animate-spin" /> Saving...</>
                          : <><Save size={13} /> Save supervisor</>
                        }
                      </button>
                    )}

                    {/* Saved state indicator */}
                    {!sup.isNew && !sup.isDirty && (
                      <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle size={11} /> Saved to roster
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}