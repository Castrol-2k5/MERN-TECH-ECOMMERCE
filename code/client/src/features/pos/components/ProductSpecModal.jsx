import { X, Cpu, Tag, Plus, PackageCheck } from 'lucide-react';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

const ATTRIBUTE_LABELS = {
  cpu: 'Vi xử lý (CPU)',
  ram: 'Bộ nhớ RAM',
  vga: 'Card đồ họa (GPU)',
  screen_size: 'Kích thước màn hình',
  storage: 'Ổ cứng / Bộ nhớ trong',
  refresh_rate: 'Tần số quét',
  weight: 'Trọng lượng',
  camera: 'Camera',
  chipset: 'Chipset',
  battery: 'Dung lượng Pin',
  panel_type: 'Tấm nền màn hình',
  resolution: 'Độ phân giải',
  connection: 'Kết nối'
};

export const ProductSpecModal = ({ isOpen, onClose, product, onAddToCart }) => {
  if (!isOpen || !product) return null;

  const attributes = Array.isArray(product.attributes) ? product.attributes : [];
  const isOutOfStock = Number(product.stock || 0) <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Thông Số Kỹ Thuật Tư Vấn Nhanh</h3>
              <p className="text-[11px] text-slate-400 font-mono">SKU: {product.sku}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex gap-4 items-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <img
              src={product.image}
              alt={product.name}
              className="w-20 h-20 object-contain rounded-xl bg-slate-900 border border-slate-800 p-1 shrink-0"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/100x100/1e293b/94a3b8?text=SP';
              }}
            />
            <div className="min-w-0 flex-1 space-y-1">
              {product.brand && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 text-[10px] font-bold">
                  <Tag className="w-2.5 h-2.5" />
                  {product.brand}
                </span>
              )}
              <h4 className="font-bold text-sm text-white leading-snug">{product.name}</h4>
              <div className="flex items-center justify-between pt-1">
                <span className="font-mono font-black text-base text-blue-400">
                  {formatPrice(product.price)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                    isOutOfStock
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  Tồn tại quầy: {product.stock}
                </span>
              </div>
            </div>
          </div>

          {product.description && (
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-300 leading-relaxed">
              {product.description}
            </div>
          )}

          <div>
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Bảng cấu hình chi tiết
            </h5>
            {attributes.length === 0 ? (
              <div className="p-4 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-500">
                Sản phẩm này chưa có thông số kỹ thuật chi tiết.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-800/80">
                    {attributes.map((attr, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60">
                        <td className="py-2 px-3.5 text-slate-400 font-medium w-2/5">
                          {ATTRIBUTE_LABELS[attr.key] || attr.key}
                        </td>
                        <td className="py-2 px-3.5 text-slate-100 font-semibold">
                          {attr.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => {
              onAddToCart?.(product);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {isOutOfStock ? <PackageCheck className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isOutOfStock ? 'Đã hết hàng tại quầy' : 'Thêm vào đơn bán'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSpecModal;
