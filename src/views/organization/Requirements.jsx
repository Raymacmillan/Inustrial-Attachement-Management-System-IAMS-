import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { UserAuth } from "../../context/AuthContext";
import * as orgService from "../../services/orgService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import {
  Save,
  Plus,
  X,
  MapPin,
  Briefcase,
  Users,
  Laptop,
  Target,
  ArrowLeft,
  FileText,
  FileCheck
} from "lucide-react";

export default function Requirements() {
  const { user } = UserAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    org_name: "",
    location: "",
    available_slots: 0,
    work_mode: "On-site",
    required_skills: [],
    job_description: "", // Added for detailed vacancy
    requires_cv: true,   // Added for document logic
    requires_transcript: true // Added for document logic
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await orgService.getOrgProfile(user.id);
        if (data) {
          setFormData({
            ...data,
            required_skills: data.required_skills ?? [],
            job_description: data.job_description ?? "",
            requires_cv: data.requires_cv ?? true,
            requires_transcript: data.requires_transcript ?? true
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user.id]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    const cleanSkill = skillInput.trim();
    if (cleanSkill && !formData.required_skills.includes(cleanSkill)) {
      setFormData({
        ...formData,
        required_skills: [...formData.required_skills, cleanSkill],
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills.filter(
        (s) => s !== skillToRemove,
      ),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await orgService.updateOrgProfile(user.id, formData);
      
      setMessage({
        type: "success",
        text: "Vacancy and Requirements updated successfully!",
      });

      setTimeout(() => navigate('/org/portal'), 1500);
    } catch (err) {
      console.error("Save Error:", err); 
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center animate-pulse text-brand-600 font-bold">
        Syncing Requirements...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="border-b border-gray-100 pb-6 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-brand-900 font-bold tracking-tight">
            Attachment Requirements
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Define role details and student prerequisites.
          </p>
        </div>
        <button 
          onClick={() => navigate('/org/portal')}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-600 transition-colors w-fit"
        >
          <ArrowLeft size={16} /> Back to Portal
        </button>
      </header>

      {message.text && (
        <div
          className={`mx-1 p-3 rounded-xl font-bold border text-sm animate-in slide-in-from-top-2 ${
            message.type === "success" 
              ? "bg-green-50 text-green-700 border-green-100" 
              : "bg-red-50 text-red-700 border-red-100"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 px-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: General Settings */}
          <div className="space-y-6">
            <div className="card p-6 bg-white shadow-sm border border-gray-100 space-y-5 h-full">
              <h3 className="text-lg font-display text-brand-900 border-b pb-3 flex items-center gap-2 font-bold">
                <Briefcase className="text-brand-600" size={18} /> Base Information
              </h3>

              <Input
                label="Office Location"
                icon={<MapPin size={16} />}
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Gaborone, Block 6"
                className="py-2.5! text-sm!"
              />

              <div className="grid grid-cols-2 gap-4 items-end">
                <Input
                  label="Available Slots"
                  type="number"
                  icon={<Users size={16} />}
                  value={formData.available_slots === 0 ? "" : formData.available_slots}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, available_slots: val === "" ? 0 : parseInt(val, 10) });
                  }}
                  className="py-2! text-sm!"
                />
                <div className="space-y-1.5 flex flex-col justify-end h-full">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Laptop size={12} /> Work Mode
                  </label>
                  <select
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none transition-all h-10.5"
                    value={formData.work_mode || "On-site"}
                    onChange={(e) => setFormData({ ...formData, work_mode: e.target.value })}
                  >
                    <option>On-site</option>
                    <option>Hybrid</option>
                    <option>Remote</option>
                  </select>
                </div>
              </div>

              {/* Document Requirements */}
              <div className="pt-4 space-y-3">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                  <FileCheck size={12} /> Required Documents
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                      checked={formData.requires_cv}
                      onChange={(e) => setFormData({...formData, requires_cv: e.target.checked})}
                    />
                    <span className="text-sm font-medium text-gray-700">Student CV</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                      checked={formData.requires_transcript}
                      onChange={(e) => setFormData({...formData, requires_transcript: e.target.checked})}
                    />
                    <span className="text-sm font-medium text-gray-700">Transcript</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Skill Requirements */}
          <div className="space-y-6">
            <div className="card p-6 bg-white shadow-sm border border-gray-100 flex flex-col h-full">
              <h3 className="text-lg font-display text-brand-900 border-b pb-3 flex items-center gap-2 font-bold">
                <Target className="text-brand-600" size={18} /> Skill Tags
              </h3>

              <div className="flex-1 pt-5 space-y-5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                    placeholder="e.g. React, SQL..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddSkill(e)}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="p-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(formData.required_skills ?? []).map((skill, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg font-bold text-xs border border-brand-100 animate-in zoom-in duration-200"
                    >
                      {skill}
                      <X
                        size={12}
                        className="cursor-pointer hover:text-red-500 transition-colors"
                        onClick={() => removeSkill(skill)}
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Detailed Vacancy Description */}
        <div className="card p-6 bg-white shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-lg font-display text-brand-900 border-b pb-3 flex items-center gap-2 font-bold">
            <FileText className="text-brand-600" size={18} /> Detailed Role Description
          </h3>
          <p className="text-xs text-gray-500">Provide specifics about the attachment projects and day-to-day responsibilities.</p>
          <textarea 
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-37.5 outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
            placeholder="e.g. We are looking for a student to assist in the development of our internal management system using React and Supabase. You will be responsible for..."
            value={formData.job_description || ""}
            onChange={(e) => setFormData({...formData, job_description: e.target.value})}
          />
          
          <div className="pt-6 border-t flex justify-end">
            <Button
              type="submit"
              loading={saving}
              className="w-full sm:w-fit py-2.5! px-10! text-sm! flex items-center justify-center gap-2 shadow-lg shadow-brand-600/10"
            >
              <Save size={16} /> Save & Post Vacancy
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}