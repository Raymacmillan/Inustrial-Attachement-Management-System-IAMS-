import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logbookService } from '../../services/logbookService';
import { UserAuth } from '../../context/AuthContext'; 
import LogbookModal from './components/LogbookModal';
import { supabase } from '../../lib/supabaseClient';

const LogbookManager = () => {
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
          .from('logbook_weeks')
          .select('*')
          .eq('student_id', user.id)
          .order('week_number', { ascending: true });
        
        setWeeks(data || []);
      } catch (error) {
        console.error("Initialization Error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadLogbookData();
  }, [user]);

  const handleWeekAction = async (weekNum, weekData) => {
    if (!weekData) {
      try {
        const startDate = new Date(placement.start_date);
        startDate.setDate(startDate.getDate() + (weekNum - 1) * 7);

        const newWeek = await logbookService.initializeWeek(
          user.id, 
          placement.id, 
          weekNum, 
          startDate
        );
        
        setWeeks(prev => [...prev, newWeek]);
      } catch (err) {
        alert(err.message);
      }
    } else {
      setSelectedWeek(weekData); 
      setIsModalOpen(true);
    }
  };

  const handleStatusUpdate = (weekId, newStatus) => {
    setWeeks(prev => prev.map(w => w.id === weekId ? { ...w, status: newStatus } : w));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!placement) return (
    <div className="max-w-4xl mx-auto mt-20 p-12 bg-white border-2 border-dashed border-gray-200 rounded-[3rem] text-center shadow-sm">
      <div className="text-6xl mb-6">⏳</div>
      <h2 className="text-3xl font-black text-gray-900 tracking-tight">Placement Pending</h2>
      <p className="text-gray-500 mt-4 max-w-md mx-auto text-lg">
        You haven't been allocated to a company yet. Your 8-week logbook will unlock once your industrial attachment is officially active.
      </p>
      
      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          onClick={() => navigate('/student/dashboard')}
          className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all transform active:scale-95 shadow-xl shadow-gray-200"
        >
          Back to Dashboard
        </button>
        <button 
          onClick={() => navigate('/student/preferences')}
          className="px-8 py-4 bg-blue-50 text-blue-600 font-bold rounded-2xl hover:bg-blue-100 transition-all transform active:scale-95"
        >
          Check My Preferences
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Logbook Manager</h1>
          <p className="text-gray-500 mt-1">
            Tracking your {placement.duration_weeks}-week journey at <span className="text-blue-600 font-bold">{placement.organization_profiles?.org_name || 'Host Organization'}</span>
          </p>
        </div>
        <div className="bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Total Progress</span>
          <span className="text-xl font-black text-blue-700">
            {weeks.filter(w => w.status === 'approved').length} / {placement.duration_weeks} Weeks Approved
          </span>
        </div>
      </header>

      {/* The Dynamic Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: placement.duration_weeks }, (_, i) => i + 1).map((weekNum) => {
          const weekData = weeks.find(w => w.week_number === weekNum);
          
          return (
            <div 
              key={weekNum} 
              className={`group relative bg-white border-2 rounded-3xl p-6 transition-all duration-300 ${
                weekData ? 'border-gray-100 shadow-sm' : 'border-dashed border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Week {weekNum}</span>
                {weekData && (
                  <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${getStatusStyles(weekData.status)}`}>
                    {weekData.status}
                  </span>
                )}
              </div>

              <div className="mb-8">
                <h3 className="text-5xl font-black text-gray-800 leading-none">0{weekNum}</h3>
                <p className="text-[11px] font-medium text-gray-400 mt-3">
                  {weekData 
                    ? `${new Date(weekData.start_date).toLocaleDateString('en-GB')} - ${new Date(weekData.end_date).toLocaleDateString('en-GB')}` 
                    : 'Not yet initialized'}
                </p>
              </div>

              <button
                onClick={() => handleWeekAction(weekNum, weekData)}
                className={`w-full py-4 rounded-2xl font-black text-sm transition-all transform active:scale-95 ${
                  weekData 
                    ? 'bg-gray-50 text-gray-800 hover:bg-gray-200' 
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700'
                }`}
              >
                {weekData ? 'Open Logbook' : 'Initialize Week'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Conditionally Render the Modal */}
      {isModalOpen && selectedWeek && (
        <LogbookModal 
          week={selectedWeek} 
          onClose={() => setIsModalOpen(false)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

const getStatusStyles = (status) => {
  switch (status) {
    case 'draft': return 'bg-blue-50 text-blue-500';
    case 'submitted': return 'bg-yellow-50 text-yellow-600';
    case 'approved': return 'bg-green-50 text-green-600';
    case 'flagged': return 'bg-red-50 text-red-600';
    default: return 'bg-gray-50 text-gray-400';
  }
};

export default LogbookManager;