import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import * as studentService from "../../services/studentService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Pill from "../../components/ui/Pill";
import SearchableSelect from "../../components/ui/SearchableSelect";

// Standardized constants
import {
  SUGGESTED_ROLES,
  SUGGESTED_SKILLS,
  BOTSWANA_LOCATIONS,
  SUGGESTED_INDUSTRIES,
} from "../../constants/matchingOptions";

import {
  Briefcase,
  MapPin,
  Sparkles,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Target,
  Building2,
  X,
} from "lucide-react";

export default function StudentPreferences() {
  const { user } = UserAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    preferred_roles: [],
    technical_skills: [],
    preferred_locations: [],
    industries: [],
    min_stipend_expected: 0,
  });

  // Auto-clear toast messages
  useEffect(() => {
    if (!message.text) return;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        if (!user?.id) return;
        const data = await studentService.getStudentPreferences(user.id);
        if (data) {
          setFormData({
            preferred_roles: data.preferred_roles || [],
            technical_skills: data.technical_skills || [],
            preferred_locations: data.preferred_locations || [],
            industries: data.industries || [],
            min_stipend_expected: data.min_stipend_expected || 0,
          });
        }
      } catch (err) {
        console.error("Error loading preferences:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPrefs();
  }, [user?.id]);

  const handleLocationToggle = (loc) => {
    const isSelected = formData.preferred_locations.includes(loc);
    if (isSelected) {
      setFormData((prev) => ({
        ...prev,
        preferred_locations: prev.preferred_locations.filter((l) => l !== loc),
      }));
    } else if (formData.preferred_locations.length < 3) {
      setFormData((prev) => ({
        ...prev,
        preferred_locations: [...prev.preferred_locations, loc],
      }));
    } else {
      setMessage({
        type: "error",
        text: "You can only select up to 3 locations.",
      });
    }
  };

  const handleSelect = (item, field) => {
    const limitFields = ["industries", "preferred_roles"];

    if (
      limitFields.includes(field) &&
      formData[field].length >= 3 &&
      !formData[field].includes(item)
    ) {
      const fieldLabel = field === "industries" ? "industries" : "target roles";
      setMessage({
        type: "error",
        text: `Maximum of 3 ${fieldLabel} allowed.`,
      });
      return;
    }

    if (!formData[field].includes(item)) {
      setFormData((prev) => ({ ...prev, [field]: [...prev[field], item] }));
    }
  };

  const handleRemove = (item, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((i) => i !== item),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- Validation Logic ---
    if (formData.preferred_roles.length === 0) {
      setMessage({
        type: "error",
        text: "Please select at least one Target Role.",
      });
      return;
    }
    if (formData.industries.length === 0) {
      setMessage({
        type: "error",
        text: "Please select at least one Industry Focus.",
      });
      return;
    }
    if (formData.technical_skills.length === 0) {
      setMessage({ type: "error", text: "Please list your Technical Skills." });
      return;
    }
    if (formData.preferred_locations.length === 0) {
      setMessage({
        type: "error",
        text: "Please select at least one Location.",
      });
      return;
    }

    // Final safety check for limits
    if (
      formData.preferred_roles.length > 3 ||
      formData.industries.length > 3 ||
      formData.preferred_locations.length > 3
    ) {
      setMessage({
        type: "error",
        text: "Some sections exceed the 3-item limit.",
      });
      return;
    }

    setSaving(true);
    try {
      await studentService.updateStudentPreferences(user.id, formData);
      setMessage({
        type: "success",
        text: "Preferences secured! Matching engine updated.",
      });
      setTimeout(() => navigate("/student/dashboard"), 1500);
    } catch (err) {
      console.error("Save error:", err);
      setMessage({ type: "error", text: "Failed to save preferences." });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-brand-600 font-bold text-lg font-display">
          Syncing Intent...
        </div>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 px-4 md:px-0">
      {/* ── Toast ── */}
      {message.text && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 pointer-events-none">
          <div
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm shadow-xl border animate-in slide-in-from-bottom-4 duration-300 ${
              message.type === "success"
                ? "bg-white text-green-700 border-green-200 shadow-green-100"
                : "bg-white text-red-700 border-red-200 shadow-red-100"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle size={18} className="text-green-500 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-500 shrink-0" />
            )}
            <span className="flex-1">{message.text}</span>
            <button
              onClick={() => setMessage({ type: "", text: "" })}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="border-b border-gray-100 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl text-brand-900 font-bold tracking-tight flex items-start md:items-center gap-3 font-display">
            <Sparkles
              className="text-brand-500 mt-1 md:mt-0 shrink-0"
              size={28}
            />
            <span className="whitespace-normal leading-tight">
              Career Preferences
            </span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Define your targets to find the perfect industrial attachment.
          </p>
        </div>
        <button
          onClick={() => navigate("/student/dashboard")}
          className="flex items-center gap-2 text-xs md:text-sm font-bold text-gray-400 hover:text-brand-600 transition-colors bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Card 1: Target Roles (Limited to 3) */}
          <div className="card p-5 md:p-6 bg-white shadow-sm rounded-2xl border border-gray-100 space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base md:text-lg text-brand-900 flex items-center gap-2 font-bold font-display">
                <Briefcase className="text-brand-600" size={20} /> Target Roles
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full ${formData.preferred_roles.length === 3 ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-400"}`}
              >
                {formData.preferred_roles.length}/3
              </span>
            </div>
            <SearchableSelect
              options={SUGGESTED_ROLES}
              selected={formData.preferred_roles}
              onSelect={(item) => handleSelect(item, "preferred_roles")}
              onRemove={(item) => handleRemove(item, "preferred_roles")}
              placeholder="Search or type a role..."
            />
            {formData.preferred_roles.length >= 3 && (
              <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 animate-in slide-in-from-left-2">
                <AlertCircle size={12} /> Role limit reached.
              </p>
            )}
          </div>

          {/* Card 2: Industry Focus (Limited to 3) */}
          <div className="card p-5 md:p-6 bg-white shadow-sm rounded-2xl border border-gray-100 space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base md:text-lg text-brand-900 flex items-center gap-2 font-bold font-display">
                <Building2 className="text-brand-600" size={20} /> Industry
                Focus
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full ${formData.industries.length === 3 ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-400"}`}
              >
                {formData.industries.length}/3
              </span>
            </div>
            <SearchableSelect
              options={SUGGESTED_INDUSTRIES}
              selected={formData.industries}
              onSelect={(item) => handleSelect(item, "industries")}
              onRemove={(item) => handleRemove(item, "industries")}
              placeholder="Search industries (e.g. Fintech)..."
            />
            {formData.industries.length >= 3 && (
              <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 animate-in slide-in-from-left-2">
                <AlertCircle size={12} /> Industry limit reached.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Card 3: Technical Skills */}
          <div className="card p-5 md:p-6 bg-white shadow-sm rounded-2xl border border-gray-100 space-y-6">
            <h3 className="text-base md:text-lg text-brand-900 border-b pb-3 flex items-center gap-2 font-bold font-display">
              <Target className="text-brand-600" size={20} /> Technical Skills
            </h3>
            <SearchableSelect
              options={SUGGESTED_SKILLS}
              selected={formData.technical_skills}
              onSelect={(item) => handleSelect(item, "technical_skills")}
              onRemove={(item) => handleRemove(item, "technical_skills")}
              placeholder="Search or type a skill..."
            />
          </div>

          {/* Card 4: Work Preferences */}
          <div className="card p-5 md:p-6 bg-white shadow-sm rounded-2xl border border-gray-100 space-y-6">
            <h3 className="text-base md:text-lg text-brand-900 border-b pb-3 flex items-center gap-2 font-bold font-display">
              <MapPin className="text-brand-600" size={20} /> Work Preferences
            </h3>
            <div className="space-y-6">
              <Input
                label="Desired Stipend (Optional)"
                type="number"
                value={
                  formData.min_stipend_expected === 0
                    ? ""
                    : formData.min_stipend_expected
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_stipend_expected: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="e.g. 500"
              />

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Locations (Max 3)
                  </label>
                  <span
                    className={`text-[10px] font-bold ${formData.preferred_locations.length === 3 ? "text-brand-600" : "text-gray-400"}`}
                  >
                    {formData.preferred_locations.length}/3 Selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {BOTSWANA_LOCATIONS.map((loc) => (
                    <Pill
                      key={loc}
                      label={loc}
                      isSelected={formData.preferred_locations.includes(loc)}
                      isDisabled={formData.preferred_locations.length >= 3}
                      onClick={() => handleLocationToggle(loc)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center md:justify-end pb-10">
          <Button
            type="submit"
            size="lg"
            loading={saving}
            fullWidth={window.innerWidth < 768}
            className="md:min-w-[380px] flex items-center justify-center gap-2"
          >
            <Save size={20} />
            <span className="font-black tracking-tight">Save Preferences</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
