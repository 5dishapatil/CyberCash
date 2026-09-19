'use client';
import { useNotificationStore } from '../store/notifications';
import { X, AlertTriangle, Info, CheckCircle, AlertOctagon } from 'lucide-react';

export default function NotificationOverlay() {
  const { toasts, removeToast } = useNotificationStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map(toast => {
        const Icon = toast.type === 'error' ? AlertOctagon : 
                     toast.type === 'warning' ? AlertTriangle : 
                     toast.type === 'success' ? CheckCircle : Info;
                     
        const colorClass = toast.type === 'error' ? 'bg-rose-950 border-rose-500/50 text-rose-400' : 
                           toast.type === 'warning' ? 'bg-amber-950 border-amber-500/50 text-amber-400' : 
                           toast.type === 'success' ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400' : 
                           'bg-slate-800 border-slate-600 text-slate-200';

        return (
          <div key={toast.id} className={`flex items-start gap-3 p-4 rounded-lg border shadow-xl w-80 animate-in slide-in-from-right-8 ${colorClass}`}>
            <Icon size={20} className="shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
