import { X, Package, Hash, CheckCircle2, AlertTriangle } from 'lucide-react';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

export const PosVariantPickerModal = ({ isOpen, onClose, groupedProduct, onSelectVariant }) => {
  if (!isOpen || !groupedProduct) return null;

  const variants = Array.isArray(groupedProduct.variants) ? groupedProduct.variants : [];
  const totalStock = variants.reduce((sum, v) => sum + Math.max(0, Number(v.stock || 0)), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl text-xs">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={groupedProduct.image}
              alt={groupedProduct.name}
              className="w-11 h-11 rounded-xl object-contain bg-slate-900 border border-slate-800 p-1 shrink-0"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/100x100/1e293b/94a3b8?text=SP';
              }}
            />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{groupedProduct.name}</h3>
              <p className="text-[11px] text-slate-400">
                {variants.length} biến thể • Tổng tồn kho:{' '}
                <span className="font-bold text-emerald-400">{totalStock}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Variant List */}
        <div className="p-4 space-y-2 max-h-[65vh] overflow-y-auto">
          {variants.map((variant) => {
            const stock = Math.max(0, Number(variant.stock || 0));
            const isOutOfStock = stock <= 0;
            const isLowStock = stock > 0 && stock <= 5;

            return (
              <button
                key={variant.skuId || variant.sku}
                type="button"
                disabled={isOutOfStock}
                onClick={() => {
                  onSelectVariant(variant);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isOutOfStock
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-50 cursor-not-allowed'
                    : 'bg-slate-950 border-slate-800 hover:border-blue-500 hover:bg-slate-800/60 cursor-pointer'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300 text-xs">{variant.sku}</span>
                    {variant.hasSerial ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 inline-flex items-center gap-0.5">
                        <Hash className="w-2.5 h-2.5" />
                        SERIAL
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 inline-flex items-center gap-0.5">
                        <Package className="w-2.5 h-2.5" />
                        SL
                      </span>
                    )}
                  </div>
                  {variant.optionLabel && (
                    <div className="text-[11px] text-slate-400 truncate">{variant.optionLabel}</div>
                  )}
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <div className="font-mono font-bold text-sm text-blue-400">{formatPrice(variant.price)}</div>
                  <div
                    className={`text-[10px] font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                      isOutOfStock
                        ? 'bg-rose-500/20 text-rose-400'
                        : isLowStock
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {isLowStock ? <AlertTriangle className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                    <span>Kho: {stock}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PosVariantPickerModal;
