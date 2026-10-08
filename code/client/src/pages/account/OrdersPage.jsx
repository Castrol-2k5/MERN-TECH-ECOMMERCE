import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  Store,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { orderService } from '../../features/orders/services/orderService.js';

export const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    let ignore = false;
    const fetchOrders = async () => {
      try {
        setError('');
        const list = await orderService.getMyOrders();
        if (!ignore) {
          setOrders(list || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.'
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchOrders();
    return () => {
      ignore = true;
    };
  }, []);

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ thanh toán' },
    { id: 'PROCESSING', label: 'Đang xử lý' },
    { id: 'COMPLETED', label: 'Đã hoàn tất' },
    { id: 'CANCELLED', label: 'Đã hủy' }
  ];

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'ALL') return true;
    return order.orderStatus === activeTab;
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Đã hoàn tất
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            Đang xử lý
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Chờ thanh toán
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Package className="w-7 h-7 text-blue-600" />
            <span>Đơn hàng của tôi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tra cứu lịch sử mua sắm, trạng thái xử lý và mã Serial/IMEI thiết bị bảo hành
          </p>
        </div>

        <Link
          to="/warranty-check"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-xs"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Tra cứu e-Warranty</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-semibold">Đang tải danh sách đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Đã xảy ra lỗi</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Chưa có đơn hàng nào</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Bạn chưa có đơn hàng nào trong mục này. Hãy khám phá ngay các sản phẩm công nghệ mới nhất!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all"
          >
            <span>Khám phá sản phẩm ngay</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const totalItemsCount = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0;
            const hasSerials = order.items?.some((it) => it.serialsAssigned?.length > 0);

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-blue-300 transition-all shadow-xs hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-black text-sm text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
                      {order.orderCode}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(order.createdAt)}
                    </span>
                    {order.branchId && (
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Store className="w-3.5 h-3.5 text-slate-400" />
                        {order.branchId.name || 'Chi nhánh TechOne'}
                      </span>
                    )}
                  </div>
                  <div>{getStatusBadge(order.orderStatus)}</div>
                </div>

                {/* Items preview */}
                <div className="py-4 space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate pr-4">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {item.quantity}x
                        </span>
                        <span className="font-semibold text-slate-800 truncate">
                          {item.productName} ({item.sku})
                        </span>
                        {item.serialsAssigned?.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200 shrink-0">
                            Serial: {item.serialsAssigned.join(', ')}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">
                        {formatPrice(item.subtotal || item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer with Total and Link */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-500">
                      Tổng cộng ({totalItemsCount} sản phẩm):
                    </span>
                    <span className="text-base font-black text-blue-600">
                      {formatPrice(order.totalAmount)}
                    </span>
                    {hasSerials && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" />
                        Có mã Serial bảo hành
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/account/orders/${order.orderCode || order._id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-600 font-bold text-xs transition-colors"
                  >
                    <span>Xem chi tiết</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
