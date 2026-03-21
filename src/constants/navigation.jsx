import {
  LayoutDashboard,
  ClipboardList,
  UserCheck,
  Settings,
  Briefcase,
  User,
  CheckCircle,
  Zap,
  Users,
  ShieldCheck
} from "lucide-react";

const ICON_SIZE = 20;

export const NAV_LINKS = {
  student: [
    { name: "My Dashboard", path: "/student/dashboard", icon: <LayoutDashboard size={ICON_SIZE} /> },
    { name: "Find Attachment", path: "/student/browse", icon: <Briefcase size={ICON_SIZE} /> },
    { name: "Career Preferences", path: "/student/preferences", icon: <Briefcase size={ICON_SIZE} /> },
    { name: "My Applications", path: "/student/applications", icon: <CheckCircle size={ICON_SIZE} /> },
    { name: "Weekly Logbook", path: "/student/logbook", icon: <ClipboardList size={ICON_SIZE} /> }, 
    { name: "My Profile", path: "/student/profile", icon: <User size={ICON_SIZE} /> },
  ],
  org: [
    { name: "Employer Portal", path: "/org/portal", icon: <LayoutDashboard size={ICON_SIZE} /> },
    { name: "Requirements", path: "/org/requirements", icon: <ClipboardList size={ICON_SIZE} /> },
    { name: "Student Matches", path: "/org/applications", icon: <UserCheck size={ICON_SIZE} /> },
  ],
  coordinator: [
    { name: "Command Center", path: "/coordinator/dashboard", icon: <ShieldCheck size={ICON_SIZE} /> },
    { name: "Student Registry", path: "/coordinator/students", icon: <Users size={ICON_SIZE} /> },
    { name: "Partner Registry", path: "/coordinator/organizations", icon: <Briefcase size={ICON_SIZE} /> },
    { name: "Matching Engine", path: "/coordinator/matching", icon: <Zap size={ICON_SIZE} /> },
  ],
};


export const getLinksByRole = (role) => {
  return NAV_LINKS[role] || NAV_LINKS.student;
};