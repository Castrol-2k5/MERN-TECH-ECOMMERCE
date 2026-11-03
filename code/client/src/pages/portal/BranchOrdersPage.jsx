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
  Barcode
} from 'lucide-react';
import { orderService } from '../../features/orders/services/orderService.js';
import { branchService } from '../../features/branches/services/branchService.js';
import { warrantyService } from '../../features/warranty/services/warrantyService.js';

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

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [verifiedSerialInfo, setVerifiedSerialInfo] = useState(null);
  const [verifyingSerial, setVerifyingSerial] = useState('');

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
      alert(`Đã bàn giao máy thành công cho đơn hàng ${order.orderCode}! Bảo hành điện tử đã được kích hoạt.`);
    } catch (err) {
      alert(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Không thể hoàn tất đơn hàng. Vui lòng thử lại.'
      );
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
      alert(`Đã hủy đơn ${order.orderCode} và hoàn trả kho chi nhánh thành công!`);
    } catch (err) {
      alert(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Không thể hủy đơn hàng. Vui lòng thử lại.'
      );
    } finally {
      setActionLoading(false);
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
                orders.map((order) => {
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

                {/* Cancel & Stock refund button for Manager / Super Admin */}
                {!['COMPLETED', 'CANCELLED'].includes(selectedOrder.orderStatus) && isManager && (
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
    </div>
  );
};
export default BranchOrdersPage;
