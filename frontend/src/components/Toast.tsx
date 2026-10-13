import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  duration = 3500
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgStyles =
    type === 'success'
      ? 'bg-[#13201a] text-white border-[#dceb6b]'
      : type === 'warning'
      ? 'bg-[#fff7ed] text-[#9a3412] border-[#ea580c]'
      : 'bg-[#173f35] text-white border-[#7ea56a]';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border-2 backdrop-blur-md max-w-md">
      {type === 'success' && <CheckCircle2 className="size-5 text-[#dceb6b] shrink-0" />}
      {type === 'warning' && <AlertCircle className="size-5 text-[#ea580c] shrink-0" />}
      {type === 'info' && <Info className="size-5 text-[#7ea56a] shrink-0" />}

      <p className="text-xs sm:text-sm font-semibold">{message}</p>

      <button
        onClick={onClose}
        className="ml-auto opacity-70 hover:opacity-100 text-sm cursor-pointer p-1"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};

export default Toast;
