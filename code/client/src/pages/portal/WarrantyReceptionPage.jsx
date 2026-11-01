import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Wrench, ShieldCheck, Lock, AlertCircle, Printer, Search, RefreshCw } from 'lucide-react';
import warrantyService from '../../features/warranty/services/warrantyService';
import usePosAudio from '../../features/pos/hooks/usePosAudio';
import RmaScanLookup from '../../features/warranty/components/RmaScanLookup';
import RmaTicketForm from '../../features/warranty/components/RmaTicketForm';
import RmaPrintReceiptModal from '../../features/warranty/components/RmaPrintReceiptModal';

const STATUS_BADGE_MAP = {
  RECEIVED: {
    label: 'RECEIVED • Đã tiếp nhận',
    className: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  PROCESSING: {
    label: 'PROCESSING • Đang sửa chữa',
    className: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  },
  COMPLETED: {
    label: 'COMPLETED • Chờ trả khách',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  RETURNED: {
    label: 'RETURNED • Đã bàn giao máy',
    className: 'bg-slate-700/60 text-slate-300 border-slate-600'
  }
};

export const WarrantyReceptionPage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';
  const branchName = authUser?.branch?.name || 'Chi nhánh của bạn';

  const [lookupResult, setLookupResult] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedTicket, setCompletedTicket] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [activeTab, setActiveTab] = useState('RECEPTION'); // 'RECEPTION' | 'TICKETS'
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchCode, setSearchCode] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const { playSuccessBeep, playErrorBeep } = usePosAudio();

  const handleLookup = async (serialNumber) => {
    setIsLookingUp(true);
    setErrorMessage('');
    try {
      const data = await warrantyService.verifySerial(serialNumber);
      setLookupResult(data);
      playSuccessBeep();
    } catch (err) {
      playErrorBeep();
      setLookupResult(null);
      setErrorMessage(
        err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          err?.message ||
          'Không tìm thấy mã Serial/IMEI trong hệ thống.'
      );
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleCreateTicket = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const result = await warrantyService.createWarrantyTicket(formData);
      playSuccessBeep();
      setCompletedTicket(result);
    } catch (err) {
      playErrorBeep();
      setErrorMessage(
        err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          err?.message ||
          'Không thể tạo phiếu tiếp nhận bảo hành. Vui lòng kiểm tra trạng thái Serial.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    setErrorMessage('');
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchCode.trim()) {
        const q = searchCode.trim().toUpperCase();
        if (q.startsWith('RMA-') || q.startsWith('BH-')) {
          params.ticketCode = q;
        } else {
          params.serialNumber = q;
        }
      }
      const data = await warrantyService.getWarrantyTickets(params);
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setTickets([]);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [statusFilter, searchCode]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMessage('');
    if (tab === 'TICKETS') {
      fetchTickets();
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    if (!ticketId) return;
    setUpdatingId(ticketId);
    setErrorMessage('');
    try {
      const updated = await warrantyService.updateTicketStatus(ticketId, { status: newStatus });
      playSuccessBeep();
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? { ...t, status: updated?.status || newStatus } : t))
      );
    } catch (err) {
      playErrorBeep();
      setErrorMessage(
        err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          'Không thể cập nhật trạng thái phiếu bảo hành.'
      );
    } finally {
      setUpdatingId('');
    }
  };

  const handleNewTicket = () => {
    setLookupResult(null);
    setCompletedTicket(null);
    setErrorMessage('');
  };

  return (
    <div className="space-y-5 select-none font-sans text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4" />
            <span>UC-BM09 • Tiếp Nhận &amp; Giám Sát Bảo Hành • TechOne Care</span>
          </div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight">
            Tiếp Nhận &amp; Thẩm Định Thiết Bị Bảo Hành Tại Quầy
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Xác thực E-Warranty theo Serial/IMEI, lập biên bản ghi nhận lỗi, cập nhật tiến độ sửa chữa và bàn giao máy
          </p>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap items-center gap-2">
          {!isSuperAdmin && (
            <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-blue-300">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Chi nhánh: {branchName}</span>
            </div>
          )}
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Chính sách đổi mới 30 ngày</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-px text-xs font-bold">
        <button
          type="button"
          onClick={() => handleTabChange('RECEPTION')}
          className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'RECEPTION'
              ? 'border-blue-500 text-blue-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Tiếp Nhận &amp; Thẩm Định Mới
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('TICKETS')}
          className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'TICKETS'
              ? 'border-blue-500 text-blue-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Danh Sách Phiếu Bảo Hành RMA
        </button>
      </div>

      {activeTab === 'RECEPTION' ? (
        /* Main Grid: Left (Lookup) & Right (Form) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Step 1: Scan & Tra cứu E-Warranty (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <RmaScanLookup
              onLookup={handleLookup}
              result={lookupResult}
              loading={isLookingUp}
            />
          </div>

          {/* Step 2: Biên bản tiếp nhận kỹ thuật (7 cols) */}
          <div className="lg:col-span-7">
            <RmaTicketForm
              warrantyData={lookupResult}
              onSubmit={handleCreateTicket}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      ) : (
        /* RMA Tickets Table Tab */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-100">Danh Sách Phiếu Tiếp Nhận RMA</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Quản lý tiến độ sửa chữa (RECEIVED → PROCESSING → COMPLETED → RETURNED). Khi chọn RETURNED, Serial tự động khôi phục về trạng thái Đã bán (SOLD).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
                  placeholder="Mã RMA-... hoặc Serial..."
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Mọi trạng thái</option>
                <option value="RECEIVED">RECEIVED - Đã tiếp nhận</option>
                <option value="PROCESSING">PROCESSING - Đang xử lý</option>
                <option value="COMPLETED">COMPLETED - Đã xong, chờ trả</option>
                <option value="RETURNED">RETURNED - Đã trả máy</option>
              </select>

              <button
                type="button"
                onClick={fetchTickets}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTickets ? 'animate-spin text-blue-400' : ''}`} />
                Làm mới
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã Phiếu</th>
                  <th className="py-3 px-4">Serial/IMEI</th>
                  <th className="py-3 px-4">Sản Phẩm</th>
                  <th className="py-3 px-4">Khách Hàng</th>
                  <th className="py-3 px-4">Mô Tả Lỗi</th>
                  <th className="py-3 px-4 text-center">Cập Nhật Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium font-sans">
                {isLoadingTickets ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      Đang tải danh sách phiếu bảo hành...
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      Chưa có phiếu bảo hành nào khớp bộ lọc tại chi nhánh.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => {
                    const productName = t.productId?.name || t.productName || 'Thiết bị công nghệ';
                    const customerFullName =
                      t.customerInfo?.fullName || t.customerId?.fullName || t.customerName || 'Khách lẻ';
                    const customerPhone =
                      t.customerInfo?.phone || t.customerId?.phone || t.customerPhone || '—';
                    const currentStatus = t.status || 'RECEIVED';
                    const badgeMeta = STATUS_BADGE_MAP[currentStatus] || STATUS_BADGE_MAP.RECEIVED;

                    return (
                      <tr key={t._id || t.ticketCode} className="hover:bg-slate-850/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-blue-400">{t.ticketCode}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {t.createdAt ? new Date(t.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-cyan-300">{t.serialNumber}</td>
                        <td className="py-3 px-4 text-slate-200 font-semibold">{productName}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{customerFullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{customerPhone}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                          <div>{t.issueDescription || t.faultDescription}</div>
                          {t.estimatedReturnDate && (
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Hẹn trả: {t.estimatedReturnDate}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <select
                            value={currentStatus}
                            disabled={updatingId === t._id}
                            onChange={(e) => handleStatusChange(t._id, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border focus:outline-none cursor-pointer ${badgeMeta.className}`}
                          >
                            <option value="RECEIVED" className="bg-slate-900 text-amber-300">
                              RECEIVED • Đã tiếp nhận
                            </option>
                            <option value="PROCESSING" className="bg-slate-900 text-blue-300">
                              PROCESSING • Đang sửa chữa
                            </option>
                            <option value="COMPLETED" className="bg-slate-900 text-emerald-300">
                              COMPLETED • Chờ trả khách
                            </option>
                            <option value="RETURNED" className="bg-slate-900 text-slate-300">
                              RETURNED • Đã bàn giao máy
                            </option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setCompletedTicket({
                                ...t,
                                productName,
                                staffName: t.staffId?.fullName || 'Kỹ thuật viên',
                                customerInfo: {
                                  fullName: customerFullName,
                                  phone: customerPhone,
                                  address: t.customerInfo?.address || ''
                                },
                                accessories: Array.isArray(t.accessories) ? t.accessories : []
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            In phiếu
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print Receipt Modal */}
      <RmaPrintReceiptModal
        isOpen={Boolean(completedTicket)}
        onClose={() => setCompletedTicket(null)}
        ticketData={completedTicket}
        onNewTicket={handleNewTicket}
      />
    </div>
  );
};

export default WarrantyReceptionPage;
