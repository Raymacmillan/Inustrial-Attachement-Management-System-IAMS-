import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { AvatarProvider } from "../../context/AvatarContext";

export default function StudentLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AvatarProvider>
      <div className="flex h-screen bg-[#F9FAFB] overflow-hidden font-sans">

        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          userRole="student"
        />

        <div className="flex-1 flex flex-col h-screen min-w-0 relative">

          <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto bg-[#F3F4F6]/20 custom-scrollbar">
            <div className="min-h-full max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>

        </div>
      </div>
    </AvatarProvider>
  );
}