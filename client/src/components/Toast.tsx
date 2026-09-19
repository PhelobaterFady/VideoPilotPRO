import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, Zap, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'speed';
  message: string;
  title?: string;
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-12 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getTheme = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: CheckCircle2,
          iconColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/30',
          bgColor: 'bg-zinc-950/90'
        };
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: 'text-rose-400',
          borderColor: 'border-rose-500/30',
          bgColor: 'bg-zinc-950/90'
        };
      case 'speed':
        return {
          icon: Zap,
          iconColor: 'text-cyan-400',
          borderColor: 'border-cyan-500/30',
          bgColor: 'bg-zinc-950/90'
        };
      default:
        return {
          icon: Info,
          iconColor: 'text-sky-400',
          borderColor: 'border-sky-500/30',
          bgColor: 'bg-zinc-950/90'
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  return (
    <div
      className={`pointer-events-auto toast-animate flex items-start gap-3 p-3.5 rounded-2xl border ${theme.borderColor} ${theme.bgColor} shadow-2xl backdrop-blur-xl transition-all`}
    >
      <div className={`p-1.5 rounded-xl bg-white/5 ${theme.iconColor} flex-shrink-0 mt-0.5`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 text-xs">
        {toast.title && <h5 className="font-bold text-white mb-0.5">{toast.title}</h5>}
        <p className="text-zinc-300 leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
