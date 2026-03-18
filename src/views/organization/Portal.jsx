import { useState, useEffect } from "react";
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
} from "lucide-react";

export default function OrgPortal() {
  const { user, loading: authLoading } = UserAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrgData = async () => {
      try {
        if (user?.id) {
          const data = await orgService.getOrgProfile(user.id);
          setProfile(data);
        }
      } catch (error) {
        console.error("Error loading org profile:", error);
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading && user) {
      loadOrgData();
    }
  }, [user, authLoading]);

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
        <div className="w-full max-w-7xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-500 px-4 sm:px-0">

          {/* ── Header ── */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-100 pb-8">
            <div className="min-w-0">
              <div className="hero-tag mb-2 bg-brand-100! text-brand-700!">
                Employer Dashboard
              </div>
              <h1 className="font-display text-4xl sm:text-5xl text-brand-900 leading-tight truncate">
                {profile?.org_name ||
                  user?.user_metadata?.full_name ||
                  "Organization"}
              </h1>
              <p className="text-gray-500 text-lg sm:text-xl font-light">
                Location:{" "}
                <span className="text-brand-600 font-medium">
                  {profile?.location || "Not specified"}
                </span>
              </p>
            </div>

            <div className="shrink-0">
              <Button className="flex items-center justify-center gap-2 !py-2.5 !px-6 !text-sm lg:!text-base shadow-lg shadow-brand-900/10">
                <Plus size={18} /> Post New Vacancy
              </Button>
            </div>
          </header>

          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Available Slots"
              value={profile?.available_slots || 0}
              icon={Users}
            />
            <StatCard
              title="Active Matches"
              value="0"
              icon={Handshake}
              colorClass="border-accent"
            />
            <StatCard
              title="Pending Reports"
              value="0"
              icon={FileText}
              colorClass="border-warning"
            />
            <StatCard
              title="Profile Health"
              value={profile?.onboarding_complete ? "100%" : "60%"}
              icon={Target}
              colorClass="border-success"
            />
          </div>

          {/* ── Two-column section ──────────────────────────────────────────
              KEY FIX: use CSS grid with grid-cols instead of flex-row.
              Grid children automatically stretch to the tallest sibling —
              no flex-1, min-h, or items-stretch hacks needed.
              On mobile: single column, cards stack naturally.
              On desktop (lg): 2/3 + 1/3 split, always same height.
          ─────────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Skills card — spans 2 of 3 columns on desktop */}
            <div className="lg:col-span-2 card p-6 sm:p-8 bg-white shadow-sm border border-gray-100 flex flex-col">
              <h2 className="font-display text-2xl text-brand-900 mb-6 flex items-center gap-2">
                <Target className="text-brand-600" size={24} /> Required Skills
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-3 flex-1 content-start">
                {profile?.required_skills?.length > 0 ? (
                  profile.required_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-brand-50 text-brand-700 rounded-lg font-bold text-xs sm:text-sm border border-brand-100 whitespace-nowrap"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-400 italic">
                    No requirements listed yet. Update your profile to attract
                    students.
                  </p>
                )}
              </div>
            </div>

            {/* Support card — spans 1 of 3 columns on desktop */}
            <div className="card p-6 sm:p-8 bg-brand-900 text-white border-0 shadow-xl shadow-brand-900/20 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <Headphones className="text-brand-400" />
                <h2 className="font-display text-2xl text-white">Support</h2>
              </div>
              <p className="text-brand-300 mb-6 text-sm leading-relaxed flex-1">
                Direct assistance for UB Industrial Attachment partners.
              </p>
              <div className="space-y-4 text-xs sm:text-sm font-medium pt-6 border-t border-brand-800">
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <span className="text-brand-400 shrink-0">Coordinator</span>
                  <span className="text-white text-right">CS Department</span>
                </div>
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <span className="text-brand-400 shrink-0">Email</span>
                  <a
                    href="mailto:support@ub.ac.bw"
                    className="text-brand-200 hover:text-white transition-colors break-all text-right font-bold underline-offset-4 hover:underline"
                  >
                    support@ub.ac.bw
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}