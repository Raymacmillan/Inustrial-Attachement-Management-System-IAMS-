import { AlertTriangle, X } from "lucide-react";
import Button from "./Button";

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText  = "Cancel",
  type = "danger" // 'danger' or 'warning'
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 md:p-8 space-y-6">
          
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-2xl ${type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
              <AlertTriangle size={24} />
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-display font-bold text-brand-900">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              variant="ghost" 
              fullWidth 
              onClick={onClose}
              className="order-2 sm:order-1"
            >
              {cancelText}
            </Button>
            <Button 
              variant={type === 'danger' ? 'primary' : 'secondary'} 
              fullWidth 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`order-1 sm:order-2 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 border-red-600 shadow-red-100' : ''}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}