import { useState } from 'react';
import { Plus, Trash2, GripVertical, Sparkles, Filter } from 'lucide-react';

export const DynamicAttributesForm = ({
  category,
  attributes = [],
  onChangeAttributes
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrType, setNewAttrType] = useState('Single-select');
  const [newAttrValues, setNewAttrValues] = useState('');
  const [newAttrFilter, setNewAttrFilter] = useState(true);

  const handleAddAttribute = (e) => {
    e.preventDefault();
    if (!newAttrName.trim() || !newAttrKey.trim()) return;

    const valuesArray = newAttrValues
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    const updated = [
      ...attributes,
      {
        name: newAttrName.trim(),
        key: newAttrKey.trim().toLowerCase().replace(/\s+/g, '_'),
        type: newAttrType,
        values: valuesArray.length > 0 ? valuesArray : ['Mặc định'],
        isFilter: newAttrFilter
      }
    ];

    onChangeAttributes(updated);
    setNewAttrName('');
    setNewAttrKey('');
    setNewAttrValues('');
    setShowAddForm(false);
  };

  const handleRemoveAttribute = (index) => {
    const updated = attributes.filter((_, idx) => idx !== index);
    onChangeAttributes(updated);
  };

  const handleToggleFilter = (index) => {
    const updated = attributes.map((attr, idx) =>
      idx === index ? { ...attr, isFilter: !attr.isFilter } : attr
    );
    onChangeAttributes(updated);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 text-slate-100">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-100">Dynamic Attributes Form Builder</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {category?.toUpperCase() || 'GENERAL'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Các thuộc tính dùng để tạo biến thể và trích xuất bộ lọc storefront tự động.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer w-fit"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Đóng form' : 'Thêm thuộc tính'}</span>
        </button>
      </div>

      {/* Mini Form: Thêm thuộc tính */}
      {showAddForm && (
        <form onSubmit={handleAddAttribute} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 animate-in fade-in">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Khai báo thuộc tính kỹ thuật mới</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Tên hiển thị (Label):</label>
              <input
                type="text"
                required
                value={newAttrName}
                onChange={(e) => {
                  setNewAttrName(e.target.value);
                  if (!newAttrKey) {
                    setNewAttrKey(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                  }
                }}
                placeholder="Ví dụ: Tần số quét màn hình"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Key hệ thống (code):</label>
              <input
                type="text"
                required
                value={newAttrKey}
                onChange={(e) => setNewAttrKey(e.target.value)}
                placeholder="refresh_rate"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-cyan-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Kiểu dữ liệu:</label>
              <select
                value={newAttrType}
                onChange={(e) => setNewAttrType(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Single-select">Single-select (Chọn 1)</option>
                <option value="Multi-select">Multi-select (Nhiều)</option>
                <option value="Text">Văn bản tự do</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">
              Các giá trị khả dụng (Phân cách bởi dấu phẩy):
            </label>
            <input
              type="text"
              value={newAttrValues}
              onChange={(e) => setNewAttrValues(e.target.value)}
              placeholder="60Hz, 120Hz, 144Hz, 240Hz"
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={newAttrFilter}
                onChange={(e) => setNewAttrFilter(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0"
              />
              <span>Dùng làm bộ lọc tìm kiếm tại Storefront B2C</span>
            </label>

            <button
              type="submit"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Lưu thuộc tính
            </button>
          </div>
        </form>
      )}

      {/* Attributes Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3 w-8"></th>
              <th className="py-2.5 px-3">Tên hiển thị</th>
              <th className="py-2.5 px-3">Key hệ thống</th>
              <th className="py-2.5 px-3">Kiểu dữ liệu</th>
              <th className="py-2.5 px-3">Giá trị khả dụng</th>
              <th className="py-2.5 px-3 text-center">Bộ lọc</th>
              <th className="py-2.5 px-3 text-right">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {attributes.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500">
                  Chưa có thuộc tính động nào được định nghĩa
                </td>
              </tr>
            ) : (
              attributes.map((attr, idx) => (
                <tr key={attr.key || idx} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-2.5 px-3 text-slate-600">
                    <GripVertical className="w-3.5 h-3.5" />
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">
                    {attr.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-cyan-400">
                    {attr.key}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px]">
                      {attr.type || 'Single-select'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">
                    {Array.isArray(attr.values) ? attr.values.join(', ') : attr.values || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleFilter(idx)}
                      className={`p-1 rounded-md transition-colors ${
                        attr.isFilter
                          ? 'text-emerald-400 hover:text-emerald-300'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title="Bật/Tắt làm bộ lọc storefront"
                    >
                      <Filter className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Xóa thuộc tính"
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

export default DynamicAttributesForm;
