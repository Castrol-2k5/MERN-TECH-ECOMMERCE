import { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Wrench,
  ShieldCheck,
  Lock,
  AlertCircle,
  CheckCircle2,
  Printer,
  Search,
  RefreshCw,
  Eye,
  Check,
  X,
  CreditCard,
  FileText,
  DollarSign,
  PhoneCall,
  Clock,
  ArrowRight
} from 'lucide-react';
import warrantyService from '../../features/warranty/services/warrantyService';
import usePosAudio from '../../features/pos/hooks/usePosAudio';
import RmaScanLookup from '../../features/warranty/components/RmaScanLookup';
import RmaTicketForm from '../../features/warranty/components/RmaTicketForm';
import RmaPrintReceiptModal from '../../features/warranty/components/RmaPrintReceiptModal';
import Toast from '../../components/common/Toast';

const STATUS_BADGE_MAP = {
  RECEIVED: {
    label: 'RECEIVED • Đã tiếp nhận tại quầy',
    className: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  DIAGNOSING: {
    label: 'DIAGNOSING • Đang kiểm tra kỹ thuật',
    className: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  },
  QUOTATION_PENDING: {
    label: 'QUOTATION • Chờ khách duyệt giá',
    className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
  },
  REPAIRING: {
    label: 'REPAIRING • Đang sửa chữa',
    className: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  },
  REPAIR_REJECTED: {
    label: 'REJECTED • Khách từ chối (Chờ trả)',
    className: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  },
  READY_FOR_PICKUP: {
    label: 'READY • Đã xong chờ khách nhận',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  RETURNED: {
    label: 'RETURNED • Đã bàn giao hoàn tất',
    className: 'bg-slate-700/60 text-slate-300 border-slate-600'
  }
};

const formatVND = (v) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`;

export const WarrantyReceptionPage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';
  const branchName = authUser?.branch?.name || 'Chi nhánh của bạn';

  const [lookupResult, setLookupResult] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedTicket, setCompletedTicket] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [toast, setToast] = useState(null);

  const { playSuccessBeep, playErrorBeep } = usePosAudio();

  const showToast = useCallback((type, title, message) => {
    if (type === 'success') {
      playSuccessBeep();
    } else {
      playErrorBeep();
    }
    setToast({ type, title, message });
  }, [playSuccessBeep, playErrorBeep]);

  const [activeTab, setActiveTab] = useState('RECEPTION'); // 'RECEPTION' | 'TICKETS'
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchCode, setSearchCode] = useState('');

  // Workflow Dialog states
  const [diagnosingTicket, setDiagnosingTicket] = useState(null);
  const [approvingTicket, setApprovingTicket] = useState(null);
  const [completingTicket, setCompletingTicket] = useState(null);
  const [handingOverTicket, setHandingOverTicket] = useState(null);
  const [detailTicket, setDetailTicket] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Form states for dialogs
  const [diagNotes, setDiagNotes] = useState('');
  const [isUnderWarranty, setIsUnderWarranty] = useState(true);
  const [partsDesc, setPartsDesc] = useState('');
  const [partsCost, setPartsCost] = useState(0);
  const [laborCost, setLaborCost] = useState(0);

  const [approvalDecision, setApprovalDecision] = useState(true);
  const [approvalNote, setApprovalNote] = useState('');

  const [repairNotes, setRepairNotes] = useState('');
  const [partsReplacedText, setPartsReplacedText] = useState('');

  const [handoverPaymentMethod, setHandoverPaymentMethod] = useState('CASH');
  const [handoverNotes, setHandoverNotes] = useState('');

  const handleLookup = async (serialNumber) => {
    setIsLookingUp(true);
    setErrorMessage('');
    setSuccessBanner('');
    try {
      const data = await warrantyService.verifySerial(serialNumber);
      setLookupResult(data);
      showToast(
        'success',
        'Tra cứu Serial thành công',
        `Đã tìm thấy thiết bị: ${data.productName} (${data.serialNumber}). ${
          data.isEligible ? 'Đủ điều kiện bảo hành chính hãng.' : 'Hết hạn bảo hành chính hãng (Sửa chữa dịch vụ có phí).'
        }`
      );
    } catch (err) {
      setLookupResult(null);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Không tìm thấy mã Serial/IMEI trong hệ thống.';
      setErrorMessage(errMsg);
      showToast('error', 'Không tìm thấy Serial', errMsg);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleCreateTicket = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessBanner('');
    try {
      const result = await warrantyService.createWarrantyTicket(formData);
      setCompletedTicket(result);
      const msg = `Tiếp nhận thiết bị thành công! Mã phiếu: ${result.ticketCode}. Hệ thống đang mở biên bản tiếp nhận để in cho khách.`;
      setSuccessBanner(`✓ ${msg}`);
      showToast('success', 'Lập biên bản thành công', msg);
      // Auto add to tickets state so it shows up immediately in TICKETS tab
      setTickets((prev) => [result, ...prev]);
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Không thể tạo phiếu tiếp nhận bảo hành. Vui lòng kiểm tra trạng thái Serial.';
      setErrorMessage(errMsg);
      showToast('error', 'Lỗi tiếp nhận bảo hành', errMsg);
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
      showToast('info', 'Đồng bộ danh sách', `Đã tải ${Array.isArray(data) ? data.length : 0} phiếu bảo hành.`);
    } catch (err) {
      setTickets([]);
      showToast('error', 'Lỗi tải danh sách', 'Không thể đồng bộ danh sách phiếu bảo hành.');
    } finally {
      setIsLoadingTickets(false);
    }
  }, [statusFilter, searchCode, showToast]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMessage('');
    setSuccessBanner('');
    if (tab === 'TICKETS') {
      fetchTickets();
    }
  };

  // Quick direct status dropdown change
  const handleStatusChange = async (ticketId, newStatus) => {
    if (!ticketId) return;
    setIsActionLoading(true);
    try {
      const updated = await warrantyService.updateTicketStatus(ticketId, { status: newStatus });
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? { ...t, ...updated, status: updated?.status || newStatus } : t))
      );
      showToast(
        'success',
        'Cập nhật trạng thái thành công',
        `Phiếu đã chuyển sang: ${STATUS_BADGE_MAP[newStatus]?.label || newStatus}`
      );
    } catch (err) {
      showToast(
        'error',
        'Lỗi cập nhật trạng thái',
        err?.response?.data?.error?.message || err?.message || 'Không thể cập nhật trạng thái phiếu bảo hành.'
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  // 1. Submit Diagnosis & Quotation
  const handleSubmitDiagnosis = async (e) => {
    e.preventDefault();
    if (!diagnosingTicket) return;
    setIsActionLoading(true);
    try {
      const payload = {
        technicianNotes: diagNotes.trim(),
        isUnderWarranty,
        partsDescription: partsDesc.trim(),
        partsCost: isUnderWarranty ? 0 : Number(partsCost || 0),
        laborCost: isUnderWarranty ? 0 : Number(laborCost || 0)
      };
      const updated = await warrantyService.diagnoseTicket(diagnosingTicket._id, payload);

      // Reactive update
      setTickets((prev) =>
        prev.map((t) => (t._id === diagnosingTicket._id ? { ...t, ...updated } : t))
      );
      const ticketCode = diagnosingTicket.ticketCode;
      setDiagnosingTicket(null);

      const msg = isUnderWarranty
        ? `Phiếu ${ticketCode}: Đủ điều kiện bảo hành chính hãng miễn phí. Đã tự động duyệt sang 'Đang sửa chữa'.`
        : `Phiếu ${ticketCode}: Báo giá ${formatVND(Number(partsCost || 0) + Number(laborCost || 0))}. Đã chuyển sang 'Chờ khách duyệt giá'.`;

      setSuccessBanner(`✓ ${msg}`);
      showToast('success', 'Chẩn đoán & Báo giá thành công', msg);
    } catch (err) {
      const errMsg = err?.response?.data?.error?.message || err?.message || 'Lỗi khi lưu chẩn đoán.';
      showToast('error', 'Lỗi chẩn đoán lỗi', errMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // 2. Submit Customer Approval/Rejection
  const handleSubmitApproval = async (e) => {
    e.preventDefault();
    if (!approvingTicket) return;
    setIsActionLoading(true);
    try {
      const payload = {
        approved: approvalDecision,
        approvedVia: 'PHONE',
        note: approvalNote.trim()
      };
      const updated = await warrantyService.approveQuotation(approvingTicket._id, payload);

      // Reactive update
      setTickets((prev) =>
        prev.map((t) => (t._id === approvingTicket._id ? { ...t, ...updated } : t))
      );
      const ticketCode = approvingTicket.ticketCode;
      setApprovingTicket(null);

      const msg = approvalDecision
        ? `Đã ghi nhận khách ĐỒNG Ý sửa chữa cho phiếu ${ticketCode}! Kỹ thuật viên có thể tiến hành sửa ngay.`
        : `Đã ghi nhận khách TỪ CHỐI sửa chữa cho phiếu ${ticketCode}! Thiết bị đã chuyển sang chuẩn bị hoàn trả nguyên trạng 0₫.`;

      setSuccessBanner(`✓ ${msg}`);
      showToast('success', 'Ghi nhận phản hồi thành công', msg);
    } catch (err) {
      const errMsg = err?.response?.data?.error?.message || err?.message || 'Lỗi khi ghi nhận phê duyệt.';
      showToast('error', 'Lỗi ghi nhận phê duyệt', errMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. Complete Repair -> Ready for pickup
  const handleSubmitCompleteRepair = async (e) => {
    e.preventDefault();
    if (!completingTicket) return;
    setIsActionLoading(true);
    try {
      const partsArray = partsReplacedText
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        repairNotes: repairNotes.trim(),
        partsReplaced: partsArray
      };
      const updated = await warrantyService.completeRepair(completingTicket._id, payload);

      // Reactive update
      setTickets((prev) =>
        prev.map((t) => (t._id === completingTicket._id ? { ...t, ...updated } : t))
      );
      const ticketCode = completingTicket.ticketCode;
      setCompletingTicket(null);

      const msg = `Hoàn tất sửa chữa phiếu ${ticketCode}! Thiết bị đã sẵn sàng chờ khách đến kiểm tra và nhận máy.`;
      setSuccessBanner(`✓ ${msg}`);
      showToast('success', 'Sửa chữa hoàn tất', msg);
    } catch (err) {
      const errMsg = err?.response?.data?.error?.message || err?.message || 'Lỗi khi hoàn tất sửa chữa.';
      showToast('error', 'Lỗi hoàn tất sửa chữa', errMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. Handover to Customer -> Returned
  const handleSubmitHandover = async (e) => {
    e.preventDefault();
    if (!handingOverTicket) return;
    setIsActionLoading(true);
    try {
      const totalAmount = handingOverTicket.quotation?.totalCost || 0;
      const payload = {
        paymentMethod: totalAmount > 0 ? handoverPaymentMethod : 'NONE',
        amountPaid: totalAmount,
        customerNotes: handoverNotes.trim()
      };
      const updated = await warrantyService.handoverTicket(handingOverTicket._id, payload);

      // Reactive update
      setTickets((prev) =>
        prev.map((t) => (t._id === handingOverTicket._id ? { ...t, ...updated } : t))
      );
      const handoverDataToPrint = { ...handingOverTicket, ...updated, status: 'RETURNED' };
      const ticketCode = handingOverTicket.ticketCode;
      const sn = handingOverTicket.serialNumber;
      setHandingOverTicket(null);

      const msg = `Bàn giao thiết bị cho khách thành công! Đã đóng phiếu ${ticketCode}. Serial ${sn} đã khôi phục về trạng thái Đã bán (SOLD). Đang mở biên bản bàn giao để in.`;
      setSuccessBanner(`✓ ${msg}`);
      showToast('success', 'Bàn giao thiết bị thành công', msg);

      // Auto open print receipt for handover
      setCompletedTicket(handoverDataToPrint);
    } catch (err) {
      const errMsg = err?.response?.data?.error?.message || err?.message || 'Lỗi khi bàn giao thiết bị.';
      showToast('error', 'Lỗi bàn giao thiết bị', errMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleNewTicket = () => {
    setLookupResult(null);
    setCompletedTicket(null);
    setErrorMessage('');
    setSuccessBanner('');
  };

  return (
    <div className="space-y-5 select-none font-sans text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4" />
            <span>UC-BM09 • Trung Tâm Kỹ Thuật &amp; Bảo Hành • TechOne Care</span>
          </div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight">
            Quản Lý Vòng Đời Bảo Hành &amp; Sửa Chữa Thiết Bị
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Quy trình chuẩn 6 bước: Tiếp nhận ➔ Chẩn đoán &amp; Báo giá ➔ Phê duyệt ➔ Sửa chữa ➔ Bàn giao trả máy &amp; Lưu vết kỹ thuật.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isSuperAdmin && (
            <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-blue-300">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Chi nhánh: {branchName}</span>
            </div>
          )}
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Chính sách chính hãng 12 tháng</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner('')}
            className="text-slate-400 hover:text-white text-xs"
          >
            Đóng
          </button>
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
          Bước 3: Tiếp Nhận &amp; Lập Biên Bản Quầy
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('TICKETS')}
          className={`px-4 py-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'TICKETS'
              ? 'border-blue-500 text-blue-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Danh Sách Phiếu Bảo Hành RMA</span>
          {tickets.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-600/30 text-blue-300 text-[10px]">
              {tickets.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'RECEPTION' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Scan & Lookup */}
          <div className="lg:col-span-5 space-y-4">
            <RmaScanLookup
              onLookup={handleLookup}
              result={lookupResult}
              loading={isLookingUp}
            />
          </div>

          {/* Form with free text fields */}
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
              <h3 className="font-bold text-sm text-slate-100">
                Theo Dõi Tiến Độ &amp; Thao Tác Chuyên Nghiệp Theo Từng Bước
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mọi hành động chẩn đoán, báo giá, sửa chữa và bàn giao đều được cập nhật tức thì (Reactive) không cần làm mới thủ công.
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
                <option value="RECEIVED">RECEIVED - Chờ thẩm định</option>
                <option value="DIAGNOSING">DIAGNOSING - Đang kiểm tra</option>
                <option value="QUOTATION_PENDING">QUOTATION_PENDING - Chờ khách duyệt</option>
                <option value="REPAIRING">REPAIRING - Đang sửa chữa</option>
                <option value="REPAIR_REJECTED">REPAIR_REJECTED - Khách từ chối</option>
                <option value="READY_FOR_PICKUP">READY_FOR_PICKUP - Đã sửa xong chờ trả</option>
                <option value="RETURNED">RETURNED - Đã bàn giao hoàn tất</option>
              </select>

              <button
                type="button"
                onClick={fetchTickets}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingTickets ? 'animate-spin text-blue-400' : ''}`}
                />
                Làm mới
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã Phiếu &amp; Ngày Nhận</th>
                  <th className="py-3 px-4">Serial / Thiết Bị</th>
                  <th className="py-3 px-4">Khách Hàng</th>
                  <th className="py-3 px-4">Hiện Trạng &amp; Báo Giá</th>
                  <th className="py-3 px-4 text-center">Trạng Thái Vòng Đời</th>
                  <th className="py-3 px-4 text-right">Hành Động Bước Tiếp Theo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium font-sans">
                {isLoadingTickets ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      Đang tải danh sách phiếu bảo hành...
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
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
                    const totalCost = t.quotation?.totalCost || 0;

                    return (
                      <tr
                        key={t._id || t.ticketCode}
                        className="hover:bg-slate-850/60 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-blue-400">{t.ticketCode}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {t.createdAt
                              ? new Date(t.createdAt).toLocaleString('vi-VN')
                              : 'Hôm nay'}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono text-cyan-300 font-bold">{t.serialNumber}</div>
                          <div className="text-slate-200 font-semibold truncate max-w-xs">
                            {productName}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{customerFullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{customerPhone}</div>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <div className="truncate text-slate-300">
                            Lỗi: {t.issueDescription || t.faultDescription}
                          </div>
                          {t.quotation?.isUnderWarranty ? (
                            <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                              ✓ Bảo hành chính hãng (0₫)
                            </div>
                          ) : totalCost > 0 ? (
                            <div className="text-[11px] text-amber-400 font-mono font-bold mt-0.5">
                              Báo giá: {formatVND(totalCost)}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 italic mt-0.5">
                              Chưa có báo giá
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <select
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(t._id, e.target.value)}
                            disabled={isActionLoading}
                            title="Chọn để chuyển nhanh trạng thái phiếu bảo hành"
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border focus:outline-none cursor-pointer bg-slate-900 ${badgeMeta.className}`}
                          >
                            <option value="RECEIVED" className="bg-slate-900 text-amber-300">
                              RECEIVED • Đã tiếp nhận tại quầy
                            </option>
                            <option value="DIAGNOSING" className="bg-slate-900 text-purple-300">
                              DIAGNOSING • Đang kiểm tra lỗi
                            </option>
                            <option value="QUOTATION_PENDING" className="bg-slate-900 text-yellow-300">
                              QUOTATION • Chờ duyệt báo giá
                            </option>
                            <option value="REPAIRING" className="bg-slate-900 text-blue-300">
                              REPAIRING • Đang sửa chữa
                            </option>
                            <option value="REPAIR_REJECTED" className="bg-slate-900 text-rose-300">
                              REJECTED • Khách từ chối (Chờ trả)
                            </option>
                            <option value="READY_FOR_PICKUP" className="bg-slate-900 text-emerald-300">
                              READY • Đã xong chờ khách nhận
                            </option>
                            <option value="RETURNED" className="bg-slate-900 text-slate-300">
                              RETURNED • Đã bàn giao hoàn tất
                            </option>
                          </select>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Step 4 Action: Diagnose & Quote */}
                            {['RECEIVED', 'DIAGNOSING'].includes(currentStatus) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDiagnosingTicket(t);
                                  setDiagNotes(t.diagnosis?.technicianNotes || '');
                                  setIsUnderWarranty(t.quotation?.isUnderWarranty ?? true);
                                  setPartsDesc(t.quotation?.partsDescription || '');
                                  setPartsCost(t.quotation?.partsCost || 0);
                                  setLaborCost(t.quotation?.laborCost || 0);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold transition-colors shadow-sm"
                              >
                                <Wrench className="w-3 h-3" />
                                B4: Báo giá
                              </button>
                            )}

                            {/* Step 4 Approval Action: Record Customer Phone Approval */}
                            {currentStatus === 'QUOTATION_PENDING' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setApprovingTicket(t);
                                  setApprovalDecision(true);
                                  setApprovalNote('');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold text-[11px] transition-colors shadow-sm"
                              >
                                <PhoneCall className="w-3 h-3" />
                                Ghi nhận duyệt
                              </button>
                            )}

                            {/* Step 5 Action: Complete Repair */}
                            {currentStatus === 'REPAIRING' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCompletingTicket(t);
                                  setRepairNotes(t.resolution?.repairNotes || '');
                                  setPartsReplacedText((t.resolution?.partsReplaced || []).join(', '));
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors shadow-sm"
                              >
                                <Check className="w-3 h-3" />
                                B5: Sửa xong
                              </button>
                            )}

                            {/* Step 5 & 6 Action: Handover & Collect Money */}
                            {['READY_FOR_PICKUP', 'REPAIR_REJECTED'].includes(currentStatus) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setHandingOverTicket(t);
                                  setHandoverPaymentMethod('CASH');
                                  setHandoverNotes('');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors shadow-sm"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Bàn giao máy
                              </button>
                            )}

                            {/* View Detail & Print receipt */}
                            <button
                              type="button"
                              onClick={() => setDetailTicket(t)}
                              title="Xem chi tiết hồ sơ bảo hành"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                            </button>

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
                              title="In phiếu"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white text-[11px] font-semibold transition-colors"
                            >
                              <Printer className="w-3 h-3" />
                            </button>
                          </div>
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

      {/* 1. Modal: Bước 4 - Chẩn đoán & Báo giá */}
      {diagnosingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSubmitDiagnosis}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-5 space-y-4 text-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-purple-400">
                  Bước 4: Kết Quả Kiểm Tra Kỹ Thuật &amp; Báo Giá
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Mã phiếu: {diagnosingTicket.ticketCode} • Serial: {diagnosingTicket.serialNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDiagnosingTicket(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Kết luận nguyên nhân lỗi &amp; Phương án xử lý <span className="text-rose-400">*</span>:
              </label>
              <textarea
                rows="2"
                required
                value={diagNotes}
                onChange={(e) => setDiagNotes(e.target.value)}
                placeholder="Ví dụ: Chết IC nguồn, lỗi cụm camera góc rộng, máy ẩm chân sạc..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Phân loại diện bảo hành */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Phân loại chế độ sửa chữa:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsUnderWarranty(true)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isUnderWarranty
                      ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs">✓ Trong Bảo Hành</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Miễn phí 100% (0₫)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsUnderWarranty(false)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    !isUnderWarranty
                      ? 'border-amber-500 bg-amber-950/30 text-amber-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs">⚡ Ngoài Bảo Hành (Có Phí)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Cần khách duyệt giá</div>
                </button>
              </div>
            </div>

            {!isUnderWarranty && (
              <div className="space-y-3 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Chi tiết linh kiện cần thay thế:
                  </label>
                  <input
                    type="text"
                    value={partsDesc}
                    onChange={(e) => setPartsDesc(e.target.value)}
                    placeholder="Ví dụ: Màn hình OLED chính hãng, Cáp sạc..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Giá linh kiện (₫):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={partsCost}
                      onChange={(e) => setPartsCost(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Tiền công dịch vụ (₫):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={laborCost}
                      onChange={(e) => setLaborCost(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                  <span className="font-bold text-slate-300">Tổng chi phí báo khách:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {formatVND(Number(partsCost || 0) + Number(laborCost || 0))}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDiagnosingTicket(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isActionLoading || !diagNotes.trim()}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {isActionLoading ? 'Đang lưu...' : 'Lưu & Cập nhật phương án'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Modal: Bước 4 - Ghi nhận duyệt báo giá */}
      {approvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSubmitApproval}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-5 space-y-4 text-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-yellow-400">
                  Ghi Nhận Phản Hồi Báo Giá Của Khách Hàng
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Phiếu: {approvingTicket.ticketCode} • Báo giá:{' '}
                  {formatVND(approvingTicket.quotation?.totalCost)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApprovingTicket(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setApprovalDecision(true)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  approvalDecision
                    ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <Check className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                <span className="font-bold text-xs">Khách Đồng Ý</span>
              </button>
              <button
                type="button"
                onClick={() => setApprovalDecision(false)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  !approvalDecision
                    ? 'border-rose-500 bg-rose-950/30 text-rose-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <X className="w-5 h-5 mx-auto mb-1 text-rose-400" />
                <span className="font-bold text-xs">Khách Từ Chối</span>
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Ghi chú cuộc gọi / thỏa thuận với khách:
              </label>
              <textarea
                rows="2"
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Ví dụ: Đã gọi điện cho khách qua số 0912..., khách đồng ý thay màn giá 1.200.000₫..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApprovingTicket(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isActionLoading}
                className="px-5 py-2 bg-yellow-600 hover:bg-yellow-500 text-slate-950 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {isActionLoading ? 'Đang cập nhật...' : 'Xác nhận cập nhật'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Modal: Bước 5 - Hoàn thành sửa chữa */}
      {completingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSubmitCompleteRepair}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-5 space-y-4 text-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-blue-400">
                  Bước 5: Hoàn Tất Sửa Chữa &amp; Chuyển Sẵn Sàng Trả Máy
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Phiếu: {completingTicket.ticketCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompletingTicket(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Ghi chú nghiệm thu sửa chữa <span className="text-rose-400">*</span>:
              </label>
              <textarea
                rows="2"
                required
                value={repairNotes}
                onChange={(e) => setRepairNotes(e.target.value)}
                placeholder="Ví dụ: Đã thay thế cụm màn hình mới, test cảm ứng và camera hoạt động tốt 100%..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Danh sách linh kiện đã thay (phân tách bởi dấu phẩy):
              </label>
              <input
                type="text"
                value={partsReplacedText}
                onChange={(e) => setPartsReplacedText(e.target.value)}
                placeholder="Ví dụ: Màn hình OLED Super Retina, Cáp sạc USB-C..."
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompletingTicket(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isActionLoading || !repairNotes.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {isActionLoading ? 'Đang hoàn tất...' : 'Xác nhận sửa xong'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Modal: Bước 5 & 6 - Bàn giao máy & Thu tiền */}
      {handingOverTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSubmitHandover}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-5 space-y-4 text-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-emerald-400">
                  Bước 6: Bàn Giao Thiết Bị &amp; Xuất Hóa Đơn Trả Máy
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Phiếu: {handingOverTicket.ticketCode} • Khách:{' '}
                  {handingOverTicket.customerInfo?.fullName || 'Khách hàng'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHandingOverTicket(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Thiết bị:</span>
                <span className="font-semibold text-slate-200">
                  {handingOverTicket.productId?.name || handingOverTicket.productName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Serial/IMEI:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {handingOverTicket.serialNumber}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-800/80">
                <span className="font-bold text-slate-300">Tổng chi phí dịch vụ:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {formatVND(handingOverTicket.quotation?.totalCost || 0)}
                </span>
              </div>
            </div>

            {(handingOverTicket.quotation?.totalCost || 0) > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Hình thức thanh toán tại quầy:
                </label>
                <select
                  value={handoverPaymentMethod}
                  onChange={(e) => setHandoverPaymentMethod(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none"
                >
                  <option value="CASH">Tiền mặt tại quầy</option>
                  <option value="TRANSFER">Chuyển khoản ngân hàng</option>
                  <option value="VNPAY">VNPAY QR</option>
                  <option value="CARD">Quẹt thẻ ngân hàng (POS)</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Ghi chú bàn giao &amp; nghiệm thu của khách:
              </label>
              <input
                type="text"
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="Ví dụ: Khách đã kiểm tra đầy đủ chức năng, nhận đủ máy và phụ kiện..."
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-300">
              ✓ Khi xác nhận: Trạng thái chuyển RETURNED, hệ thống tự động hoàn Serial về trạng thái SOLD và mở biên bản bàn giao để in.
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setHandingOverTicket(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isActionLoading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {isActionLoading ? 'Đang bàn giao...' : 'Xác nhận bàn giao & Đóng phiếu'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Modal: Chi tiết toàn bộ hồ sơ bảo hành */}
      {detailTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden p-6 space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-blue-400">
                  Hồ Sơ Chi Tiết Phiếu Bảo Hành {detailTicket.ticketCode}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Serial: {detailTicket.serialNumber} • Chi nhánh:{' '}
                  {detailTicket.branchId?.name || branchName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailTicket(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-400 uppercase text-[10px]">
                  1. Tiếp nhận ban đầu (Quầy)
                </div>
                <div>Khách: <strong>{detailTicket.customerInfo?.fullName || 'Khách lẻ'}</strong> ({detailTicket.customerInfo?.phone || '—'})</div>
                <div>Lỗi phản ánh: <span className="text-rose-300 font-medium">{detailTicket.issueDescription}</span></div>
                <div>Ngoại quan: {detailTicket.appearanceCondition || 'Bình thường'}</div>
                <div>Nguồn: {detailTicket.powerStatus || 'Lên nguồn bình thường'}</div>
                <div>Mật khẩu PIN: {detailTicket.devicePassword || 'Không có'}</div>
                <div>Phụ kiện: {(detailTicket.accessories || []).join(', ') || 'Chỉ thân máy'}</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-400 uppercase text-[10px]">
                  2. Chẩn đoán kỹ thuật &amp; Báo giá
                </div>
                <div>Kỹ thuật kết luận: <strong>{detailTicket.diagnosis?.technicianNotes || 'Đang chờ thẩm định'}</strong></div>
                <div>Diện bảo hành: {detailTicket.quotation?.isUnderWarranty ? 'Chính hãng (0₫)' : 'Ngoài bảo hành (Có phí)'}</div>
                {!detailTicket.quotation?.isUnderWarranty && (
                  <div>
                    Linh kiện: {detailTicket.quotation?.partsDescription || '—'} • Tổng phí: <span className="font-mono font-bold text-amber-400">{formatVND(detailTicket.quotation?.totalCost)}</span>
                  </div>
                )}
                <div>Phê duyệt của khách: <strong>{detailTicket.customerApproval?.status || 'PENDING'}</strong> ({detailTicket.customerApproval?.approvedVia || 'NONE'})</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-400 uppercase text-[10px]">
                  3. Kết quả sửa chữa
                </div>
                <div>Xử lý: {detailTicket.resolution?.repairNotes || 'Đang trong quá trình xử lý'}</div>
                <div>Linh kiện đã thay: {(detailTicket.resolution?.partsReplaced || []).join(', ') || 'Không thay linh kiện'}</div>
                {detailTicket.resolution?.completedAt && (
                  <div>Hoàn thành lúc: {new Date(detailTicket.resolution.completedAt).toLocaleString('vi-VN')}</div>
                )}
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-400 uppercase text-[10px]">
                  4. Bàn giao &amp; Đóng phiếu
                </div>
                <div>Thời gian bàn giao: {detailTicket.handover?.returnedAt ? new Date(detailTicket.handover.returnedAt).toLocaleString('vi-VN') : 'Chưa bàn giao'}</div>
                <div>Đã thu: <strong className="font-mono text-emerald-400">{formatVND(detailTicket.handover?.amountPaid || 0)}</strong> ({detailTicket.handover?.paymentMethod || 'NONE'})</div>
                <div>Ghi chú khách: {detailTicket.handover?.customerNotes || 'Không có'}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailTicket(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Đóng cửa sổ
              </button>
            </div>
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

      {/* Floating System Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default WarrantyReceptionPage;
