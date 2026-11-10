import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Calendar,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  ArrowLeftRight,
  Trash2,
  RefreshCw
} from 'lucide-react';
import rosterService from '../../features/roster/services/rosterService.js';
import { userService } from '../../features/users/services/userService.js';

const SHIFT_LABEL = {
  MORNING: { name: 'Ca Sáng', hours: '08:00 - 14:00', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  AFTERNOON: { name: 'Ca Chiều', hours: '14:00 - 22:00', badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  SPLIT: { name: 'Ca Gãy', hours: '10:00 - 20:00', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' }
};

const ATT_META = {
  SCHEDULED: { label: 'Đã xếp lịch', cls: 'bg-slate-800 text-slate-300' },
  CHECKED_IN: { label: 'Đang trực', cls: 'bg-emerald-500/20 text-emerald-300' },
  LATE: { label: 'Đi muộn', cls: 'bg-amber-500/20 text-amber-300' },
  COMPLETED: { label: 'Hoàn tất', cls: 'bg-blue-500/20 text-blue-300' }
};

function getMondayOfWeek(offsetWeeks = 0) {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon + offsetWeeks * 7);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function toYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const BranchRosterPage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const myUserId = authUser?._id || authUser?.id || '';
  const isManagerOrAdmin = ['BRANCH_MANAGER', 'SUPER_ADMIN'].includes(authUser?.role);
  const myBranchId =
    typeof authUser?.branchId === 'object' ? authUser?.branchId?._id || '' : authUser?.branchId || '';

  const [weekOffset, setWeekOffset] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [toast, setToast] = useState(null);

  // Assign form state
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignDate, setAssignDate] = useState(() => toYmd(new Date()));
  const [assignShiftType, setAssignShiftType] = useState('MORNING');

  // Swap modal state
  const [swapTargetShift, setSwapTargetShift] = useState(null);
  const [swapNote, setSwapNote] = useState('');
  const [swapReplacementId, setSwapReplacementId] = useState('');

  const [busy, setBusy] = useState(false);

  const weekDays = useMemo(() => {
    const mon = getMondayOfWeek(weekOffset);
    const labels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    return labels.map((lbl, idx) => {
      const dt = new Date(mon);
      dt.setDate(mon.getDate() + idx);
      return {
        label: lbl,
        dateStr: toYmd(dt),
        displayDate: `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`
      };
    });
  }, [weekOffset]);

  const startDate = weekDays[0].dateStr;
  const endDate = weekDays[6].dateStr;
  const requestKey = `${startDate}:${endDate}:${refreshTick}`;
  const isLoading = loadedKey !== requestKey;

  const notify = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!isManagerOrAdmin) return undefined;
    let active = true;
    userService
      .getUsers(myBranchId ? { branchId: myBranchId, limit: 100 } : { limit: 100 })
      .then((list) => {
        if (!active) return;
        const staffOnly = (list || []).filter((u) => ['STAFF', 'BRANCH_MANAGER'].includes(u.role) && u.isActive);
        setStaffList(staffOnly);
        if (staffOnly[0]) {
          setAssignStaffId((prev) => prev || staffOnly[0]._id);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isManagerOrAdmin, myBranchId]);

  useEffect(() => {
    let cancelled = false;
    rosterService
      .getWeeklyRoster({ startDate, endDate })
      .then((list) => {
        if (!cancelled) {
          setSchedules(list);
          setLoadedKey(requestKey);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setToast({
            type: 'error',
            message: err?.response?.data?.message || err?.message || 'Lỗi tải lịch phân ca.'
          });
          setLoadedKey(requestKey);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, requestKey]);

  const handleAssignShift = async (e) => {
    e.preventDefault();
    if (!assignStaffId) return;
    setBusy(true);
    try {
      await rosterService.assignShift({
        staffId: assignStaffId,
        dateStr: assignDate,
        shiftType: assignShiftType
      });
      notify('success', 'Đã xếp ca làm việc thành công.');
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Không thể xếp ca.');
    } finally {
      setBusy(false);
    }
  };

  const handleCheckIn = async (id) => {
    setBusy(true);
    try {
      await rosterService.checkInShift(id);
      notify('success', 'Check-in vào ca thành công!');
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Lỗi Check-in.');
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async (id) => {
    setBusy(true);
    try {
      await rosterService.checkOutShift(id);
      notify('success', 'Check-out kết ca thành công!');
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Lỗi Check-out.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitSwap = async (e) => {
    e.preventDefault();
    if (!swapTargetShift) return;
    setBusy(true);
    try {
      await rosterService.requestSwap(swapTargetShift._id, {
        requestedNote: swapNote.trim(),
        targetStaffId: swapReplacementId || null
      });
      setSwapTargetShift(null);
      setSwapNote('');
      setSwapReplacementId('');
      notify('success', 'Đã gửi yêu cầu đổi ca tới Quản lý.');
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Không thể gửi đổi ca.');
    } finally {
      setBusy(false);
    }
  };

  const handleReviewSwap = async (id, decision) => {
    setBusy(true);
    try {
      await rosterService.reviewSwap(id, { decision });
      notify('success', decision === 'APPROVED' ? 'Đã duyệt yêu cầu đổi ca.' : 'Đã từ chối đổi ca.');
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Lỗi duyệt đổi ca.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveShift = async (id) => {
    setBusy(true);
    try {
      await rosterService.removeShift(id);
      notify('success', 'Đã xóa ca trực.');
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Không thể xóa ca.');
    } finally {
      setBusy(false);
    }
  };

  const pendingSwaps = schedules.filter((s) => s.swapRequest?.status === 'PENDING');

  return (
    <div className="space-y-5 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span>Phân Ca &amp; Chấm Công Gọn Nhẹ • UC-BM-09</span>
          </div>
          <h1 className="text-xl font-black text-white">
            Lịch Phân Ca Tuần &amp; Chấm Công Check-in / Out
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Từ {weekDays[0].displayDate} đến {weekDays[6].displayDate} ({startDate} → {endDate})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-white cursor-pointer"
          >
            Tuần này
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setRefreshTick((t) => t + 1)}
            disabled={isLoading}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {toast && (
        <div
          className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Manager Quick Assign Bar */}
      {isManagerOrAdmin && (
        <form
          onSubmit={handleAssignShift}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Nhân viên:</label>
            <select
              value={assignStaffId}
              onChange={(e) => setAssignStaffId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            >
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Ngày trực:</label>
            <input
              type="date"
              required
              value={assignDate}
              onChange={(e) => setAssignDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Khung ca:</label>
            <select
              value={assignShiftType}
              onChange={(e) => setAssignShiftType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            >
              <option value="MORNING">Ca Sáng (08:00 - 14:00)</option>
              <option value="AFTERNOON">Ca Chiều (14:00 - 22:00)</option>
              <option value="SPLIT">Ca Gãy (10:00 - 20:00)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={busy || !assignStaffId}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Xếp Ca Làm Việc</span>
          </button>
        </form>
      )}

      {/* Pending Swap Requests */}
      {isManagerOrAdmin && pendingSwaps.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <ArrowLeftRight className="w-4 h-4" />
            Yêu cầu đổi ca / xin phép chờ duyệt ({pendingSwaps.length})
          </p>
          <div className="space-y-2">
            {pendingSwaps.map((sw) => (
              <div
                key={sw._id}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-white">{sw.staffId?.fullName}</span>
                  <span className="text-slate-400">
                    {' '}• {sw.dateStr} ({SHIFT_LABEL[sw.shiftType]?.name})
                  </span>
                  <p className="text-slate-300 mt-0.5">
                    Lý do: {sw.swapRequest?.requestedNote}
                    {sw.swapRequest?.targetStaffId?.fullName &&
                      ` → Đổi cho: ${sw.swapRequest.targetStaffId.fullName}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleReviewSwap(sw._id, 'APPROVED')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                  >
                    Duyệt
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleReviewSwap(sw._id, 'REJECTED')}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 font-bold cursor-pointer"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dayShifts = schedules.filter((s) => s.dateStr === day.dateStr);
          const isToday = day.dateStr === toYmd(new Date());

          return (
            <div
              key={day.dateStr}
              className={`bg-slate-900 border rounded-2xl p-3 flex flex-col gap-2.5 min-h-[200px] ${
                isToday ? 'border-cyan-500/60 shadow-lg shadow-cyan-500/10' : 'border-slate-800'
              }`}
            >
              <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                <span className={`text-xs font-black ${isToday ? 'text-cyan-400' : 'text-white'}`}>
                  {day.label}
                </span>
                <span className="font-mono text-[11px] text-slate-400">{day.displayDate}</span>
              </div>

              <div className="space-y-2 flex-1">
                {dayShifts.map((sh) => {
                  const sMeta = SHIFT_LABEL[sh.shiftType] || SHIFT_LABEL.MORNING;
                  const attMeta = ATT_META[sh.attendanceStatus] || ATT_META.SCHEDULED;
                  const isMine = String(sh.staffId?._id || sh.staffId) === String(myUserId);

                  return (
                    <div
                      key={sh._id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${sMeta.badge}`}>
                          {sMeta.name}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${attMeta.cls}`}>
                          {attMeta.label}
                        </span>
                      </div>

                      <p className="font-bold text-slate-100 truncate">{sh.staffId?.fullName || 'Nhân viên'}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {sMeta.hours}
                      </p>

                      {sh.swapRequest?.status === 'PENDING' && (
                        <span className="block text-[10px] text-amber-300 font-semibold">
                          Đang chờ duyệt đổi ca
                        </span>
                      )}

                      <div className="flex flex-wrap gap-1 pt-1">
                        {(isMine || isManagerOrAdmin) && sh.attendanceStatus === 'SCHEDULED' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleCheckIn(sh._id)}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <LogIn className="w-3 h-3" />
                            Check-in
                          </button>
                        )}
                        {(isMine || isManagerOrAdmin) &&
                          ['CHECKED_IN', 'LATE'].includes(sh.attendanceStatus) && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleCheckOut(sh._id)}
                              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <LogOut className="w-3 h-3" />
                              Check-out
                            </button>
                          )}
                        {isMine && sh.attendanceStatus === 'SCHEDULED' && sh.swapRequest?.status !== 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSwapTargetShift(sh);
                              setSwapNote('');
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold cursor-pointer"
                          >
                            Đổi ca
                          </button>
                        )}
                        {isManagerOrAdmin && sh.attendanceStatus === 'SCHEDULED' && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleRemoveShift(sh._id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 cursor-pointer ml-auto"
                            title="Xóa lịch ca"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {dayShifts.length === 0 && (
                  <p className="text-[11px] text-slate-600 text-center py-6">Trống</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Swap Request Modal */}
      {swapTargetShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">
              Xin đổi ca ngày {swapTargetShift.dateStr} ({SHIFT_LABEL[swapTargetShift.shiftType]?.name})
            </h3>
            <form onSubmit={handleSubmitSwap} className="space-y-3 text-xs">
              <textarea
                rows={3}
                required
                minLength={2}
                value={swapNote}
                onChange={(e) => setSwapNote(e.target.value)}
                placeholder="Nhập lý do xin đổi ca hoặc xin đi muộn..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
              />
              {staffList.length > 0 && (
                <select
                  value={swapReplacementId}
                  onChange={(e) => setSwapReplacementId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">-- Chọn đồng nghiệp trực thay (tùy chọn) --</option>
                  {staffList
                    .filter((s) => s._id !== myUserId)
                    .map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.fullName}
                      </option>
                    ))}
                </select>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSwapTargetShift(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Gửi Yêu Cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchRosterPage;
