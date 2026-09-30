import { Package, Hash, AlertTriangle } from 'lucide-react';

export const PosProductCatalog = ({ products = [], onSelectProduct, loading = false }) => {
  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

  if (loading) {
    return (
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-3 animate-pulse h-44"></div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Package className="w-12 h-12 mx-auto mb-2 text-slate-600" />
        <p className="font-medium text-slate-300">Không tìm thấy sản phẩm phù hợp</p>
        <p className="text-xs text-slate-500 mt-1">Vui lòng quét mã vạch hoặc đổi từ khóa tìm kiếm</p>
      </div>
    );
  }

  return (
    <div className="p-3 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
      {products.map((product) => {
        const isOutOfStock = product.stock <= 0;
        const isLowStock = product.stock > 0 && product.stock <= 5;

        return (
          <div
            key={product._id || product.sku}
            onClick={() => !isOutOfStock && onSelectProduct(product)}
            className={`group bg-slate-900 border rounded-xl p-2.5 flex flex-col justify-between transition-all select-none relative ${
              isOutOfStock
                ? 'opacity-50 border-slate-800 cursor-not-allowed'
                : 'border-slate-800 hover:border-blue-500/80 hover:bg-slate-850 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer active:scale-[0.98]'
            }`}
          >
            {/* Top info: Badge Serial & Tồn kho */}
            <div className="flex items-center justify-between gap-1 mb-2">
              {product.hasSerial ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                  <Hash className="w-2.5 h-2.5" />
                  SERIAL
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                  STANDARD
                </span>
              )}

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
                Kho: {product.stock}
              </span>
            </div>

            {/* Thumbnail + Details */}
            <div className="flex items-center gap-2.5 mb-2">
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
                <h4 className="font-semibold text-xs text-slate-200 line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
                  {product.name}
                </h4>
                <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                  {product.sku}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 font-mono">
                {formatPrice(product.price)}
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-200 font-medium">
                + Chọn
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PosProductCatalog;
