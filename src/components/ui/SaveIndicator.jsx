/**
 * SaveIndicator — IAMS
 *
 * Displays auto-save status inline. Designed to sit in a form header
 * next to the close button. Self-clears after `clearAfter` ms.
 *
 * Usage:
 *   const [saveStatus, setSaveStatus] = useState(null);
 *
 *   // In your debounced save:
 *   setSaveStatus("saving");
 *   try {
 *     await saveToDb();
 *     setSaveStatus("saved");
 *   } catch {
 *     setSaveStatus("error");
 *   }
 *
 *   <SaveIndicator status={saveStatus} />
 *
 * Props:
 *   status      — null | "saving" | "saved" | "error"
 *   clearAfter  — ms before "saved"/"error" fades out (default 2500)
 *   className   — extra classes on wrapper
 */
import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const CFG = {
  saving: { icon: Loader2,      label: "Saving…",  color: "text-gray-400", spin: true  },
  saved:  { icon: CheckCircle,  label: "Saved",     color: "text-emerald-600", spin: false },
  error:  { icon: AlertCircle,  label: "Not saved", color: "text-red-500",  spin: false },
};

export default function SaveIndicator({ status, clearAfter = 2500, className = "" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!status) { setVisible(false); return; }
    setVisible(true);

    // Auto-hide after delay for terminal states
    if (status === "saved" || status === "error") {
      const t = setTimeout(() => setVisible(false), clearAfter);
      return () => clearTimeout(t);
    }
  }, [status, clearAfter]);

  if (!visible || !status) return null;

  const cfg = CFG[status];
  if (!cfg) return null;

  return (
    <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest
      transition-opacity duration-300 ${cfg.color} ${className}`}>
      <cfg.icon
        size={12}
        className={cfg.spin ? "animate-spin" : ""}
        strokeWidth={2.5}
      />
      {cfg.label}
    </span>
  );
}