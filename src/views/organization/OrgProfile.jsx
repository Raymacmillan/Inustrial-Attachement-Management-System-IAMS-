import { useState, useEffect } from "react";
import { 
  Building2, 
  MapPin, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  Mail,
  Phone,
  UserCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as orgService from "../../services/orgService";
import { UserAuth } from "../../context/AuthContext";
import { useAvatar } from "../../context/AvatarContext"; 
import { supabase } from "../../lib/supabaseClient";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import SearchableSelect from "../../components/ui/SearchableSelect";

import { 
  SUGGESTED_INDUSTRIES, 
  BOTSWANA_LOCATIONS 
} from "../../constants/matchingOptions";

export default function OrgProfile() {
  const { user } = UserAuth();
  const { avatarUrl, refreshAvatar } = useAvatar() || {}; 
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    org_name: "", industry: "", location: "", avatar_url: "",
    contact_person: "", contact_phone: "", supervisor_email: "",
    requires_cv: true, requires_transcript: true, onboarding_complete: false
  });

  useEffect(() => {
    if (user?.id) {
      orgService.getOrgProfile(user.id)
        .then(data => { if (data) setProfile(data); })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      refreshAvatar(publicUrl); 
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await orgService.updateOrgProfile(user.id, profile);
      alert("Profile Saved!");
      navigate("/org/portal");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-brand-600" size={40} /></div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 px-4 pb-20">
      
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
        {/* Branding Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="aspect-square bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <Building2 size={48} className="text-gray-200" />
            )}
            <label className="absolute inset-0 bg-brand-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
              <Camera size={24} />
              <input type="file" className="hidden" onChange={handleUploadAvatar} accept="image/*" />
            </label>
          </div>
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${profile.onboarding_complete ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
            <CheckCircle className={profile.onboarding_complete ? 'text-green-500' : 'text-amber-500'} size={20} />
            <span className="text-xs font-bold text-brand-900">{profile.onboarding_complete ? 'Verified' : 'Pending Verification'}</span>
          </div>
        </div>

        {/* Data Column */}
        <div className="lg:col-span-2 space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-gray-100">
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-600 flex items-center gap-2"><Building2 size={14} /> Basic Details</h3>
            <Input label="Org Name" value={profile.org_name} onChange={e => setProfile({...profile, org_name: e.target.value})} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SearchableSelect placeholder="Industry" label="Industry" options={SUGGESTED_INDUSTRIES} selected={profile.industry ? [profile.industry] : []} onSelect={item => setProfile({...profile, industry: item})} onRemove={() => setProfile({...profile, industry: ""})} />
              <SearchableSelect placeholder="Location" label="Location" options={BOTSWANA_LOCATIONS} selected={profile.location ? [profile.location] : []} onSelect={item => setProfile({...profile, location: item})} onRemove={() => setProfile({...profile, location: ""})} />
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-gray-50">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-600 flex items-center gap-2"><UserCheck size={14} /> Contacts</h3>
            <Input label="Contact Person" value={profile.contact_person} onChange={e => setProfile({...profile, contact_person: e.target.value})} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Phone" icon={<Phone size={14} />} value={profile.contact_phone} onChange={e => setProfile({...profile, contact_phone: e.target.value})} />
              <Input label="Supervisor Email" icon={<Mail size={14} />} value={profile.supervisor_email} onChange={e => setProfile({...profile, supervisor_email: e.target.value})} />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50">
            <Button onClick={handleSave} loading={saving} fullWidth size="lg">Save Identity</Button>
          </div>
        </div>
      </div>
    </div>
  );
}