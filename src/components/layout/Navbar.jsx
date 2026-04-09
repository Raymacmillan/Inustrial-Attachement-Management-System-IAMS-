import { Menu } from 'lucide-react';
import { useAvatar } from "../../context/AvatarContext";

export default function Navbar({ onMenuClick }) {
  const { avatarUrl, initials } = useAvatar() || {};

  return (
    <nav className="h-20 bg-white border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-40 w-full shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-brand-900 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <Menu size={28} />
      </button>

      <div className="hidden lg:block font-bold text-brand-900 uppercase text-[11px] tracking-widest">
        Industrial Attachment Portal
      </div>

      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-brand-50 bg-brand-100 overflow-hidden flex items-center justify-center shadow-sm shrink-0">
          {avatarUrl ? (
            <img
              key={avatarUrl}
              src={avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-black text-brand-600 uppercase">
              {initials}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}