import { createContext, useContext, useEffect, useState, useRef } from "react";
import { UserAuth } from "./AuthContext";
import * as studentService from "../services/studentService";
import * as orgService from "../services/orgService"; // Import Org Service

const AvatarContext = createContext(null);

export function AvatarProvider({ children }) {
  const { user, userRole } = UserAuth(); // Destructure userRole
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [initials, setInitials] = useState("U"); // Default to 'U' for User

  const manuallySet = useRef(false);

  useEffect(() => {
    if (!user?.id || !userRole) return;
    if (manuallySet.current) return;

    const load = async () => {
      try {
        let profileData = null;
        let finalName = "";
        let finalUrl = user?.user_metadata?.avatar_url || null;

        // ── Role-Based Fetching Strategy ──
        if (userRole === "student") {
          profileData = await studentService.getStudentProfile(user.id);
          finalName = profileData?.full_name || user?.user_metadata?.full_name || "";
          finalUrl = profileData?.avatar_url || finalUrl;
        } 
        else if (userRole === "organization") {
          profileData = await orgService.getOrgProfile(user.id);
          finalName = profileData?.org_name || user?.user_metadata?.full_name || "Organization";
          // If organizations use a logo column instead of avatar_url, adjust here
          finalUrl = profileData?.avatar_url || finalUrl; 
        }

        // ── Set the Avatar URL ──
        setAvatarUrl(finalUrl);

        // ── Generate Initials ──
        const name = finalName.trim().replace(/\s+/g, " ");
        if (name) {
          const parts = name.split(" ");
          const first = parts[0]?.[0] ?? "";
          // For companies like 'Botswana Telecommunications', get 'B T'
          const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
          setInitials((first + last).toUpperCase() || "U");
        }
      } catch (err) {
        console.error("Avatar Context Error:", err);
        // Fallback to metadata if service fails
        setInitials(user?.user_metadata?.full_name?.[0]?.toUpperCase() || "U");
      }
    };

    load();
  }, [user?.id, userRole]); // Re-run if user OR role changes

  const refreshAvatar = (newUrl) => {
    manuallySet.current = true;
    setAvatarUrl(newUrl);
  };

  return (
    <AvatarContext value={{ avatarUrl, initials, refreshAvatar }}>
      {children}
    </AvatarContext>
  );
}

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  // Disaster Prevention: If context is null, return safe defaults instead of crashing
  return context || { avatarUrl: null, initials: "U", refreshAvatar: () => {} };
};