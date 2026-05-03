import { useState, useEffect, useCallback } from "react";
import {
  Building2, GraduationCap, Mail, CheckCircle, Clock,
  Loader2, RefreshCw, Send, AlertTriangle, UserCheck,
  ChevronDown, ChevronUp, Users,
} from "lucide-react";
import { coordinatorService } from "../../services/coordinatorService";
import { supervisorService }  from "../../services/supervisorService";
import { UserAuth }           from "../../context/AuthContext";
import Button     from "../../components/ui/Button";
import TabBar     from "../../components/ui/TabBar";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState  from "../../components/ui/EmptyState";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-6 right-6 z-[300] flex items-center gap-2 px-5 py-3
      rounded-2xl shadow-lg text-sm font-bold animate-in slide-in-from-top-2
      ${toast.type === "error"
        ? "bg-red-50 border border-red-200 text-red-700"
        : "bg-brand-100 border border-brand-100 text-success"
      }`}>
      {toast.type === "error" ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
      {toast.msg}
    </div>
  );
}

// ─── Invitation table (shared by both tabs) ───────────────────────────────────

function InvitationTable({ invitations, loading }) {
  if (loading) return (
    <div className="flex justify-center py-10">
      <Loader2 className="animate-spin text-brand-400" size={24} />
    </div>
  );

  if (invitations.length === 0) return (
    <div className="py-10 text-center">
      <p className="text-sm text-gray-400 font-medium">No invitations sent yet.</p>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <table className="w-full hidden md:table">
        <thead>
          <tr className="bg-brand-900">
            {["Supervisor / Email", "Status", "Sent", "Expires"].map((h) => (
              <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black
                uppercase tracking-widest text-brand-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {invitations.map((inv) => {
            const isExpired = inv.status === "pending" && new Date(inv.expires_at) < new Date();
            return (
              <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-600
                      flex items-center justify-center shrink-0">
                      <Mail size={14} />
                    </div>
                    <span className="text-sm font-semibold text-brand-900 truncate max-w-[220px]">
                      {inv.email}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={isExpired ? "expired" : inv.status} size="sm" />
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500 font-medium">
                  {fmt(inv.created_at)}
                </td>
                <td className={`px-5 py-3.5 text-sm font-medium
                  ${isExpired ? "text-red-500" : "text-gray-400"}`}>
                  {fmt(inv.expires_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-gray-100">
        {invitations.map((inv) => {
          const isExpired = inv.status === "pending" && new Date(inv.expires_at) < new Date();
          return (
            <div key={inv.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-brand-900 truncate">{inv.email}</p>
                <StatusBadge status={isExpired ? "expired" : inv.status} size="sm" />
              </div>
              <p className="text-[11px] text-gray-400">
                Sent {fmt(inv.created_at)} · Expires {fmt(inv.expires_at)}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Industrial tab ───────────────────────────────────────────────────────────

function IndustrialTab({ invitations, loading, user, onInvited, showToast }) {
  const [orgs,        setOrgs]        = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [invitingIds, setInvitingIds] = useState(new Set());
  const [selected,    setSelected]    = useState(new Set()); // supervisor IDs
  const [expandedOrg, setExpandedOrg] = useState(null);

  // Emails that already have a pending/accepted invite
  const pendingEmails = new Set(
    invitations
      .filter((i) => i.status === "pending" || i.status === "accepted")
      .map((i) => i.email)
  );

  useEffect(() => {
    coordinatorService.getOrgsWithSupervisors().then((data) => {
      setOrgs(data || []);
      // Auto-expand first org that has active students
      const first = data?.find((o) => o.activePlacements?.length > 0);
      if (first) setExpandedOrg(first.id);
    }).catch(console.error).finally(() => setOrgsLoading(false));
  }, []);

  const canInvite = (sup) => !sup.user_id && !pendingEmails.has(sup.email);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const inviteOne = async (sup, orgId) => {
    setInvitingIds((p) => new Set(p).add(sup.id));
    try {
      const inv = await supervisorService.inviteIndustrialSupervisor(
        sup.email, orgId, user.id, sup.id
      );
      onInvited(inv);
      showToast(`Invitation sent to ${sup.full_name}`);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setInvitingIds((p) => { const n = new Set(p); n.delete(sup.id); return n; });
    }
  };

  const inviteSelected = async (org) => {
    const toInvite = org.supervisors.filter(
      (s) => selected.has(s.id) && canInvite(s)
    );
    for (const sup of toInvite) {
      await inviteOne(sup, org.id);
    }
    setSelected(new Set());
  };

  if (orgsLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="animate-spin text-brand-400" size={28} />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Org accordion list */}
      <div className="space-y-3">
        {orgs.map((org) => {
          const isExpanded  = expandedOrg === org.id;
          const uninvited   = org.supervisors.filter(canInvite);
          const hasActive   = org.activePlacements?.length > 0;
          const orgSelected = org.supervisors.filter((s) => selected.has(s.id));

          return (
            <div key={org.id} className={`bg-white rounded-2xl border-2 overflow-hidden
              transition-all ${hasActive ? "border-brand-100" : "border-gray-100"}`}>

              {/* Org header row */}
              <button
                onClick={() => setExpandedOrg(isExpanded ? null : org.id)}
                className="w-full flex items-center justify-between px-5 py-4
                  hover:bg-gray-50 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                    ${hasActive ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-brand-900 text-sm truncate">{org.org_name}</p>
                    <div className="flex items-center gap-3 flex-wrap mt-0.5">
                      {hasActive && (
                        <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">
                          {org.activePlacements.length} active student{org.activePlacements.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {org.supervisors.length} supervisor{org.supervisors.length !== 1 ? "s" : ""} on record
                      </span>
                      {uninvited.length > 0 && (
                        <span className="text-[10px] font-black text-amber-600">
                          {uninvited.length} not invited
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-3">
                  {orgSelected.length > 0 && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={(e) => { e.stopPropagation(); inviteSelected(org); }}
                    >
                      <Send size={12} /> Invite {orgSelected.length}
                    </Button>
                  )}
                  {isExpanded
                    ? <ChevronUp size={15} className="text-gray-400" />
                    : <ChevronDown size={15} className="text-gray-400" />
                  }
                </div>
              </button>

              {/* Active students strip */}
              {isExpanded && hasActive && (
                <div className="px-5 py-2 bg-brand-100/40 border-t border-brand-100 flex gap-2 flex-wrap">
                  <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest self-center">
                    Students:
                  </span>
                  {org.activePlacements.map((p) => (
                    <span key={p.id} className="text-[10px] font-bold text-brand-700
                      bg-brand-100 px-2 py-0.5 rounded-full">
                      {p.student_profiles?.full_name || p.student_profiles?.student_id}
                    </span>
                  ))}
                </div>
              )}

              {/* Supervisor rows */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {org.supervisors.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-gray-400 italic">
                      No supervisors on record.
                    </p>
                  ) : (
                    org.supervisors.map((sup) => {
                      const invitable  = canInvite(sup);
                      const isPending  = pendingEmails.has(sup.email) && !sup.user_id;
                      const isInviting = invitingIds.has(sup.id);

                      return (
                        <div key={sup.id} className="flex items-center gap-3 px-5 py-3
                          border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">

                          {/* Checkbox */}
                          <div className="w-5 shrink-0">
                            {invitable && (
                              <input
                                type="checkbox"
                                checked={selected.has(sup.id)}
                                onChange={() => toggleSelect(sup.id)}
                                className="h-4 w-4 rounded text-brand-600 border-gray-300
                                  focus:ring-brand-500 cursor-pointer"
                              />
                            )}
                          </div>

                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700
                            flex items-center justify-center font-black text-sm shrink-0">
                            {sup.full_name?.[0] || "?"}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-brand-900 truncate">{sup.full_name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{sup.email}</p>
                            {sup.role_title && (
                              <p className="text-[10px] font-black text-brand-400 uppercase tracking-wider">
                                {sup.role_title}
                              </p>
                            )}
                          </div>

                          {/* Status + action */}
                          <div className="flex items-center gap-2 shrink-0">
                            {sup.user_id ? (
                              <span className="text-[10px] font-black text-success bg-brand-100
                                border border-brand-100 px-2 py-0.5 rounded-full uppercase tracking-wider
                                flex items-center gap-1">
                                <CheckCircle size={9} /> Active
                              </span>
                            ) : isPending ? (
                              <span className="text-[10px] font-black text-amber-700 bg-amber-50
                                border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider
                                flex items-center gap-1">
                                <Clock size={9} /> Invited
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                loading={isInviting}
                                onClick={() => inviteOne(sup, org.id)}
                              >
                                <Mail size={12} /> Invite
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Invitation history table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
            Industrial Supervisor Invitations
          </p>
        </div>
        <InvitationTable
          invitations={invitations.filter((i) => i.supervisor_type === "industrial_supervisor")}
          loading={loading}
        />
      </div>
    </div>
  );
}

// ─── University tab ───────────────────────────────────────────────────────────

function UniversityTab({ invitations, loading, user, onInvited, showToast }) {
  const [email,   setEmail]   = useState("");
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState("");

  const pendingEmails = new Set(
    invitations
      .filter((i) => i.status === "pending" || i.status === "accepted")
      .map((i) => i.email)
  );

  const handleSend = async () => {
    setError("");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (pendingEmails.has(email.trim())) {
      setError("An invitation has already been sent to this email.");
      return;
    }
    setSending(true);
    try {
      const inv = await supervisorService.inviteUniversitySupervisor(email.trim(), user.id);
      onInvited(inv);
      showToast(`Invitation sent to ${email.trim()}`);
      setEmail("");
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Send invite form */}
      <div className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
        <div className="px-5 py-4 bg-brand-100 border-b border-brand-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
            <GraduationCap size={16} />
          </div>
          <div>
            <p className="font-bold text-brand-900 text-sm">Invite University Supervisor</p>
            <p className="text-[11px] text-brand-600">
              UB lecturers who conduct student visits and assessments
            </p>
          </div>
        </div>
        <div className="px-5 py-5 space-y-3">
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="lecturer@ub.ac.bw"
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
            />
            <Button
              loading={sending}
              onClick={handleSend}
              className="bg-brand-600 hover:bg-brand-700 border-brand-600 text-white
                shadow-sm px-5 rounded-xl font-bold text-sm flex items-center gap-2 shrink-0"
            >
              <Send size={13} /> Send Invite
            </Button>
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
              <AlertTriangle size={12} /> {error}
            </p>
          )}
          <p className="text-[11px] text-gray-400">
            The supervisor will receive an email with a registration link valid for 7 days.
            Once registered they can log in to record visit assessments.
          </p>
        </div>
      </div>

      {/* Invitation history table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
            University Supervisor Invitations
          </p>
        </div>
        <InvitationTable
          invitations={invitations.filter((i) => i.supervisor_type === "university_supervisor")}
          loading={loading}
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SupervisorManagement() {
  const { user } = UserAuth();

  const [activeTab,   setActiveTab]   = useState("industrial");
  const [invitations, setInvitations] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const invs = await supervisorService.listInvitations();
      setInvitations(invs || []);
    } catch (e) {
      console.error("Load failed:", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInvited = (inv) => setInvitations((p) => [inv, ...p]);

  // Stats
  const industrial = invitations.filter((i) => i.supervisor_type === "industrial_supervisor");
  const university = invitations.filter((i) => i.supervisor_type === "university_supervisor");
  const pending    = invitations.filter((i) => i.status === "pending").length;
  const accepted   = invitations.filter((i) => i.status === "accepted").length;

  const tabs = [
    {
      key:      "industrial",
      label:    "Industrial",
      sublabel: "Org supervisors",
      count:    industrial.length,
    },
    {
      key:      "university",
      label:    "University",
      sublabel: "UB lecturers",
      count:    university.length,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      <Toast toast={toast} />

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4
        border-b border-gray-100 pb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-brand-900 font-bold">
            Supervisor <span className="text-brand-600">Management</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage and invite industrial and university supervisors
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Industrial Invites
          </p>
          <p className="text-3xl font-black text-brand-900">{industrial.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            University Invites
          </p>
          <p className="text-3xl font-black text-brand-900">{university.length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">
            Pending
          </p>
          <p className="text-3xl font-black text-amber-700">{pending}</p>
        </div>
        <div className="bg-brand-100 border border-brand-100 rounded-2xl p-5">
          <p className="text-[10px] font-black text-success uppercase tracking-widest mb-1">
            Accepted
          </p>
          <p className="text-3xl font-black text-success">{accepted}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold
                text-sm transition-all duration-150 cursor-pointer
                ${activeTab === tab.key
                  ? "bg-white shadow-sm text-brand-900"
                  : "text-gray-500 hover:text-gray-800"
                }`}
            >
              {tab.key === "industrial"
                ? <Building2 size={15} className={activeTab === tab.key ? "text-brand-600" : "text-gray-400"} />
                : <GraduationCap size={15} className={activeTab === tab.key ? "text-brand-600" : "text-gray-400"} />
              }
              {tab.label}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full
                ${activeTab === tab.key
                  ? tab.key === "industrial" ? "bg-brand-100 text-brand-700" : "bg-brand-100 text-brand-700"
                  : "bg-gray-200 text-gray-500"
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "industrial" ? (
          <IndustrialTab
            invitations={invitations}
            loading={loading}
            user={user}
            onInvited={handleInvited}
            showToast={showToast}
          />
        ) : (
          <UniversityTab
            invitations={invitations}
            loading={loading}
            user={user}
            onInvited={handleInvited}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}