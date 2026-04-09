import { createContext, useContext, useEffect, useState, useRef } from "react";
import { UserAuth } from "./AuthContext";
import * as studentService from "../services/studentService";
import * as orgService from "../services/orgService";

const AvatarContext = createContext(null);

export function AvatarProvider({ children }) {
  const { user, userRole } = UserAuth();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [initials, setInitials] = useState("U");
  const manuallySet = useRef(false);

  useEffect(() => {
    if (!user?.id || !userRole) return;
    if (manuallySet.current) return;

    const load = async () => {
      try {
        let finalName = "";
        let finalUrl = user?.user_metadata?.avatar_url || null;

        if (userRole === "student") {
          const profileData = await studentService.getStudentProfile(user.id);
          finalName = profileData?.full_name || user?.user_metadata?.full_name || "";
          finalUrl = profileData?.avatar_url || finalUrl;
        } else if (userRole === "org") {
          const profileData = await orgService.getOrgProfile(user.id);
          finalName = profileData?.org_name || user?.user_metadata?.full_name || "Organization";
          finalUrl = profileData?.avatar_url || finalUrl;
        } else {
          // coordinator or other roles — use metadata only
          finalName = user?.user_metadata?.full_name || "";
        }

        setAvatarUrl(finalUrl);

        const name = finalName.trim().replace(/\s+/g, " ");
        if (name) {
          const parts = name.split(" ");
          const first = parts[0]?.[0] ?? "";
          const last  = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
          setInitials((first + last).toUpperCase() || "U");
        }
      } catch (err) {
        console.error("AvatarContext error:", err);
        setInitials(user?.user_metadata?.full_name?.[0]?.toUpperCase() || "U");
      }
    };

    load();
  }, [user?.id, userRole]);

  const refreshAvatar = (newUrl) => {
    manuallySet.current = true;
    setAvatarUrl(newUrl);
  };

  // ← .Provider is required — <AvatarContext value={...}> only works in React 19 canary
  return (
    <AvatarContext.Provider value={{ avatarUrl, initials, refreshAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
}

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  return context || { avatarUrl: null, initials: "U", refreshAvatar: () => {} };
};