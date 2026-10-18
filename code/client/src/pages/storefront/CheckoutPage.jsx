import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  Truck,
  Store,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  ArrowLeft,
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  User,
  FileText
} from 'lucide-react';
import { clearCart } from '../../store/slices/cartSlice.js';
import { branchService } from '../../features/branches/services/branchService.js';
import { orderService } from '../../features/orders/services/orderService.js';
import { toB2cCheckoutPayload } from '../../features/orders/services/orderAdapter.js';

export const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, totalAmount, totalQuantity } = useSelector((state) => state.cart);
  const authUser = useSelector((state) => state.auth?.user);

  // Delivery options: 'DELIVERY' (Giao tận nơi) hoặc 'CLICK_COLLECT' (Nhận tại cửa hàng)
  const [deliveryType, setDeliveryType] = useState('DELIVERY');
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Customer form inputs
  const [fullName, setFullName] = useState(authUser?.fullName || '');
  const [phone, setPhone] = useState(authUser?.phone || '');
  const [address, setAddress] = useState(authUser?.address || '');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    const fetchBranches = async () => {
      try {
        const list = await branchService.getBranches();
        if (!ignore && list && list.length > 0) {
          setBranches(list);
          setSelectedBranchId(list[0]._id);
        }
      } catch (err) {
        console.warn('Failed to load branches for checkout:', err);
      }
    };

    fetchBranches();
    return () => {
      ignore = true;
    };
  }, []);

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(val || 0);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Giỏ hàng của bạn đang trống, vui lòng chọn sản phẩm trước khi thanh toán.');
      return;
    }

    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên người nhận hàng');
      return;
    }

    const cleanPhone = phone.trim();
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      setError('Số điện thoại không hợp lệ (Phải là 10 chữ số di động tại Việt Nam: 03x, 05x, 07x, 08x, 09x)');
      return;
    }

    let finalAddress = '';
    const chosenBranch = branches.find((b) => b._id === selectedBranchId) || branches[0];

    if (deliveryType === 'CLICK_COLLECT') {
      if (!selectedBranchId) {
        setError('Vui lòng chọn chi nhánh cửa hàng bạn muốn đến nhận máy');
        return;
      }
      finalAddress = `[Nhận tại cửa hàng] ${chosenBranch?.name || 'Chi nhánh'} - ${chosenBranch?.address || ''}${note ? ` (Ghi chú: ${note})` : ''}`;
    } else {
      if (!address.trim()) {
        setError('Vui lòng nhập địa chỉ giao hàng chi tiết (Số nhà, đường, phường/xã, quận/huyện)');
        return;
      }
      finalAddress = `${address.trim()}${note ? ` (Ghi chú: ${note})` : ''}`;
    }

    try {
      setLoading(true);

      const payload = toB2cCheckoutPayload(
        { items, selectedBranchId: selectedBranchId || chosenBranch?._id },
        {
          fullName: fullName.trim(),
          phone: cleanPhone,
          address: finalAddress,
          branchId: selectedBranchId || chosenBranch?._id,
          paymentMethod
        }
      );

      const createdOrder = await orderService.createB2cOrder(payload);

      // Nếu chọn thanh toán VNPAY
      if (paymentMethod === 'VNPAY') {
        try {
          const vnpayRes = await orderService.createVnpayUrl(createdOrder._id || createdOrder.id);
          if (vnpayRes?.paymentUrl) {
            dispatch(clearCart());
            window.location.href = vnpayRes.paymentUrl;
            return;
          }
        } catch (vnpayErr) {
          console.warn('Lỗi tạo URL thanh toán VNPay, chuyển hướng trang thành công:', vnpayErr);
        }
      }

      // Thanh toán tiền mặt (CASH) hoặc fallback
      dispatch(clearCart());
      navigate('/checkout/success', {
        state: { order: createdOrder }
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Không thể hoàn tất đặt hàng. Vui lòng kiểm tra lại kết nối hoặc tồn kho chi nhánh.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-10 shadow-xs max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Giỏ hàng của bạn đang trống</h2>
          <p className="text-xs text-slate-500">
            Hiện không có sản phẩm nào để thanh toán. Hãy chọn các thiết bị công nghệ bạn yêu thích nhé!
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tiếp tục mua sắm</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-slate-400 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <Link to="/cart" className="hover:text-blue-600 transition-colors">
          Giỏ hàng
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-slate-800 font-bold">Thanh toán & Đặt hàng</span>
      </nav>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Xác Nhận & Đặt Hàng
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Hoàn tất các bước dưới đây để nhân viên xuất kho và bàn giao thiết bị công nghệ chính hãng đến bạn.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      <form onSubmit={handleCheckoutSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI (7 CỘT): THÔNG TIN GIAO HÀNG & THANH TOÁN */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Chọn hình thức nhận hàng */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Phương thức nhận hàng
                </h2>
              </div>

              {/* Tabs Delivery Mode */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType('DELIVERY')}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    deliveryType === 'DELIVERY'
                      ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      deliveryType === 'DELIVERY'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">
                      Giao tận nơi
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Giao hàng nhanh 2h - 48h toàn quốc
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('CLICK_COLLECT')}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    deliveryType === 'CLICK_COLLECT'
                      ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      deliveryType === 'CLICK_COLLECT'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">
                      Nhận tại cửa hàng
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Click & Collect sau 15-30 phút
                    </div>
                  </div>
                </button>
              </div>

              {/* Chi nhánh nhận máy (Khi chọn Click & Collect) */}
              {deliveryType === 'CLICK_COLLECT' && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Chọn chi nhánh TechOne gần bạn nhất
                  </label>
                  <div className="space-y-2">
                    {branches.map((b) => (
                      <label
                        key={b._id}
                        className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                          selectedBranchId === b._id
                            ? 'border-blue-600 bg-blue-50/40 text-blue-950 font-medium'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="branchSelection"
                          value={b._id}
                          checked={selectedBranchId === b._id}
                          onChange={() => setSelectedBranchId(b._id)}
                          className="mt-1 text-blue-600 cursor-pointer"
                        />
                        <div className="flex-1 text-xs">
                          <div className="font-bold flex items-center gap-2">
                            <span>{b.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                              Có sẵn hàng
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{b.address}</span>
                          </div>
                          {b.phone && (
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Hotline: {b.phone}</span>
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Thông tin người nhận */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Thông tin người nhận
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Họ và tên người nhận <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Số điện thoại <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0909123456"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Địa chỉ giao hàng khi chọn Giao tận nơi */}
              {deliveryType === 'DELIVERY' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Địa chỉ nhận hàng chi tiết <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                    required={deliveryType === 'DELIVERY'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ghi chú đơn hàng (Tùy chọn)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* 3. Phương thức thanh toán */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Phương thức thanh toán
                </h2>
              </div>

              <div className="space-y-3">
                {/* VNPAY QR */}
                <label
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                    paymentMethod === 'VNPAY'
                      ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPAY"
                    checked={paymentMethod === 'VNPAY'}
                    onChange={() => setPaymentMethod('VNPAY')}
                    className="mt-1 text-blue-600 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs text-slate-900">
                        Cổng thanh toán điện tử VNPAY (QR / ATM / Visa)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        Khuyên dùng
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Quét mã VNPAY QR bằng App Ngân hàng hoặc thanh toán bằng thẻ ATM nội địa, thẻ quốc tế an toàn tuyệt đối.
                    </p>
                  </div>
                </label>

                {/* Tiền mặt / COD */}
                <label
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                    paymentMethod === 'CASH'
                      ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH"
                    checked={paymentMethod === 'CASH'}
                    onChange={() => setPaymentMethod('CASH')}
                    className="mt-1 text-blue-600 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                        <Banknote className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs text-slate-900">
                        {deliveryType === 'CLICK_COLLECT'
                          ? 'Thanh toán tiền mặt trực tiếp tại quầy thu ngân'
                          : 'Thanh toán tiền mặt khi nhận hàng (COD)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Kiểm tra thiết bị nguyên seal, đồng kiểm cùng nhân viên trước khi thanh toán.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (5 CỘT): TÓM TẮT ĐƠN HÀNG */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">
                  Tóm tắt đơn hàng ({totalQuantity} sản phẩm)
                </h3>
                <Link
                  to="/cart"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Sửa giỏ hàng
                </Link>
              </div>

              {/* Items List */}
              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.productSkuId}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 line-clamp-1 max-w-[200px]">
                          {item.productName}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          SL: {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculation Summary */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span className="font-bold text-slate-900">{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí giao hàng:</span>
                  <span className="font-bold text-emerald-600">Miễn phí toàn quốc</span>
                </div>
                <div className="flex justify-between">
                  <span>Bảo hành điện tử:</span>
                  <span className="font-bold text-blue-600">Kích hoạt theo Serial/IMEI</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Tổng thanh toán:</span>
                  <span className="text-2xl font-black text-blue-600">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý đơn hàng...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {paymentMethod === 'VNPAY'
                        ? 'THANH TOÁN QUA VNPAY'
                        : 'XÁC NHẬN ĐẶT HÀNG (COD)'}
                    </span>
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>100% Sản phẩm chính hãng - Quản lý Serial/IMEI khép kín</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Hỗ trợ 1 đổi 1 trong 30 ngày nếu phát sinh lỗi kỹ thuật</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
