import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, Scale, Check } from 'lucide-react';
import { addToCart } from '../../../store/slices/cartSlice.js';
import { addToCompare, removeFromCompare } from '../../../store/slices/compareSlice.js';

export const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const compareList = useSelector((state) => state.compare.products);
  const isCompared = compareList.some((p) => (p._id || p.id) === (product._id || product.id));

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val || 0);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const sku = product.skus?.[0];
    dispatch(
      addToCart({
        productId: product._id || product.id,
        productSkuId: sku?._id || `sku-${product._id || product.id}`,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        quantity: 1,
      })
    );
  };

  const handleToggleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompared) {
      dispatch(removeFromCompare(product._id || product.id));
    } else {
      dispatch(addToCompare(product));
    }
  };

  const isOutOfStock = product.stockStatus === 'OUT_OF_STOCK_ONLINE';

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 p-4 transition-all duration-200 hover:shadow-xl hover:border-blue-200 flex flex-col justify-between">
      <div className="relative w-full aspect-4/3 rounded-xl bg-slate-50 overflow-hidden mb-3.5 flex items-center justify-center">
        {product.discountPercentage > 0 && (
          <span className="absolute top-2.5 left-2.5 z-10 px-2 py-1 bg-red-600 text-white text-[11px] font-bold rounded-lg shadow-xs">
            -{product.discountPercentage}%
          </span>
        )}

        <button
          onClick={handleToggleCompare}
          className={`absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg border transition-all cursor-pointer ${
            isCompared
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white/90 backdrop-blur-xs text-slate-500 border-slate-200 hover:text-blue-600'
          }`}
          title={isCompared ? 'Đã thêm vào so sánh' : 'Thêm vào so sánh'}
        >
          {isCompared ? <Check className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
        </button>

        <Link to={`/product/${product.slug}`} className="w-full h-full flex items-center justify-center">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'}
            alt={product.name}
            className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
      </div>

      <div className="flex-1 flex flex-col">
        <Link to={`/product/${product.slug}`} className="block">
          <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[40px] leading-snug">
            {product.name}
          </h3>
        </Link>

        {product.specsSummary && (
          <p className="text-[12px] text-slate-500 mt-1.5 line-clamp-1">
            {product.specsSummary}
          </p>
        )}

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            {product.originalPrice > product.price && (
              <span className="text-[11px] text-slate-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            <span className="text-base font-extrabold text-blue-600 leading-tight">
              {formatPrice(product.price)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            title="Thêm vào giỏ"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center justify-between text-[11px]">
          <span
            className={`font-semibold ${
              isOutOfStock ? 'text-red-500' : 'text-emerald-600'
            }`}
          >
            ● {isOutOfStock ? 'Hết hàng online' : 'Còn hàng tại showroom'}
          </span>
          <span className="text-slate-400">Trả góp 0%</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
