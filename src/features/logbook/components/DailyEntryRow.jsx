import React from "react";
const DailyEntryRow = ({ day, onUpdate }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b border-gray-100 pb-4 pt-2 items-start">
      <div className="md:col-span-2">
        <span className="font-bold text-gray-700 block md:mt-2">{day.day_of_week}</span>
        <span className="text-xs text-gray-400">{day.log_date}</span>
      </div>

      <div className="md:col-span-8">
        <textarea
          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
          rows="3"
          placeholder="What did you accomplish today?"
          value={day.activity_details || ''}
          onChange={(e) => onUpdate(day.id, 'activity_details', e.target.value)}
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-[10px] uppercase font-bold text-gray-400 md:hidden">Hours</label>
        <input
          type="number"
          step="0.5"
          max="24"
          className="w-full border border-gray-200 rounded-xl p-3 text-sm text-center font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
          value={day.hours_worked}
          onChange={(e) => onUpdate(day.id, 'hours_worked', e.target.value)}
        />
      </div>
    </div>
  );
};

export default DailyEntryRow;