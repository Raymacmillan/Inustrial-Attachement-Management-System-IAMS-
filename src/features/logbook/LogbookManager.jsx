import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ClipboardList, ArrowLeft, Sparkles } from "lucide-react";
import { logbookService } from "../../services/logbookService";
import { UserAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import Button from "../../components/ui/Button";
import WeekCard from "./components/WeekCard";
import LogbookModal from "./components/LogbookModal";

export default function LogbookManager() {
  const { user } = UserAuth();
  const navigate = useNavigate();

  const [placement, setPlacement] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);

  useEffect(() => {
    const loadLogbookData = async () => {
      try {
        const activePlacement = await logbookService.getActivePlacement(user.id);
        setPlacement(activePlacement);

        const { data } = await supabase
          .from("logbook_weeks")
          .select("*")
          .eq("student_id", user.id)
          .order("week_number", { ascending: true });

        setWeeks(data || []);
      } catch (error) {
        // No active placement — not a crash, just an empty state
        console.warn("No active placement:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadLogbookData();
  }, [user]);

  const handleWeekAction = async (weekNum, weekData) => {
    if (!weekData) {
      // Initialize a new week
      try {
        const startDate = new Date(placement.start_date);
        startDate.setDate(startDate.getDate() + (weekNum - 1) * 7);

        const newWeek = await logbookService.initializeWeek(
          user.id,
          placement.id,
          weekNum,
          startDate
        );

        setWeeks((prev) => [...prev, newWeek]);
        // Open it immediately after initializing
        setSelectedWeek(newWeek);
        setIsModalOpen(true);
      } catch (err) {
        console.error("Week initialization failed:", err.message);
      }
    } else {
      setSelectedWeek(weekData);
      setIsModalOpen(true);
    }
  };

  const handleStatusUpdate = (weekId, newStatus) => {
    setWeeks((prev) =>
      prev.map((w) => (w.id === weekId ? { ...w, status: newStatus } : w))
    );
  };

  // ── Loading state ──
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-brand-600" size={40} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
        Syncing Logbook...
      </p>
    </div>
  );

  // ── No placement state ──
  if (!placement) return (
    <div className="max-w-2xl mx-auto mt-16 animate-in fade-in duration-500">
      <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center space-y-6">
        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
          <ClipboardList size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-bold text-brand-900">
            Placement Pending
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
            You haven't been allocated to an organization yet. Your{" "}
            <span className="font-bold text-brand-600">8-week logbook</span>{" "}
            will unlock once your industrial attachment is officially active.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/student/dashboard")}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate("/student/preferences")}
          >
            <Sparkles size={16} />
            Update Preferences
          </Button>
        </div>
      </div>
    </div>
  );

  const approvedCount = weeks.filter((w) => w.status === "approved").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-brand-900 font-bold">
            Weekly <span className="text-brand-600">Logbook</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Tracking your {placement.duration_weeks}-week journey at{" "}
            <span className="font-bold text-brand-600">
              {placement.organization_profiles?.org_name || "Host Organization"}
            </span>
          </p>
        </div>

        {/* Progress indicator */}
        <div className="bg-brand-50 border border-brand-100 px-5 py-3 rounded-2xl shrink-0">
          <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1">
            Total Progress
          </p>
          <p className="text-xl font-black text-brand-700">
            {approvedCount} / {placement.duration_weeks}{" "}
            <span className="text-sm font-bold">Weeks Approved</span>
          </p>
        </div>
      </header>

      {/* ── Week Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: placement.duration_weeks }, (_, i) => i + 1).map(
          (weekNum) => {
            const weekData = weeks.find((w) => w.week_number === weekNum);
            return (
              <WeekCard
                key={weekNum}
                weekNum={weekNum}
                weekData={weekData}
                onAction={handleWeekAction}
              />
            );
          }
        )}
      </div>

      {/* ── Modal ── */}
      {isModalOpen && selectedWeek && (
        <LogbookModal
          week={selectedWeek}
          onClose={() => setIsModalOpen(false)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}