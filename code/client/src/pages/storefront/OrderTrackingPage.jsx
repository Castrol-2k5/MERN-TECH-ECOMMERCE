import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Package,
  Truck,
  Store,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  CreditCard,
  Banknote,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { orderService } from '../../features/orders/services/orderService.js';

const ORDER_STEPS = [
  { key: 'PENDING', label: 'Tiếp nhận đơn', desc: 'Đã nhận yêu cầu đặt hàng' },
  { key: 'PROCESSING', label: 'Chuẩn bị hàng', desc: 'Kiểm tra tồn kho & đóng gói' },
  { key: 'READY_FOR_SHIPPING', label: 'Xuất kho / Sẵn sàng', desc: 'Sẵn sàng giao hoặc nhận tại quầy' },
  { key: 'SHIPPING', label: 'Đang vận chuyển', desc: 'Đang giao đến địa chỉ nhận' },
  { key: 'COMPLETED', label: 'Hoàn tất', desc: 'Đã nhận máy & kích hoạt bảo hành' }
];

export const OrderTrackingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlOrderCode = searchParams.get('orderCode') || '';
  const urlPhone = searchParams.get('phone') || '';

  const [orderCode, setOrderCode] = useState(urlOrderCode);
  const [phone, setPhone] = useState(urlPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  const fetchTracking = async (searchCode, searchPhone) => {
    const code = (searchCode || orderCode).trim();
    const cleanPhone = (searchPhone || phone).trim();

    if (!code) {
      setError('Vui lòng nhập Mã đơn hàng cần tra cứu.');
      return;
    }

    if (!cleanPhone) {
      setError('Vui lòng nhập Số điện thoại người nhận để xác thực.');
      return;
    }

    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError('Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số).');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setOrder(null);

      const result = await orderService.trackOrderPublic(code, cleanPhone);
      setOrder(result);

      // Cập nhật URL query params để tiện bookmark hoặc chia sẻ
      setSearchParams({ orderCode: code, phone: cleanPhone });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Không tìm thấy thông tin đơn hàng phù hợp với mã và số điện thoại đã cung cấp.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlOrderCode && urlPhone) {
      fetchTracking(urlOrderCode, urlPhone);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchTracking();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(d);
  };

  const getStepStatus = (stepKey, currentStatus) => {
    if (currentStatus === 'CANCELLED') return 'cancelled';

    const orderStatusOrder = ['PENDING', 'PROCESSING', 'READY_FOR_SHIPPING', 'SHIPPING', 'COMPLETED'];
    const currentIndex = orderStatusOrder.indexOf(currentStatus);
    const stepIndex = orderStatusOrder.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const isClickAndCollect =
    order?.orderType === 'CLICK_COLLECT' ||
    (typeof order?.customerInfo?.address === 'string' &&
      (order.customerInfo.address.includes('Click & Collect') ||
        order.customerInfo.address.includes('[Nhận tại cửa hàng]')));

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-slate-400 flex items-center gap-1.5">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-bold">Tra cứu đơn hàng</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 max-w-xl z-10 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <Package className="w-3.5 h-3.5" />
            Tra cứu đơn hàng công khai
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Theo dõi tiến trình đơn hàng
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Nhập Mã đơn hàng và Số điện thoại đã đặt để kiểm tra tình trạng chuẩn bị máy, vận chuyển hoặc sẵn sàng nhận tại quầy.
          </p>
        </div>

        <div className="hidden lg:block shrink-0 z-10">
          <div className="w-24 h-24 rounded-3xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
            <Truck className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Search Input Form */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Mã đơn hàng <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Package className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: ORD-B2C-261103-002"
                  className="w-full h-11 pl-10 pr-4 text-sm font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Số điện thoại người nhận <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0988776655"
                  className="w-full h-11 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ĐANG TRA CỨU...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>TRA CỨU TIẾN ĐỘ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tracking Result View */}
      {order && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-8 animate-fade-in">
          {/* Top Order Overview Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {order.orderCode}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    order.orderStatus === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.orderStatus === 'CANCELLED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {order.orderStatus === 'PENDING' && 'Tiếp nhận đơn'}
                  {order.orderStatus === 'PROCESSING' && 'Đang chuẩn bị hàng'}
                  {order.orderStatus === 'READY_FOR_SHIPPING' && 'Sẵn sàng giao / nhận'}
                  {order.orderStatus === 'SHIPPING' && 'Đang vận chuyển'}
                  {order.orderStatus === 'COMPLETED' && 'Đã hoàn tất'}
                  {order.orderStatus === 'CANCELLED' && 'Đã hủy đơn'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                  {isClickAndCollect ? 'Nhận tại cửa hàng' : 'Giao hàng tận nơi'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Thời gian đặt: {formatDate(order.createdAt)}</span>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 block font-medium">Tổng giá trị đơn hàng</span>
              <span className="text-2xl font-black text-blue-600">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          {order.orderStatus !== 'CANCELLED' ? (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tiến độ xử lý đơn hàng
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {ORDER_STEPS.map((step, idx) => {
                  const status = getStepStatus(step.key, order.orderStatus);
                  return (
                    <div
                      key={step.key}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        status === 'completed'
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : status === 'current'
                            ? 'bg-blue-50/80 border-blue-400 text-blue-900 ring-2 ring-blue-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            status === 'completed'
                              ? 'bg-emerald-600 text-white'
                              : status === 'current'
                                ? 'bg-blue-600 text-white animate-pulse'
                                : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {status === 'completed' ? '✓' : idx + 1}
                        </div>
                        <span className="text-xs font-bold leading-tight truncate">{step.label}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed line-clamp-2">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Đơn hàng này đã bị hủy</p>
                <p className="text-rose-600 text-[11px]">
                  Vui lòng liên hệ tổng đài 1800 6868 nếu quý khách cần hỗ trợ thêm thông tin.
                </p>
              </div>
            </div>
          )}

          {/* Delivery & Showroom Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer & Shipping info */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Thông tin nhận hàng</span>
              </h4>
              <div className="space-y-1.5 text-slate-700">
                <p>
                  <strong className="text-slate-900">Người nhận:</strong> {order.customerInfo?.fullName}
                </p>
                <p>
                  <strong className="text-slate-900">Số điện thoại:</strong> {order.customerInfo?.phone}
                </p>
                <p>
                  <strong className="text-slate-900">Địa chỉ:</strong> {order.customerInfo?.address}
                </p>
              </div>
            </div>

            {/* Branch and Payment info */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-600" />
                <span>Chi nhánh & Thanh toán</span>
              </h4>
              <div className="space-y-1.5 text-slate-700">
                {order.branch && (
                  <p>
                    <strong className="text-slate-900">Chi nhánh xử lý:</strong> {order.branch.name}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <strong className="text-slate-900">Hình thức thanh toán:</strong>
                  <span className="inline-flex items-center gap-1 font-bold">
                    {order.paymentMethod === 'VNPAY' ? (
                      <>
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" /> VNPAY Sandbox
                      </>
                    ) : (
                      <>
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Tiền mặt (CASH / COD)
                      </>
                    )}
                  </span>
                </p>
                <p>
                  <strong className="text-slate-900">Trạng thái thanh toán:</strong>{' '}
                  <span
                    className={`font-bold ${
                      order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán (Thanh toán khi nhận)'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Purchased Items Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Chi tiết sản phẩm ({order.items?.length || 0})
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {(order.items || []).map((it, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm">{it.productName}</p>
                    <p className="text-slate-400 font-mono text-[11px]">SKU: {it.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">
                      {it.quantity} x {formatPrice(it.unitPrice)}
                    </p>
                    <p className="text-blue-600 font-black">{formatPrice(it.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Sản phẩm chính hãng kèm bảo hành điện tử 12 tháng tại hệ thống TechOne.</span>
            </div>
            <Link
              to="/warranty-check"
              className="text-blue-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>Tra cứu bảo hành e-Warranty</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;
