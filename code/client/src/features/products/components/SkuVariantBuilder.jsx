import { useState } from 'react';
import {
  Plus,
  Trash2,
  Layers,
  Settings2,
  Wand2,
  Lock,
  Image as ImageIcon,
  Check,
  Sparkles,
} from 'lucide-react';
import { generateAutoSkuCode } from '../services/productAdapter.js';

const computeCartesian = (options = []) => {
  const validGroups = options.filter((o) => o && o.name && Array.isArray(o.values) && o.values.length > 0);
  if (validGroups.length === 0) return [];

  let combos = [{}];
  for (const group of validGroups) {
    const nextCombos = [];
    for (const prev of combos) {
      for (const val of group.values) {
        nextCombos.push({ ...prev, [group.name]: val });
      }
    }
    combos = nextCombos;
  }
  return combos;
};

const getComboSignature = (optionsDict = {}) =>
  Object.entries(optionsDict)
    .filter(([k, v]) => k && v)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k.toLowerCase()}:${String(v).toLowerCase()}`)
    .join('|');

export const SkuVariantBuilder = ({
  skus = [],
  options = [],
  productName = '',
  brand = '',
  productImages = [],
  inUseSkuIds = [],
  onChangeSkus,
  onChangeOptions,
}) => {
  const [showOptionForm, setShowOptionForm] = useState(false);
  const [newOptName, setNewOptName] = useState('');
  const [newOptValues, setNewOptValues] = useState('');
  const [activeImgPickerIdx, setActiveImgPickerIdx] = useState(null);

  const inUseSet = new Set((inUseSkuIds || []).map(String));

  const syncCombinationsToSkus = (nextOptions) => {
    const combos = computeCartesian(nextOptions);
    if (combos.length === 0) return;

    const existingBySig = new Map();
    skus.forEach((s) => {
      const sig = getComboSignature(s.options || {});
      if (sig) existingBySig.set(sig, s);
    });

    const basePrice = Number(skus[0]?.price || 0);
    const baseCost = Number(skus[0]?.costPrice || 0);

    const nextSkus = combos.map((combo, idx) => {
      const sig = getComboSignature(combo);
      const existing = existingBySig.get(sig);
      if (existing) {
        return {
          ...existing,
          options: combo,
          optionValues: Object.entries(combo).map(([optionName, value]) => ({ optionName, value })),
        };
      }
      const code = generateAutoSkuCode(brand, productName, combo, idx + 1);
      return {
        _id: `sku-${Date.now()}-${idx}`,
        sku: code,
        code,
        price: basePrice,
        salePrice: basePrice,
        costPrice: baseCost,
        images: [],
        options: combo,
        optionValues: Object.entries(combo).map(([optionName, value]) => ({ optionName, value })),
        isDefault: idx === 0 && !skus.some((s) => s.isDefault),
        isActive: true,
      };
    });

    // Giữ lại các SKU cũ đang có tồn kho/Serial nhưng không còn trong tổ hợp mới (đánh dấu ngừng bán)
    const comboSigs = new Set(combos.map(getComboSignature));
    const protectedOldSkus = skus
      .filter((s) => inUseSet.has(String(s._id)) && !comboSigs.has(getComboSignature(s.options || {})))
      .map((s) => ({ ...s, isActive: false }));

    const merged = [...nextSkus, ...protectedOldSkus];
    if (merged.length > 0 && !merged.some((s) => s.isDefault)) {
      merged[0].isDefault = true;
    }
    onChangeSkus?.(merged);
  };

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
    syncCombinationsToSkus(updatedOptions);
    setNewOptName('');
    setNewOptValues('');
    setShowOptionForm(false);
  };

  const handleRemoveOptionGroup = (optName) => {
    const updatedOptions = options.filter((o) => o.name !== optName);
    onChangeOptions?.(updatedOptions);
    if (updatedOptions.length > 0) {
      syncCombinationsToSkus(updatedOptions);
    }
  };

  const handleAddManualSku = () => {
    const idx = skus.length + 1;
    const code = generateAutoSkuCode(brand, productName, {}, idx);
    const newSku = {
      _id: `sku-${Date.now()}`,
      sku: code,
      code,
      price: Number(skus[0]?.price || 0),
      salePrice: Number(skus[0]?.price || 0),
      costPrice: Number(skus[0]?.costPrice || 0),
      images: [],
      options: {},
      optionValues: [],
      isDefault: skus.length === 0,
      isActive: true,
    };
    onChangeSkus?.([...skus, newSku]);
  };

  const handleUpdateSkuField = (index, field, rawVal) => {
    const updated = skus.map((s, idx) => {
      if (idx !== index) return s;
      if (field === 'sku') {
        const code = String(rawVal || '').toUpperCase();
        return { ...s, sku: code, code };
      }
      if (field === 'price') {
        const sellingPrice = Math.max(0, parseInt(rawVal, 10) || 0);
        return {
          ...s,
          price: sellingPrice,
          originalPrice: sellingPrice,
          salePrice: sellingPrice,
        };
      }
      if (field === 'costPrice') {
        const costPrice = Math.max(0, parseInt(rawVal, 10) || 0);
        return { ...s, costPrice };
      }
      if (field === 'isActive') {
        return { ...s, isActive: Boolean(rawVal) };
      }
      return s;
    });
    onChangeSkus?.(updated);
  };

  const handleSetDefaultSku = (index) => {
    const updated = skus.map((s, idx) => ({
      ...s,
      isDefault: idx === index,
    }));
    onChangeSkus?.(updated);
  };

  const handleAutoFillSkuCode = (index) => {
    const target = skus[index];
    if (!target) return;
    const code = generateAutoSkuCode(brand, productName, target.options || {}, index + 1);
    handleUpdateSkuField(index, 'sku', code);
  };

  const handleSelectSkuImage = (index, imgUrl) => {
    const updated = skus.map((s, idx) =>
      idx === index ? { ...s, images: imgUrl ? [imgUrl] : [] } : s
    );
    onChangeSkus?.(updated);
    setActiveImgPickerIdx(null);
  };

  const handleRemoveSku = (index) => {
    const target = skus[index];
    if (target && inUseSet.has(String(target._id))) {
      return;
    }
    if (skus.length <= 1) {
      window.alert('Sản phẩm phải có ít nhất 1 biến thể SKU!');
      return;
    }
    const updated = skus.filter((_, idx) => idx !== index);
    if (updated.length > 0 && !updated.some((s) => s.isDefault)) {
      updated[0].isDefault = true;
    }
    onChangeSkus?.(updated);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Biến thể SKU &amp; Nhóm tùy chọn</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Thêm nhóm tùy chọn (Màu sắc, RAM...) để tự động sinh tổ hợp biến thể, chọn SKU Tiêu chuẩn mặc định.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOptionForm(!showOptionForm)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Thêm nhóm tùy chọn</span>
          </button>
          {options.length > 0 && (
            <button
              type="button"
              onClick={() => syncCombinationsToSkus(options)}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tạo tổ hợp tự động</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleAddManualSku}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm SKU lẻ</span>
          </button>
        </div>
      </div>

      {/* Form thêm nhóm tùy chọn */}
      {showOptionForm && (
        <div className="p-3.5 bg-slate-950/90 border border-cyan-500/30 rounded-xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Tên nhóm tùy chọn *
              </label>
              <input
                type="text"
                value={newOptName}
                onChange={(e) => setNewOptName(e.target.value)}
                placeholder="VD: Màu sắc, RAM, Dung lượng..."
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Các giá trị (ngăn cách dấu phẩy) *
              </label>
              <input
                type="text"
                value={newOptValues}
                onChange={(e) => setNewOptValues(e.target.value)}
                placeholder="VD: Đen, Bạc, Titan Sa Mạc"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowOptionForm(false)}
              className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleAddOptionGroup}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Áp dụng &amp; Sinh tổ hợp
            </button>
          </div>
        </div>
      )}

      {/* Danh sách nhóm tùy chọn hiện có */}
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <div
              key={opt.name}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
            >
              <span className="font-bold text-cyan-400">{opt.name}:</span>
              <span className="text-slate-300">{(opt.values || []).join(', ')}</span>
              <button
                type="button"
                onClick={() => handleRemoveOptionGroup(opt.name)}
                title="Xóa nhóm tùy chọn"
                className="text-slate-500 hover:text-rose-400 cursor-pointer ml-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bảng danh sách SKUs */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-2 text-center w-16">Tiêu chuẩn</th>
              <th className="py-2.5 px-2 text-center w-14">Ảnh</th>
              <th className="py-2.5 px-2 min-w-[160px]">Mã SKU (tự sinh nếu trống)</th>
              <th className="py-2.5 px-2 min-w-[130px]">Tổ hợp tùy chọn</th>
              <th className="py-2.5 px-2 text-right min-w-[125px]">Giá vốn (VNĐ)</th>
              <th className="py-2.5 px-2 text-right min-w-[125px]">Giá bán (VNĐ)</th>
              <th className="py-2.5 px-2 text-center w-24">Trạng thái</th>
              <th className="py-2.5 px-2 text-center w-12">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {skus.map((s, idx) => {
              const isLocked = inUseSet.has(String(s._id));
              const skuImg = Array.isArray(s.images) && s.images[0] ? s.images[0] : '';
              const optionSummary =
                s.options && Object.keys(s.options).length > 0
                  ? Object.entries(s.options)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' • ')
                  : 'Mặc định (Không phân loại)';

              return (
                <tr key={s._id || idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-2 text-center">
                    <input
                      type="radio"
                      name="defaultSkuRadio"
                      checked={Boolean(s.isDefault)}
                      onChange={() => handleSetDefaultSku(idx)}
                      title="Đặt làm biến thể Tiêu chuẩn mặc định"
                      className="w-4 h-4 accent-blue-500 cursor-pointer"
                    />
                  </td>

                  <td className="py-2.5 px-2 text-center relative">
                    <button
                      type="button"
                      onClick={() => setActiveImgPickerIdx(activeImgPickerIdx === idx ? null : idx)}
                      title="Chọn ảnh đại diện cho biến thể này"
                      className="w-9 h-9 rounded-lg border border-slate-700 bg-white overflow-hidden inline-flex items-center justify-center hover:border-blue-500 cursor-pointer"
                    >
                      {skuImg ? (
                        <img src={skuImg} alt={s.sku} className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {activeImgPickerIdx === idx && (
                      <div className="absolute left-0 top-12 z-50 w-56 p-2.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl space-y-2 text-left">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                          <span>Chọn ảnh cho SKU</span>
                          <button
                            type="button"
                            onClick={() => setActiveImgPickerIdx(null)}
                            className="text-slate-400 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>
                        {productImages.length === 0 ? (
                          <p className="text-[11px] text-slate-500">Chưa có ảnh sản phẩm nào để chọn.</p>
                        ) : (
                          <div className="grid grid-cols-4 gap-1.5">
                            {productImages.map((imgUrl, imgI) => (
                              <button
                                key={imgI}
                                type="button"
                                onClick={() => handleSelectSkuImage(idx, imgUrl)}
                                className={`relative w-11 h-11 rounded-lg border bg-white overflow-hidden cursor-pointer ${
                                  skuImg === imgUrl ? 'border-blue-500 ring-2 ring-blue-500/40' : 'border-slate-700'
                                }`}
                              >
                                <img src={imgUrl} alt="" className="w-full h-full object-contain p-0.5" />
                                {skuImg === imgUrl && (
                                  <span className="absolute bottom-0 right-0 bg-blue-600 text-white p-0.5 rounded-tl">
                                    <Check className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        {skuImg && (
                          <button
                            type="button"
                            onClick={() => handleSelectSkuImage(idx, '')}
                            className="w-full py-1 text-[11px] text-rose-400 hover:bg-rose-500/10 rounded-lg font-semibold cursor-pointer"
                          >
                            Bỏ chọn ảnh riêng
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={s.sku || s.code || ''}
                        onChange={(e) => handleUpdateSkuField(idx, 'sku', e.target.value)}
                        placeholder="Tự sinh nếu để trống"
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg font-mono text-xs text-slate-100 uppercase focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAutoFillSkuCode(idx)}
                        title="Tự động sinh mã SKU chuẩn"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 cursor-pointer shrink-0"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  <td className="py-2.5 px-2">
                    <span className="text-[11px] px-2 py-1 rounded-md bg-slate-800/80 text-slate-300 font-medium inline-block">
                      {optionSummary}
                    </span>
                  </td>

                  <td className="py-2.5 px-2 text-right">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={s.costPrice ?? 0}
                      onChange={(e) => handleUpdateSkuField(idx, 'costPrice', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-right font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </td>

                  <td className="py-2.5 px-2 text-right">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={s.price ?? 0}
                      onChange={(e) => handleUpdateSkuField(idx, 'price', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-right font-mono text-emerald-400 font-bold focus:outline-none focus:border-blue-500"
                    />
                  </td>

                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleUpdateSkuField(idx, 'isActive', s.isActive === false)}
                      className={`px-2 py-1 rounded-full text-[10px] font-bold cursor-pointer ${
                        s.isActive !== false
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {s.isActive !== false ? 'Đang bán' : 'Ngừng bán'}
                    </button>
                  </td>

                  <td className="py-2.5 px-2 text-center">
                    {isLocked ? (
                      <span
                        title="SKU đã có tồn kho hoặc Serial trong hệ thống — không thể xóa, chỉ có thể chuyển sang Ngừng bán"
                        className="p-1.5 text-amber-500/80 inline-flex items-center justify-center cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveSku(idx)}
                        title="Xóa biến thể SKU"
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SkuVariantBuilder;
