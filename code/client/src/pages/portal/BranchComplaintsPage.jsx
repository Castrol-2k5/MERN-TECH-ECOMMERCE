import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  AlertTriangle,
  Plus,
  CheckCircle2,
  RefreshCw,
  Wrench,
  Phone,
  User,
  MessageSquareWarning
} from 'lucide-react';
import complaintService from '../../features/complaints/services/complaintService.js';

const SEVERITY_META = {
  NORMAL: 'bg-slate-800 text-slate-300 border-slate-700',
  HIGH: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  CRITICAL: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
};

const STATUS_META = {
  OPEN: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  INVESTIGATING: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  RESOLVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  CLOSED: 'bg-slate-800 text-slate-400 border-slate-700'
};

export const BranchComplaintsPage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const isManagerOrAdmin = ['BRANCH_MANAGER', 'SUPER_ADMIN'].includes(authUser?.role);

  const [activeTab, setActiveTab] = useState('COMPLAINTS'); // 'COMPLAINTS' | 'WARRANTY'
  const [complaints, setComplaints] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [toast, setToast] = useState(null);

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [description, setDescription] = useState('');

  // Resolve Modal
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolveStatus, setResolveStatus] = useState('RESOLVED');
  const [resolutionNote, setResolutionNote] = useState('');
  const [compensationNote, setCompensationNote] = useState('');

  const [busy, setBusy] = useState(false);

  const requestKey = `${activeTab}:${refreshTick}`;
  const isLoading = loadedKey !== requestKey;

  const notify = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([complaintService.getComplaints(), complaintService.getWarrantyWatchlist()])
      .then(([cmpList, watchList]) => {
        if (!cancelled) {
          setComplaints(cmpList);
          setWatchlist(watchList);
          setLoadedKey(requestKey);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setToast({
            type: 'error',
            message: err?.response?.data?.message || err?.message || 'Lỗi tải dữ liệu khiếu nại.'
          });
          setLoadedKey(requestKey);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await complaintService.createComplaint({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        orderCode: orderCode.trim(),
        severity,
        description: description.trim()
      });
      setShowCreate(false);
      setCustomerName('');
      setCustomerPhone('');
      setOrderCode('');
      setDescription('');
      notify('success', `Đã tiếp nhận khiếu nại ${created?.complaintCode}`);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Không thể tạo phiếu khiếu nại.');
    } finally {
      setBusy(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveTarget) return;
    setBusy(true);
    try {
      await complaintService.updateComplaint(resolveTarget._id, {
        status: resolveStatus,
        resolutionNote: resolutionNote.trim(),
        compensationNote: compensationNote.trim()
      });
      setResolveTarget(null);
      setResolutionNote('');
      setCompensationNote('');
      notify('success', 'Đã cập nhật phương án xử lý khiếu nại.');
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Không thể cập nhật.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
            <MessageSquareWarning className="w-4 h-4" />
            <span>Xử Lý Khủng Hoảng &amp; Bảo Hành • UC-BM-08</span>
          </div>
          <h1 className="text-xl font-black text-white">
            Tiếp Nhận Khiếu Nại &amp; Theo Dõi Bảo Hành Chuỗi
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ghi nhận ca khiếu nại cần Quản lý giải quyết và danh sách phiếu bảo hành chờ báo giá / trễ hẹn
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo phiếu khiếu nại</span>
          </button>
          <button
            type="button"
            onClick={() => setRefreshTick((t) => t + 1)}
            disabled={isLoading}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
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

      {/* Tabs */}
      <div className="inline-flex bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('COMPLAINTS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'COMPLAINTS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Ca Khiếu Nại ({complaints.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('WARRANTY')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'WARRANTY' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Bảo Hành Cần Chú Ý ({watchlist.length})</span>
        </button>
      </div>

      {activeTab === 'COMPLAINTS' ? (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-400">{c.complaintCode}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${SEVERITY_META[c.severity]}`}>
                    {c.severity}
                  </span>
                  {c.orderCode && (
                    <span className="font-mono text-[11px] text-slate-400">Đơn: {c.orderCode}</span>
                  )}
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_META[c.status]}`}>
                  {c.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-slate-300">
                <span className="flex items-center gap-1 font-semibold">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  {c.customerInfo?.fullName}
                </span>
                <span className="flex items-center gap-1 font-mono text-slate-400">
                  <Phone className="w-3.5 h-3.5" />
                  {c.customerInfo?.phone}
                </span>
              </div>

              <p className="text-slate-200 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                {c.description}
              </p>

              {c.resolutionNote && (
                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200">
                  <strong>Phương án xử lý:</strong> {c.resolutionNote}
                  {c.compensationNote ? ` • Hỗ trợ thêm: ${c.compensationNote}` : ''}
                </div>
              )}

              {isManagerOrAdmin && !['RESOLVED', 'CLOSED'].includes(c.status) && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setResolveTarget(c);
                      setResolveStatus('RESOLVED');
                      setResolutionNote('');
                      setCompensationNote('');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                  >
                    Xử lý &amp; Cập nhật kết quả
                  </button>
                </div>
              )}
            </div>
          ))}
          {complaints.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-500">
              Chưa có ca khiếu nại nào được ghi nhận.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-4">Mã Phiếu / Serial</th>
                  <th className="py-3 px-4">Thiết bị</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Cảnh báo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {watchlist.map((t) => (
                  <tr key={t._id}>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-cyan-400 block">{t.ticketCode}</span>
                      <span className="text-[11px] text-slate-500">{t.serialNumber}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{t.productId?.name || 'Thiết bị'}</td>
                    <td className="py-3 px-4">
                      <div>{t.customerInfo?.fullName || 'Khách'}</div>
                      <div className="font-mono text-[11px] text-slate-400">{t.customerInfo?.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-200">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {t.needsAttention ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          Cần gọi cập nhật khách
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Bình thường</span>
                      )}
                    </td>
                  </tr>
                ))}
                {watchlist.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-500">
                      Không có phiếu bảo hành tồn đọng cần chú ý.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Complaint Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Tiếp nhận Ca Khiếu nại Mới (Escalation)</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Họ tên khách hàng *"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="SĐT khách (VD: 0909...) *"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white"
                />
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder="Mã đơn hàng (nếu có)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white"
                />
              </div>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
              >
                <option value="NORMAL">Mức độ: Bình thường (NORMAL)</option>
                <option value="HIGH">Mức độ: Nghiêm trọng (HIGH)</option>
                <option value="CRITICAL">Mức độ: Khẩn cấp (CRITICAL)</option>
              </select>
              <textarea
                rows={3}
                required
                minLength={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết phản ánh của khách hàng..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                >
                  Gửi Lên Quản Lý
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Xử lý khiếu nại {resolveTarget.complaintCode}</h3>
            <form onSubmit={handleResolveSubmit} className="space-y-3 text-xs">
              <select
                value={resolveStatus}
                onChange={(e) => setResolveStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
              >
                <option value="INVESTIGATING">Đang xác minh (INVESTIGATING)</option>
                <option value="RESOLVED">Đã giải quyết thỏa đáng (RESOLVED)</option>
                <option value="CLOSED">Đóng ca khiếu nại (CLOSED)</option>
              </select>
              <textarea
                rows={3}
                required
                minLength={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Kết luận & phương án xử lý cho khách hàng..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
              />
              <input
                type="text"
                value={compensationNote}
                onChange={(e) => setCompensationNote(e.target.value)}
                placeholder="Ghi chú hỗ trợ thêm (VD: Miễn phí vệ sinh máy / Dán cường lực...)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolveTarget(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Lưu Xử Lý
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchComplaintsPage;
