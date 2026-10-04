import React from 'react';
import { useCloudWatch } from '../../context/CloudWatchContext';
import { Bell, CheckCircle, AlertCircle, Zap, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useCloudWatch();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let icon = <AlertCircle className="w-5 h-5 text-amber-400" />;
        let borderColor = 'border-amber-500/50';
        let bg = 'bg-slate-900';

        if (toast.type === 'ALARM') {
          icon = <Bell className="w-5 h-5 text-red-400 animate-bounce" />;
          borderColor = 'border-red-500';
          bg = 'bg-red-950/90';
        } else if (toast.type === 'OK') {
          icon = <CheckCircle className="w-5 h-5 text-emerald-400" />;
          borderColor = 'border-emerald-500';
          bg = 'bg-slate-900/95';
        } else if (toast.type === 'CHAOS') {
          icon = <Zap className="w-5 h-5 text-amber-400 animate-pulse" />;
          borderColor = 'border-amber-500';
          bg = 'bg-slate-900/95';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start p-3.5 rounded-lg border ${borderColor} ${bg} shadow-2xl transition transform translate-y-0 text-xs text-white backdrop-blur-md`}
          >
            <div className="mr-3 mt-0.5 flex-shrink-0">{icon}</div>
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white truncate">{toast.title}</span>
                <span className="text-[10px] text-slate-400 ml-2 font-mono">{toast.timestamp}</span>
              </div>
              <p className="text-slate-300 mt-0.5 text-[11px] leading-relaxed line-clamp-3">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
