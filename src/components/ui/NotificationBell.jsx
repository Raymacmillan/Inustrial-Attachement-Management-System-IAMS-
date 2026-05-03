/**
 * NotificationBell — pure display component.
 * Receives notifications and onMarkRead callback from StudentLayout.
 * No Supabase queries — single source of truth in studentService.
 */

import { useState, useRef, useEffect } from "react";
import { Bell, X, Calendar, AlertTriangle, Check } from "lucide-react";

export default function NotificationBell({ notifications = [], onMarkRead }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const count = notifications.length;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>

      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl text-gray-400 hover:bg-gray-100
          hover:text-brand-900 transition-colors cursor-pointer"
        aria-label={`${count} notification${count !== 1 ? "s" : ""}`}
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]
            bg-red-500 text-white text-[10px] font-black rounded-full
            flex items-center justify-center px-1 leading-none
            animate-in zoom-in-75 duration-200">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50
          w-[calc(100vw-2rem)] sm:w-80
          bg-white rounded-2xl shadow-2xl border border-gray-100
          animate-in slide-in-from-top-2 duration-200 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
            border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-black text-brand-900 uppercase tracking-widest">
              Notifications
            </p>
            <div className="flex items-center gap-2">
              {count > 0 && onMarkRead && (
                <button
                  onClick={() => {
                    notifications.forEach((n) => onMarkRead(n.type, n.refId));
                    setOpen(false);
                  }}
                  className="text-[10px] font-black text-brand-600 hover:underline
                    uppercase tracking-wider cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-brand-900
                  hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          {count === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-500 mb-1">All caught up</p>
              <p className="text-xs text-gray-400 font-medium">
                No pending visits or logbook revisions
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {notifications.map((item, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3
                  hover:bg-gray-50 transition-colors group">
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5
                    ${item.type === "visit" ? "bg-brand-100" : "bg-red-100"}`}>
                    {item.type === "visit"
                      ? <Calendar size={14} className="text-brand-600" />
                      : <AlertTriangle size={14} className="text-red-500" />
                    }
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-brand-900 leading-tight">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>

                  {/* Mark read button — appears on hover */}
                  {onMarkRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkRead(item.type, item.refId);
                      }}
                      title="Mark as read"
                      className="shrink-0 opacity-0 group-hover:opacity-100
                        w-6 h-6 rounded-full bg-gray-100 hover:bg-green-100
                        flex items-center justify-center transition-all cursor-pointer mt-0.5"
                    >
                      <Check size={11} className="text-gray-400 hover:text-green-600" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-[10px] text-gray-400 font-medium text-center">
              View full details on your dashboard
            </p>
          </div>
        </div>
      )}
    </div>
  );
}