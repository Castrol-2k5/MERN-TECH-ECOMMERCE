import { Sparkles, Plus, X } from 'lucide-react';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

export const CrossSellStrip = ({
  suggestions = [],
  triggerProductName = '',
  onAddAccessory,
  onDismiss
}) => {
  if (!Array.isArray(suggestions) || suggestions.length === 0) return null;

  return (
    <div className="mx-3 mt-2 p-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2 animate-in fade-in">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-indigo-300 font-bold truncate">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">
            Gợi ý bán kèm sẵn kho cho <strong className="text-white">{triggerProductName}</strong>:
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-0.5 cursor-pointer shrink-0"
          title="Ẩn gợi ý bán kèm"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {suggestions.map((acc) => (
          <div
            key={acc.skuId || acc.sku}
            className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 flex flex-col justify-between gap-1.5"
          >
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-200 truncate" title={acc.name}>
                {acc.name}
              </div>
              <div className="flex items-center justify-between text-[10px] mt-0.5">
                <span className="font-mono font-bold text-blue-400">{formatPrice(acc.price)}</span>
                <span className="text-emerald-400 font-mono">Kho: {acc.stock}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onAddAccessory(acc)}
              className="w-full py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Thêm kèm</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CrossSellStrip;
