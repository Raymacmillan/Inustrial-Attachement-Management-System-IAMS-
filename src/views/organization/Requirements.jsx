import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import * as orgService from "../../services/orgService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Pill from "../../components/ui/Pill";
import SearchableSelect from "../../components/ui/SearchableSelect";
import ConfirmModal from "../../components/ui/ConfirmModal";

import {
  SUGGESTED_ROLES,
  SUGGESTED_SKILLS,
  BOTSWANA_LOCATIONS,
} from "../../constants/matchingOptions";

import {
  Save,
  MapPin,
  Briefcase,
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function Requirements() {
  const { user } = UserAuth();
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [profile, setProfile]   = useState({
    location: "",
    requires_cv: true,
    requires_transcript: true,
  });
  const [vacancies, setVacancies]   = useState([]);
  const [message, setMessage]       = useState({ type: "", text: "" });
  const [activeVacancy, setActiveVacancy]     = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vacancyToDelete, setVacancyToDelete]     = useState(null);
  const [formError, setFormError] = useState("");

  // Auto-clear messages
  useEffect(() => {
    if (!message.text) return;
    const t = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    return () => clearTimeout(t);
  }, [message]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) return;
        const [profData, vacData] = await Promise.all([
          orgService.getOrgProfile(user.id),
          orgService.getOrgVacancies(user.id),
        ]);
        setProfile(profData);
        setVacancies(vacData || []);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const startNewVacancy = () => {
    setFormError("");
    setActiveVacancy({
      role_title: "",
      available_slots: 1,   // minimum is 1
      work_mode: "On-site",
      required_skills: [],
      job_description: "",
      min_gpa_required: 2.0,
    });
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 100);
  };

  const handleSaveVacancy = async (e) => {
    e.preventDefault();
    setFormError("");

    // ── Client-side validation ──
    if (!activeVacancy.role_title?.trim()) {
      setFormError("Please select a role title.");
      return;
    }
    const slots = parseInt(activeVacancy.available_slots);
    if (!slots || slots < 1) {
      setFormError("Available slots must be at least 1. An org must offer at least one position.");
      return;
    }

    setSaving(true);
    try {
      await orgService.updateOrgProfile(user.id, profile);
      const savedVac = await orgService.upsertVacancy(user.id, {
        ...activeVacancy,
        available_slots: slots, // guarantee integer, never 0
      });

      setVacancies(prev => {
        const exists = prev.find(v => v.id === savedVac.id);
        if (exists) return prev.map(v => v.id === savedVac.id ? savedVac : v);
        return [savedVac, ...prev];
      });

      setActiveVacancy(null);
      setMessage({ type: "success", text: "Role inventory updated!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to save role." });
    } finally {
      setSaving(false);
    }
  };

  const triggerDelete = (vacancy) => {
    setVacancyToDelete(vacancy);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await orgService.deleteVacancy(vacancyToDelete.id);
      setVacancies(prev => prev.filter(v => v.id !== vacancyToDelete.id));
      setMessage({ type: "success", text: "Vacancy removed." });
      if (activeVacancy?.id === vacancyToDelete.id) setActiveVacancy(null);
    } catch (err) {
      setMessage({ type: "error", text: "Delete failed." });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="animate-spin text-brand-600" size={40} />
      <p className="text-brand-600 font-bold text-[10px] uppercase tracking-widest">Loading Inventory...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 px-4 md:px-0 animate-in fade-in duration-500">

      {/* ── Toast ── */}
      {message.text && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm shadow-xl border animate-in slide-in-from-bottom-4 duration-300 bg-white ${
          message.type === "success" ? "text-green-700 border-green-200" : "text-red-700 border-red-200"
        }`}>
          {message.type === "success"
            ? <AlertCircle size={16} className="text-green-500" />
            : <AlertCircle size={16} className="text-red-500" />}
          {message.text}
        </div>
      )}

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-brand-900 leading-tight">
            Placement <span className="text-brand-600">Inventory</span>
          </h1>
          <p className="text-gray-500 text-sm">Manage multiple internship roles and requirements.</p>
        </div>
        <button
          onClick={() => navigate("/org/portal")}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Portal
        </button>
      </header>

      {/* ── Global Settings ── */}
      <div className="card p-6 md:p-8 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-6">
        <h3 className="font-bold flex items-center gap-2 text-brand-900 text-sm uppercase tracking-wider">
          <MapPin size={18} className="text-brand-600" /> Headquarters & Logistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <SearchableSelect
            options={BOTSWANA_LOCATIONS}
            selected={profile.location ? [profile.location] : []}
            onSelect={loc => setProfile({ ...profile, location: loc })}
            placeholder="Search Location..."
          />
          <div className="flex flex-wrap gap-6 items-center pt-2">
            <label className="flex items-center gap-3 text-xs font-black tracking-widest text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={profile.requires_cv}
                onChange={e => setProfile({ ...profile, requires_cv: e.target.checked })}
              />
              Require CV
            </label>
            <label className="flex items-center gap-3 text-xs font-black tracking-widest text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={profile.requires_transcript}
                onChange={e => setProfile({ ...profile, requires_transcript: e.target.checked })}
              />
              Require Transcript
            </label>
          </div>
        </div>
      </div>

      {/* ── Vacancies List ── */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-xl font-display font-bold text-brand-900">
            Active Vacancies ({vacancies.length})
          </h2>
          {!activeVacancy && (
            <Button onClick={startNewVacancy} size="md" className="rounded-full px-5 w-full md:w-auto flex justify-center items-center">
              <Plus size={16} className="mr-2" /> Add New Role
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vacancies.length === 0 ? (
            <div className="col-span-full p-12 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center opacity-60">
              <Briefcase size={40} className="text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No roles listed yet</p>
            </div>
          ) : (
            vacancies.map(v => (
              <div key={v.id} className="p-5 md:p-6 bg-white border border-gray-100 rounded-2xl flex justify-between items-center group hover:border-brand-200 hover:shadow-md transition-all">
                <div className="min-w-0 pr-4">
                  <p className="font-bold text-brand-900 truncate">{v.role_title}</p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mt-1">
                    {v.available_slots} Slot{v.available_slots !== 1 ? "s" : ""} · {v.work_mode} · GPA {v.min_gpa_required}+
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setFormError(""); setActiveVacancy(v); }} className="p-2.5 text-brand-600 hover:bg-brand-50 rounded-xl transition-colors cursor-pointer">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => triggerDelete(v)} className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Vacancy Editor ── */}
      {activeVacancy && (
        <div className="animate-in slide-in-from-bottom-8 duration-500 bg-brand-50/40 p-6 md:p-10 rounded-3xl border-2 border-brand-100 space-y-8">
          <div className="flex justify-between items-center border-b border-brand-100 pb-4">
            <h3 className="text-xl font-display font-bold text-brand-900 uppercase tracking-tight">
              {activeVacancy.id ? "Refine Role" : "New Role Definition"}
            </h3>
            <button onClick={() => setActiveVacancy(null)} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
              <Trash2 size={20} />
            </button>
          </div>

          {/* Form error banner */}
          {formError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm font-bold text-red-600">{formError}</p>
            </div>
          )}

          <form onSubmit={handleSaveVacancy} className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Target Position</label>
                <SearchableSelect
                  options={SUGGESTED_ROLES}
                  selected={activeVacancy.role_title ? [activeVacancy.role_title] : []}
                  onSelect={val => setActiveVacancy({ ...activeVacancy, role_title: val })}
                  placeholder="Select role..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Input
                    label="Slots"
                    type="number"
                    min="1"  /* enforced at HTML level */
                    value={activeVacancy.available_slots}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setActiveVacancy({
                        ...activeVacancy,
                        // Never allow setting below 1 through the UI
                        available_slots: isNaN(val) || val < 1 ? 1 : val,
                      });
                    }}
                    helperText="Minimum 1 slot required"
                  />
                </div>
                <Input
                  label="Min GPA"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={activeVacancy.min_gpa_required}
                  onChange={e => setActiveVacancy({ ...activeVacancy, min_gpa_required: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Required Skills</label>
                <SearchableSelect
                  options={SUGGESTED_SKILLS}
                  selected={activeVacancy.required_skills}
                  onSelect={skill => {
                    if (!activeVacancy.required_skills.includes(skill))
                      setActiveVacancy({ ...activeVacancy, required_skills: [...activeVacancy.required_skills, skill] });
                  }}
                  onRemove={skill => setActiveVacancy({ ...activeVacancy, required_skills: activeVacancy.required_skills.filter(s => s !== skill) })}
                  placeholder="Search technical skills..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Work Mode</label>
                <div className="flex flex-wrap gap-2">
                  {["On-site", "Hybrid", "Remote"].map(m => (
                    <Pill key={m} label={m} isSelected={activeVacancy.work_mode === m} onClick={() => setActiveVacancy({ ...activeVacancy, work_mode: m })} />
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3 pt-4 border-t border-brand-100">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Role Description</label>
              <textarea
                className="w-full p-5 rounded-2xl border border-brand-100 bg-white min-h-[140px] text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                placeholder="What will the intern be doing daily? Describe projects and expectations..."
                value={activeVacancy.job_description}
                onChange={e => setActiveVacancy({ ...activeVacancy, job_description: e.target.value })}
              />
              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <Button variant="ghost" onClick={() => setActiveVacancy(null)} className="order-2 sm:order-1">Cancel</Button>
                <Button type="submit" loading={saving} className="order-1 sm:order-2 px-10">
                  <Save size={16} /> Save Role
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Vacancy?"
        message={`Are you sure you want to remove the "${vacancyToDelete?.role_title}" position? This will stop matching for this role.`}
        confirmText="Remove Role"
      />
    </div>
  );
}