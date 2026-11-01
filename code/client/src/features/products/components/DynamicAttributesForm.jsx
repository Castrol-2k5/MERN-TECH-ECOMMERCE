import { useState } from 'react';
import { Plus, Trash2, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

const ATTRIBUTE_LABELS = {
  cpu: 'Vi xử lý (CPU)',
  ram: 'Bộ nhớ RAM',
  storage: 'Ổ cứng lưu trữ',
  screen: 'Màn hình',
  screen_size: 'Kích thước màn hình',
  gpu: 'Card đồ họa (GPU)',
  vga: 'Card đồ họa (VGA)',
  battery: 'Pin & Sạc',
  os: 'Hệ điều hành',
  color: 'Màu sắc',
  camera: 'Camera',
  connection: 'Chuẩn kết nối',
  dpi: 'Độ nhạy (DPI)',
  weight: 'Trọng lượng',
  switch_type: 'Loại Switch',
  layout: 'Bố cục phím (Layout)',
};

export const DynamicAttributesForm = ({
  categoryName = 'Danh mục',
  allowedKeys = [],
  attributes = [],
  onChangeAttributes,
}) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // Chuẩn hóa mảng attributes thành [{ key, value }]
  const normalizedAttributes = Array.isArray(attributes)
    ? attributes.map((item) => ({
        key: String(item?.key || '').trim(),
        value: String(item?.value ?? ''),
      }))
    : [];

  const existingKeys = new Set(normalizedAttributes.map((a) => a.key.toLowerCase()));
  const allowedLowerSet = new Set(allowedKeys.map((k) => String(k).toLowerCase()));

  const handleUpdateValue = (index, val) => {
    const updated = normalizedAttributes.map((attr, idx) =>
      idx === index ? { ...attr, value: val } : attr
    );
    onChangeAttributes(updated);
  };

  const handleUpdateKey = (index, keyVal) => {
    const updated = normalizedAttributes.map((attr, idx) =>
      idx === index ? { ...attr, key: keyVal.toLowerCase().replace(/\s+/g, '_') } : attr
    );
    onChangeAttributes(updated);
  };

  const handleRemoveAttribute = (index) => {
    const updated = normalizedAttributes.filter((_, idx) => idx !== index);
    onChangeAttributes(updated);
  };

  const handleAddAttribute = (e) => {
    e.preventDefault();
    const cleanKey = newKey.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanVal = newValue.trim();
    if (!cleanKey || !cleanVal) return;

    const existingIdx = normalizedAttributes.findIndex((a) => a.key.toLowerCase() === cleanKey);
    if (existingIdx >= 0) {
      const updated = normalizedAttributes.map((attr, idx) =>
        idx === existingIdx ? { ...attr, value: cleanVal } : attr
      );
      onChangeAttributes(updated);
    } else {
      onChangeAttributes([...normalizedAttributes, { key: cleanKey, value: cleanVal }]);
    }
    setNewKey('');
    setNewValue('');
  };

  const handleSyncAllowedKeys = () => {
    if (!allowedKeys.length) return;
    const merged = [...normalizedAttributes];
    allowedKeys.forEach((k) => {
      const cleanK = String(k).trim().toLowerCase();
      if (!merged.some((a) => a.key.toLowerCase() === cleanK)) {
        merged.push({ key: cleanK, value: '' });
      }
    });
    onChangeAttributes(merged);
  };

  const missingAllowedKeys = allowedKeys.filter(
    (k) => !existingKeys.has(String(k).toLowerCase())
  );

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 text-slate-100">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm text-slate-100">
              Thuộc tính kỹ thuật động (UC-AD03)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {categoryName}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cấu hình thông số kỹ thuật theo tập khóa cho phép (attributeKeys) của danh mục để đồng bộ bộ lọc Storefront.
          </p>
        </div>

        {missingAllowedKeys.length > 0 && (
          <button
            type="button"
            onClick={handleSyncAllowedKeys}
            className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer w-fit"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Điền khung {missingAllowedKeys.length} thuộc tính chuẩn</span>
          </button>
        )}
      </div>

      {/* Allowed Keys Reference Bar */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-semibold">
          Khóa thuộc tính hợp lệ của danh mục ({allowedKeys.length}):
        </span>
        {allowedKeys.length > 0 ? (
          allowedKeys.map((k) => {
            const isUsed = existingKeys.has(String(k).toLowerCase());
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  if (!isUsed) {
                    onChangeAttributes([
                      ...normalizedAttributes,
                      { key: String(k).toLowerCase(), value: '' },
                    ]);
                  } else {
                    setNewKey(String(k).toLowerCase());
                  }
                }}
                className={`px-2 py-0.5 rounded-md font-mono text-[11px] border transition-colors cursor-pointer flex items-center gap-1 ${
                  isUsed
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400'
                }`}
                title={isUsed ? 'Đã khai báo' : 'Nhấn để thêm thuộc tính này'}
              >
                {isUsed && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                <span>{k}</span>
              </button>
            );
          })
        ) : (
          <span className="text-slate-500 italic">
            Danh mục này chưa giới hạn attributeKeys (cho phép mọi key).
          </span>
        )}
      </div>

      {/* Quick Add Attribute Form */}
      <form
        onSubmit={handleAddAttribute}
        className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
      >
        <div className="sm:col-span-4">
          <label className="text-[11px] text-slate-400 block mb-1">
            Khóa thuộc tính (key) *:
          </label>
          {allowedKeys.length > 0 ? (
            <select
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-cyan-400 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Chọn key thuộc tính --</option>
              {allowedKeys.map((k) => (
                <option key={k} value={k}>
                  {k} ({ATTRIBUTE_LABELS[k] || k})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Ví dụ: cpu, ram, storage..."
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-cyan-400 focus:outline-none focus:border-blue-500"
            />
          )}
        </div>

        <div className="sm:col-span-6">
          <label className="text-[11px] text-slate-400 block mb-1">
            Giá trị thông số (value) *:
          </label>
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Ví dụ: Intel Core i7-13650HX, 16GB DDR5, 512GB NVMe..."
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </div>
      </form>

      {/* Attributes Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3 w-44">Key hệ thống</th>
              <th className="py-2.5 px-3 w-48">Tên gợi ý</th>
              <th className="py-2.5 px-3">Giá trị thông số (Value)</th>
              <th className="py-2.5 px-3 text-center w-28">Trạng thái</th>
              <th className="py-2.5 px-3 text-right w-16">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {normalizedAttributes.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-500">
                  Chưa có thuộc tính nào. Nhấn &ldquo;Điền khung thuộc tính chuẩn&rdquo; hoặc thêm ở trên.
                </td>
              </tr>
            ) : (
              normalizedAttributes.map((attr, idx) => {
                const isAllowed =
                  allowedLowerSet.size === 0 || allowedLowerSet.has(attr.key.toLowerCase());
                return (
                  <tr key={`${attr.key}-${idx}`} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={attr.key}
                        onChange={(e) => handleUpdateKey(idx, e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-cyan-400 focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-2 px-3 text-slate-300 text-xs">
                      {ATTRIBUTE_LABELS[attr.key.toLowerCase()] || attr.key}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => handleUpdateValue(idx, e.target.value)}
                        placeholder={`Nhập giá trị cho ${attr.key}...`}
                        className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      {isAllowed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Hợp lệ
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold"
                          title="Key này chưa nằm trong attributeKeys của danh mục"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Ngoài DM
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Xóa thuộc tính"
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

export default DynamicAttributesForm;
