import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { ToastType } from '@/types';

function ToastItem({ toast }: { toast: { id: string; type: ToastType; message: string } }) {
  const hideToast = useAppStore((s) => s.hideToast);

  const icons: Record<ToastType, any> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors: Record<ToastType, string> = {
    success: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
    error: 'bg-red-500/20 border-red-500/50 text-red-400',
    warning: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    info: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',
  };

  const Icon = icons[toast.type];
  const colorClass = colors[toast.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm animate-[slideIn_0.3s_ease-out] ${colorClass}`}
    >
      <Icon size={18} className="flex-shrink-0" />
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button
        onClick={() => hideToast(toast.id)}
        className="p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
