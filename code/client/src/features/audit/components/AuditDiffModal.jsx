import { useEffect } from 'react';
import { X, ShieldAlert, ArrowRight, User, Globe, FileText, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

export const AuditDiffModal = ({ isOpen, onClose, log }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !log) return null;

  const { actor, action, severity, target, changes, context, status, timestamp, errorMessage } = log;
  const before = changes?.before || null;
  const after = changes?.after || null;
  const diff = changes?.diff || null;

  const getSeverityBadge = () => {
    if (severity === 'CRITICAL') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Nghiêm trọng (CRITICAL)</span>
        </span>
      );
    }
    if (severity === 'WARNING') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Cảnh báo (WARNING)</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Thông tin (INFO)</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white font-mono">{action}</h3>
                {getSeverityBadge()}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {new Date(timestamp).toLocaleString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Actor Info */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Nhân sự thực hiện (Actor)</span>
              </div>
              <div className="font-bold text-slate-100 text-sm">{actor?.fullName || 'Hệ thống'}</div>
              <div className="text-slate-400 font-mono text-[11px]">{actor?.email || 'N/A'}</div>
              <div className="flex items-center gap-2 pt-1 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold">
                  {actor?.role || 'SYSTEM'}
                </span>
                {actor?.branchCode && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-950 border border-blue-800 text-blue-300 font-mono">
                    {actor?.branchCode}
                  </span>
                )}
              </div>
            </div>

            {/* Target & Context */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Đối tượng tác động & Thiết bị</span>
              </div>
              <div className="font-bold text-slate-100 truncate">
                {target?.name || target?.code || target?.model}
              </div>
              <div className="text-slate-400 font-mono text-[11px]">
                Model: <strong className="text-slate-200">{target?.model}</strong> • Code: <strong className="text-cyan-300">{target?.code || '—'}</strong>
              </div>
              <div className="text-slate-400 text-[11px] pt-1 truncate">
                IP: <strong className="text-slate-300 font-mono">{context?.ipAddress || '127.0.0.1'}</strong>
                {context?.userAgent && ` • ${context.userAgent}`}
              </div>
            </div>
          </div>

          {/* Reason & Notes */}
          {(context?.reason || context?.notes || errorMessage) && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Giải trình / Lý do & Ghi chú</span>
              </div>
              {context?.reason && (
                <p className="text-slate-200 font-medium">
                  <strong>Lý do:</strong> {context.reason}
                </p>
              )}
              {context?.notes && (
                <p className="text-slate-400">
                  <strong>Ghi chú:</strong> {context.notes}
                </p>
              )}
              {errorMessage && (
                <p className="text-rose-400 font-mono">
                  <strong>Lỗi:</strong> {errorMessage}
                </p>
              )}
            </div>
          )}

          {/* Snapshot Diff Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>So sánh biến động dữ liệu (Snapshot Diff Before vs After)</span>
            </h4>

            {diff || before || after ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Before */}
                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-rose-300 uppercase">
                    <span>Trước khi thay đổi (Before)</span>
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  </div>
                  <pre className="font-mono text-[11px] text-rose-200 whitespace-pre-wrap overflow-x-auto bg-slate-950/60 p-3 rounded-xl border border-rose-500/20 max-h-48">
                    {before ? JSON.stringify(before, null, 2) : '(Không có trạng thái trước)'}
                  </pre>
                </div>

                {/* After */}
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300 uppercase">
                    <span>Sau khi thay đổi (After)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <pre className="font-mono text-[11px] text-emerald-200 whitespace-pre-wrap overflow-x-auto bg-slate-950/60 p-3 rounded-xl border border-emerald-500/20 max-h-48">
                    {after ? JSON.stringify(after, null, 2) : '(Không có trạng thái sau)'}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
                Không ghi nhận thay đổi diff trường dữ liệu
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Audit ID: <strong className="font-mono text-slate-400">{log._id}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditDiffModal;
