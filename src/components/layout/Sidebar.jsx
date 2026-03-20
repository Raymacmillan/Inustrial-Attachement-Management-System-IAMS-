import { Link, useLocation } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  ClipboardList,
  UserCheck,
  Settings,
  LogOut,
  X,
  Briefcase,
  User,
  CheckCircle
} from "lucide-react";

export default function Sidebar({ isOpen, setIsOpen }) {
  const { userRole, signOut } = UserAuth();
  const location = useLocation();

  const studentLinks = [
  { name: "My Dashboard", path: "/student/dashboard", icon: <LayoutDashboard size={20} /> },
  { name: "Find Attachment", path: "/student/browse", icon: <Briefcase size={20} /> },
  { name: "Career Preferences", path: "/student/preferences", icon: <Briefcase size={20} /> },
  { name: "My Applications", path: "/student/applications", icon: <CheckCircle size={20} /> },
  { name: "Weekly Logbook", path: "/student/logbook", icon: <ClipboardList size={20} /> }, 
  { name: "My Profile", path: "/student/profile", icon: <User size={20} /> },
];

  const orgLinks = [
    { name: "Employer Portal", path: "/org/portal", icon: <LayoutDashboard size={20} /> },
    { name: "Requirements", path: "/org/requirements", icon: <ClipboardList size={20} /> },
    { name: "Student Matches", path: "/org/applications", icon: <UserCheck size={20} /> },
  ];

  const links = userRole === "org" ? orgLinks : studentLinks;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-brand-950/60 z-[60] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar: h-screen ensures it takes full height */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-[70] w-72 bg-brand-900 text-white transform transition-transform duration-300 ease-in-out shadow-2xl
        lg:relative lg:translate-x-0 lg:z-0 lg:shadow-none h-screen shrink-0 flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="h-full flex flex-col p-6 overflow-hidden">
          {/* Logo Section */}
          <div className="flex items-center justify-between mb-10 shrink-0">
            <h2 className="font-display text-3xl font-bold tracking-tighter text-white">
              IAMS
            </h2>
            <button
              className="lg:hidden p-2 -mr-2 text-brand-200 hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <X size={28} />
            </button>
          </div>

          {/* Navigation Section - overflow-y-auto only here if links exceed height */}
          <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)} 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                  location.pathname === link.path
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/40"
                    : "text-brand-300 hover:bg-brand-800 hover:text-white"
                }`}
              >
                <span className="shrink-0">{link.icon}</span>
                <span className="truncate">{link.name}</span>
              </Link>
            ))}
          </nav>

          {/* Bottom Actions Section */}
          <div className="pt-6 mt-6 border-t border-brand-800 shrink-0 space-y-1">
            <Link
              to="/settings"
              className="flex items-center gap-4 px-4 py-3 text-brand-300 font-bold hover:text-white transition-colors rounded-xl hover:bg-brand-800"
            >
              <Settings size={20} /> 
              <span>Settings</span>
            </Link>
            
            <button
              onClick={signOut}
              className="w-full flex items-center gap-4 px-4 py-3 text-red-400 font-bold hover:bg-red-500/10 rounded-xl transition-all cursor-pointer group"
            >
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" /> 
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}