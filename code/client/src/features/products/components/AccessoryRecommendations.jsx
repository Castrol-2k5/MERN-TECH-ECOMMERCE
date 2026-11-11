import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Sparkles, Plus, Check, ShoppingBag } from 'lucide-react';
import productService from '../services/productService.js';
import { createCartItem } from '../services/productAdapter.js';
import { addToCart } from '../../../store/slices/cartSlice.js';

const formatPrice = (val) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(val || 0);

export const AccessoryRecommendations = ({
  productIds = [],
  branchId = null,
  limit = 4,
  title = 'Phụ kiện mua kèm phù hợp',
  subtitle = 'Gợi ý thiết bị âm thanh & phụ kiện tương thích sẵn sàng giao ngay',
}) => {
  const dispatch = useDispatch();
  const [recommendations, setRecommendations] = useState([]);
  const [addedIds, setAddedIds] = useState({});

  const productIdsKey = useMemo(
    () =>
      Array.from(new Set((productIds || []).map(String).filter((id) => /^[0-9a-fA-F]{24}$/.test(id))))
        .sort()
        .join(','),
    [productIds]
  );

  useEffect(() => {
    if (!productIdsKey) return;

    let cancelled = false;
    productService
      .getRecommendations({ productIds: productIdsKey, limit, branchId })
      .then((list) => {
        if (!cancelled) {
          setRecommendations(Array.isArray(list) ? list : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecommendations([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productIdsKey, limit, branchId]);

  if (!productIdsKey || recommendations.length === 0) {
    return null;
  }

  const handleQuickAdd = (product) => {
    const activeSku = product.skus?.find((s) => s.isActive !== false) || product.skus?.[0];
    if (!activeSku) return;

    const item = createCartItem({ product, activeSku, quantity: 1 });
    dispatch(addToCart(item));

    const key = String(product._id || product.id);
    setAddedIds((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [key]: false }));
    }, 1500);
  };

  return (
    <section className="my-8 bg-slate-50/90 rounded-3xl border border-slate-200/80 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gợi ý thông minh</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map((prod) => {
          const prodId = String(prod._id || prod.id);
          const isAdded = Boolean(addedIds[prodId]);
          const hasStock = prod.availableStock === undefined || prod.availableStock > 0;

          return (
            <div
              key={prodId}
              className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex flex-col justify-between gap-3 shadow-xs hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Link
                  to={`/product/${prod.slug}`}
                  className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 p-1.5 shrink-0 flex items-center justify-center overflow-hidden"
                >
                  {prod.images?.[0] ? (
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-slate-300" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  {prod.categoryName && (
                    <span className="inline-block text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mb-1">
                      {prod.categoryName}
                    </span>
                  )}
                  <Link
                    to={`/product/${prod.slug}`}
                    className="block text-xs font-bold text-slate-900 line-clamp-2 hover:text-blue-600 transition-colors"
                  >
                    {prod.name}
                  </Link>
                  <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-blue-600">
                      {formatPrice(prod.price)}
                    </span>
                    {prod.originalPrice > prod.price && (
                      <span className="text-[10px] text-slate-400 line-through">
                        {formatPrice(prod.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <span
                  className={`text-[10px] font-semibold ${
                    hasStock ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {prod.availableStock > 0
                    ? `Còn ${prod.availableStock} sp`
                    : 'Liên hệ chi nhánh'}
                </span>
                <button
                  type="button"
                  disabled={!hasStock}
                  onClick={() => handleQuickAdd(prod)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                    !hasStock
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : isAdded
                      ? 'bg-emerald-600 text-white cursor-pointer'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white cursor-pointer'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã thêm</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm vào giỏ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AccessoryRecommendations;
