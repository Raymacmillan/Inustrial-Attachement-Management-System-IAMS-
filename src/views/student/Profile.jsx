import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import { useAvatar } from "../../context/AvatarContext";
import * as studentService from "../../services/studentService";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { UB_MAJORS } from "../../constants/matchingOptions";
import ConfirmModal from "../../components/ui/ConfirmModal";
import {
  Save, X, User, BookOpen, Upload, ArrowLeft,
  CheckCircle, AlertCircle, ChevronDown, Target,
} from "lucide-react";

// ── Profile completion requires both CV and Transcript ──
// Most Botswana organisations require a certified transcript alongside
// a CV. The org can choose to waive either requirement on their profile,
// but for a student to be considered "onboarded" both must be uploaded.
// Allocation is then checked against the specific org's requirements.
const isProfileComplete = (f) =>
  Boolean(
    f.full_name?.trim()      &&
    f.student_id?.trim()     &&
    f.major?.trim()          &&
    f.gpa && parseFloat(f.gpa) > 0 &&
    f.cv_url?.trim()         &&
    f.transcript_url?.trim()
  );

export default function StudentProfile() {
  const { user }          = UserAuth();
  const { refreshAvatar } = useAvatar();
  const navigate          = useNavigate();
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [message,        setMessage]        = useState({ type: "", text: "" });
  const [deleteTarget,   setDeleteTarget]   = useState(null);

  const [formData, setFormData] = useState({
    full_name:           "",
    student_id:          "",
    major:               "",
    year_of_study:       3,
    gpa:                 "",
    avatar_url:          "",
    cv_url:              "",
    transcript_url:      "",
    onboarding_complete: false,
  });

  useEffect(() => {
    if (!message.text) return;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const dbData = await studentService.getStudentProfile(user.id);
        const meta   = user?.user_metadata || {};
        setFormData((prev) => ({
          ...prev,
          avatar_url:          dbData?.avatar_url          || meta?.avatar_url  || "",
          full_name:           dbData?.full_name            || meta?.full_name   || "",
          student_id:          dbData?.student_id           || meta?.student_id  || "",
          major:               dbData?.major                || "",
          gpa:                 dbData?.gpa                  || "",
          cv_url:              dbData?.cv_url               || "",
          transcript_url:      dbData?.transcript_url       || "",
          onboarding_complete: dbData?.onboarding_complete  || false,
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
      setMessage({ type: "success", text: "Document saved successfully!" });
    } catch {
      setMessage({ type: "error", text: "Upload failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = (bucket) => setDeleteTarget(bucket);

  const confirmDeleteDoc = async () => {
    const bucket = deleteTarget;
    setDeleteTarget(null);
    setSaving(true);
    try {
      await studentService.deleteDocument(user.id, bucket);
      const fieldName = bucket === "cvs" ? "cv_url" : "transcript_url";
      setFormData((prev) => ({ ...prev, [fieldName]: "" }));
      setMessage({ type: "success", text: "Document removed." });
    } catch {
      setMessage({ type: "error", text: "Delete failed." });
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
      setMessage({ type: "error", text: "Avatar upload failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.major) {
      setMessage({ type: "error", text: "Please select your Major." });
      return;
    }
    setSaving(true);
    try {
      const updatedData = {
        ...formData,
        onboarding_complete: isProfileComplete(formData),
      };
      await studentService.updateStudentProfile(user.id, updatedData);
      setFormData(updatedData);
      setMessage({
        type: "success",
        text: updatedData.onboarding_complete
          ? "Profile complete — you are now eligible for matching! ✓"
          : "Profile saved. Upload both your CV and Transcript to complete your profile.",
      });
      setTimeout(() => navigate("/student/dashboard"), 1500);
    } catch {
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

 
  const missingFields = [
    !formData.full_name?.trim()                       && "Full Name",
    !formData.student_id?.trim()                      && "Student ID",
    !formData.major?.trim()                           && "Major",
    (!formData.gpa || parseFloat(formData.gpa) <= 0)  && "GPA",
    !formData.cv_url?.trim()                          && "CV",
    !formData.transcript_url?.trim()                  && "Transcript",
  ].filter(Boolean);

  const profileComplete = isProfileComplete(formData);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse text-brand-600 font-bold text-lg">Syncing Identity...</div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500 pb-24">

      {/* ── Toast ── */}
      {message.text && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 pointer-events-none">
          <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm shadow-xl border animate-in slide-in-from-bottom-4 duration-300 ${
            message.type === "success" ? "bg-white text-green-700 border-green-200" : "bg-white text-red-700 border-red-200"
          }`}>
            {message.type === "success"
              ? <CheckCircle size={18} className="text-green-500" />
              : <AlertCircle size={18} className="text-red-500" />}
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage({ type: "", text: "" })} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row items-center gap-6 border-b border-gray-100 pb-8">
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-50 flex items-center justify-center">
            {formData.avatar_url
              ? <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              : <User size={40} className="text-gray-200" />}
          </div>
          <label className="absolute inset-0 flex flex-col items-center justify-center bg-brand-900/60 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-full backdrop-blur-[2px]">
            <Upload size={20} className="mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Update</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
          </label>
        </div>

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="hero-tag mx-auto sm:mx-0 mb-2 bg-brand-100 text-brand-700 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            Academic Identity
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-brand-900 font-bold truncate min-w-0">
            {formData.full_name || "Complete Profile"}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base font-light mt-1 truncate">
            {formData.student_id ? `ID: ${formData.student_id}` : "Ready for Matching?"}
          </p>

          {/* Eligibility badge */}
          <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
            profileComplete
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}>
            <CheckCircle size={13} />
            {profileComplete
              ? "Eligible for Matching"
              : missingFields.length > 0
                ? `Missing: ${missingFields.join(", ")}`
                : "Complete your profile"
            }
          </div>

          <div className="mt-3 flex justify-center sm:justify-start">
            <button
              onClick={() => navigate("/student/dashboard")}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} /> Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 space-y-6">
            <h3 className="text-base sm:text-xl font-display text-brand-900 flex items-center gap-2 font-bold">
              <BookOpen className="text-brand-600 shrink-0" size={18} />
              <span>Academic Record</span>
            </h3>
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
                min="0"
                max="5"
                value={formData.gpa}
                onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Major</label>
                <div className="relative">
                  <select
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold h-11 appearance-none focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer pr-10"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  >
                    <option value="" disabled>Select Major</option>
                    {UB_MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Year of Study</label>
                <div className="relative">
                  <select
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold h-11 appearance-none focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer pr-10"
                    value={formData.year_of_study}
                    onChange={(e) => setFormData({ ...formData, year_of_study: parseInt(e.target.value) })}
                  >
                    <option value={3}>3rd Year (Attachment)</option>
                    <option value={4}>4th Year (Final)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Documents */}
        <div className="xl:col-span-1 space-y-6 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 min-w-0">
            <div className="border-b border-gray-100 pb-4 mb-5">
              <h3 className="text-base sm:text-xl font-display text-brand-900 flex items-center gap-2 font-bold">
                <Upload className="text-brand-600 shrink-0" size={18} />
                <span>Documents</span>
              </h3>
              <p className="text-[10px] text-red-500 uppercase tracking-widest mt-1 font-bold">
                Both Required · PDF · Max 5MB
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
                        : "border-red-100 bg-red-50/30 hover:bg-red-50/60 cursor-pointer"
                    }`}>
                      {!url && <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(e, bucket)} />}
                      <div className={`p-2 rounded-lg shrink-0 ${url ? "bg-green-100 text-green-600" : "bg-red-50 text-red-400 shadow-sm"}`}>
                        {url ? <CheckCircle size={16} /> : <Upload size={16} />}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className={`text-xs font-bold truncate ${url ? "text-green-700" : "text-red-600"}`}>
                          {url
                            ? (isCV ? "CV uploaded ✓" : "Transcript uploaded ✓")
                            : (isCV ? "Upload CV" : "Upload Transcript")}
                        </p>
                        <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-wider ${url ? "text-gray-400" : "text-red-400"}`}>
                          Required for matching
                        </p>
                      </div>
                    </label>
                    {url && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(bucket)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 z-10 border-2 border-white cursor-pointer"
                      >
                        <X size={11} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-5">
              <Button type="submit" loading={saving} fullWidth size="md">
                <Save size={15} /> Save Profile
              </Button>
            </div>
          </div>

          <div className="p-5 bg-brand-900 rounded-2xl text-white">
            <h4 className="font-bold mb-1.5 flex items-center gap-2 text-brand-400 text-xs">
              <Target size={14} /> PRO TIP
            </h4>
            <p className="text-[11px] text-brand-100/80 leading-relaxed font-semibold">
              Most Botswana organisations require both a CV and a certified transcript. Upload both to maximise your placement chances — some orgs may waive one requirement, but having both gives you access to all opportunities.
            </p>
          </div>
        </div>
      </form>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteDoc}
        title={`Remove ${deleteTarget === "cvs" ? "CV" : "Transcript"}?`}
        message="This file will be deleted from your profile. You can re-upload a new version at any time."
        confirmText="Remove Document"
        type="danger"
      />
    </div>
  );
}