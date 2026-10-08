import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Store,
  CreditCard,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import {
  removeFromCart,
  updateQuantity,
  clearCart
} from '../../store/slices/cartSlice.js';
import { toB2cCheckoutPayload } from '../../features/orders/services/orderAdapter.js';

import { branchService } from '../../features/branches/services/branchService.js';
import { orderService } from '../../features/orders/services/orderService.js';

export const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalAmount, totalQuantity } = useSelector((state) => state.cart);
  const authUser = useSelector((state) => state.auth?.user);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    fullName: authUser?.fullName || '',
    phone: authUser?.phone || '',
    address: authUser?.address || ''
  });
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    const fetchBranches = async () => {
      try {
        const list = await branchService.getBranches();
        if (!ignore) {
          setBranches(list || []);
          if (list && list.length > 0) {
            setSelectedBranchId(list[0]._id);
          }
        }
      } catch (err) {
        console.warn('Failed to load branches for cart:', err);
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

    if (!selectedBranchId) {
      setError('Vui lòng chọn chi nhánh xử lý đơn hàng');
      return;
    }
    if (!customerInfo.fullName.trim() || !customerInfo.phone.trim()) {
      setError('Vui lòng nhập Họ tên và Số điện thoại nhận hàng');
      return;
    }

    try {
      setLoading(true);
      const payload = toB2cCheckoutPayload(
        { items, selectedBranchId },
        {
          fullName: customerInfo.fullName.trim(),
          phone: customerInfo.phone.trim(),
          address: customerInfo.address.trim(),
          branchId: selectedBranchId,
          paymentMethod
        }
      );

      const createdOrder = await orderService.createB2cOrder(payload);

      dispatch(clearCart());
      setIsCheckoutModalOpen(false);

      navigate('/checkout/success', {
        state: { order: createdOrder }
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Không thể hoàn tất đặt hàng. Vui lòng kiểm tra lại tồn kho chi nhánh.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-400 mb-6 flex items-center gap-1.5">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-bold">Giỏ hàng của bạn</span>
      </nav>

      <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Giỏ hàng ({totalQuantity} sản phẩm)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Đơn hàng được giữ trong 30 phút • Kiểm tra hàng trước khi thanh toán
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => dispatch(clearCart())}
            className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
          >
            Xóa toàn bộ
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Giỏ hàng của bạn đang trống
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Hãy khám phá các thiết bị công nghệ đỉnh cao và thêm vào giỏ hàng ngay!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tiếp tục mua sắm</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => (
              <div
                key={item.productSkuId}
                className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 p-2 shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                      {item.productName}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      SKU: {item.sku}
                    </p>
                    <p className="text-xs font-semibold text-blue-600 mt-1">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() =>
                        dispatch(
                          updateQuantity({
                            productSkuId: item.productSkuId,
                            quantity: item.quantity - 1
                          })
                        )
                      }
                      className="p-1 rounded-lg bg-white text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        dispatch(
                          updateQuantity({
                            productSkuId: item.productSkuId,
                            quantity: item.quantity + 1
                          })
                        )
                      }
                      className="p-1 rounded-lg bg-white text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-black text-sm text-slate-900 min-w-[100px] text-right">
                    {formatPrice(item.price * item.quantity)}
                  </span>

                  <button
                    onClick={() => dispatch(removeFromCart(item.productSkuId))}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Xóa khỏi giỏ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary Card */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col gap-5 sticky top-28">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
              Tóm tắt đơn hàng
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Tạm tính ({totalQuantity} món):</span>
                <span className="font-bold text-slate-900">{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Phí vận chuyển:</span>
                <span className="font-bold text-emerald-600">Miễn phí</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Bảo hiểm vận chuyển:</span>
                <span className="font-bold text-slate-900">TechOne Care Free</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-blue-600">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition-colors cursor-pointer shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>TIẾN HÀNH THANH TOÁN</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Thanh toán bảo mật SSL 256-bit</span>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Xác nhận thông tin đặt hàng</span>
              </h2>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
              {/* Branch Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-blue-600" />
                  <span>Chọn Chi nhánh phục vụ / Xuất kho</span>
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-hidden focus:border-blue-600"
                  required
                >
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.address})
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ và tên người nhận
                  </label>
                  <input
                    type="text"
                    value={customerInfo.fullName}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Địa chỉ giao hàng (hoặc ghi Nhận tại quầy)
                </label>
                <input
                  type="text"
                  value={customerInfo.address}
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                      paymentMethod === 'VNPAY'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="VNPAY"
                      checked={paymentMethod === 'VNPAY'}
                      onChange={() => setPaymentMethod('VNPAY')}
                      className="text-blue-600"
                    />
                    <span>Cổng VNPAY QR</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                      paymentMethod === 'CASH'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH"
                      checked={paymentMethod === 'CASH'}
                      onChange={() => setPaymentMethod('CASH')}
                      className="text-blue-600"
                    />
                    <span>Tiền mặt khi nhận</span>
                  </label>
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">Tổng thanh toán:</span>
                <span className="font-black text-base text-blue-600">
                  {formatPrice(totalAmount)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/25 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tạo đơn...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Xác nhận đặt hàng</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
