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
  CreditCard,
  MapPin,
  Store
} from 'lucide-react';
import {
  removeFromCart,
  updateQuantity,
  clearCart
} from '../../store/slices/cartSlice.js';
import { branchService } from '../../features/branches/services/branchService.js';

export const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalAmount, totalQuantity } = useSelector((state) => state.cart);

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    return localStorage.getItem('techone_selected_branch') || '';
  });

  useEffect(() => {
    let ignore = false;
    const loadBranches = async () => {
      try {
        const list = await branchService.getBranches();
        if (!ignore && list && list.length > 0) {
          setBranches(list);
          if (!selectedBranchId || !list.some((b) => b._id === selectedBranchId)) {
            setSelectedBranchId(list[0]._id);
            localStorage.setItem('techone_selected_branch', list[0]._id);
          }
        }
      } catch (err) {
        console.warn('[CartPage] Failed to load branches:', err);
      }
    };
    loadBranches();
    return () => {
      ignore = true;
    };
  }, [selectedBranchId]);

  const handleBranchChange = (e) => {
    const newId = e.target.value;
    setSelectedBranchId(newId);
    localStorage.setItem('techone_selected_branch', newId);
    window.dispatchEvent(new CustomEvent('techone_branch_changed', { detail: { branchId: newId } }));
  };

  const selectedBranch = branches.find((b) => b._id === selectedBranchId) || branches[0];

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(val || 0);
  };

  const handleProceedToCheckout = () => {
    navigate(`/checkout?branchId=${selectedBranchId || selectedBranch?._id || ''}`);
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
              Đơn hàng được giữ trong 30 phút • Đổi trả 30 ngày chính hãng
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

            {/* UC-CU09 Step 6: Select Branch for Pickup/Fulfillment */}
            <div className="bg-blue-50/60 rounded-3xl border border-blue-100 p-5 shadow-xs">
              <div className="flex items-center gap-2.5 mb-2.5">
                <Store className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Chi nhánh xử lý & Giao hàng
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Chọn chi nhánh TechOne gần bạn nhất để được phục vụ và giao hàng nhanh chóng:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <select
                  value={selectedBranchId}
                  onChange={handleBranchChange}
                  className="bg-white border border-blue-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-xs flex-1"
                >
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name || b.branchName}
                    </option>
                  ))}
                </select>
              </div>
              {selectedBranch?.address && (
                <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{selectedBranch.address}</span>
                </div>
              )}
            </div>
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
              {selectedBranch && (
                <div className="pt-2 border-t border-slate-100 text-slate-500">
                  <span className="block text-[11px] text-slate-400 font-semibold mb-0.5">XỬ LÝ TẠI:</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedBranch.name || selectedBranch.branchName}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-blue-600">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
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
    </div>
  );
};

export default CartPage;
