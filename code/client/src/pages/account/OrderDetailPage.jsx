import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Store,
  MapPin,
  Phone,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { orderService } from '../../features/orders/services/orderService.js';

export const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    const fetchOrderDetail = async () => {
      try {
        setError('');
        const detail = await orderService.getMyOrderDetail(id);
        if (!ignore) {
          setOrder(detail);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Không thể tải chi tiết đơn hàng.'
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchOrderDetail();
    return () => {
      ignore = true;
    };
  }, [id]);

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

  // 4-step Stepper Progress calculation
  const getStepProgress = (status) => {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'PROCESSING':
        return 2;
      case 'COMPLETED':
        return 4;
      default:
        return 1;
    }
  };

  const steps = [
    { step: 1, label: 'Đã đặt hàng', desc: 'Đơn hàng đã được tiếp nhận' },
    { step: 2, label: 'Xác nhận & Phân bổ', desc: 'Chi nhánh đã kiểm tra và chuẩn bị máy' },
    { step: 3, label: 'Đang vận chuyển', desc: 'Kiện hàng đang trên đường giao' },
    { step: 4, label: 'Giao thành công', desc: 'Hoàn tất đơn hàng & kích hoạt bảo hành' }
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-semibold">Đang tải chi tiết đơn hàng...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs max-w-md mx-auto mb-6">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
          <p className="font-bold text-sm">Không tìm thấy đơn hàng</p>
          <p className="mt-1">{error || 'Đơn hàng không tồn tại hoặc bạn không có quyền xem.'}</p>
        </div>
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách đơn hàng</span>
        </Link>
      </div>
    );
  }

  const currentStep = getStepProgress(order.orderStatus);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Back & Code */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/account/orders"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Mã đơn hàng:</span>
              <span className="font-mono font-black text-lg text-blue-600">
                {order.orderCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Thời gian đặt: {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-black ${
              order.orderStatus === 'COMPLETED'
                ? 'bg-emerald-100 text-emerald-800'
                : order.orderStatus === 'PROCESSING'
                ? 'bg-blue-100 text-blue-800'
                : order.orderStatus === 'CANCELLED'
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {order.orderStatus === 'COMPLETED'
              ? 'ĐÃ HOÀN TẤT'
              : order.orderStatus === 'PROCESSING'
              ? 'ĐANG XỬ LÝ'
              : order.orderStatus === 'CANCELLED'
              ? 'ĐÃ HỦY'
              : 'CHỜ THANH TOÁN'}
          </span>
        </div>
      </div>

      {/* 4-Step Stepper Card */}
      {order.orderStatus !== 'CANCELLED' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
            Tiến độ đơn hàng
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            {steps.map((st) => {
              const isPassed = currentStep >= st.step;
              const isCurrent = currentStep === st.step;

              return (
                <div key={st.step} className="flex flex-col items-start gap-2 relative">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                        isPassed
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : st.step}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-blue-600'
                          : isPassed
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-9 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Info Grid (Fulfillment & Payment) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Branch / Fulfillment Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Store className="w-4 h-4 text-blue-600" />
            <span>Chi nhánh phục vụ</span>
          </div>

          {order.branchId ? (
            <div className="space-y-2 text-xs text-slate-600">
              <p className="font-bold text-slate-900 text-sm">{order.branchId.name}</p>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{order.branchId.address}</span>
              </div>
              {order.branchId.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold">{order.branchId.phone}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Đơn hàng phân bổ tự động từ kho tổng.</p>
          )}

          {/* Customer / Delivery Info */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-900 block mb-1">Thông tin nhận hàng:</span>
            <p>
              <span className="text-slate-400">Người nhận:</span>{' '}
              <span className="font-semibold text-slate-800">
                {order.customerInfo?.fullName || 'Khách hàng'}
              </span>
            </p>
            <p>
              <span className="text-slate-400">Số điện thoại:</span>{' '}
              <span className="font-semibold text-slate-800">
                {order.customerInfo?.phone || '—'}
              </span>
            </p>
            <p>
              <span className="text-slate-400">Địa chỉ giao:</span>{' '}
              <span className="font-semibold text-slate-800">
                {order.customerInfo?.address || 'Nhận tại cửa hàng (Click & Collect)'}
              </span>
            </p>
          </div>
        </div>

        {/* Payment Summary Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Thanh toán & Hóa đơn</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Phương thức thanh toán:</span>
              <span className="font-bold text-slate-900 uppercase">
                {order.paymentMethod || 'CASH'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Trạng thái thanh toán:</span>
              <span
                className={`font-bold ${
                  order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển:</span>
              <span className="font-bold text-emerald-600">Miễn phí</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Tổng thanh toán:</span>
              <span className="text-2xl font-black text-blue-600">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Items Table with Serial / IMEI & Warranty Link */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span>Danh sách sản phẩm ({order.items?.length || 0})</span>
          </h2>
          <span className="text-xs text-slate-400">Kèm mã kích hoạt bảo hành điện tử</span>
        </div>

        <div className="divide-y divide-slate-100">
          {order.items?.map((item, idx) => (
            <div key={idx} className="py-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-bold text-sm text-slate-900">{item.productName}</p>
                  <p className="text-xs text-slate-400 font-mono">Mã SKU: {item.sku}</p>
                </div>

                <div className="flex items-center gap-6 text-xs text-right">
                  <div>
                    <span className="text-slate-400">Đơn giá:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {formatPrice(item.unitPrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">SL:</span>{' '}
                    <span className="font-bold text-slate-900">{item.quantity}</span>
                  </div>
                  <div className="min-w-[120px]">
                    <span className="text-slate-400 block text-[10px]">Thành tiền:</span>
                    <span className="text-sm font-black text-blue-600">
                      {formatPrice(item.subtotal || item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Serial Numbers and Warranty CTA */}
              {item.serialsAssigned && item.serialsAssigned.length > 0 && (
                <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Serial/IMEI máy đã bàn giao:</span>
                    </span>
                    {item.serialsAssigned.map((serial, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-1 rounded-lg bg-white border border-purple-300 font-mono text-xs font-bold text-purple-800 shadow-2xs"
                      >
                        {serial}
                      </span>
                    ))}
                  </div>

                  {item.serialsAssigned.map((serial, sIdx) => (
                    <Link
                      key={sIdx}
                      to={`/warranty-check?serial=${encodeURIComponent(serial)}`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      <span>Tra cứu bảo hành</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
