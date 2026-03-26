import { BookOpen, Plus } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";

// Maps DB status values to your Badge variant system
const STATUS_VARIANT = {
  draft:     "brand",
  submitted: "warning",
  approved:  "success",
  flagged:   "default",
};

export default function WeekCard({ weekNum, weekData, onAction }) {
  const hasData = !!weekData;
  const isLocked = weekData?.status === "approved";

  return (
    <div className={`relative bg-white rounded-3xl p-6 transition-all duration-300 border-2 flex flex-col gap-6
      ${hasData
        ? "border-gray-100 shadow-sm hover:shadow-md"
        : "border-dashed border-gray-200 hover:border-brand-300"
      }`}
    >
      {/* Top row — week label + status badge */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
          Week {weekNum}
        </span>
        {hasData && (
          <Badge variant={STATUS_VARIANT[weekData.status] || "default"}>
            {weekData.status}
          </Badge>
        )}
      </div>

      {/* Week number display */}
      <div>
        <h3 className="font-display text-5xl font-bold text-brand-900 leading-none">
          {String(weekNum).padStart(2, "0")}
        </h3>
        <p className="text-[11px] font-medium text-gray-400 mt-2">
          {hasData
            ? `${new Date(weekData.start_date).toLocaleDateString("en-GB")} – ${new Date(weekData.end_date).toLocaleDateString("en-GB")}`
            : "Not yet initialized"}
        </p>
      </div>

      {/* Action button */}
      <Button
        variant={hasData ? "secondary" : "primary"}
        fullWidth
        onClick={() => onAction(weekNum, weekData)}
        disabled={false}
      >
        {hasData ? (
          <>
            <BookOpen size={15} />
            {isLocked ? "View Logbook" : "Open Logbook"}
          </>
        ) : (
          <>
            <Plus size={15} />
            Initialize Week
          </>
        )}
      </Button>
    </div>
  );
}