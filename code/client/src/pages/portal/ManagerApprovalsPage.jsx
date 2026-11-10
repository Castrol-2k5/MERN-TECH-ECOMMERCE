import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  Banknote,
  RotateCcw,
  Ban,
  User
} from 'lucide-react';
import approvalService from '../../features/approvals/services/approvalService.js';

const formatVND = (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫`;

const TYPE_META = {
  HIGH_VALUE_RETURN: {
    label: 'Hoàn tiền giá trị lớn (> 5tr)',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: RotateCcw
  },
  LARGE_CASH_OUT: {
    label: 'Phiếu chi két lớn (> 1tr)',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: Banknote
  },
  VOID_POS_ORDER: {
    label: 'Hủy hóa đơn POS đã hoàn tất',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    icon: Ban
  }
};

const STATUS_META = {
  PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  APPROVED: { label: 'Đã duyệt', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  REJECTED: { label: 'Từ chối', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30' }
};

export const ManagerApprovalsPage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const canReview = ['BRANCH_MANAGER', 'SUPER_ADMIN'].includes(authUser?.role);

  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [requests, setRequests] = useState([]);
  const [actionId, setActionId] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [toast, setToast] = useState(null);

  const requestKey = `${statusFilter}:${refreshTick}`;
  const loading = loadedKey !== requestKey;

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let cancelled = false;
    approvalService
      .getRequests({ status: statusFilter, limit: 50 })
      .then((data) => {
        if (!cancelled) {
          setRequests(data?.requests || []);
          setLoadedKey(requestKey);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setToast({
            type: 'error',
            message: err?.response?.data?.message || err?.message || 'Không thể tải danh sách phê duyệt.'
          });
          setLoadedKey(requestKey);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [statusFilter, requestKey]);

  const handleApprove = async (reqItem) => {
    setActionId(reqItem._id);
    try {
      await approvalService.approveRequest(reqItem._id, 'Quản lý chi nhánh đã phê duyệt');
      showToast('success', `Đã duyệt yêu cầu ${reqItem.requestCode} và tự động thực thi nghiệp vụ!`);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      showToast('error', err?.response?.data?.message || err?.message || 'Lỗi khi phê duyệt yêu cầu.');
    } finally {
      setActionId('');
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectTarget) return;
    setActionId(rejectTarget._id);
    try {
      await approvalService.rejectRequest(
        rejectTarget._id,
        reviewNote.trim() || 'Quản lý chi nhánh từ chối phê duyệt'
      );
      showToast('success', `Đã từ chối yêu cầu ${rejectTarget.requestCode}.`);
      setRejectTarget(null);
      setReviewNote('');
      setRefreshTick((t) => t + 1);
    } catch (err) {
      showToast('error', err?.response?.data?.message || err?.message || 'Không thể từ chối yêu cầu.');
    } finally {
      setActionId('');
    }
  };

  return (
    <div className="space-y-5 font-sans text-slate-100 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Kiểm Soát Đặc Quyền • UC-BM-04</span>
          </div>
          <h1 className="text-xl font-black text-white">
            {canReview ? 'Phê Duyệt Đặc Quyền Chi Nhánh' : 'Yêu Cầu Phê Duyệt Đã Gửi'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {canReview
              ? 'Giao diện tối ưu cho điện thoại: Bấm 1 chạm để Duyệt hoặc Từ chối hoàn tiền lớn, phiếu chi lớn & hủy đơn POS'
              : 'Theo dõi trạng thái các yêu cầu vượt ngưỡng bạn đã gửi lên Quản lý chi nhánh'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshTick((t) => t + 1)}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
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

      {/* Status Tabs */}
      <div className="grid grid-cols-4 sm:inline-flex bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1 w-full sm:w-auto">
        {[
          { id: 'PENDING', label: 'Chờ duyệt' },
          { id: 'APPROVED', label: 'Đã duyệt' },
          { id: 'REJECTED', label: 'Từ chối' },
          { id: 'ALL', label: 'Tất cả' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === tab.id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile-First Cards List */}
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-500">
            {loading ? 'Đang tải danh sách yêu cầu...' : 'Không có yêu cầu phê duyệt nào trong mục này.'}
          </div>
        ) : (
          requests.map((reqItem) => {
            const typeMeta = TYPE_META[reqItem.type] || TYPE_META.VOID_POS_ORDER;
            const statusMeta = STATUS_META[reqItem.status] || STATUS_META.PENDING;
            const TypeIcon = typeMeta.icon;
            const isBusy = actionId === reqItem._id;

            return (
              <div
                key={reqItem._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black text-cyan-400">
                      {reqItem.requestCode}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${typeMeta.badgeClass}`}>
                      <TypeIcon className="w-3 h-3" />
                      {typeMeta.label}
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusMeta.cls}`}>
                    {statusMeta.label}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                  <div className="space-y-0.5 text-xs">
                    <p className="text-slate-400">
                      Chứng từ mục tiêu:{' '}
                      <strong className="font-mono text-white">{reqItem.targetCode}</strong>
                    </p>
                    <p className="text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>Người gửi: {reqItem.requestedBy?.fullName || 'Thu ngân'}</span>
                      <span className="text-slate-600">•</span>
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="font-mono text-[11px]">
                        {reqItem.createdAt ? new Date(reqItem.createdAt).toLocaleString('vi-VN') : ''}
                      </span>
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[10px] uppercase text-slate-500 block font-semibold">Giá trị tác động</span>
                    <span className="text-lg font-black font-mono text-rose-400">
                      {formatVND(reqItem.estimatedAmount)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-200">
                  <span className="text-slate-400 font-semibold">Lý do từ quầy: </span>
                  <span>{reqItem.reason}</span>
                </div>

                {reqItem.status !== 'PENDING' && (
                  <div className="text-[11px] text-slate-400 bg-slate-950/50 rounded-xl px-3 py-2 border border-slate-800/60">
                    Người duyệt: <strong className="text-slate-200">{reqItem.reviewedBy?.fullName || 'Quản lý'}</strong>
                    {reqItem.reviewNote ? ` • Ghi chú: "${reqItem.reviewNote}"` : ''}
                  </div>
                )}

                {canReview && reqItem.status === 'PENDING' && (
                  <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        setRejectTarget(reqItem);
                        setReviewNote('');
                      }}
                      className="py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Từ chối</span>
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleApprove(reqItem)}
                      className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isBusy ? 'Đang xử lý...' : 'Duyệt & Thực thi'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              Từ chối yêu cầu {rejectTarget.requestCode}
            </h3>
            <form onSubmit={handleConfirmReject} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Lý do từ chối gửi lại cho thu ngân:</label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="VD: Chưa đủ chứng từ / Cần kiểm tra lại Serial..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={Boolean(actionId)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Xác nhận Từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerApprovalsPage;
