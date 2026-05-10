import { createContext, useContext, useEffect, useState, useRef } from "react";
import { UserAuth } from "./AuthContext";
import * as studentService from "../services/studentService";
import * as orgService from "../services/orgService";

const AvatarContext = createContext(null);

export function AvatarProvider({ children }) {
  const { user, userRole } = UserAuth();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [initials, setInitials] = useState("U");

  // Tracks which userId the manually-uploaded avatar belongs to.
  // Using a userId instead of a plain boolean means a different user
  // signing in will never match, forcing a fresh load for their account.
  const manualSetForUser = useRef(null);

  useEffect(() => {
    // User signed out — wipe the previous user's avatar immediately so it
    // never leaks into the next user's session, and reset the manual flag.
    if (!user?.id || !userRole) {
      setAvatarUrl(null);
      setInitials("U");
      manualSetForUser.current = null;
      return;
    }

    // The user just uploaded a new photo this session — skip the DB fetch
    // so we don't overwrite their freshly-set image. Only skip when the
    // manual set was for THIS specific user (not a previous account).
    if (manualSetForUser.current === user.id) return;

    const load = async () => {
      try {
        let finalName = "";
        let finalUrl  = user?.user_metadata?.avatar_url || null;

        if (userRole === "student") {
          const profile = await studentService.getStudentProfile(user.id);
          finalName = profile?.full_name || user?.user_metadata?.full_name || "";
          finalUrl  = profile?.avatar_url || finalUrl;
        } else if (userRole === "org") {
          const profile = await orgService.getOrgProfile(user.id);
          finalName = profile?.org_name || user?.user_metadata?.full_name || "Organization";
          finalUrl  = profile?.avatar_url || finalUrl;
        } else {
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
    // Stamp the current user's id so the effect knows this manual set
    // belongs to them — not to any future user who signs in.
    manualSetForUser.current = user?.id ?? null;
    setAvatarUrl(newUrl);
  };

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