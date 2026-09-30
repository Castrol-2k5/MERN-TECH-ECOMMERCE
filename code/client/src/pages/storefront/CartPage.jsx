import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, ShieldCheck } from 'lucide-react';
import {
  removeFromCart,
  updateQuantity,
  clearCart,
} from '../../store/slices/cartSlice.js';

export const CartPage = () => {
  const dispatch = useDispatch();
  const { items, totalAmount, totalQuantity } = useSelector((state) => state.cart);

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val || 0);
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
          <h2 className="text-lg font-bold text-slate-800 mb-2">Giỏ hàng của bạn đang trống</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            Hãy khám phá các thiết bị công nghệ chính hãng hàng đầu tại TechOne và thêm vào giỏ.
          </p>
          <Link
            to="/category/laptop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tiếp tục mua sắm</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items List */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.productSkuId} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-contain rounded-xl bg-slate-50 p-1 border border-slate-100 shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{item.name}</h3>
                    <p className="text-xs text-blue-600 font-extrabold mt-0.5">
                      {formatPrice(item.price)}
                    </p>
                    {item.fulfillmentType === 'CLICK_AND_COLLECT' && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded">
                        Click & Collect: {item.pickupBranch}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() =>
                        dispatch(
                          updateQuantity({
                            productSkuId: item.productSkuId,
                            quantity: item.quantity - 1,
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
                            quantity: item.quantity + 1,
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
              onClick={() => alert('Đang chuyển hướng tới cổng thanh toán.')}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition-colors cursor-pointer shadow-lg shadow-blue-600/25"
            >
              TIẾN HÀNH THANH TOÁN
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Thanh toán bảo mật SSL 256-bit</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
