/**
 * DigitalStamp — IAMS
 *
 * Renders a verifiable approval stamp. Used in:
 *   - LogbookModal (approved week banner)
 *   - Supervisor dashboard (week review panel)
 *   - PDF logbook export (stamp block at bottom of each week)
 *
 * Usage:
 *   <DigitalStamp
 *     signerName="Dr. K. Moagi"
 *     signerTitle="Industrial Supervisor"
 *     signerRole="industrial_supervisor"
 *     signedAt="2026-05-02T10:34:00Z"
 *   />
 *
 *   // Compact for tables / lists:
 *   <DigitalStamp ... size="sm" />
 *
 * Props:
 *   signerName   — full name of approver
 *   signerTitle  — job title / role label
 *   signerRole   — "industrial_supervisor" | "university_supervisor" | "coordinator"
 *   signedAt     — ISO timestamp string
 *   size         — "sm" | "md" (default "md")
 *   className    — extra classes
 */
import { CheckCircle, Shield } from "lucide-react";

const ROLE_LABEL = {
  industrial_supervisor:  "Industrial Supervisor",
  university_supervisor:  "University Supervisor",
  coordinator:            "Coordinator",
};

export default function DigitalStamp({
  signerName,
  signerTitle,
  signerRole,
  signedAt,
  size = "md",
  className = "",
}) {
  const sm = size === "sm";

  const formattedDate = signedAt
    ? new Date(signedAt).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  const roleLabel = ROLE_LABEL[signerRole] || signerRole || "Approver";

  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-emerald-200
      bg-emerald-50 ${sm ? "px-3 py-2.5" : "px-4 py-3"} ${className}`}>

      {/* Icon */}
      <div className={`shrink-0 rounded-full bg-emerald-100 flex items-center justify-center
        text-emerald-600 ${sm ? "w-8 h-8" : "w-10 h-10"}`}>
        <CheckCircle size={sm ? 15 : 18} strokeWidth={2.5} />
      </div>

      {/* Text block */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className={`font-black text-emerald-900 leading-tight truncate
            ${sm ? "text-xs" : "text-sm"}`}>
            {signerName || "Unknown"}
          </p>
          <span className="text-[9px] font-black uppercase tracking-wider
            bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full">
            {roleLabel}
          </span>
        </div>

        {signerTitle && (
          <p className={`text-emerald-700 font-medium truncate
            ${sm ? "text-[10px]" : "text-xs"}`}>
            {signerTitle}
          </p>
        )}
      </div>

      {/* Timestamp */}
      {formattedDate && (
        <div className="shrink-0 text-right">
          <p className={`font-mono text-emerald-600 leading-tight
            ${sm ? "text-[9px]" : "text-[10px]"}`}>
            {formattedDate}
          </p>
          <div className="flex items-center justify-end gap-1 mt-0.5">
            <Shield size={9} className="text-emerald-400" />
            <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400">
              Verified
            </span>
          </div>
        </div>
      )}
    </div>
  );
}