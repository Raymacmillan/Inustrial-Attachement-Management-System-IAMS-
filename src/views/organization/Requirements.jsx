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
  FileCheck,
} from "lucide-react";

export default function Requirements() {
  const { user } = UserAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        if (!user?.id) return;
        const [profile, vacancies] = await Promise.all([
          orgService.getOrgProfile(user.id),
          orgService.getOrgVacancies(user.id),
        ]);

        const latestVacancy = vacancies[0] || {};
        setFormData({
          location: profile?.location || "",
          requires_cv: profile?.requires_cv ?? true,
          requires_transcript: profile?.requires_transcript ?? true,
          role_title: latestVacancy.role_title || "",
          available_slots: latestVacancy.available_slots || 1,
          work_mode: latestVacancy.work_mode || "On-site",
          required_skills: latestVacancy.required_skills || [],
          job_description: latestVacancy.job_description || "",
          id: latestVacancy.id,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [user?.id]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    const clean = skillInput.trim();
    if (clean && !formData.required_skills.includes(clean)) {
      setFormData({
        ...formData,
        required_skills: [...formData.required_skills, clean],
      });
      setSkillInput("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await orgService.updateOrgProfile(user.id, {
        location: formData.location,
        requires_cv: formData.requires_cv,
        requires_transcript: formData.requires_transcript,
      });

      await orgService.upsertVacancy(user.id, {
        id: formData.id,
        role_title: formData.role_title,
        job_description: formData.job_description,
        required_skills: formData.required_skills,
        available_slots: formData.available_slots,
        work_mode: formData.work_mode,
      });

      setMessage({
        type: "success",
        text: "Requirements and Vacancy updated!",
      });
      setTimeout(() => navigate("/org/portal"), 1500);
    } catch (err) {
      setMessage({
        type: "error",
        text: "Error saving data. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-brand-600 font-bold animate-pulse">
        Syncing Requirements...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 px-4 md:px-0">
      {/* ── Header ── */}
      <header className="border-b border-gray-100 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl text-brand-900 font-bold tracking-tight">
            Requirement Manager
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Update company info and post your attachment role.
          </p>
        </div>
        <button
          onClick={() => navigate("/org/portal")}
          className="flex items-center gap-2 text-xs md:text-sm font-bold text-gray-400 hover:text-brand-600 transition-colors w-fit"
        >
          <ArrowLeft size={16} /> Back to Portal
        </button>
      </header>

      {message.text && (
        <div
          className={`p-4 rounded-xl font-bold border text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Card 1: Role & Location */}
          <div className="card p-5 md:p-6 bg-white shadow-sm border border-gray-100 space-y-5">
            <h3 className="text-base md:text-lg text-brand-900 border-b pb-3 flex items-center gap-2 font-bold">
              <Briefcase className="text-brand-600" size={18} /> Role Title &
              Location
            </h3>
            <Input
              label="Role Title"
              icon={<Target size={16} />}
              value={formData.role_title}
              onChange={(e) =>
                setFormData({ ...formData, role_title: e.target.value })
              }
              placeholder="e.g. Junior Dev"
            />
            <Input
              label="Office Location"
              icon={<MapPin size={16} />}
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Gaborone, Block 6"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Slots"
                type="number"
                icon={<Users size={16} />}
                value={formData.available_slots}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    available_slots: parseInt(e.target.value, 10),
                  })
                }
              />
              <div className="space-y-1.5 flex flex-col">
                <label className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Work Mode
                </label>
                <select
                  className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium h-[46px] md:h-10.5 outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  value={formData.work_mode}
                  onChange={(e) =>
                    setFormData({ ...formData, work_mode: e.target.value })
                  }
                >
                  <option>On-site</option>
                  <option>Hybrid</option>
                  <option>Remote</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Fixed Skill Input Section */}
          <div className="card p-5 md:p-6 bg-white shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-base md:text-lg text-brand-900 border-b pb-3 flex items-center gap-2 font-bold">
              <Target className="text-brand-600" size={18} /> Necessary Skills
            </h3>
            <div className="flex items-center gap-2 mt-5">
              <input
                type="text"
                className="min-w-0 flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-brand-500 transition-all"
                placeholder="Add skill..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddSkill(e)}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="shrink-0 p-3 bg-brand-600 text-white rounded-xl shadow-md hover:bg-brand-700 transition-colors flex items-center justify-center"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {formData.required_skills.length > 0 ? (
                formData.required_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg font-bold text-[10px] md:text-xs border border-brand-100 animate-in zoom-in duration-200"
                  >
                    {skill}
                    <X
                      size={12}
                      className="cursor-pointer hover:text-red-500"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          required_skills: formData.required_skills.filter(
                            (s) => s !== skill,
                          ),
                        })
                      }
                    />
                  </span>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">
                  No skills added yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Description & Fixed Footer Button */}
        <div className="card p-5 md:p-6 bg-white shadow-sm border border-gray-100 space-y-5">
          <h3 className="text-base md:text-lg text-brand-900 border-b pb-3 flex items-center gap-2 font-bold">
            <FileText className="text-brand-600" size={18} /> Role Description &
            Documents
          </h3>
          <textarea
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[150px] outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            placeholder="Describe the daily tasks..."
            value={formData.job_description}
            onChange={(e) =>
              setFormData({ ...formData, job_description: e.target.value })
            }
          />

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 py-2">
            <label className="flex items-center gap-3 font-medium text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={formData.requires_cv}
                onChange={(e) =>
                  setFormData({ ...formData, requires_cv: e.target.checked })
                }
              />
              Student CV
            </label>
            <label className="flex items-center gap-3 font-medium text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={formData.requires_transcript}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requires_transcript: e.target.checked,
                  })
                }
              />
              Transcript
            </label>
          </div>

          <div className="pt-6 border-t flex flex-col md:flex-row justify-end items-center">
            <Button
              type="submit"
              loading={saving}
              size="lg"
              fullWidth={window.innerWidth < 768}
              className="md:w-max md:min-w-[320px] flex items-center justify-center flex-nowrap"
            >
              <Save size={18} className="shrink-0" />
              <span className="whitespace-nowrap">Update Vacancy</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
