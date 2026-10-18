import { useState } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Check,
  ShoppingBag,
  Package,
  MapPin,
  Clock,
  Store,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

export const CheckoutSuccessPage = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);

  // Get order data from router state or fallback to query params
  const orderState = location.state?.order || null;
  const orderCode =
    orderState?.orderCode || searchParams.get('orderCode') || '';
  const totalAmount =
    orderState?.finalAmount ||
    orderState?.totalAmount ||
    (searchParams.get('vnp_Amount') ? Number(searchParams.get('vnp_Amount')) : 0);

  const customerInfo = orderState?.shippingAddress || orderState?.customerInfo || {
    fullName: searchParams.get('customerName') || 'Khách hàng',
    phone: searchParams.get('phone') || '',
    address: searchParams.get('address') || ''
  };

  const isClickAndCollect =
    !orderState?.shippingAddress ||
    (typeof orderState?.shippingAddress === 'string' &&
      orderState?.shippingAddress?.includes('Click & Collect')) ||
    (typeof customerInfo.address === 'string' &&
      customerInfo.address?.includes('Click & Collect'));

  // VNPay query verification
  const vnpResponseCode = searchParams.get('vnp_ResponseCode');
  const vnpTransactionNo = searchParams.get('vnp_TransactionNo');
  const vnpBankCode = searchParams.get('vnp_BankCode');
  const isVnpaySuccess = vnpResponseCode === '00';
  const isVnpayFailed = vnpResponseCode !== null && vnpResponseCode !== '00';

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(orderCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Central Success Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xl shadow-slate-200/40 text-center space-y-6">
        {/* Animated Badge Icon */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg ${
            isVnpayFailed
              ? 'bg-amber-100 text-amber-600 shadow-amber-500/20'
              : 'bg-emerald-100 text-emerald-600 shadow-emerald-500/20'
          }`}
        >
          {isVnpayFailed ? (
            <AlertTriangle className="w-12 h-12" />
          ) : (
            <CheckCircle2 className="w-12 h-12" />
          )}
        </div>

        <div>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border mb-2 ${
              isVnpayFailed
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {isVnpayFailed
              ? 'Đơn hàng đã ghi nhận (Chờ thanh toán)'
              : 'Thanh toán & Đặt hàng hoàn tất'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isVnpayFailed
              ? 'Đơn hàng của bạn đã được tiếp nhận!'
              : 'Cảm ơn bạn đã mua sắm tại TechStore!'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
            {isVnpayFailed
              ? 'Giao dịch qua VNPAY chưa hoàn tất. Nhân viên TechStore sẽ liên hệ xác nhận để bạn thanh toán tiền mặt khi nhận hàng (COD).'
              : 'Đơn hàng của bạn đã được xác nhận và đang được chi nhánh chuẩn bị sản phẩm kèm phiếu bảo hành điện tử.'}
          </p>
        </div>

        {/* VNPay Payment Notice Box */}
        {isVnpaySuccess && (
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 max-w-lg mx-auto text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Thanh toán VNPAY thành công</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Đã thanh toán
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-blue-100">
              {vnpTransactionNo && (
                <div>
                  <span className="text-slate-400 block">Mã giao dịch VNPAY:</span>
                  <span className="font-mono font-bold text-slate-800">{vnpTransactionNo}</span>
                </div>
              )}
              {vnpBankCode && (
                <div>
                  <span className="text-slate-400 block">Ngân hàng thanh toán:</span>
                  <span className="font-bold text-slate-800">{vnpBankCode}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Meta Box */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-lg mx-auto space-y-3 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block uppercase">
                Mã đơn hàng
              </span>
              <span className="font-mono font-black text-base text-blue-600">
                {orderCode || 'ORD-TECHSTORE'}
              </span>
            </div>
            {orderCode && (
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép mã</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Người nhận:</span>
              <span className="font-bold text-slate-800">{customerInfo.fullName || 'Khách hàng'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Số điện thoại:</span>
              <span className="font-bold text-slate-800">{customerInfo.phone || 'Đã ghi nhận'}</span>
            </div>
          </div>

          {totalAmount > 0 && (
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-600">Tổng thanh toán:</span>
              <span className="text-xl font-black text-blue-600">{formatPrice(totalAmount)}</span>
            </div>
          )}
        </div>

        {/* Fulfillment Instructions Card */}
        <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-left max-w-lg mx-auto space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
            <Store className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Phương thức nhận hàng: {isClickAndCollect ? 'Nhận tại cửa hàng (Click & Collect)' : 'Giao hàng tận nơi'}</span>
          </div>

          {isClickAndCollect ? (
            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800">Chi nhánh nhận máy:</strong> TechStore chi nhánh đã chọn
                </span>
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Hàng sẵn sàng nhận sau: <strong>15 - 30 phút</strong> từ khi đặt đơn</span>
              </p>
              <p className="text-[11px] text-blue-700 bg-white/80 p-2.5 rounded-xl border border-blue-200 font-medium">
                💡 Khi đến quầy thu ngân, vui lòng xuất trình <strong>Mã đơn hàng {orderCode}</strong> để nhân viên bàn giao máy kèm kích hoạt bảo hành điện tử.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 text-xs text-slate-600">
              {customerInfo.address && (
                <p className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-800">Giao đến:</strong> {customerInfo.address}
                  </span>
                </p>
              )}
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Thời gian giao hàng dự kiến: <strong>2h - 48h</strong> làm việc</span>
              </p>
            </div>
          )}
        </div>

        {/* Next Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            to="/account/orders"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
          >
            <Package className="w-4 h-4" />
            <span>THEO DÕI ĐƠN HÀNG</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>TIẾP TỤC MUA SẮM</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
