import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Scale, Plus, X } from 'lucide-react';
import CompareMatrixTable from '../../features/products/components/CompareMatrixTable.jsx';
import {
  setCompareProducts,
  addToCompare,
} from '../../store/slices/compareSlice.js';
import productService, { fallbackProducts } from '../../features/products/services/productService.js';

export const ComparePage = () => {
  const dispatch = useDispatch();
  const compareProducts = useSelector((state) => state.compare.products);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (compareProducts.length === 0) {
      productService.getCompareProducts().then((initialList) => {
        dispatch(setCompareProducts(initialList));
      });
    }
  }, [compareProducts.length, dispatch]);

  const availableToAdd = fallbackProducts.filter(
    (item) => !compareProducts.some((p) => (p._id || p.id) === (item._id || item.id))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-6">
      <nav className="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-bold">So sánh cấu hình</span>
      </nav>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
          <Scale className="w-3.5 h-3.5" />
          <span>Ma trận so sánh thông số</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          So sánh chi tiết cấu hình máy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
          Đặt cạnh nhau các thông số kỹ thuật then chốt để dễ dàng lựa chọn sản phẩm phù hợp nhất với nhu cầu sử dụng của bạn.
        </p>
      </div>

      <CompareMatrixTable onAddProductClick={() => setIsAddModalOpen(true)} />

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-scale">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Thêm thiết bị vào so sánh</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {availableToAdd.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Đã thêm tất cả thiết bị có sẵn vào bảng so sánh.
                </p>
              ) : (
                availableToAdd.map((prod) => (
                  <div
                    key={prod._id || prod.id}
                    className="p-3 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 flex items-center justify-between gap-3 transition-colors"
                  >
                    <img
                      src={prod.images?.[0]}
                      alt={prod.name}
                      className="w-12 h-12 object-contain rounded-lg bg-slate-50 p-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                      <p className="text-xs text-blue-600 font-extrabold mt-0.5">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(prod.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        dispatch(addToCompare(prod));
                        setIsAddModalOpen(false);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparePage;
