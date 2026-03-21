import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import * as orgService from "../../services/orgService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Pill from "../../components/ui/Pill";
import SearchableSelect from "../../components/ui/SearchableSelect";

// Standardized constants for the Matching Engine
import { 
  SUGGESTED_ROLES, 
  SUGGESTED_SKILLS, 
  BOTSWANA_LOCATIONS 
} from "../../constants/matchingOptions";

import {
  Save,
  MapPin,
  Briefcase,
  Users,
  Target,
  ArrowLeft,
  FileCheck,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function Requirements() {
  const { user } = UserAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState(""); 
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    location: "",
    requires_cv: true,
    requires_transcript: true,
    role_title: "",
    available_slots: 1,
    work_mode: "On-site",
    required_skills: [],
    job_description: "",
    min_gpa_required: 2.0,
  });

  useEffect(() => {
    if (!message.text) return;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        if (!user?.id) return;
        const [profile, vacancies] = await Promise.all([
          orgService.getOrgProfile(user.id),
          orgService.getOrgVacancies(user.id),
        ]);

        // Capture Org Name for the UI Header
        setOrgName(profile?.org_name || "New Organization");

        const latestVacancy = vacancies[0] || {};
        setFormData({
          location: profile?.location || "",
          requires_cv: profile?.requires_cv ?? true,
          requires_transcript: profile?.requires_transcript ?? true,
          role_title: latestVacancy.role_title || "",
          available_slots: latestVacancy.available_slots ?? 1,
          work_mode: latestVacancy.work_mode || "On-site",
          required_skills: latestVacancy.required_skills || [],
          job_description: latestVacancy.job_description || "",
          min_gpa_required: latestVacancy.min_gpa_required || 2.0,
          id: latestVacancy.id,
        });
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [user?.id]);

  /**
   * BUG FIX: Handle number inputs specifically to allow empty strings during typing.
   * This prevents the "cannot erase 1" issue.
   */
  const handleNumberChange = (value, field) => {
    if (value === "") {
      setFormData(prev => ({ ...prev, [field]: "" })); 
    } else {
      const parsed = field === 'min_gpa_required' ? parseFloat(value) : parseInt(value);
      setFormData(prev => ({ ...prev, [field]: parsed }));
    }
  };

  const handleSelect = (item, field) => {
    if (field === 'role_title') {
      setFormData(prev => ({ ...prev, role_title: item }));
    } else if (field === 'required_skills') {
      if (!formData.required_skills.includes(item)) {
        setFormData(prev => ({ ...prev, required_skills: [...prev.required_skills, item] }));
      }
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.role_title || !formData.location) {
      setMessage({ type: "error", text: "Role title and Location are required." });
      return;
    }

    setSaving(true);
    try {
      await orgService.updateOrgProfile(user.id, {
        location: formData.location,
        requires_cv: formData.requires_cv,
        requires_transcript: formData.requires_transcript,
      });

      const vacancyPayload = {
        ...formData,
        available_slots: formData.available_slots === "" ? 1 : parseInt(formData.available_slots),
        min_gpa_required: formData.min_gpa_required === "" ? 2.0 : parseFloat(formData.min_gpa_required)
      };

      const updatedVacancy = await orgService.upsertVacancy(user.id, vacancyPayload);

      if (!formData.id) {
        setFormData(prev => ({ ...prev, id: updatedVacancy.id }));
      }

      setMessage({ type: "success", text: "Requirements secured!" });
      setTimeout(() => navigate("/org/portal"), 1500);
    } catch (err) {
      console.error("Submit error:", err);
      setMessage({ type: "error", text: "Save failed. Check table schema in Supabase." });
    } finally {
      setSaving(false);
    }
  };
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse text-brand-600 font-bold text-lg font-display tracking-tighter">
        SYNCING REQUIREMENTS...
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24 px-4 md:px-0">
      
      {/* ── Toast ── */}
      {message.text && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 pointer-events-none">
          <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm shadow-xl border animate-in slide-in-from-bottom-4 duration-300 ${
            message.type === "success" ? "bg-white text-green-700 border-green-200" : "bg-white text-red-700 border-red-200"
          }`}>
            {message.type === "success" ? <CheckCircle size={18} className="text-green-500" /> : <AlertCircle size={18} className="text-red-500" />}
            <span className="flex-1">{message.text}</span>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="border-b border-gray-100 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl text-brand-900 font-bold tracking-tight font-display leading-tight">
             {orgName} Requirements
          </h1>
          <p className="text-gray-500 text-sm md:text-base font-light">Set your role criteria for the intelligent matching engine.</p>
        </div>
        <button onClick={() => navigate("/org/portal")} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-brand-600 transition-colors bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
          <ArrowLeft size={16} /> Back to Portal
        </button>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card 1: Role Definition */}
          <div className="card p-6 md:p-8 bg-white shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-lg text-brand-900 border-b pb-3 flex items-center gap-2 font-bold font-display">
              <Briefcase className="text-brand-600" size={20} /> Role Definition
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Target Position</label>
              <SearchableSelect 
                options={SUGGESTED_ROLES}
                selected={formData.role_title ? [formData.role_title] : []}
                onSelect={(item) => handleSelect(item, 'role_title')}
                onRemove={() => setFormData(prev => ({...prev, role_title: ""}))}
                placeholder="Select the role you are offering..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Slots Available</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Users size={16} />
                  </div>
                  <input
                    type="number"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all h-11 font-semibold"
                    value={formData.available_slots}
                    onChange={(e) => handleNumberChange(e.target.value, "available_slots")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Min GPA Required</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Target size={16} />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all h-11 font-semibold"
                    value={formData.min_gpa_required}
                    onChange={(e) => handleNumberChange(e.target.value, "min_gpa_required")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Required Expertise */}
          <div className="card p-6 md:p-8 bg-white shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-lg text-brand-900 border-b pb-3 flex items-center gap-2 font-bold font-display">
              <Target className="text-brand-600" size={20} /> Required Expertise
            </h3>
            <SearchableSelect 
              options={SUGGESTED_SKILLS}
              selected={formData.required_skills}
              onSelect={(item) => handleSelect(item, 'required_skills')}
              onRemove={handleRemoveSkill}
              placeholder="Select technical skills required..."
            />
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Work Arrangement</label>
              <div className="flex gap-2">
                {['On-site', 'Hybrid', 'Remote'].map((mode) => (
                  <Pill 
                    key={mode}
                    label={mode}
                    isSelected={formData.work_mode === mode}
                    onClick={() => setFormData(prev => ({...prev, work_mode: mode}))}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Logistics & Location */}
        <div className="card p-6 md:p-8 bg-white shadow-sm border border-gray-100 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg text-brand-900 border-b pb-3 flex items-center gap-2 font-bold font-display">
                <MapPin className="text-brand-600" size={20} /> Office Location
              </h3>
              <div className="flex flex-wrap gap-2">
                {BOTSWANA_LOCATIONS.map((loc) => (
                  <Pill 
                    key={loc}
                    label={loc}
                    isSelected={formData.location === loc}
                    onClick={() => setFormData(prev => ({...prev, location: loc}))}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg text-brand-900 border-b pb-3 flex items-center gap-2 font-bold font-display">
                <FileCheck className="text-brand-600" size={20} /> Documentation Required
              </h3>
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-3 font-bold text-xs text-gray-700 cursor-pointer uppercase tracking-wider">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" checked={formData.requires_cv} onChange={(e) => setFormData(prev => ({ ...prev, requires_cv: e.target.checked }))} />
                  Student CV
                </label>
                <label className="flex items-center gap-3 font-bold text-xs text-gray-700 cursor-pointer uppercase tracking-wider">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" checked={formData.requires_transcript} onChange={(e) => setFormData(prev => ({ ...prev, requires_transcript: e.target.checked }))} />
                  Transcript
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-50">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Role Description</label>
            <textarea
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
              placeholder="Describe daily responsibilities and project expectations..."
              value={formData.job_description}
              onChange={(e) => setFormData(prev => ({ ...prev, job_description: e.target.value }))}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={saving} size="lg" className="min-w-[280px]">
              <Save size={18} />
              <span>Update Attachment Vacancy</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}