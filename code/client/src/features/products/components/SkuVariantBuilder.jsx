import { useState } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';

export const SkuVariantBuilder = ({
  skus = [],
  options = [],
  onChangeSkus
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkuCode, setNewSkuCode] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newStock, setNewStock] = useState('10');
  const [selectedOptions, setSelectedOptions] = useState({});

  const formatVnd = (num) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  const handleAddSku = (e) => {
    e.preventDefault();
    if (!newSkuCode.trim() || !newPrice) return;

    const newSku = {
      _id: 'sku-' + Date.now(),
      code: newSkuCode.trim().toUpperCase(),
      price: parseInt(newPrice, 10) || 0,
      originalPrice: parseInt(newOriginalPrice, 10) || parseInt(newPrice, 10) || 0,
      stock: parseInt(newStock, 10) || 0,
      options: { ...selectedOptions }
    };

    onChangeSkus([...skus, newSku]);
    setNewSkuCode('');
    setNewPrice('');
    setNewOriginalPrice('');
    setSelectedOptions({});
    setShowAddModal(false);
  };

  const handleRemoveSku = (index) => {
    const updated = skus.filter((_, idx) => idx !== index);
    onChangeSkus(updated);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-100">SKU Variant Manager</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              {skus.length} BIẾN THỂ
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Quản lý mã SKU, đơn giá theo cấu hình biến thể và số lượng tồn kho khởi tạo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(!showAddModal)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer w-fit"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddModal ? 'Đóng form' : 'Tạo biến thể SKU'}</span>
        </button>
      </div>

      {/* Form Tạo biến thể mới */}
      {showAddModal && (
        <form onSubmit={handleAddSku} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 animate-in fade-in">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Thêm biến thể SKU mới cho sản phẩm</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Mã SKU duy nhất:</label>
              <input
                type="text"
                required
                value={newSkuCode}
                onChange={(e) => setNewSkuCode(e.target.value)}
                placeholder="MBA-M4-32-1TB-SL"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-cyan-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Giá bán lẻ (VND):</label>
              <input
                type="number"
                required
                min="0"
                step="50000"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="26490000"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Giá niêm yết (Gốc):</label>
              <input
                type="number"
                min="0"
                step="50000"
                value={newOriginalPrice}
                onChange={(e) => setNewOriginalPrice(e.target.value)}
                placeholder="30490000"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Tồn kho ban đầu:</label>
              <input
                type="number"
                min="0"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>
          </div>

          {/* Dynamic options selection (RAM, Color...) */}
          {options.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 border-t border-slate-800">
              {options.map((opt) => (
                <div key={opt.name}>
                  <label className="text-[11px] text-slate-400 block mb-1">{opt.name}:</label>
                  <select
                    value={selectedOptions[opt.name] || ''}
                    onChange={(e) =>
                      setSelectedOptions({ ...selectedOptions, [opt.name]: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Chọn {opt.name} --</option>
                    {opt.values?.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              Lưu biến thể SKU
            </button>
          </div>
        </form>
      )}

      {/* SKUs Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Mã SKU</th>
              <th className="py-2.5 px-3">Cấu hình biến thể</th>
              <th className="py-2.5 px-3 text-right">Giá bán</th>
              <th className="py-2.5 px-3 text-right">Giá gốc</th>
              <th className="py-2.5 px-3 text-center">Tồn kho</th>
              <th className="py-2.5 px-3 text-right">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {skus.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500">
                  Chưa có biến thể SKU nào được tạo
                </td>
              </tr>
            ) : (
              skus.map((sku, idx) => (
                <tr key={sku.code || idx} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">
                    {sku.code}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {sku.options ? (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(sku.options).map(([k, v]) => (
                          <span
                            key={k}
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700"
                          >
                            {k}: <strong>{v}</strong>
                          </span>
                        ))}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                    {formatVnd(sku.price)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500 line-through text-[11px]">
                    {formatVnd(sku.originalPrice)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-semibold text-emerald-400">
                    {sku.stock || 0}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveSku(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Xóa biến thể SKU"
                    >
                      <Trash2 className="w-3.5 h-3.5 ml-auto" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SkuVariantBuilder;
