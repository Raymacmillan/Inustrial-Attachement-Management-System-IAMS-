import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import * as studentService from "../../services/studentService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import {
  Save,
  Plus,
  X,
  User,
  BookOpen,
  Award,
  Upload,
  FileText,
  Target,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

export default function StudentProfile() {
  const { user } = UserAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  console.log(user);

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
  const fetchProfile = async () => {
    try {
      const dbData = await studentService.getStudentProfile(user.id);
      const meta = user?.user_metadata || {};

      setFormData(prev => ({
        ...prev,
        avatar_url: dbData?.avatar_url || meta?.avatar_url || "",
        full_name: dbData?.full_name || meta?.full_name || "",
        student_id: dbData?.student_id || meta?.student_id || "",
        major: dbData?.major || "",
        gpa: dbData?.gpa || "",
        skills: dbData?.skills || [],
        cv_url: dbData?.cv_url || "",
        transcript_url: dbData?.transcript_url || ""
      }));
    } catch (err) {
      console.error("Fetch Error:", err);
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
  } catch (err) {
    setMessage({ type: "error", text: "Upload failed." });
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
    
    await studentService.updateStudentProfile(user.id, { 
      avatar_url: publicUrl 
    });
    

    setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
    setMessage({ type: "success", text: "Profile picture synced!" });
  } catch (err) {
    console.error(err);
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
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    });
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
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-brand-600 font-bold text-lg">
          Syncing Profile Data...
        </div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* ── Unified Modern Header (Integrated Avatar) ── */}
      <header className="flex flex-col md:flex-row items-center gap-6 border-b border-gray-100 pb-8 px-2">
        
        {/* Avatar with Hover Upload */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-50 flex items-center justify-center transition-transform hover:scale-[1.02]">
            {formData.avatar_url ? (
              <img
                src={formData.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={48} className="text-gray-200" />
            )}
          </div>
          
          <label className="absolute inset-0 flex flex-col items-center justify-center bg-brand-900/60 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer rounded-full backdrop-blur-[2px]">
            <Upload size={24} className="mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Update</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarUpload}
            />
          </label>
        </div>

        {/* Identity & Nav Information */}
        <div className="flex-1 text-center md:text-left min-w-0">
          <div className="hero-tag mx-auto md:mx-0 mb-3 bg-brand-100! text-brand-700!">
            Student Information
          </div>
          <h1 className="font-display text-3xl sm:text-5xl text-brand-900 leading-tight font-bold truncate">
            {formData.full_name || "Complete Profile"}
          </h1>
          <p className="text-gray-500 text-base sm:text-xl font-light mt-1">
            {formData.student_id ? `ID: ${formData.student_id}` : "Ready for the Matching Engine?"}
          </p>
          
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
            <button
              onClick={() => navigate("/student/dashboard")}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 cursor-pointer hover:text-brand-600 transition-colors bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* ── Status Message ── */}
      {message.text && (
        <div
          className={`p-3 rounded-xl font-bold border text-xs sm:text-sm shadow-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border-green-100"
              : "bg-red-50 text-red-700 border-red-100"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle size={16} />
            ) : (
              <X size={16} />
            )}
            {message.text}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10"
      >
        {/* ── Column 1 & 2: Information ── */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-10">
          
          {/* Academic Details Card */}
          <div className="card p-5 sm:p-8 bg-white shadow-sm border border-gray-100 space-y-6 rounded-2xl">
            <h3 className="text-lg sm:text-2xl font-display text-brand-900 flex items-center gap-2 sm:gap-3 font-bold">
              <BookOpen className="text-brand-600" size={20} />
              <span>Academic Record</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Input
                label="Student ID"
                value={formData.student_id}
                onChange={(e) =>
                  setFormData({ ...formData, student_id: e.target.value })
                }
                placeholder="e.g. 202303013"
              />
              <Input
                label="GPA"
                type="number"
                step="0.01"
                value={formData.gpa}
                onChange={(e) =>
                  setFormData({ ...formData, gpa: e.target.value })
                }
                placeholder="e.g. 3.85"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Major
                </label>
                <select
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none h-11 appearance-none"
                  value={formData.major}
                  onChange={(e) =>
                    setFormData({ ...formData, major: e.target.value })
                  }
                >
                  <option value="" disabled>Select Major</option>
                  <option value="Computer Science">B.Sc. (Computer Science)</option>
                  <option value="Computing with Finance">B.Sc. (Comp. with Finance)</option>
                  <option value="Information Systems">B.Sc. (Information Systems)</option>
                  <option value="Information Technology">B.Sc. (Information Technology)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Year
                </label>
                <select
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none h-11 appearance-none"
                  value={formData.year_of_study}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      year_of_study: parseInt(e.target.value),
                    })
                  }
                >
                  <option value={3}>3rd Year (Attachment)</option>
                  <option value={4}>4th Year (Final)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Technical Skills Card */}
          <div className="card p-5 sm:p-8 bg-white shadow-sm border border-gray-100 space-y-6 rounded-2xl">
            <h3 className="text-lg sm:text-2xl font-display text-brand-900 flex items-center gap-2 sm:gap-3 font-bold">
              <Target className="text-brand-600 w-5 h-5 sm:w-6 sm:h-6" />
              <span>Technical Expertise</span>
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs sm:text-sm font-medium min-w-0"
                placeholder="Add a skill..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddSkill(e)}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="p-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shrink-0 cursor-pointer"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg font-bold text-[10px] sm:text-xs border border-brand-100 animate-in zoom-in duration-300"
                >
                  {skill}
                  <X
                    size={12}
                    className="cursor-pointer hover:text-red-500"
                    onClick={() => removeSkill(skill)}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Column 3: Verification ── */}
        <div className="space-y-6 sm:space-y-10">
          <div className="card p-5 sm:p-8 bg-white shadow-sm border border-gray-100 space-y-6 rounded-2xl h-fit">
            <h3 className="text-lg sm:text-2xl font-display text-brand-900 border-b pb-4 flex items-center gap-2 sm:gap-3 font-bold">
              <Upload className="text-brand-600" size={20} />
              <span>Documents</span>
            </h3>

            <div className="space-y-4">
              <label
                className={`block p-4 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center ${formData.cv_url ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}
              >
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e, "cvs")}
                />
                <div className="flex flex-col items-center gap-1">
                  {formData.cv_url ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <Upload size={20} className="text-gray-400" />
                  )}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${formData.cv_url ? "text-green-700" : "text-gray-500"}`}
                  >
                    {formData.cv_url ? "CV Uploaded" : "Upload CV"}
                  </span>
                </div>
              </label>

              <label
                className={`block p-4 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center ${formData.transcript_url ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}
              >
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e, "transcripts")}
                />
                <div className="flex flex-col items-center gap-1">
                  {formData.transcript_url ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <Upload size={20} className="text-gray-400" />
                  )}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${formData.transcript_url ? "text-green-700" : "text-gray-500"}`}
                  >
                    {formData.transcript_url
                      ? "Transcript Uploaded"
                      : "Upload Transcript"}
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                loading={saving}
                className="w-full py-2! sm:py-2.5! text-xs sm:text-sm! shadow-lg shadow-brand-600/10 rounded-xl"
              >
                <Save size={16} className="mr-2" /> Save Profile
              </Button>
            </div>
          </div>

          <div className="p-6 bg-brand-900 rounded-2xl text-white shadow-xl shadow-brand-900/20">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <Target size={18} className="text-brand-400" /> Pro Tip
            </h4>
            <p className="text-xs text-brand-200 leading-relaxed">
              Organizations filter by GPA and Skills. Having these ready speeds up matching!
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}