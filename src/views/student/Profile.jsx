import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import { useAvatar } from "../../context/AvatarContext";
import * as studentService from "../../services/studentService";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import {
  Save,
  Plus,
  X,
  User,
  BookOpen,
  Upload,
  Target,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function StudentProfile() {
  const { user } = UserAuth();
  const { refreshAvatar } = useAvatar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    full_name: "",
    student_id: "",
    major: "",
    year_of_study: 3,
    gpa: "",
    bio: "",
    skills: [],
    avatar_url: "",
    cv_url: "",
    transcript_url: "",
  });

  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!message.text) return;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const dbData = await studentService.getStudentProfile(user.id);
        const meta = user?.user_metadata || {};
        setFormData((prev) => ({
          ...prev,
          avatar_url:     dbData?.avatar_url     || meta?.avatar_url  || "",
          full_name:      dbData?.full_name       || meta?.full_name   || "",
          student_id:     dbData?.student_id      || meta?.student_id  || "",
          major:          dbData?.major           || "",
          gpa:            dbData?.gpa             || "",
          skills:         dbData?.skills          || [],
          cv_url:         dbData?.cv_url          || "",
          transcript_url: dbData?.transcript_url  || "",
        }));
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchProfile();
  }, [user?.id]);

  const handleFileUpload = async (e, bucket) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    try {
      const publicUrl = await studentService.uploadDocument(user.id, file, bucket);
      const fieldName = bucket === "cvs" ? "cv_url" : "transcript_url";
      await studentService.updateStudentProfile(user.id, { [fieldName]: publicUrl });
      setFormData((prev) => ({ ...prev, [fieldName]: publicUrl }));
      setMessage({ type: "success", text: "File secured and saved!" });
    } catch {
      setMessage({ type: "error", text: "Upload failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async (bucket) => {
    if (!window.confirm(`Remove this ${bucket === "cvs" ? "CV" : "Transcript"}?`)) return;
    setSaving(true);
    try {
      await studentService.deleteDocument(user.id, bucket);
      const fieldName = bucket === "cvs" ? "cv_url" : "transcript_url";
      setFormData((prev) => ({ ...prev, [fieldName]: "" }));
      setMessage({ type: "success", text: "Document removed successfully." });
    } catch {
      setMessage({ type: "error", text: "Delete failed. Try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    try {
      const publicUrl = await studentService.uploadAvatar(user.id, file);
      await studentService.updateStudentProfile(user.id, { avatar_url: publicUrl });
      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
      refreshAvatar(publicUrl);
      setMessage({ type: "success", text: "Profile picture synced!" });
    } catch {
      setMessage({ type: "error", text: "Failed to sync avatar." });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const cleanSkill = skillInput.trim();
    if (cleanSkill && !formData.skills.includes(cleanSkill)) {
      setFormData({ ...formData, skills: [...formData.skills, cleanSkill] });
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({ ...formData, skills: formData.skills.filter((s) => s !== skillToRemove) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.major) {
      setMessage({ type: "error", text: "Please select your Major." });
      return;
    }
    setSaving(true);
    try {
      await studentService.updateStudentProfile(user.id, formData);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => navigate("/student/dashboard"), 1500);
    } catch {
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-brand-600 font-bold text-lg">Syncing Profile...</div>
      </div>
    );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500 pb-24">

      {/* ── Toast ── */}
      {message.text && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 pointer-events-none">
          <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm shadow-xl border animate-in slide-in-from-bottom-4 duration-300 ${
            message.type === "success"
              ? "bg-white text-green-700 border-green-200 shadow-green-100"
              : "bg-white text-red-700 border-red-200 shadow-red-100"
          }`}>
            {message.type === "success"
              ? <CheckCircle size={18} className="text-green-500 shrink-0" />
              : <AlertCircle size={18} className="text-red-500 shrink-0" />
            }
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage({ type: "", text: "" })} className="text-gray-400 hover:text-gray-600 shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row items-center gap-6 border-b border-gray-100 pb-8">
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-50 flex items-center justify-center">
            {formData.avatar_url ? (
              <img key={formData.avatar_url} src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-gray-200" />
            )}
          </div>
          <label className="absolute inset-0 flex flex-col items-center justify-center bg-brand-900/60 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-full backdrop-blur-[2px]">
            <Upload size={20} className="mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Update</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
          </label>
        </div>

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="hero-tag mx-auto sm:mx-0 mb-2 bg-brand-100! text-brand-700! inline-block">Student Profile</div>
          {/* overflow-hidden + min-w-0 prevents the name from blowing out the header */}
          <h1 className="font-display text-3xl sm:text-4xl text-brand-900 font-bold truncate min-w-0">
            {formData.full_name || "Complete Profile"}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base font-light mt-1 truncate">
            {formData.student_id ? `ID: ${formData.student_id}` : "Ready for Matching?"}
          </p>
          <div className="mt-3 flex justify-center sm:justify-start">
            <button
              onClick={() => navigate("/student/dashboard")}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 transition-colors"
            >
              <ArrowLeft size={13} /> Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* ── Form ──────────────────────────────────────────────────────────
          BREAKPOINT FIX: changed from lg:grid-cols-3 to xl:grid-cols-3.
          At lg (1024px) the sidebar takes ~256px, leaving ~768px for content.
          Splitting that into 3 columns makes the right column only ~200px —
          too narrow for the document labels. At xl (1280px) there's enough
          room for a proper 3-column split alongside the sidebar.
          Between md and xl: single column stack, documents below skills.
      ──────────────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left: Academic + Skills ── */}
        <div className="xl:col-span-2 space-y-6 min-w-0">

          {/* Academic Record */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 space-y-5 min-w-0">
            <h3 className="text-base sm:text-xl font-display text-brand-900 flex items-center gap-2 font-bold">
              <BookOpen className="text-brand-600 shrink-0" size={18} />
              <span>Academic Record</span>
            </h3>
            {/* 2-col grid only at sm+ — on mobile stack vertically */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Student ID"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              />
              <Input
                label="GPA"
                type="number"
                step="0.01"
                value={formData.gpa}
                onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Major</label>
                <select
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold h-11 appearance-none focus:ring-2 focus:ring-brand-500 outline-none"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                >
                  <option value="" disabled>Select Major</option>
                  <option value="Computer Science">B.Sc. (Computer Science)</option>
                  <option value="Computing with Finance">B.Sc. (Comp. with Finance)</option>
                  <option value="Information Systems">B.Sc. (Information Systems)</option>
                  <option value="Information Technology">B.Sc. (Information Technology)</option>
                </select>
              </div>
              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Year</label>
                <select
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold h-11 appearance-none focus:ring-2 focus:ring-brand-500 outline-none"
                  value={formData.year_of_study}
                  onChange={(e) => setFormData({ ...formData, year_of_study: parseInt(e.target.value) })}
                >
                  <option value={3}>3rd Year (Attachment)</option>
                  <option value={4}>4th Year (Final)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Technical Skills */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 space-y-5 min-w-0">
            <h3 className="text-base sm:text-xl font-display text-brand-900 flex items-center gap-2 font-bold">
              <Target className="text-brand-600 shrink-0" size={18} />
              <span>Technical Expertise</span>
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 min-w-0 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Add a skill (e.g. React, Python)..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddSkill(e)}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddSkill}
                className="shrink-0 !min-w-[40px] !w-10 !h-10 !p-0"
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.length === 0 && (
                <p className="text-xs text-gray-400 italic">No skills added yet.</p>
              )}
              {formData.skills.map((skill, index) => (
                <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg font-semibold text-xs border border-brand-100">
                  {skill}
                  <X size={11} className="cursor-pointer hover:text-red-500 shrink-0" onClick={() => removeSkill(skill)} />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Documents + Save ─────────────────────────────────────
            min-w-0 on this column wrapper is critical — without it the
            column can grow wider than its grid cell on tablet viewports.
        ──────────────────────────────────────────────────────────────── */}
        <div className="xl:col-span-1 space-y-6 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 min-w-0">

            <div className="border-b border-gray-100 pb-4 mb-5">
              <h3 className="text-base sm:text-xl font-display text-brand-900 flex items-center gap-2 font-bold">
                <Upload className="text-brand-600 shrink-0" size={18} />
                <span>Documents</span>
              </h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">
                PDF · Max 5MB
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {["cvs", "transcripts"].map((bucket) => {
                const isCV = bucket === "cvs";
                const url  = isCV ? formData.cv_url : formData.transcript_url;

                return (
                  <div key={bucket} className="relative min-w-0">
                    <label className={`flex items-center gap-3 w-full px-4 py-3.5 border-2 border-dashed rounded-xl transition-all min-w-0 ${
                      url
                        ? "border-green-200 bg-green-50/60 cursor-default"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                    }`}>
                      {!url && (
                        <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(e, bucket)} />
                      )}

                      <div className={`p-2 rounded-lg shrink-0 ${url ? "bg-green-100 text-green-600" : "bg-white text-gray-400 shadow-sm"}`}>
                        {url ? <CheckCircle size={16} /> : <Upload size={16} />}
                      </div>

                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className={`text-xs font-bold truncate ${url ? "text-green-700" : "text-gray-700"}`}>
                          {url ? (isCV ? "CV uploaded" : "Transcript uploaded") : (isCV ? "Upload CV" : "Upload Transcript")}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                          {url ? "Tap × to remove" : "PDF · max 5MB"}
                        </p>
                      </div>
                    </label>

                    {url && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(bucket)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10 border-2 border-white"
                      >
                        <X size={11} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-5">
              <Button
                type="submit"
                loading={saving}
                fullWidth
                size="md"
              >
                <Save size={15} />
                Save Profile
              </Button>
            </div>
          </div>

          <div className="p-5 bg-brand-900 rounded-2xl text-white">
            <h4 className="font-bold mb-1.5 flex items-center gap-2 text-brand-400 text-xs">
              <Target size={14} /> PRO TIP
            </h4>
            <p className="text-[11px] text-brand-100/80 leading-relaxed">
              Organizations prioritize profiles with verified transcripts and a GPA above 3.0.
            </p>
          </div>
        </div>

      </form>
    </div>
  );
}