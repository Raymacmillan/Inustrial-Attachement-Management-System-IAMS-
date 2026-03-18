import { Menu, User, Bell } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
  return (
    <nav className="h-20 bg-white border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-40 w-full">
      <button 
        onClick={onMenuClick}
        className="lg:hidden p-2 text-brand-900 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <Menu size={28} />
      </button>

      <div className="hidden lg:block font-bold text-brand-900">
        Industrial Attachment Portal
      </div>

      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
          <User size={20} />
        </div>
      </div>
    </nav>
  );
}