import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { UserAuth } from "../../context/AuthContext";
import {
  getStudentPlacement,
  getStudentNotifications,
  markNotificationRead,
} from "../../services/studentService";

export default function StudentLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications,  setNotifications] = useState([]);
  const [placementId,    setPlacementId]   = useState(null);
  const { user } = UserAuth();

  const fetchNotifications = useCallback(async (pId) => {
    if (!user?.id || !pId) return;
    try {
      const notifs = await getStudentNotifications(user.id, pId);
      setNotifications(notifs);
    } catch {
      // Non-fatal
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;

    const init = async () => {
      try {
        const placement = await getStudentPlacement(user.id);
        if (!alive || !placement?.id) return;
        setPlacementId(placement.id);
        await fetchNotifications(placement.id);
      } catch {
        // Non-fatal
      }
    };

    init();
    return () => { alive = false; };
  }, [user?.id, fetchNotifications]);

  // Called by NotificationBell when user clicks mark as read on an item
  const handleMarkRead = useCallback(async (type, refId) => {
    if (!user?.id) return;
    try {
      await markNotificationRead(user.id, type, refId);
      // Optimistically remove from list immediately
      setNotifications((prev) =>
        prev.filter((n) => !(n.type === type && n.refId === refId))
      );
    } catch {
      // Re-fetch to resync if write failed
      await fetchNotifications(placementId);
    }
  }, [user?.id, placementId, fetchNotifications]);

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} userRole="student" />
      <div className="flex-1 flex flex-col h-screen min-w-0 relative">
        <Navbar
          onMenuClick={() => setIsSidebarOpen(true)}
          notifications={notifications}
          onMarkRead={handleMarkRead}
        />
        <main className="flex-1 overflow-y-auto bg-[#F3F4F6]/20 custom-scrollbar">
          <div className="min-h-full max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}