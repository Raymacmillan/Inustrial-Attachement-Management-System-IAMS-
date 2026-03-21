import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import { useAvatar } from "../../context/AvatarContext";
import StatCard from "../../components/ui/StatCard";
import Button from "../../components/ui/Button";
import * as orgService from "../../services/orgService";
import {
  Users,
  Handshake,
  FileText,
  Target,
  Plus,
  Headphones,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Settings,
} from "lucide-react";

export default function OrgPortal() {
  const { user, loading: authLoading } = UserAuth();
  const { avatarUrl, refreshAvatar } = useAvatar() || {};
  const [profile, setProfile] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadOrgData = async () => {
      try {
        if (user?.id) {
          const { profile: profileData, vacancies: vacanciesData } =
            await orgService.getOrgDashboardData(user.id);

          setProfile(profileData);
          setVacancies(vacanciesData);

          if (profileData.avatar_url) {
            refreshAvatar(profileData.avatar_url);
          }
        }
      } catch (error) {
        console.error("Error loading portal:", error);
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading && user) loadOrgData();
  }, [user, authLoading, refreshAvatar]);

  const totalSlots = vacancies.reduce(
    (acc, curr) => acc + (curr.available_slots || 0),
    0,
  );
  const latestVacancy = vacancies[0] || null;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-brand-600" size={48} />
        <p className="text-brand-600 font-bold animate-pulse text-[10px] uppercase tracking-widest">
          Syncing Portal Data...
        </p>
      </div>
    );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 md:space-y-10 animate-in fade-in zoom-in-95 duration-500 px-4 pb-10">
      {/* ── HEADER ── */}
      {/* 1. Added items-center for mobile centering, reset to items-start for desktop */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-100 pb-8 items-center lg:items-start">
        {/* 2. Container for Logo + Title: Center items on mobile, Row on tablet+ */}
        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 min-w-0 text-center sm:text-left">
          {/* Avatar/Logo */}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-brand-900 overflow-hidden shadow-xl border-4 border-white shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                className="w-full h-full object-cover"
                alt="Logo"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl md:text-2xl">
                {profile?.org_name?.charAt(0)}
              </div>
            )}
          </div>

          {/* Text Content: Center text on mobile */}
          <div className="min-w-0 flex flex-col items-center sm:items-start">
            <div className="inline-block mb-1 bg-brand-100 text-brand-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              Employer Dashboard
            </div>
            <h1 className="font-display text-2xl md:text-4xl text-brand-900 leading-tight truncate font-bold">
              {profile?.org_name || "Organization"}
            </h1>

            {/* Meta tags: justify-center for mobile layout */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 mt-1 text-gray-500 font-medium">
              <p className="flex items-center gap-1.5 text-xs md:text-sm">
                <MapPin size={14} className="text-brand-400" />
                {profile?.location || "Location not set"}
              </p>
              <span className="hidden sm:inline text-gray-300">•</span>
              <p className="text-[10px] md:text-sm text-brand-600 font-bold uppercase tracking-wider">
                {profile?.industry || "Industry Not Specified"}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Buttons: Stacked and centered by parent, full width for better mobile tap targets */}
        {/* 3. Buttons: Added sm:justify-center to fix tablet alignment */}
        <div className="flex flex-col sm:flex-row sm:justify-center lg:justify-end gap-3 w-full lg:w-auto">
          <Button
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto flex justify-center items-center"
            onClick={() => navigate("/org/profile")}
          >
            <Settings size={20} className="mr-2" />
            <span>Edit Identity</span>
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto flex justify-center items-center"
            onClick={() => navigate("/org/requirements")}
          >
            <Plus size={20} className="mr-2" />
            <span>Post Vacancy</span>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Slots" value={totalSlots} icon={Users} />
        <StatCard
          title="Matches"
          value="0"
          icon={Handshake}
          colorClass="border-accent"
        />
        <StatCard
          title="Listings"
          value={vacancies.length}
          icon={FileText}
          colorClass="border-warning"
        />
        <StatCard
          title="Status"
          value={profile?.onboarding_complete ? "Active" : "New"}
          icon={Target}
          colorClass="border-success"
        />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Main Content Areas */}
        <div className="xl:col-span-2 space-y-6 md:space-y-8">
          <div className="card p-6 md:p-8 bg-white shadow-sm border border-gray-100 flex flex-col rounded-3xl">
            <h2 className="font-display text-xl md:text-2xl text-brand-900 mb-6 flex items-center gap-2 font-bold">
              <Target className="text-brand-600" size={20} /> Required Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {latestVacancy?.required_skills?.length > 0 ? (
                latestVacancy.required_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg font-bold text-[10px] md:text-xs border border-brand-100 uppercase"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-400 italic text-sm">
                  Update vacancies to define skills.
                </p>
              )}
            </div>
          </div>

          <div className="card p-6 md:p-8 bg-white shadow-sm border border-gray-100 rounded-3xl">
            <h2 className="font-display text-xl md:text-2xl text-brand-900 mb-6 flex items-center gap-2 font-bold">
              <FileText className="text-brand-600" size={20} />
              Role: {latestVacancy?.role_title || "Pending"}
            </h2>
            <div className="text-gray-600 leading-relaxed text-sm font-medium border-l-4 border-brand-100 pl-4 py-1 mb-6">
              {latestVacancy?.job_description ||
                "Detailed role overview will appear here."}
            </div>
            <div className="pt-6 border-t flex flex-wrap gap-4 md:gap-8">
              <DocBadge label="CV" active={profile?.requires_cv} />
              <DocBadge
                label="Transcript"
                active={profile?.requires_transcript}
              />
            </div>
          </div>
        </div>

        {/* Support Sidebar: Stacks on mobile, stays sticky on desktop */}
        <div className="xl:col-span-1">
          <div className="card p-6 md:p-8 bg-brand-900 text-white border-0 shadow-xl flex flex-col rounded-3xl sticky top-24">
            <div className="flex items-center gap-3 mb-4">
              <Headphones className="text-brand-400" size={20} />
              <h2 className="font-display text-xl md:text-2xl text-white font-bold">
                Support
              </h2>
            </div>
            <p className="text-brand-300 mb-6 text-sm">
              Need help managing matches?
            </p>
            <div className="space-y-3 text-[10px] md:text-xs font-medium pt-4 border-t border-brand-800">
              <div className="flex justify-between items-center">
                <span className="text-brand-400 uppercase tracking-widest">
                  Coordinator
                </span>
                <span>CS Dept</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-brand-400 uppercase tracking-widest">
                  Email
                </span>
                <span className="text-brand-200">support@ub.ac.bw</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocBadge({ label, active }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      {active ? (
        <CheckCircle2 size={14} className="text-green-500" />
      ) : (
        <AlertCircle size={14} className="text-gray-300" />
      )}
      <span
        className={`text-[10px] font-black uppercase tracking-widest ${active ? "text-green-700" : "text-gray-400"}`}
      >
        {label}
      </span>
    </div>
  );
}
