import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  PackageCheck,
  RefreshCw,
  Volume2,
  VolumeX,
  ArrowRight,
  Clock
} from 'lucide-react';
import { orderService } from '../services/orderService.js';
import usePosAudio from '../../pos/hooks/usePosAudio.js';

const POLL_INTERVAL_MS = 20000;

const formatVnd = (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫`;

export const OrderAlertBell = ({ branchId = '', compact = false }) => {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth?.user);
  const { playSuccessBeep } = usePosAudio();

  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewPulse, setHasNewPulse] = useState(false);
  const [alertState, setAlertState] = useState({
    pendingCount: 0,
    newCount: 0,
    processingCount: 0,
    alerts: []
  });

  const containerRef = useRef(null);
  const prevCountRef = useRef(null);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const syncAlerts = useCallback(async () => {
    if (!authUser) return;
    try {
      const data = await orderService.getBranchAlerts(branchId ? { branchId } : {});
      const nextCount = Number(data?.pendingCount || 0);

      if (prevCountRef.current !== null && nextCount > prevCountRef.current) {
        setHasNewPulse(true);
        if (soundEnabledRef.current) {
          playSuccessBeep();
        }
        setTimeout(() => setHasNewPulse(false), 6000);
      }
      prevCountRef.current = nextCount;

      setAlertState({
        pendingCount: nextCount,
        newCount: Number(data?.newCount || 0),
        processingCount: Number(data?.processingCount || 0),
        alerts: Array.isArray(data?.alerts) ? data.alerts : []
      });
    } catch {
      // Im lặng khi poll nền thất bại tạm thời
    }
  }, [authUser, branchId, playSuccessBeep]);

  const handleManualRefresh = async () => {
    setIsLoading(true);
    try {
      await syncAlerts();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
    }, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncAlerts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [syncAlerts]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const targetRoute =
    authUser?.role === 'SUPER_ADMIN'
      ? '/portal/admin/orders-dispatch'
      : '/portal/branch/orders';

  const handleGoToOrders = () => {
    setIsOpen(false);
    setHasNewPulse(false);
    navigate(targetRoute);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setHasNewPulse(false);
        }}
        title="Thông báo đơn Online / Click & Collect cần xử lý"
        className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
          alertState.pendingCount > 0
            ? 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
            : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent'
        } ${hasNewPulse ? 'animate-bounce' : ''}`}
      >
        <Bell className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
        {alertState.pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-black ring-2 ring-slate-900">
            {alertState.pendingCount > 99 ? '99+' : alertState.pendingCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-100">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-amber-400" />
                Đơn Online Chờ Xử Lý
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {alertState.newCount} đơn mới • {alertState.processingCount} đang đóng gói
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSoundEnabled((v) => !v)}
                title={soundEnabled ? 'Tắt chuông báo đơn mới' : 'Bật chuông báo đơn mới'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isLoading}
                title="Làm mới ngay"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Alerts list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80">
            {alertState.alerts.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-slate-500">
                Hiện không có đơn Online mới nào đang chờ đóng gói tại chi nhánh.
              </div>
            ) : (
              alertState.alerts.map((ord) => {
                const firstItem = ord.items?.[0]?.productName || 'Thiết bị công nghệ';
                const extraCount = (ord.items?.length || 0) - 1;
                const customerName = ord.customerInfo?.fullName || 'Khách Online';
                const isPending = ord.orderStatus === 'PENDING';

                return (
                  <button
                    key={ord._id || ord.orderCode}
                    type="button"
                    onClick={handleGoToOrders}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-800/70 transition-colors cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {ord.orderCode}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isPending
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {isPending ? 'Mới đặt' : 'Đang đóng gói'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 truncate">
                      {firstItem}{extraCount > 0 ? ` (+${extraCount} SP)` : ''}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate">{customerName}</span>
                      <span className="font-mono font-semibold text-emerald-400 shrink-0">
                        {formatVnd(ord.totalAmount)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Tự cập nhật mỗi 20 giây
            </span>
            <button
              type="button"
              onClick={handleGoToOrders}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Đi tới xử lý / Đóng gói</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderAlertBell;
