import { Trash2, Plus, Minus, Hash, AlertCircle, ShoppingCart } from 'lucide-react';

export const PosCartTable = ({
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenSerialModal,
  onRemoveSerial
}) => {
  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 select-none">
        <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500 mb-3">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <p className="font-semibold text-slate-300 text-sm">Giỏ hàng đang trống</p>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Quét mã vạch [F2] hoặc chạm chọn sản phẩm từ danh mục bên trái để thêm vào đơn
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-900/60">
      {/* Header toolbar */}
      <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900">
        <span className="font-medium">
          Danh sách mặt hàng ({items.reduce((sum, it) => sum + it.quantity, 0)})
        </span>
        <button
          type="button"
          onClick={onClearCart}
          className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa giỏ</span>
        </button>
      </div>

      {/* Cart items list */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {items.map((item, idx) => {
          const serials = item.serialsAssigned || [];
          const isMissingSerials = item.hasSerial && serials.length < item.quantity;
          const lineTotal = (item.price || 0) * (item.quantity || 1);

          return (
            <div key={`${item.productId}-${item.productSkuId}`} className="p-3 hover:bg-slate-850/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                {/* Product Name & SKU */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="w-5 h-5 rounded bg-slate-800 text-slate-400 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 leading-snug">
                      {item.name}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      {item.sku}
                    </p>
                    <div className="text-xs font-mono font-semibold text-slate-300 mt-1">
                      {formatPrice(item.price)}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.productSkuId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1) {
                        onUpdateQuantity(item.productSkuId, val);
                      }
                    }}
                    className="w-9 text-center bg-transparent text-xs font-bold text-slate-100 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.productSkuId, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-right shrink-0 min-w-[90px]">
                  <div className="text-xs font-bold font-mono text-blue-400">
                    {formatPrice(lineTotal)}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.productSkuId)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors mt-1"
                    title="Xóa sản phẩm"
                  >
                    <Trash2 className="w-3.5 h-3.5 ml-auto" />
                  </button>
                </div>
              </div>

              {/* Serial Management Area (nếu thiết bị yêu cầu quản lý Serial) */}
              {item.hasSerial && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 bg-slate-950/40 -mx-3 -mb-3 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-cyan-400" />
                      Serial / IMEI:
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenSerialModal(item)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                        isMissingSerials
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {isMissingSerials ? (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Gán Serial ({serials.length}/{item.quantity})
                        </>
                      ) : (
                        `Đủ Serial (${serials.length}/${item.quantity}) • Sửa`
                      )}
                    </button>
                  </div>

                  {/* Serial chips */}
                  {serials.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {serials.map((sn) => (
                        <span
                          key={sn}
                          className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-mono text-[10px] flex items-center gap-1"
                        >
                          {sn}
                          <button
                            type="button"
                            onClick={() => onRemoveSerial(item.productSkuId, sn)}
                            className="text-cyan-400 hover:text-rose-400 ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-400/90 italic">
                      ⚠️ Bắt buộc gán mã Serial trước khi bấm thanh toán
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PosCartTable;
