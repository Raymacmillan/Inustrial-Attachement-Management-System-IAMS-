import React from "react";
import { useEffect, useState } from 'react';
import { logbookService } from '../../../services/logbookService';
import DailyEntryRow from './DailyEntryRow'; 

const LogbookModal = ({ week, onClose, onStatusUpdate }) => {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDays = async () => {
      try {
        const data = await logbookService.getWeekDetails(week.id);
        setDays(data.daily_logs);
      } catch (err) {
        console.error("Failed to load days", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDays();
  }, [week.id]);

  const handleUpdateDay = async (logId, field, value) => {
    const updatedDays = days.map(d => d.id === logId ? { ...d, [field]: value } : d);
    setDays(updatedDays);

    try {
      const currentDay = updatedDays.find(d => d.id === logId);
      await logbookService.updateDailyLog(logId, {
        activity_details: currentDay.activity_details,
        hours_worked: currentDay.hours_worked
      });
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure? You won't be able to edit this week until the supervisor reviews it.")) return;
    
    try {
      await logbookService.submitWeek(week.id);
      onStatusUpdate(week.id, 'submitted'); 
      onClose();
    } catch (err) {
      alert("Submission failed: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-black text-gray-800">Week {week.week_number} Logbook</h2>
            <p className="text-sm text-gray-500">Log your daily activities for supervisor approval.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading daily entries...</div>
          ) : (
            <div className="space-y-4">
              <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] uppercase font-black text-gray-400 px-2">
                <div className="col-span-2">Day</div>
                <div className="col-span-8">Activity & Tasks</div>
                <div className="col-span-2 text-center">Hours</div>
              </div>
              {days.map((day) => (
                <DailyEntryRow 
                  key={day.id} 
                  day={day} 
                  onUpdate={handleUpdateDay} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t bg-gray-50 rounded-b-3xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500 italic">
            Total for Week: <span className="font-bold text-gray-900">{days.reduce((acc, curr) => acc + Number(curr.hours_worked), 0)} hrs</span>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={onClose} className="flex-1 md:flex-none px-8 py-3 font-bold text-gray-600 hover:bg-gray-200 rounded-2xl transition-all">
              Save & Exit
            </button>
            <button 
              onClick={handleSubmit}
              disabled={week.status === 'submitted' || week.status === 'approved'}
              className="flex-1 md:flex-none px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-gray-300 transition-all"
            >
              Submit Week
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogbookModal;