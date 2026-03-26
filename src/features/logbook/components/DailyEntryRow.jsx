import { Clock } from "lucide-react";

export default function DailyEntryRow({ day, onUpdate, isLocked }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b border-gray-100 pb-5 pt-3 items-start">

      {/* Day + Date */}
      <div className="md:col-span-2">
        <span className="font-bold text-brand-900 text-sm block">{day.day_of_week}</span>
        <span className="text-[10px] font-mono text-gray-400 mt-0.5 block">
          {new Date(day.log_date).toLocaleDateString("en-GB")}
        </span>
      </div>

      {/* Activity */}
      <div className="md:col-span-8">
        <textarea
          rows={3}
          disabled={isLocked}
          placeholder="Describe your tasks and accomplishments today..."
          value={day.activity_details || ""}
          onChange={(e) => onUpdate(day.id, "activity_details", e.target.value)}
          className={`w-full border rounded-xl p-3 text-sm outline-none transition-all resize-none
            focus:ring-2 focus:ring-brand-500 focus:border-brand-300
            ${isLocked
              ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white border-gray-200 text-gray-700"
            }`}
        />
      </div>

      {/* Hours */}
      <div className="md:col-span-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 md:hidden">
          Hours
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.5"
            min="0"
            max="24"
            disabled={isLocked}
            value={day.hours_worked}
            onChange={(e) => onUpdate(day.id, "hours_worked", e.target.value)}
            className={`w-full border rounded-xl p-3 text-sm text-center font-bold outline-none transition-all
              focus:ring-2 focus:ring-brand-500 focus:border-brand-300
              ${isLocked
                ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border-gray-200 text-brand-900"
              }`}
          />
          <Clock
            size={12}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}