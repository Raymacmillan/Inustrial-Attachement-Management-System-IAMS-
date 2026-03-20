import { createContext, useContext, useEffect, useState, useRef } from "react";
import { UserAuth } from "./AuthContext";
import * as studentService from "../services/studentService";

const AvatarContext = createContext(null);

export function AvatarProvider({ children }) {
  const { user } = UserAuth();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [initials, setInitials]   = useState("S");

  const manuallySet = useRef(false);

  useEffect(() => {
    if (!user?.id) return;


    if (manuallySet.current) return;

    const load = async () => {
      try {
        const profile = await studentService.getStudentProfile(user.id);

        const url = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
        setAvatarUrl(url);

        const name = (profile?.full_name || user?.user_metadata?.full_name || "")
          .trim()
          .replace(/\s+/g, " ");

        if (name) {
          const parts = name.split(" ");
          const first = parts[0]?.[0] ?? "";
          const last  = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
          setInitials((first + last).toUpperCase() || "S");
        }
      } catch {
        // silently fall back to initials
      }
    };

    load();
  }, [user?.id]);

 
  const refreshAvatar = (newUrl) => {
    manuallySet.current = true;
    setAvatarUrl(newUrl);
  };

  return (
    <AvatarContext.Provider value={{ avatarUrl, initials, refreshAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
}

export const useAvatar = () => useContext(AvatarContext);