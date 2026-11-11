import { useState } from 'react';
import { Plus, Trash2, Layers, Settings2 } from 'lucide-react';

export const SkuVariantBuilder = ({
  skus = [],
  options = [],
  onChangeSkus,
  onChangeOptions,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOptionForm, setShowOptionForm] = useState(false);

  // State cho Option Group mới
  const [newOptName, setNewOptName] = useState('');
  const [newOptValues, setNewOptValues] = useState('');

  // State cho SKU mới
  const [newSkuCode, setNewSkuCode] = useState('');
  const [newListPrice, setNewListPrice] = useState('');
  const [newSalePrice, setNewSalePrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({});

  const handleAddOptionGroup = (e) => {
    e.preventDefault();
    const name = newOptName.trim();
    const values = newOptValues
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (!name || values.length === 0) return;

    const existingIdx = options.findIndex((o) => o.name.toLowerCase() === name.toLowerCase());
    let updatedOptions;
    if (existingIdx >= 0) {
      updatedOptions = options.map((o, idx) =>
        idx === existingIdx
          ? { ...o, values: Array.from(new Set([...(o.values || []), ...values])) }
          : o
      );
    } else {
      updatedOptions = [...options, { name, displayType: 'button', values }];
    }
    onChangeOptions?.(updatedOptions);
    setNewOptName('');
    setNewOptValues('');
    setShowOptionForm(false);
  };

  const handleRemoveOptionGroup = (optName) => {
    onChangeOptions?.(options.filter((o) => o.name !== optName));
  };

  const handleAddSku = (e) => {
    e.preventDefault();
    if (!newSkuCode.trim() || !newListPrice) return;

    const listPrice = Math.max(0, parseInt(newListPrice, 10) || 0);
    const rawSale = newSalePrice !== '' ? parseInt(newSalePrice, 10) : listPrice;
    const salePrice = Math.max(0, Math.min(listPrice, isNaN(rawSale) ? listPrice : rawSale));
    const costPrice = Math.max(0, parseInt(newCostPrice, 10) || 0);

    const cleanOptions = {};
    Object.entries(selectedOptions).forEach(([k, v]) => {
      if (k && v) cleanOptions[k] = v;
    });

    const optionValues = Object.entries(cleanOptions).map(([optionName, value]) => ({
      optionName,
      value,
    }));

    const code = newSkuCode.trim().toUpperCase();
    const newSku = {
      _id: 'sku-' + Date.now(),
      sku: code,
      code,
      price: listPrice,
      originalPrice: listPrice,
      salePrice,
      costPrice,
      options: cleanOptions,
      optionValues,
      isActive: true,
    };

    onChangeSkus([...skus, newSku]);
    setNewSkuCode('');
    setNewListPrice('');
    setNewSalePrice('');
    setNewCostPrice('');
    setSelectedOptions({});
    setShowAddModal(false);
  };

  const handleUpdateSkuField = (index, field, rawVal) => {
    const updated = skus.map((s, idx) => {
      if (idx !== index) return s;
      if (field === 'sku') {
        const code = String(rawVal || '').toUpperCase();
        return { ...s, sku: code, code };
      }
      if (field === 'price') {
        const listPrice = Math.max(0, parseInt(rawVal, 10) || 0);
        const currentSale = s.salePrice !== undefined ? Number(s.salePrice) : listPrice;
        return {
          ...s,
          price: listPrice,
          originalPrice: listPrice,
          salePrice: Math.min(listPrice, currentSale),
        };
      }
      if (field === 'salePrice') {
        const salePrice = Math.max(0, parseInt(rawVal, 10) || 0);
        const listPrice = Math.max(Number(s.price || 0), salePrice);
        return {
          ...s,
          price: listPrice,
          originalPrice: listPrice,
          salePrice,
        };
      }
      if (field === 'costPrice') {
        const costPrice = Math.max(0, parseInt(rawVal, 10) || 0);
        return {
          ...s,
          costPrice,
        };
      }
      return s;
    });
    onChangeSkus(updated);
  };

  const handleRemoveSku = (index) => {
    if (skus.length <= 1) {
      window.alert('Sản phẩm phải có ít nhất 1 biến thể SKU!');
      return;
    }
    const updated = skus.filter((_, idx) => idx !== index);
    onChangeSkus(updated);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-100">
              Quản lý Biến thể SKU &amp; Tùy chọn (UC-AD03)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              {skus.length} BIẾN THỂ
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Định nghĩa nhóm tùy chọn (RAM, Màu sắc, Dung lượng...) và bảng giá niêm yết / giá khuyến mãi cho từng mã SKU.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOptionForm(!showOptionForm)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nhóm tùy chọn ({options.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(!showAddModal)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddModal ? 'Đóng form' : 'Thêm biến thể SKU'}</span>
          </button>
        </div>
      </div>

      {/* Option Groups Bar */}
      {(options.length > 0 || showOptionForm) && (
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Nhóm tùy chọn biến thể:</span>
            {options.map((opt) => (
              <div
                key={opt.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs"
              >
                <span className="font-bold text-cyan-400">{opt.name}:</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {(opt.values || []).join(', ')}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveOptionGroup(opt.name)}
                  className="text-slate-500 hover:text-rose-400 ml-1 cursor-pointer"
                  title="Xóa nhóm tùy chọn"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {showOptionForm && (
            <form
              onSubmit={handleAddOptionGroup}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-slate-800 items-end"
            >
              <div className="sm:col-span-4">
                <label className="text-[11px] text-slate-400 block mb-1">
                  Tên tùy chọn (VD: Màu sắc, RAM, Dung lượng):
                </label>
                <input
                  type="text"
                  required
                  value={newOptName}
                  onChange={(e) => setNewOptName(e.target.value)}
                  placeholder="Màu sắc"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="text-[11px] text-slate-400 block mb-1">
                  Các giá trị (phân cách bởi dấu phẩy):
                </label>
                <input
                  type="text"
                  required
                  value={newOptValues}
                  onChange={(e) => setNewOptValues(e.target.value)}
                  placeholder="Titan Tự Nhiên, Titan Đen, Titan Trắng"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Lưu nhóm
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Form Tạo biến thể mới */}
      {showAddModal && (
        <form
          onSubmit={handleAddSku}
          className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 animate-in fade-in"
        >
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Thêm biến thể SKU mới cho sản phẩm</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Mã SKU duy nhất *:</label>
              <input
                type="text"
                required
                value={newSkuCode}
                onChange={(e) => setNewSkuCode(e.target.value)}
                placeholder="ROG-G16-I7-16-512"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-cyan-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Giá vốn nhập (costPrice - VND):
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={newCostPrice}
                onChange={(e) => setNewCostPrice(e.target.value)}
                placeholder="27000000"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-300 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Giá niêm yết / Giá gốc (price - VND) *:
              </label>
              <input
                type="number"
                required
                min="0"
                step="10000"
                value={newListPrice}
                onChange={(e) => {
                  setNewListPrice(e.target.value);
                  if (!newSalePrice) setNewSalePrice(e.target.value);
                }}
                placeholder="35990000"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Giá bán khuyến mãi (salePrice &le; Giá niêm yết):
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={newSalePrice}
                onChange={(e) => setNewSalePrice(e.target.value)}
                placeholder="32990000"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Dynamic options selection (RAM, Color...) */}
          {options.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
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
              Thêm vào danh sách SKU
            </button>
          </div>
        </form>
      )}

      {/* SKUs Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3 w-44">Mã SKU</th>
              <th className="py-2.5 px-3">Tổ hợp biến thể (optionValues)</th>
              <th className="py-2.5 px-3 text-right w-40">Giá vốn (costPrice)</th>
              <th className="py-2.5 px-3 text-right w-40">Giá niêm yết (price)</th>
              <th className="py-2.5 px-3 text-right w-40">Giá bán KM (salePrice)</th>
              <th className="py-2.5 px-3 text-right w-24">Biên LN</th>
              <th className="py-2.5 px-3 text-right w-14">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {skus.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500">
                  Chưa có biến thể SKU nào. Sản phẩm bắt buộc phải có ít nhất 1 SKU.
                </td>
              </tr>
            ) : (
              skus.map((skuItem, idx) => {
                const opts =
                  skuItem.options && Object.keys(skuItem.options).length > 0
                    ? skuItem.options
                    : Array.isArray(skuItem.optionValues)
                      ? Object.fromEntries(
                          skuItem.optionValues.map((ov) => [ov.optionName, ov.value])
                        )
                      : {};

                return (
                  <tr key={skuItem._id || idx} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={skuItem.sku || skuItem.code || ''}
                        onChange={(e) => handleUpdateSkuField(idx, 'sku', e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono font-bold text-cyan-400 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {Object.keys(opts).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(opts).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700"
                            >
                              {k}: <strong>{v}</strong>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Mặc định (Tiêu chuẩn)</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={skuItem.costPrice ?? 0}
                        onChange={(e) => handleUpdateSkuField(idx, 'costPrice', e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-right text-amber-300 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={skuItem.price ?? 0}
                        onChange={(e) => handleUpdateSkuField(idx, 'price', e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-right text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={skuItem.salePrice ?? skuItem.price ?? 0}
                        onChange={(e) => handleUpdateSkuField(idx, 'salePrice', e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono font-bold text-right text-emerald-400 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-[11px]">
                      {(() => {
                        const sell = Number(skuItem.salePrice ?? skuItem.price ?? 0);
                        const cost = Number(skuItem.costPrice ?? 0);
                        if (sell <= 0 || cost <= 0) return <span className="text-slate-500">--</span>;
                        const margin = Math.round(((sell - cost) / sell) * 1000) / 10;
                        return (
                          <span className={margin >= 10 ? 'text-emerald-400 font-bold' : margin >= 0 ? 'text-amber-300 font-bold' : 'text-rose-400 font-bold'}>
                            {margin}%
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveSku(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Xóa biến thể SKU"
                      >
                        <Trash2 className="w-3.5 h-3.5 ml-auto" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SkuVariantBuilder;
