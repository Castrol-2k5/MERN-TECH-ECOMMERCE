import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Building2,
  Lock,
  Eye,
  X,
  User,
  Phone,
  MapPin,
  CreditCard,
  Cpu,
  ShieldCheck,
  Store,
  Globe,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  ArrowUpRight,
  ArrowRight,
  Barcode,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { orderService } from '../../features/orders/services/orderService.js';
import { branchService } from '../../features/branches/services/branchService.js';
import { warrantyService } from '../../features/warranty/services/warrantyService.js';
import { inventoryService } from '../../features/inventory/services/inventoryService.js';
import usePosAudio from '../../features/pos/hooks/usePosAudio';
import Toast from '../../components/common/Toast';
import DataTablePagination from '../../components/common/DataTablePagination';
import ReturnOrderModal from '../../features/orders/components/ReturnOrderModal.jsx';
import PickPackSlipModal from '../../features/orders/components/PickPackSlipModal.jsx';
import approvalService from '../../features/approvals/services/approvalService.js';
import { Printer, Ban } from 'lucide-react';

const formatVND = (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫`;

const ORDER_STATUS_META = {
  PENDING: {
    label: 'Chờ xử lý',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: Clock
  },
  PROCESSING: {
    label: 'Đang đóng gói',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Clock
  },
  READY_FOR_SHIPPING: {
    label: 'Sẵn sàng giao',
    badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    icon: Truck
  },
  SHIPPING: {
    label: 'Đang vận chuyển',
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    icon: Truck
  },
  COMPLETED: {
    label: 'Hoàn tất',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2
  },
  PARTIALLY_RETURNED: {
    label: 'Trả 1 phần',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: RotateCcw
  },
  RETURNED: {
    label: 'Đã trả hàng',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: RotateCcw
  },
  CANCELLED: {
    label: 'Đã hủy',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    icon: XCircle
  }
};

export const BranchOrdersPage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';
  const isManager = authUser?.role === 'BRANCH_MANAGER' || isSuperAdmin;
  const canComplete = ['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN'].includes(authUser?.role);
  const userBranchId =
    typeof authUser?.branchId === 'object'
      ? authUser?.branchId?._id || ''
      : authUser?.branchId || '';

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(isSuperAdmin ? '' : userBranchId);
  const [orderTypeFilter, setOrderTypeFilter] = useState('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnTargetOrder, setReturnTargetOrder] = useState(null);
  const [pickPackOrder, setPickPackOrder] = useState(null);
  const [voidTargetOrder, setVoidTargetOrder] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [verifiedSerialInfo, setVerifiedSerialInfo] = useState(null);
  const [verifyingSerial, setVerifyingSerial] = useState('');

  // Toast & Audio Feedback
  const [toast, setToast] = useState(null);
  const { playSuccessBeep, playErrorBeep } = usePosAudio();

  const showToast = useCallback(
    (type, title, message) => {
      if (type === 'success') {
        playSuccessBeep();
      } else {
        playErrorBeep();
      }
      setToast({ type, title, message });
    },
    [playSuccessBeep, playErrorBeep]
  );

  // Exchange SKU Modal State
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [exchangeOrder, setExchangeOrder] = useState(null);
  const [exchangeOldSkuId, setExchangeOldSkuId] = useState('');
  const [exchangeBranchInventory, setExchangeBranchInventory] = useState([]);
  const [exchangeTargetSkuId, setExchangeTargetSkuId] = useState('');
  const [exchangeSearchQuery, setExchangeSearchQuery] = useState('');
  const [exchangeSerialNumber, setExchangeSerialNumber] = useState('');
  const [exchangePaymentMethod, setExchangePaymentMethod] = useState('CASH');
  const [exchangeNote, setExchangeNote] = useState('');
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeModalError, setExchangeModalError] = useState('');

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const list = await branchService.getAllBranches();
        setBranches(Array.isArray(list) ? list : []);
      } catch {
        setBranches([]);
      }
    };
    loadBranches();
  }, []);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = {
        limit: 100
      };
      if (isSuperAdmin && selectedBranchId) {
        params.branchId = selectedBranchId;
      }
      if (orderTypeFilter !== 'ALL') {
        params.orderType = orderTypeFilter;
      }
      if (orderStatusFilter !== 'ALL') {
        params.orderStatus = orderStatusFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const list = await orderService.getBranchOrders(params);
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Không thể tải danh sách đơn hàng chi nhánh.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, selectedBranchId, orderTypeFilter, orderStatusFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranchId, orderTypeFilter, orderStatusFilter, searchQuery]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return orders.slice(startIndex, startIndex + pageSize);
  }, [orders, currentPage, pageSize]);

  const currentBranchName = useMemo(() => {
    if (authUser?.branch?.name) return authUser.branch.name;
    const found = branches.find((b) => String(b._id) === String(userBranchId));
    return found?.name || 'Chi nhánh của bạn';
  }, [authUser, branches, userBranchId]);

  const stats = useMemo(() => {
    const totalCount = orders.length;
    const posCount = orders.filter((o) => o.orderType === 'POS_STORE').length;
    const b2cCount = orders.filter((o) => o.orderType === 'B2C_ONLINE').length;
    const totalRevenue = orders
      .filter((o) => o.orderStatus !== 'CANCELLED')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    return { totalCount, posCount, b2cCount, totalRevenue };
  }, [orders]);

  const handleInspectSerial = async (serialNumber) => {
    if (!serialNumber) return;
    setVerifyingSerial(serialNumber);
    try {
      const info = await warrantyService.verifySerial(serialNumber);
      setVerifiedSerialInfo(info);
    } catch (err) {
      setVerifiedSerialInfo({
        serialNumber,
        error:
          err?.response?.data?.error?.message ||
          err?.message ||
          'Không tra cứu được thông tin bảo hành của mã Serial này.'
      });
    } finally {
      setVerifyingSerial('');
    }
  };

  const handleCompleteOrder = async (order) => {
    if (!order) return;
    const isUnpaid = order.paymentStatus !== 'PAID';
    const confirmMsg = isUnpaid
      ? `Đơn hàng ${order.orderCode} chưa thanh toán (${formatVND(order.totalAmount)}).\n\nBạn xác nhận ĐÃ THU ĐỦ TIỀN mặt/chuyển khoản từ khách hàng và BÀN GIAO MÁY thành công?\n\nHệ thống sẽ:\n- Cập nhật trạng thái Đã Thanh Toán (PAID)\n- Hoàn tất đơn hàng (COMPLETED)\n- Kích hoạt bảo hành điện tử chính hãng cho toàn bộ mã Serial.`
      : `Xác nhận khách hàng đã nhận máy cho đơn hàng ${order.orderCode}?\n\nHệ thống sẽ hoàn tất đơn hàng và kích hoạt bảo hành điện tử chính hãng ngay lập tức.`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const updated = await orderService.completeOrder(order._id);
      const patchData = {
        orderStatus: 'COMPLETED',
        paymentStatus: 'PAID',
        completedAt: new Date().toISOString(),
        staffId: authUser ? { _id: authUser._id, fullName: authUser.fullName, email: authUser.email } : order.staffId,
        ...(updated && typeof updated === 'object' ? updated : {})
      };

      setOrders((prev) =>
        prev.map((o) => (String(o._id) === String(order._id) ? { ...o, ...patchData } : o))
      );
      setSelectedOrder((prev) =>
        prev && String(prev._id) === String(order._id) ? { ...prev, ...patchData } : prev
      );
      showToast(
        'success',
        'Bàn giao máy thành công',
        `Đơn hàng ${order.orderCode} đã hoàn tất và kích hoạt bảo hành điện tử chính hãng!`
      );
    } catch (err) {
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Không thể hoàn tất đơn hàng. Vui lòng thử lại.';
      showToast('error', 'Lỗi bàn giao đơn hàng', errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!order) return;
    const defaultReason = 'Khách quá hạn giữ hàng không đến nhận (No-show)';
    const reason = window.prompt(
      `HỦY ĐƠN VÀ HOÀN TRẢ KHO CHI NHÁNH (${order.orderCode})\n\nThao tác này sẽ:\n1. Hủy đơn hàng và ghi nhận người hủy (${authUser?.fullName || 'Quản lý'})\n2. Tự động hoàn lại số lượng tồn kho chi nhánh\n3. Giải phóng mã Serial về trạng thái Đang có trong kho (IN_STOCK)\n\nNhập lý do hủy:`,
      defaultReason
    );
    if (reason === null) return;
    const finalReason = reason.trim() || defaultReason;

    setActionLoading(true);
    try {
      const updated = await orderService.cancelOrder(order._id, finalReason);
      const patchData = {
        orderStatus: 'CANCELLED',
        cancellationReason: finalReason,
        cancelledBy: authUser ? { _id: authUser._id, fullName: authUser.fullName } : null,
        cancelledAt: new Date().toISOString(),
        ...(updated && typeof updated === 'object' ? updated : {})
      };

      setOrders((prev) =>
        prev.map((o) => (String(o._id) === String(order._id) ? { ...o, ...patchData } : o))
      );
      setSelectedOrder((prev) =>
        prev && String(prev._id) === String(order._id) ? { ...prev, ...patchData } : prev
      );
      showToast(
        'success',
        'Hủy đơn thành công',
        `Đơn hàng ${order.orderCode} đã được hủy và hoàn trả tồn kho chi nhánh thành công.`
      );
    } catch (err) {
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Không thể hủy đơn hàng. Vui lòng thử lại.';
      showToast('error', 'Lỗi hủy đơn hàng', errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Exchange SKU Handlers
  const handleOpenExchangeModal = async (order) => {
    if (!order) return;
    setExchangeOrder(order);
    const firstSkuId = order.items?.[0]?.productSkuId?._id || order.items?.[0]?.productSkuId || '';
    setExchangeOldSkuId(firstSkuId);
    setExchangeTargetSkuId('');
    setExchangeSearchQuery('');
    setExchangeSerialNumber('');
    setExchangePaymentMethod('CASH');
    setExchangeNote('');
    setExchangeModalError('');
    setIsExchangeModalOpen(true);
    setIsInventoryLoading(true);

    try {
      const branchId =
        typeof order.branchId === 'object'
          ? order.branchId?._id || ''
          : order.branchId || userBranchId;
      const inv = await inventoryService.getBranchInventory(branchId);
      setExchangeBranchInventory(Array.isArray(inv) ? inv : []);
    } catch {
      setExchangeBranchInventory([]);
      setExchangeModalError('Không thể tải danh sách tồn kho chi nhánh để chọn SKU đổi.');
    } finally {
      setIsInventoryLoading(false);
    }
  };

  const oldItemToExchange = useMemo(() => {
    if (!exchangeOrder?.items) return null;
    return (
      exchangeOrder.items.find(
        (i) =>
          String(i.productSkuId?._id || i.productSkuId) === String(exchangeOldSkuId)
      ) || exchangeOrder.items[0]
    );
  }, [exchangeOrder, exchangeOldSkuId]);

  const filteredTargetInventory = useMemo(() => {
    const oldSkuIdStr = String(oldItemToExchange?.productSkuId?._id || oldItemToExchange?.productSkuId || '');
    return exchangeBranchInventory.filter((inv) => {
      if (String(inv.productSkuId?._id || inv.productSkuId) === oldSkuIdStr) return false;
      if ((Number(inv.quantityAvailable) || Number(inv.quantityPhysical) || 0) <= 0) return false;
      if (exchangeSearchQuery.trim()) {
        const q = exchangeSearchQuery.toLowerCase();
        const matchName = (inv.productName || '').toLowerCase().includes(q);
        const matchSku = (inv.sku || '').toLowerCase().includes(q);
        return matchName || matchSku;
      }
      return true;
    });
  }, [exchangeBranchInventory, oldItemToExchange, exchangeSearchQuery]);

  const targetInventoryItem = useMemo(() => {
    if (!exchangeTargetSkuId) return null;
    return exchangeBranchInventory.find(
      (inv) => String(inv.productSkuId?._id || inv.productSkuId) === String(exchangeTargetSkuId)
    );
  }, [exchangeBranchInventory, exchangeTargetSkuId]);

  const priceComparison = useMemo(() => {
    if (!oldItemToExchange || !targetInventoryItem) return null;
    const qty = Number(oldItemToExchange.quantity || 1);
    const oldUnitPrice = Number(oldItemToExchange.unitPrice || 0);
    const newUnitPrice = Number(targetInventoryItem.unitPrice || 0);
    const oldTotal = oldUnitPrice * qty;
    const newTotal = newUnitPrice * qty;
    const diff = newTotal - oldTotal;

    return {
      qty,
      oldUnitPrice,
      newUnitPrice,
      oldTotal,
      newTotal,
      diff,
      type: diff > 0 ? 'COLLECT_MORE' : diff < 0 ? 'REFUND_CUSTOMER' : 'EQUAL'
    };
  }, [oldItemToExchange, targetInventoryItem]);

  const handleConfirmExchange = async (e) => {
    if (e) e.preventDefault();
    if (!exchangeOrder || !oldItemToExchange || !targetInventoryItem) {
      setExchangeModalError('Vui lòng chọn đầy đủ sản phẩm cần đổi và sản phẩm mới.');
      return;
    }

    if (targetInventoryItem.hasSerial && !exchangeSerialNumber.trim()) {
      setExchangeModalError(
        `Vui lòng chọn hoặc quét mã Serial / IMEI cho sản phẩm mới (${targetInventoryItem.sku}).`
      );
      return;
    }

    setIsExchanging(true);
    setExchangeModalError('');

    try {
      const payload = {
        oldProductSkuId: oldItemToExchange.productSkuId?._id || oldItemToExchange.productSkuId,
        newProductSkuId: targetInventoryItem.productSkuId?._id || targetInventoryItem.productSkuId,
        newSerialNumber: exchangeSerialNumber.trim() || undefined,
        paymentMethod: priceComparison?.diff > 0 ? exchangePaymentMethod : 'NONE',
        note: exchangeNote.trim() || 'Đổi SKU theo yêu cầu của khách tại quầy'
      };

      const result = await orderService.exchangeSku(exchangeOrder._id, payload);
      const updatedOrder = result?.order || result;

      setOrders((prev) =>
        prev.map((o) => (String(o._id) === String(exchangeOrder._id) ? { ...o, ...updatedOrder } : o))
      );
      setSelectedOrder(updatedOrder);
      setIsExchangeModalOpen(false);

      const diff = priceComparison?.diff || 0;
      const diffText =
        diff > 0
          ? `Khách bù thêm ${formatVND(diff)} (${exchangePaymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'})`
          : diff < 0
          ? `Cửa hàng hoàn lại ${formatVND(Math.abs(diff))}`
          : 'Đổi ngang giá (0 ₫)';

      showToast(
        'success',
        'Đổi SKU thành công',
        `Đã chuyển đổi sang ${targetInventoryItem.productName}. ${diffText}. Tồn kho và mã Serial đã được điều chỉnh tự động.`
      );
    } catch (err) {
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Không thể thực hiện đổi SKU tại quầy.';
      setExchangeModalError(errMsg);
      showToast('error', 'Lỗi đổi SKU', errMsg);
    } finally {
      setIsExchanging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 lg:flex-row lg:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
              <ShoppingBag className="h-3.5 w-3.5" />
              UC-BM08 • Giám Sát Đơn Hàng Chi Nhánh
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Đơn Hàng Tại Chi Nhánh (POS & B2C Online)
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Theo dõi toàn bộ hóa đơn bán tại quầy (Web POS) và đơn hàng B2C trực tuyến phân bổ về chi nhánh, kèm lịch sử mã Serial / IMEI xuất kho.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isSuperAdmin ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
              <Building2 className="h-4 w-4 text-blue-400" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none"
              >
                <option value="" className="bg-slate-900">
                  Tất cả chi nhánh
                </option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id} className="bg-slate-900">
                    {b.name} ({b.branchCode})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-300">
              <Lock className="h-3.5 w-3.5 text-blue-400" />
              <span>Chi nhánh khóa: {currentBranchName}</span>
            </div>
          )}

          <button
            type="button"
            onClick={fetchOrders}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-medium text-slate-400">Tổng số đơn hiển thị</p>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{stats.totalCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">Bao gồm cả POS & B2C</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-emerald-300">Đơn bán tại quầy (POS)</p>
            <Store className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-400">{stats.posCount}</p>
          <p className="mt-1 text-[11px] text-emerald-500/80">Thanh toán & xuất Serial trực tiếp</p>
        </div>
        <div className="rounded-2xl border border-blue-500/20 bg-blue-950/15 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-blue-300">Đơn B2C Online</p>
            <Globe className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-blue-400">{stats.b2cCount}</p>
          <p className="mt-1 text-[11px] text-blue-500/80">Đơn phân bổ về chi nhánh đóng gói</p>
        </div>
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/15 p-4">
          <p className="text-xs font-medium text-indigo-300">Tổng giá trị đơn (Hợp lệ)</p>
          <p className="mt-2 font-mono text-xl font-bold text-indigo-400">
            {formatVND(stats.totalRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-indigo-500/80">Không tính đơn đã hủy</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'Tất cả kênh' },
            { id: 'POS_STORE', label: 'Bán tại quầy (POS)' },
            { id: 'B2C_ONLINE', label: 'Đơn Online (B2C)' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setOrderTypeFilter(tab.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                orderTypeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <select
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">Mọi trạng thái đơn</option>
            <option value="PENDING">PENDING - Chờ xử lý</option>
            <option value="PROCESSING">PROCESSING - Đang đóng gói</option>
            <option value="READY_FOR_SHIPPING">READY_FOR_SHIPPING - Sẵn sàng giao</option>
            <option value="COMPLETED">COMPLETED - Hoàn tất</option>
            <option value="PARTIALLY_RETURNED">PARTIALLY_RETURNED - Trả 1 phần</option>
            <option value="RETURNED">RETURNED - Đã trả hàng</option>
            <option value="CANCELLED">CANCELLED - Đã hủy</option>
          </select>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm mã đơn (ORD-...), tên hoặc SĐT khách..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3.5">Mã Đơn / Thời Gian</th>
                <th className="px-4 py-3.5">Kênh Bán</th>
                <th className="px-4 py-3.5">Khách Hàng</th>
                <th className="px-4 py-3.5">Thu Ngân / Phụ Trách</th>
                <th className="px-4 py-3.5">Sản Phẩm & Serial</th>
                <th className="px-4 py-3.5 text-right">Tổng Tiền</th>
                <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                <th className="px-4 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                    Đang tải danh sách đơn hàng chi nhánh...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
                    Không tìm thấy đơn hàng nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const statusMeta = ORDER_STATUS_META[order.orderStatus] || {
                    label: order.orderStatus,
                    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
                    icon: Clock
                  };
                  const StatusIcon = statusMeta.icon;
                  const items = Array.isArray(order.items) ? order.items : [];
                  const totalQty = items.reduce((s, it) => s + (Number(it.quantity) || 1), 0);
                  const assignedSerials = items.flatMap((it) =>
                    Array.isArray(it.serialsAssigned) ? it.serialsAssigned : []
                  );
                  const customerName =
                    order.customerInfo?.fullName ||
                    order.shippingAddress?.fullName ||
                    'Khách lẻ tại quầy';
                  const customerPhone =
                    order.customerInfo?.phone || order.shippingAddress?.phone || '—';

                  return (
                    <tr
                      key={order._id || order.orderCode}
                      className="transition-colors hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs font-bold text-blue-400">
                          {order.orderCode}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString('vi-VN')
                            : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {order.orderType === 'POS_STORE' ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                            <Store className="h-3 w-3" />
                            POS Tại Quầy
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
                            <Globe className="h-3 w-3" />
                            B2C Online
                          </span>
                        )}
                        {isSuperAdmin && order.branchId?.name && (
                          <div className="mt-1 text-[11px] text-slate-400">
                            {order.branchId.name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-xs font-semibold text-slate-200">{customerName}</div>
                        <div className="font-mono text-[11px] text-slate-400">{customerPhone}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        {order.staffId?.fullName ? (
                          <div>
                            <div className="text-xs font-medium text-slate-200">
                              {order.staffId.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500">{order.staffId.email}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Hệ thống Online</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="max-w-xs truncate text-xs font-medium text-slate-200">
                          {items[0]?.productName || 'Sản phẩm'}
                          {items.length > 1 ? ` (+${items.length - 1} SP khác)` : ''}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                          <span>SL: {totalQty}</span>
                          <span>•</span>
                          <span
                            className={`font-mono ${
                              assignedSerials.length > 0 ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            Serial: {assignedSerials.length}/{totalQty}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="font-mono text-xs font-bold text-white">
                          {formatVND(order.totalAmount || 0)}
                        </div>
                        <div className="mt-0.5 text-[10px] font-semibold uppercase text-slate-400">
                          {order.paymentMethod} • {order.paymentStatus}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClass}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {['PROCESSING', 'READY_FOR_SHIPPING'].includes(order.orderStatus) && canComplete && (
                            <button
                              type="button"
                              onClick={() => handleCompleteOrder(order)}
                              disabled={actionLoading}
                              title="Bàn giao máy & Hoàn tất đơn"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-600 hover:text-white px-2.5 py-1.5 text-xs font-semibold text-emerald-400 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Bàn giao
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setVerifiedSerialInfo(null);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-blue-600 hover:border-blue-500 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Chi tiết
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

        {/* Pagination */}
        <DataTablePagination
          currentPage={currentPage}
          totalPages={Math.ceil(orders.length / pageSize) || 1}
          pageSize={pageSize}
          totalItems={orders.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          variant="dark"
          itemName="đơn hàng"
        />
      </div>

      {/* Order Detail & Serial Warranty Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-base font-bold text-blue-400">
                    {selectedOrder.orderCode}
                  </span>
                  <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                    {selectedOrder.orderType === 'POS_STORE' ? 'POS Tại Quầy' : 'B2C Online'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  Ngày tạo:{' '}
                  {selectedOrder.createdAt
                    ? new Date(selectedOrder.createdAt).toLocaleString('vi-VN')
                    : '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  setVerifiedSerialInfo(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {/* Info Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Thông Tin Khách Hàng
                  </h3>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <span className="font-semibold text-white">
                        {selectedOrder.customerInfo?.fullName ||
                          selectedOrder.shippingAddress?.fullName ||
                          'Khách lẻ tại quầy'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      <span className="font-mono">
                        {selectedOrder.customerInfo?.phone ||
                          selectedOrder.shippingAddress?.phone ||
                          'Không lưu SĐT'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span>
                        {selectedOrder.customerInfo?.address ||
                          selectedOrder.shippingAddress?.address ||
                          'Mua trực tiếp tại quầy POS'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Thông Tin Giao Dịch & Chi Nhánh
                  </h3>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Chi nhánh:</span>
                      <span className="font-semibold text-white">
                        {selectedOrder.branchId?.name || currentBranchName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Nhân viên thu ngân / xử lý:</span>
                      <span className="font-semibold text-slate-200">
                        {selectedOrder.staffId?.fullName || 'Đặt hàng B2C trực tuyến'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Thanh toán:</span>
                      <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-400">
                        <CreditCard className="h-3.5 w-3.5" />
                        {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Status Banners (Cancelled / Completed) */}
              {selectedOrder.orderStatus === 'CANCELLED' && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/25 p-4 text-xs text-rose-300">
                  <div className="flex items-center gap-2 font-bold text-rose-200">
                    <XCircle className="h-4 w-4 text-rose-400" />
                    Đơn hàng đã bị hủy & Hoàn kho thành công
                  </div>
                  <div className="mt-2 text-slate-300">
                    Lý do hủy: <span className="font-semibold text-rose-300">{selectedOrder.cancellationReason || 'Không ghi nhận lý do'}</span>
                  </div>
                  {selectedOrder.cancelledAt && (
                    <div className="mt-1 text-[11px] text-slate-400">
                      Thời điểm hủy: {new Date(selectedOrder.cancelledAt).toLocaleString('vi-VN')}
                      {selectedOrder.cancelledBy?.fullName && ` • Bởi: ${selectedOrder.cancelledBy.fullName}`}
                    </div>
                  )}
                  <div className="mt-2 text-[11px] text-emerald-400">
                    ✓ Số lượng sản phẩm đã được tự động hoàn lại vào kho chi nhánh và mã Serial đã được giải phóng (IN_STOCK).
                  </div>
                </div>
              )}

              {selectedOrder.orderStatus === 'COMPLETED' && selectedOrder.completedAt && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/25 p-4 text-xs text-emerald-300">
                  <div className="flex items-center gap-2 font-bold text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Đơn hàng đã hoàn tất bàn giao & Kích hoạt bảo hành điện tử
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-300">
                    Thời điểm bàn giao: {new Date(selectedOrder.completedAt).toLocaleString('vi-VN')}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    ✓ Khách hàng đã nhận máy và toàn bộ mã Serial / IMEI đã được kích hoạt bảo hành chính hãng.
                  </div>
                </div>
              )}

              {/* Exchange History Box */}
              {selectedOrder.exchangeHistory && selectedOrder.exchangeHistory.length > 0 && (
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 mb-3">
                    <RefreshCw className="h-4 w-4 text-indigo-400" />
                    Lịch Sử Đổi SKU / Đổi Máy Tại Quầy ({selectedOrder.exchangeHistory.length} lần đổi)
                  </div>
                  <div className="space-y-2.5">
                    {selectedOrder.exchangeHistory.map((item, idx) => {
                      const diff = Number(item.priceDifference || 0);
                      return (
                        <div
                          key={idx}
                          className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400 mb-2 border-b border-slate-800 pb-1.5">
                            <span>
                              Thời gian: <span className="font-medium text-slate-200">{new Date(item.exchangedAt).toLocaleString('vi-VN')}</span>
                            </span>
                            <span>
                              Nhân viên xử lý: <span className="font-medium text-indigo-300">{item.exchangedBy?.fullName || 'Nhân viên quầy'}</span>
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                            <div className="bg-slate-950/50 p-2 rounded border border-slate-800/60">
                              <div className="text-[10px] text-slate-400 uppercase font-semibold">SKU Ban Đầu</div>
                              <div className="font-semibold text-rose-300 truncate">{item.oldProductName}</div>
                              <div className="text-[11px] font-mono text-slate-400">SKU: {item.oldSku} • Đơn giá: {formatVND(item.oldUnitPrice)}</div>
                            </div>
                            <div className="bg-slate-950/50 p-2 rounded border border-slate-800/60">
                              <div className="text-[10px] text-slate-400 uppercase font-semibold">SKU Đã Đổi Sang</div>
                              <div className="font-semibold text-emerald-300 truncate">{item.newProductName}</div>
                              <div className="text-[11px] font-mono text-slate-400">SKU: {item.newSku} • Đơn giá: {formatVND(item.newUnitPrice)}</div>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pt-1.5 text-[11px]">
                            <div>
                              <span className="text-slate-400">Ghi chú: </span>
                              <span className="italic text-slate-300">{item.note || 'Đổi theo yêu cầu của khách'}</span>
                            </div>
                            <div className="font-semibold">
                              {diff > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Khách bù thêm: +{formatVND(diff)} ({item.paymentMethod || 'Tiền mặt'})
                                </span>
                              ) : diff < 0 ? (
                                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  Cửa hàng hoàn lại: -{formatVND(Math.abs(diff))}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-slate-700 text-slate-200">
                                  Đổi ngang giá: 0 ₫
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Return History Box */}
              {Array.isArray(selectedOrder.returnHistory) && selectedOrder.returnHistory.length > 0 && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/15 p-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Lịch Sử Trả Hàng &amp; Hoàn Tiền ({selectedOrder.returnHistory.length})
                  </h3>
                  <div className="space-y-2.5">
                    {selectedOrder.returnHistory.map((rtn, rIdx) => (
                      <div key={rtn._id || rIdx} className="rounded-lg border border-rose-500/20 bg-slate-900/80 p-3 text-xs space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                          <span className="font-mono font-bold text-rose-300">{rtn.returnCode}</span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(rtn.returnedAt).toLocaleString('vi-VN')} • {rtn.processedByName || 'Nhân viên quầy'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-slate-300">Lý do: <em className="text-slate-200">{rtn.reason}</em></span>
                          <span className="font-mono font-bold text-rose-400">
                            Hoàn {formatVND(rtn.refundAmount)} ({rtn.refundMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'})
                          </span>
                        </div>
                        <div className="space-y-1 pt-1">
                          {(rtn.items || []).map((ri, iIdx) => (
                            <div key={iIdx} className="text-[11px] text-slate-400 flex flex-wrap justify-between">
                              <span>
                                • {ri.productName} ({ri.sku}) x{ri.quantity} —{' '}
                                <strong className={ri.condition === 'GOOD' ? 'text-emerald-400' : 'text-amber-400'}>
                                  {ri.condition === 'GOOD' ? 'Nhập kho bán lại' : 'Hàng lỗi DEFECTIVE'}
                                </strong>
                              </span>
                              {Array.isArray(ri.serialsReturned) && ri.serialsReturned.length > 0 && (
                                <span className="font-mono text-slate-300">[{ri.serialsReturned.join(', ')}]</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items & Assigned Serials */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Danh Sách Sản Phẩm & Mã Serial / IMEI Đã Xuất
                  </h3>
                  {selectedOrder.orderType === 'B2C_ONLINE' &&
                    selectedOrder.orderStatus === 'PROCESSING' && (
                      <Link
                        to="/portal/admin/orders-dispatch"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                      >
                        Đi tới trang Đóng gói & Quét Serial
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                </div>

                <div className="space-y-3">
                  {(selectedOrder.items || []).map((item, idx) => {
                    const serials = Array.isArray(item.serialsAssigned)
                      ? item.serialsAssigned
                      : [];
                    return (
                      <div
                        key={item.productSkuId || idx}
                        className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5"
                      >
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <div>
                            <div className="text-xs font-bold text-white">{item.productName}</div>
                            <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                              SKU: {item.sku} • SL: {item.quantity} × {formatVND(item.unitPrice || 0)}
                            </div>
                          </div>
                          <div className="font-mono text-xs font-bold text-blue-400">
                            {formatVND((item.unitPrice || 0) * (item.quantity || 1))}
                          </div>
                        </div>

                        {/* Serial badges */}
                        <div className="mt-3 border-t border-slate-800/80 pt-2.5">
                          <div className="mb-1.5 text-[11px] font-medium text-slate-400">
                            Mã Serial / IMEI gắn với sản phẩm (Nhấn vào mã để kiểm tra Bảo hành điện tử):
                          </div>
                          {serials.length === 0 ? (
                            <span className="text-[11px] italic text-amber-400">
                              Chưa gán mã Serial (Đơn đang chờ xuất kho hoặc phụ kiện không quản lý Serial)
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {serials.map((sn) => (
                                <button
                                  key={sn}
                                  type="button"
                                  onClick={() => handleInspectSerial(sn)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-300 transition-colors"
                                >
                                  <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                                  {sn}
                                  {verifyingSerial === sn && (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Verified Serial e-Warranty Box */}
              {verifiedSerialInfo && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                      <ShieldCheck className="h-4 w-4 text-blue-400" />
                      Thông Tin Bảo Hành Điện Tử (Serial: {verifiedSerialInfo.serialNumber})
                    </div>
                    <button
                      type="button"
                      onClick={() => setVerifiedSerialInfo(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Đóng
                    </button>
                  </div>
                  {verifiedSerialInfo.error ? (
                    <p className="mt-2 text-xs text-rose-400">{verifiedSerialInfo.error}</p>
                  ) : (
                    <div className="mt-2.5 grid grid-cols-1 gap-2 text-xs text-slate-300 sm:grid-cols-3">
                      <div>
                        <span className="text-slate-400">Trạng thái: </span>
                        <span className="font-mono font-bold text-emerald-400">
                          {verifiedSerialInfo.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Kích hoạt: </span>
                        <span className="font-mono">
                          {verifiedSerialInfo.soldAt
                            ? new Date(verifiedSerialInfo.soldAt).toLocaleDateString('vi-VN')
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Hạn bảo hành: </span>
                        <span className="font-mono font-semibold text-amber-300">
                          {verifiedSerialInfo.warrantyExpiresAt
                            ? new Date(verifiedSerialInfo.warrantyExpiresAt).toLocaleDateString(
                                'vi-VN'
                              )
                            : '—'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col gap-3 border-t border-slate-800 bg-slate-950/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-400">
                Tổng thanh toán:{' '}
                <span className="font-mono text-base font-bold text-white">
                  {formatVND(selectedOrder.totalAmount || 0)}
                </span>
                <span className="ml-2 inline-block font-mono text-[11px] text-emerald-400">
                  ({selectedOrder.paymentStatus})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Pack & Assign Serials for Processing orders */}
                {selectedOrder.orderStatus === 'PROCESSING' && selectedOrder.orderType === 'B2C_ONLINE' && (
                  <Link
                    to="/portal/admin/orders-dispatch"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 px-3.5 py-2 text-xs font-semibold text-blue-300 transition-colors"
                  >
                    <Barcode className="h-4 w-4 text-blue-400" />
                    Quét Serial &amp; Đóng gói
                  </Link>
                )}

                {/* Handover button for Click & Collect or Ready online orders */}
                {['PROCESSING', 'READY_FOR_SHIPPING'].includes(selectedOrder.orderStatus) && canComplete && (
                  <button
                    type="button"
                    onClick={() => handleCompleteOrder(selectedOrder)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Bàn giao máy & Hoàn tất
                  </button>
                )}

                {/* Pick & Pack Slip Print button (UC-OMNI-02) */}
                {selectedOrder.orderStatus !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => setPickPackOrder(selectedOrder)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-2 text-xs font-semibold text-cyan-300 transition-colors cursor-pointer"
                  >
                    <Printer className="h-4 w-4 text-cyan-400" />
                    In phiếu Pick &amp; Pack
                  </button>
                )}

                {/* Counter SKU Exchange button for Processing or Ready orders */}
                {['PROCESSING', 'READY_FOR_SHIPPING'].includes(selectedOrder.orderStatus) && canComplete && (
                  <button
                    type="button"
                    onClick={() => handleOpenExchangeModal(selectedOrder)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 px-3.5 py-2 text-xs font-semibold text-indigo-300 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4 text-indigo-400" />
                    Đổi SKU tại quầy
                  </button>
                )}

                {/* Request Void POS Order button (UC-BM-04) */}
                {selectedOrder.orderType === 'POS_STORE' && selectedOrder.orderStatus === 'COMPLETED' && canComplete && (
                  <button
                    type="button"
                    onClick={() => {
                      setVoidTargetOrder(selectedOrder);
                      setVoidReason('');
                    }}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 text-xs font-semibold text-amber-300 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Ban className="h-4 w-4 text-amber-400" />
                    Xin hủy hóa đơn POS
                  </button>
                )}

                {/* Return & Refund button for COMPLETED or PARTIALLY_RETURNED orders */}
                {['COMPLETED', 'PARTIALLY_RETURNED'].includes(selectedOrder.orderStatus) && canComplete && (
                  <button
                    type="button"
                    onClick={() => setReturnTargetOrder(selectedOrder)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-semibold text-rose-300 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4 text-rose-400" />
                    Trả hàng &amp; Hoàn tiền
                  </button>
                )}

                {/* Cancel & Stock refund button for Manager / Super Admin */}
                {!['COMPLETED', 'PARTIALLY_RETURNED', 'RETURNED', 'CANCELLED'].includes(selectedOrder.orderStatus) && isManager && (
                  <button
                    type="button"
                    onClick={() => handleCancelOrder(selectedOrder)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-semibold text-rose-300 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4 text-rose-400" />
                    Hủy đơn & Hoàn kho
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    setVerifiedSerialInfo(null);
                  }}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exchange SKU Modal */}
      {isExchangeModalOpen && exchangeOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2 text-indigo-400">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Đổi SKU / Đổi Model Tại Quầy</h2>
                  <p className="text-xs text-slate-400">
                    Mã đơn: <span className="font-mono font-semibold text-slate-200">{exchangeOrder.orderCode}</span> • Kho: {exchangeOrder.branchId?.name || currentBranchName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExchangeModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleConfirmExchange} className="flex-1 overflow-y-auto p-6 space-y-5">
              {exchangeModalError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{exchangeModalError}</span>
                </div>
              )}

              {/* Step 1: Select Old Item (if multiple items in order) */}
              {exchangeOrder.items && exchangeOrder.items.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Chọn sản phẩm trong đơn cần đổi:
                  </label>
                  <select
                    value={exchangeOldSkuId}
                    onChange={(e) => setExchangeOldSkuId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {exchangeOrder.items.map((i) => (
                      <option key={i.productSkuId?._id || i.productSkuId} value={i.productSkuId?._id || i.productSkuId}>
                        {i.productName} ({i.sku}) - {formatVND(i.unitPrice)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Current Item Overview */}
              {oldItemToExchange && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                    Sản phẩm hiện tại của đơn hàng
                  </span>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{oldItemToExchange.productName}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                        SKU: <span className="text-slate-200">{oldItemToExchange.sku}</span> • SL: {oldItemToExchange.quantity} • Đơn giá: {formatVND(oldItemToExchange.unitPrice)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-200">
                        {formatVND((oldItemToExchange.unitPrice || 0) * (oldItemToExchange.quantity || 1))}
                      </div>
                      {oldItemToExchange.serialsAssigned?.length > 0 && (
                        <div className="mt-0.5 font-mono text-[10px] text-emerald-400">
                          Serial cũ: {oldItemToExchange.serialsAssigned.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Target SKU Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Chọn sản phẩm / biến thể mới khách muốn đổi:
                  </label>
                  {isInventoryLoading && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Đang tải kho...
                    </span>
                  )}
                </div>

                {/* Search Bar for Candidate SKUs */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={exchangeSearchQuery}
                    onChange={(e) => setExchangeSearchQuery(e.target.value)}
                    placeholder="Tìm tên sản phẩm hoặc mã SKU trong kho..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* SKU List */}
                <div className="max-h-44 overflow-y-auto space-y-1.5 rounded-xl border border-slate-800 bg-slate-950/80 p-2">
                  {filteredTargetInventory.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      {isInventoryLoading ? 'Đang tải dữ liệu...' : 'Không có SKU nào khả dụng trong kho chi nhánh.'}
                    </div>
                  ) : (
                    filteredTargetInventory.map((item) => {
                      const isSelected = String(item.productSkuId?._id || item.productSkuId) === String(exchangeTargetSkuId);
                      return (
                        <button
                          key={item.productSkuId?._id || item.productSkuId}
                          type="button"
                          onClick={() => {
                            setExchangeTargetSkuId(item.productSkuId?._id || item.productSkuId);
                            // Pre-fill first in-stock serial if available
                            const inStockSerial = item.serials?.find((s) => s.status === 'IN_STOCK');
                            if (inStockSerial) {
                              setExchangeSerialNumber(inStockSerial.serialNumber);
                            } else {
                              setExchangeSerialNumber('');
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors ${
                            isSelected
                              ? 'border border-indigo-500 bg-indigo-950/40 text-white'
                              : 'border border-transparent bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-white">{item.productName}</div>
                            <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                              SKU: {item.sku} • Có sẵn: <span className="text-emerald-400 font-bold">{item.quantityAvailable || item.quantityPhysical}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-indigo-400">{formatVND(item.unitPrice)}</div>
                            {item.hasSerial && (
                              <div className="text-[10px] text-slate-400">Yêu cầu Serial</div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Price Difference & Payment Reconciliation */}
              {priceComparison && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Giá trị sản phẩm mới:</span>
                    <span className="font-mono font-bold text-white">
                      {formatVND(priceComparison.newTotal)} ({priceComparison.qty} x {formatVND(priceComparison.newUnitPrice)})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Giá trị sản phẩm cũ:</span>
                    <span className="font-mono font-semibold text-slate-400">
                      - {formatVND(priceComparison.oldTotal)}
                    </span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Chênh lệch đối soát:</span>
                    <div>
                      {priceComparison.diff > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Khách cần bù thêm: +{formatVND(priceComparison.diff)}
                        </span>
                      ) : priceComparison.diff < 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Cửa hàng hoàn lại khách: -{formatVND(Math.abs(priceComparison.diff))}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Đổi ngang giá: 0 ₫
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Method when customer pays more */}
                  {priceComparison.diff > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-300">Hình thức thu tiền bù:</span>
                      <div className="flex items-center gap-2">
                        {['CASH', 'BANK_TRANSFER', 'VNPAY'].map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setExchangePaymentMethod(method)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              exchangePaymentMethod === method
                                ? 'bg-indigo-600 text-white'
                                : 'border border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            {method === 'CASH' ? 'Tiền mặt' : method === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'VNPay'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Serial input for new product */}
              {targetInventoryItem?.hasSerial && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Barcode className="h-3.5 w-3.5 text-indigo-400" />
                      Mã Serial / IMEI máy mới:
                    </label>
                    {targetInventoryItem.serials?.filter((s) => s.status === 'IN_STOCK').length > 0 && (
                      <span className="text-[11px] text-emerald-400">
                        {targetInventoryItem.serials.filter((s) => s.status === 'IN_STOCK').length} máy sẵn sàng
                      </span>
                    )}
                  </div>

                  {targetInventoryItem.serials?.filter((s) => s.status === 'IN_STOCK').length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={exchangeSerialNumber}
                        onChange={(e) => setExchangeSerialNumber(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-emerald-400 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Chọn mã Serial trong kho --</option>
                        {targetInventoryItem.serials
                          .filter((s) => s.status === 'IN_STOCK')
                          .map((s) => (
                            <option key={s.serialNumber} value={s.serialNumber}>
                              {s.serialNumber}
                            </option>
                          ))}
                      </select>
                      <input
                        type="text"
                        value={exchangeSerialNumber}
                        onChange={(e) => setExchangeSerialNumber(e.target.value)}
                        placeholder="Hoặc quét barcode / gõ mã Serial..."
                        className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={exchangeSerialNumber}
                      onChange={(e) => setExchangeSerialNumber(e.target.value)}
                      placeholder="Quét mã vạch hoặc nhập mã Serial của máy mới..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  )}
                </div>
              )}

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Lý do / Ghi chú đổi máy:
                </label>
                <input
                  type="text"
                  value={exchangeNote}
                  onChange={(e) => setExchangeNote(e.target.value)}
                  placeholder="Ví dụ: Khách đổi sang bản 512GB hoặc đổi màu Titan Tự Nhiên..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExchangeModalOpen(false)}
                  disabled={isExchanging}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isExchanging || !targetInventoryItem}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isExchanging ? 'animate-spin' : ''}`} />
                  Xác nhận đổi SKU &amp; Điều chỉnh kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return & Refund Modal (UC-ORD-12) */}
      <PickPackSlipModal
        isOpen={Boolean(pickPackOrder)}
        onClose={() => setPickPackOrder(null)}
        order={pickPackOrder}
      />

      <ReturnOrderModal
        isOpen={Boolean(returnTargetOrder)}
        onClose={() => setReturnTargetOrder(null)}
        order={returnTargetOrder}
        onReturnSuccess={(result) => {
          if (result?.approvalPending) {
            showToast(
              'success',
              'Đã gửi yêu cầu phê duyệt',
              `Yêu cầu ${result?.request?.requestCode || ''} đã gửi tới Quản lý Chi nhánh duyệt trước khi hoàn tiền.`
            );
            return;
          }
          const updatedOrder = result?.order;
          const returnCode = result?.returnRecord?.returnCode || 'RTN';
          const refundAmt = result?.returnRecord?.refundAmount || 0;
          showToast(
            'success',
            'Xử lý trả hàng thành công',
            `Phiếu trả ${returnCode}: Đã hoàn ${formatVND(refundAmt)} và cập nhật kho/Serial.`
          );
          if (updatedOrder) {
            setSelectedOrder(updatedOrder);
          }
          fetchOrders();
        }}
      />

      {/* Request Void POS Order Modal */}
      {voidTargetOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Ban className="w-4 h-4 text-amber-400" />
              Gửi yêu cầu hủy hóa đơn POS {voidTargetOrder.orderCode}
            </h3>
            <p className="text-xs text-slate-400">
              Hóa đơn POS đã hoàn tất ({formatVND(voidTargetOrder.totalAmount)}) cần Quản lý Chi nhánh phê duyệt trước khi hủy &amp; hoàn kho/Serial.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setActionLoading(true);
                try {
                  const req = await approvalService.createRequest({
                    type: 'VOID_POS_ORDER',
                    targetId: voidTargetOrder._id,
                    reason: voidReason.trim()
                  });
                  showToast(
                    'success',
                    'Đã gửi yêu cầu hủy hóa đơn',
                    `Mã yêu cầu ${req?.requestCode || ''} đang chờ Quản lý phê duyệt.`
                  );
                  setVoidTargetOrder(null);
                  setVoidReason('');
                } catch (err) {
                  showToast(
                    'error',
                    'Không thể gửi yêu cầu',
                    err?.response?.data?.message || err?.message || 'Lỗi gửi phê duyệt'
                  );
                } finally {
                  setActionLoading(false);
                }
              }}
              className="space-y-3"
            >
              <textarea
                rows={3}
                required
                minLength={2}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Nhập lý do chi tiết (VD: Xuất nhầm hình thức thanh toán / Khách đổi ý tại quầy)..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVoidTargetOrder(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Đang gửi...' : 'Gửi Quản Lý Duyệt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating System Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
export default BranchOrdersPage;
