import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const TOAST_STYLES = {
  success: {
    bg: 'bg-slate-900/95 border-emerald-500/50 text-white shadow-emerald-950/50',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    bar: 'bg-emerald-500'
  },
  error: {
    bg: 'bg-slate-900/95 border-rose-500/50 text-white shadow-rose-950/50',
    icon: AlertCircle,
    iconColor: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    bar: 'bg-rose-500'
  },
  warning: {
    bg: 'bg-slate-900/95 border-amber-500/50 text-white shadow-amber-950/50',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    bar: 'bg-amber-500'
  },
  info: {
    bg: 'bg-slate-900/95 border-blue-500/50 text-white shadow-blue-950/50',
    icon: Info,
    iconColor: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    bar: 'bg-blue-500'
  }
};

export const Toast = ({
  toast,
  onClose,
  duration = 4000
}) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onClose, duration]);

  if (!toast) return null;

  const type = toast.type || 'info';
  const style = TOAST_STYLES[type] || TOAST_STYLES.info;
  const Icon = style.icon;

  return (
    <div className="fixed top-6 right-6 z-[99999] max-w-md w-[calc(100vw-3rem)] animate-in slide-in-from-top-4 fade-in duration-300">
      <div
        className={`relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-md ${style.bg}`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50 shrink-0">
            <Icon className={`w-5 h-5 ${style.iconColor}`} />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.badge}`}
              >
                {type === 'success'
                  ? 'Thành công'
                  : type === 'error'
                  ? 'Thông báo lỗi'
                  : type === 'warning'
                  ? 'Cảnh báo'
                  : 'Hệ thống'}
              </span>
              {toast.title && (
                <span className="font-bold text-xs truncate text-white">{toast.title}</span>
              )}
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium break-words">
              {toast.message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar Animation */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
          <div
            className={`h-full ${style.bar} animate-[width_4s_linear]`}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default Toast;
