import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
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
} from "lucide-react";

export default function OrgPortal() {
  const { user, loading: authLoading } = UserAuth();
  const [profile, setProfile] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadOrgData = async () => {
      try {
        if (user?.id) {
          const [profileData, vacanciesData] = await Promise.all([
            orgService.getOrgProfile(user.id),
            orgService.getOrgVacancies(user.id),
          ]);
          setProfile(profileData);
          setVacancies(vacanciesData);
        }
      } catch (error) {
        console.error("Error loading portal:", error);
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading && user) loadOrgData();
  }, [user, authLoading]);

  const totalSlots = vacancies.reduce(
    (acc, curr) => acc + (curr.available_slots || 0),
    0,
  );
  const latestVacancy = vacancies[0] || null;

  return (
    <>
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="animate-spin text-brand-600" size={48} />
          <p className="text-brand-600 font-bold animate-pulse text-lg">
            Syncing Portal Data...
          </p>
        </div>
      ) : (
        <div className="w-full max-w-7xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-500 px-4 sm:px-0 pb-10">
          {/* ── Header: Adjusted Button Size ── */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-100 pb-8">
            <div className="min-w-0">
              <div className="hero-tag mb-2 bg-brand-100! text-brand-700!">
                Employer Dashboard
              </div>
              <h1 className="font-display text-4xl sm:text-5xl text-brand-900 leading-tight truncate">
                {profile?.org_name || "Organization"}
              </h1>
              <p className="text-gray-500 text-lg sm:text-xl font-light">
                Location:{" "}
                <span className="text-brand-600 font-medium">
                  {profile?.location || "Not specified"}
                </span>
              </p>
            </div>
            {/* Removed the ! overrides to maintain component consistency */}
            <Button size="xl" onClick={() => navigate("/org/requirements")}>
              <Plus size={14} />
              <span>{vacancies.length > 0 ? "Manage Vacancies" : "Post Vacancy"}</span>
            </Button>
          </header>

          {/* ── Stats Grid: Corrected xl:grid-cols-4 ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            <StatCard title="Total Slots" value={totalSlots} icon={Users} />
            <StatCard
              title="Active Matches"
              value="0"
              icon={Handshake}
              colorClass="border-accent"
            />
            <StatCard
              title="Active Listings"
              value={vacancies.length}
              icon={FileText}
              colorClass="border-warning"
            />
            <StatCard
              title="Profile Status"
              value={profile?.onboarding_complete ? "Active" : "Incomplete"}
              icon={Target}
              colorClass="border-success"
            />
          </div>

          {/* ── Action Center: Switched to xl for 3-col layout to avoid squashing on iPad/Laptops ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              {/* Skills Card */}
              <div className="card p-6 sm:p-8 bg-white shadow-sm border border-gray-100 flex flex-col">
                <h2 className="font-display text-2xl text-brand-900 mb-6 flex items-center gap-2 font-bold">
                  <Target className="text-brand-600" size={24} /> Required
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {latestVacancy?.required_skills?.length > 0 ? (
                    latestVacancy.required_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg font-bold text-xs border border-brand-100"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-400 italic">
                      No vacancies posted yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Vacancy Overview Card */}
              <div className="card p-6 sm:p-8 bg-white shadow-sm border border-gray-100">
                <h2 className="font-display text-2xl text-brand-900 mb-6 flex items-center gap-2 font-bold">
                  <FileText className="text-brand-600" size={24} /> Role
                  Overview: {latestVacancy?.role_title || "None"}
                </h2>
                <div className="text-gray-600 italic border-l-4 border-brand-100 pl-4 py-1 line-clamp-6">
                  {latestVacancy?.job_description ||
                    "Add a vacancy description to help students match with your needs."}
                </div>
                <div className="mt-8 pt-6 border-t flex flex-wrap gap-4 md:gap-8">
                  <DocBadge label="CV" active={profile?.requires_cv} />
                  <DocBadge
                    label="Transcript"
                    active={profile?.requires_transcript}
                  />
                </div>
              </div>
            </div>

            {/* Support Card */}
            <div className="card p-6 sm:p-8 bg-brand-900 text-white border-0 shadow-xl flex flex-col h-fit sticky top-24">
              <div className="flex items-center gap-3 mb-4">
                <Headphones className="text-brand-400" />
                <h2 className="font-display text-2xl text-white">Support</h2>
              </div>
              <p className="text-brand-300 mb-6 text-sm">
                Assistance for UB Attachment partners.
              </p>
              <div className="space-y-4 text-xs font-medium pt-6 border-t border-brand-800">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-brand-400">Coordinator</span>
                  <span className="text-right">CS Dept</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-brand-400">Email</span>
                  <span className="text-brand-200 truncate">
                    support@ub.ac.bw
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DocBadge({ label, active }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      {active ? (
        <CheckCircle2 size={16} className="text-green-500" />
      ) : (
        <AlertCircle size={16} className="text-gray-300" />
      )}
      <span
        className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${active ? "text-green-700" : "text-gray-400"}`}
      >
        {label} Required
      </span>
    </div>
  );
}
