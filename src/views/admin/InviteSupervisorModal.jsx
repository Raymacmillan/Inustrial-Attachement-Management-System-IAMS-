import { useState } from "react";
import { X, Mail, User, Building2, GraduationCap, Send, CheckCircle, AlertTriangle } from "lucide-react";
import { supervisorService } from "../../services/supervisorService";
import { UserAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import SegmentedControl from "../../components/ui/SegmentedControl";

/**
 * InviteSupervisorModal
 *
 * Used by the coordinator to invite both supervisor types.
 * For industrial supervisors, an org must be selected from the list.
 * For university supervisors, no org is needed.
 *
 * Props:
 *   isOpen       — boolean
 *   onClose      — () => void
 *   partners     — organization_profiles[] (for industrial supervisor org selection)
 *   onSuccess    — (invitation) => void
 */
export default function InviteSupervisorModal({ isOpen, onClose, partners = [], onSuccess }) {
  const { user } = UserAuth();

  const [type,      setType]      = useState("industrial_supervisor");
  const [email,     setEmail]     = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState("");
  const [sent,      setSent]      = useState(false);

  const isIndustrial = type === "industrial_supervisor";

  const reset = () => {
    setEmail("");
    setSelectedOrg("");
    setError("");
    setSent(false);
    setType("industrial_supervisor");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSend = async () => {
    setError("");

    // Validation
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (isIndustrial && !selectedOrg) {
      setError("Please select the organisation this supervisor belongs to.");
      return;
    }

    setSending(true);
    try {
      let invitation;
      if (isIndustrial) {
        invitation = await supervisorService.inviteIndustrialSupervisor(
          email.trim(), selectedOrg, user.id
        );
      } else {
        invitation = await supervisorService.inviteUniversitySupervisor(
          email.trim(), user.id
        );
      }

      setSent(true);
      if (onSuccess) onSuccess(invitation);

      // Auto-close after 2.5s
      setTimeout(() => {
        handleClose();
      }, 2500);

    } catch (err) {
      setError(err.message || "Failed to send invitation. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4
      animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl
        animate-in zoom-in-95 slide-in-from-bottom-3 duration-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5
          border-b border-gray-100">
          <div>
            <h2 className="font-display text-xl font-bold text-brand-900">
              Invite Supervisor
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              They'll receive an email with a registration link
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-gray-400 hover:text-brand-900
              hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-5">

          {/* Success state */}
          {sent ? (
            <div className="flex flex-col items-center py-6 gap-4 text-center">
              <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center
                justify-center">
                <CheckCircle size={28} className="text-success" />
              </div>
              <div>
                <p className="font-black text-brand-900 text-lg">Invitation Sent</p>
                <p className="text-sm text-gray-400 mt-1">
                  An email has been sent to <strong>{email}</strong>
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Supervisor type toggle */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block ml-1">
                  Supervisor Type
                </label>
                <SegmentedControl
                  options={[
                    {
                      key:   "industrial_supervisor",
                      label: "Industrial",
                      icon:  <Building2 size={12} />,
                      description: "Works at the host organisation",
                    },
                    {
                      key:   "university_supervisor",
                      label: "University",
                      icon:  <GraduationCap size={12} />,
                      description: "UB department lecturer",
                    },
                  ]}
                  value={type}
                  onChange={(v) => { setType(v); setSelectedOrg(""); setError(""); }}
                  fullWidth
                />
              </div>

              {/* Email */}
              <Input
                label="Email Address"
                type="email"
                placeholder="supervisor@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={15} />}
              />

              {/* Organisation selector — industrial only */}
              {isIndustrial && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block ml-1">
                    Host Organisation
                  </label>
                  <select
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                      text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none
                      cursor-pointer text-gray-700"
                  >
                    <option value="">Select organisation…</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.org_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Info box */}
              <div className={`flex items-start gap-3 p-4 rounded-2xl border text-sm
                ${isIndustrial
                  ? "bg-blue-50 border-blue-100 text-blue-800"
                  : "bg-brand-100 border-brand-100 text-brand-800"
                }`}>
                <User size={15} className="mt-0.5 shrink-0" />
                <p className="leading-snug">
                  {isIndustrial
                    ? "The supervisor will receive a link to create an account. They'll be able to review and approve student logbooks for their organisation."
                    : "The university supervisor will be able to record visit assessments and review student logbooks across all placements."
                  }
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border
                  border-red-100 rounded-xl">
                  <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700 font-medium">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!sent && (
          <div className="px-7 py-5 border-t border-gray-100 bg-gray-50/60
            rounded-b-3xl flex gap-3 justify-end">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={sending}
              onClick={handleSend}
            >
              <Send size={14} />
              Send Invitation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}