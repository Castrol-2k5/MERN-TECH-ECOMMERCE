import { useMemo } from 'react';
import { Package, Hash, AlertTriangle, Info, Layers } from 'lucide-react';

export const PosProductCatalog = ({ products = [], onSelectProduct, onViewSpec, loading = false }) => {
  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

  // Gom nhóm các SKU cùng một sản phẩm thành 1 thẻ sản phẩm chung
  const groupedProducts = useMemo(() => {
    const map = new Map();
    products.forEach((item) => {
      const prodKey = String(item._id || item.productId || item.skuId || item.sku);
      if (!map.has(prodKey)) {
        map.set(prodKey, {
          ...item,
          _id: prodKey,
          variants: [item],
          totalStock: Math.max(0, Number(item.stock || 0)),
          minPrice: Number(item.price || 0),
          maxPrice: Number(item.price || 0)
        });
      } else {
        const group = map.get(prodKey);
        group.variants.push(item);
        group.totalStock += Math.max(0, Number(item.stock || 0));
        const p = Number(item.price || 0);
        if (p < group.minPrice) group.minPrice = p;
        if (p > group.maxPrice) group.maxPrice = p;
        if (!group.image && item.image) group.image = item.image;
      }
    });
    return Array.from(map.values()).map((g) => ({
      ...g,
      stock: g.totalStock
    }));
  }, [products]);

  if (loading) {
    return (
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-3 animate-pulse h-44"></div>
        ))}
      </div>
    );
  }

  if (groupedProducts.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Package className="w-12 h-12 mx-auto mb-2 text-slate-600" />
        <p className="font-medium text-slate-300">Không tìm thấy sản phẩm phù hợp</p>
        <p className="text-xs text-slate-500 mt-1">Vui lòng quét mã vạch hoặc đổi từ khóa tìm kiếm</p>
      </div>
    );
  }

  return (
    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
      {groupedProducts.map((product) => {
        const isOutOfStock = product.totalStock <= 0;
        const isLowStock = product.totalStock > 0 && product.totalStock <= 5;
        const variantCount = product.variants.length;

        return (
          <div
            key={product._id}
            onClick={() => !isOutOfStock && onSelectProduct(product)}
            className={`group bg-slate-900 border rounded-xl p-3 flex flex-col justify-between transition-all select-none relative ${
              isOutOfStock
                ? 'opacity-50 border-slate-800 cursor-not-allowed'
                : 'border-slate-800 hover:border-blue-500/80 hover:bg-slate-850 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer active:scale-[0.98]'
            }`}
          >
            {/* Top info: Badge Serial, Tổng tồn kho & Nút Spec Sheet */}
            <div className="flex items-center justify-between gap-1 mb-2.5">
              <div className="flex items-center gap-1">
                {product.hasSerial ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                    <Hash className="w-2.5 h-2.5" />
                    SERIAL
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                    SỐ LƯỢNG
                  </span>
                )}
                {variantCount > 1 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-0.5">
                    <Layers className="w-2.5 h-2.5" />
                    {variantCount} SKU
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    isOutOfStock
                      ? 'bg-rose-500/20 text-rose-400'
                      : isLowStock
                        ? 'bg-amber-500/20 text-amber-400 flex items-center gap-0.5'
                        : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {isLowStock && <AlertTriangle className="w-2.5 h-2.5" />}
                  Tổng kho: {product.totalStock}
                </span>

                {onViewSpec && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewSpec(product);
                    }}
                    title="Xem nhanh thông số & tồn kho từng biến thể"
                    className="p-1 rounded-md bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Thumbnail + Details */}
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-12 h-12 rounded-lg bg-slate-950 p-1 border border-slate-800 shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/100x100/1e293b/94a3b8?text=SP';
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-xs text-slate-200 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
                  {product.name}
                </h4>
                <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                  {variantCount > 1 ? `${variantCount} biến thể khả dụng` : product.sku}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-blue-400 font-mono truncate">
                {product.minPrice === product.maxPrice
                  ? formatPrice(product.minPrice)
                  : `${formatPrice(product.minPrice)} – ${formatPrice(product.maxPrice)}`}
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-200 font-medium shrink-0">
                {variantCount > 1 ? '+ Chọn SKU' : '+ Chọn'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PosProductCatalog;
