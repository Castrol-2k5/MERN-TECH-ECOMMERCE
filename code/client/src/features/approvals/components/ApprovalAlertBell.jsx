import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import approvalService from '../services/approvalService.js';
import usePosAudio from '../../pos/hooks/usePosAudio.js';

const POLL_MS = 15000;

const formatVnd = (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫`;

const TYPE_LABEL = {
  HIGH_VALUE_RETURN: 'Hoàn tiền lớn',
  LARGE_CASH_OUT: 'Phiếu chi lớn',
  VOID_POS_ORDER: 'Hủy đơn POS'
};

export const ApprovalAlertBell = () => {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth?.user);
  const { playSuccessBeep } = usePosAudio();

  const isManagerOrAdmin = ['BRANCH_MANAGER', 'SUPER_ADMIN'].includes(authUser?.role);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewPulse, setHasNewPulse] = useState(false);
  const [state, setState] = useState({ pendingCount: 0, alerts: [] });

  const containerRef = useRef(null);
  const prevCountRef = useRef(null);

  const syncAlerts = useCallback(async () => {
    if (!isManagerOrAdmin) return;
    try {
      const data = await approvalService.getAlerts();
      const nextCount = Number(data?.pendingCount || 0);
      if (prevCountRef.current !== null && nextCount > prevCountRef.current) {
        setHasNewPulse(true);
        playSuccessBeep();
        setTimeout(() => setHasNewPulse(false), 6000);
      }
      prevCountRef.current = nextCount;
      setState({
        pendingCount: nextCount,
        alerts: Array.isArray(data?.alerts) ? data.alerts : []
      });
    } catch {
      // Im lặng khi poll nền tạm lỗi
    }
  }, [isManagerOrAdmin, playSuccessBeep]);

  useEffect(() => {
    if (!isManagerOrAdmin) return undefined;
    let active = true;
    const run = async () => {
      if (!active) return;
      await syncAlerts();
    };
    run();

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncAlerts();
      }
    }, POLL_MS);

    const handleVis = () => {
      if (document.visibilityState === 'visible') {
        syncAlerts();
      }
    };
    document.addEventListener('visibilitychange', handleVis);

    return () => {
      active = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, [isManagerOrAdmin, syncAlerts]);

  useEffect(() => {
    const onOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  if (!isManagerOrAdmin) return null;

  const handleManualRefresh = async () => {
    setIsLoading(true);
    try {
      await syncAlerts();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((v) => !v);
          setHasNewPulse(false);
        }}
        title="Yêu cầu Phê duyệt Đặc quyền từ Thu ngân"
        className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
          state.pendingCount > 0
            ? 'text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40'
            : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent'
        } ${hasNewPulse ? 'animate-bounce' : ''}`}
      >
        <ShieldCheck className="w-4 h-4" />
        {state.pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-black ring-2 ring-slate-900">
            {state.pendingCount > 99 ? '99+' : state.pendingCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-100">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                Chờ Phê Duyệt Đặc Quyền ({state.pendingCount})
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hoàn tiền lớn • Phiếu chi lớn • Hủy đơn POS
              </p>
            </div>
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80">
            {state.alerts.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-slate-500">
                Không có yêu cầu đặc quyền nào đang chờ duyệt.
              </div>
            ) : (
              state.alerts.map((req) => (
                <button
                  key={req._id}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/portal/manager/approvals');
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-800/70 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-rose-300">{req.requestCode}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {TYPE_LABEL[req.type] || req.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 truncate">{req.reason}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{req.requestedBy?.fullName || 'Thu ngân'}</span>
                    <span className="font-mono font-bold text-emerald-400">{formatVnd(req.estimatedAmount)}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/portal/manager/approvals');
              }}
              className="w-full sm:w-auto px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Mở Hàng Đợi Phê Duyệt</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalAlertBell;
