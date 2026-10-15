import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderTree, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import categoryService, { fallbackCategories } from '../services/categoryService.js';
import { isMockEnabled } from '../../../config/dataMode.js';

export const CategoryManagementTab = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    attributeKeys: '',
    icon: 'laptop',
  });

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await categoryService.getCategories();
      setCategories(data || []);
    } catch (err) {
      setToastMsg({
        type: 'error',
        message: 'Lỗi tải danh mục: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      attributeKeys: '',
      icon: 'laptop',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      attributeKeys: Array.isArray(cat.attributeKeys) ? cat.attributeKeys.join(', ') : '',
      icon: cat.icon || 'laptop',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      setToastMsg({ type: 'error', message: 'Tên và đường dẫn slug là bắt buộc!' });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      description: formData.description.trim(),
      attributeKeys: formData.attributeKeys
        ? formData.attributeKeys.split(',').map((k) => k.trim()).filter(Boolean)
        : [],
      icon: formData.icon || 'laptop',
    };

    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory._id, payload);
        setToastMsg({ type: 'success', message: 'Cập nhật danh mục thành công!' });
      } else {
        await categoryService.createCategory(payload);
        setToastMsg({ type: 'success', message: 'Thêm danh mục mới thành công!' });
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      setToastMsg({
        type: 'error',
        message: 'Lỗi khi lưu danh mục: ' + (err.response?.data?.message || err.message),
      });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?`)) return;
    try {
      await categoryService.deleteCategory(id);
      setToastMsg({ type: 'success', message: `Đã xóa danh mục "${name}"!` });
      loadCategories();
    } catch (err) {
      setToastMsg({
        type: 'error',
        message: 'Lỗi khi xóa: ' + (err.response?.data?.message || err.message),
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toastMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top-2 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toastMsg.message}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-blue-400" />
            Quản lý Danh mục & Phân loại
          </h3>
          <p className="text-xs text-slate-400">
            Cấu hình danh mục sản phẩm và các khóa thuộc tính tương ứng (attribute keys)
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm Danh Mục</span>
        </button>
      </div>

      {/* Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4">Tên danh mục</th>
              <th className="py-2.5 px-4">Slug</th>
              <th className="py-2.5 px-4">Khóa thuộc tính (Attributes)</th>
              <th className="py-2.5 px-4 text-center">Sản phẩm</th>
              <th className="py-2.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="py-6 text-center text-slate-400">
                  Đang tải danh mục...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-6 text-center text-slate-400">
                  Chưa có danh mục nào. Hãy tạo mới.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-2.5 px-4 font-sans font-medium text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    {cat.name}
                  </td>
                  <td className="py-2.5 px-4 text-blue-400">{cat.slug}</td>
                  <td className="py-2.5 px-4 font-sans">
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {cat.attributeKeys && cat.attributeKeys.length > 0 ? (
                        cat.attributeKeys.map((key) => (
                          <span
                            key={key}
                            className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300"
                          >
                            {key}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Mặc định</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-center text-slate-300 font-sans">
                    {cat.productCount || 0}
                  </td>
                  <td className="py-2.5 px-4 text-right space-x-2 font-sans">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1 hover:bg-slate-800 text-slate-300 hover:text-blue-400 rounded transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat._id, cat.name)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-400" />
              {editingCategory ? 'Chỉnh sửa Danh Mục' : 'Thêm Danh Mục Mới'}
            </h4>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Laptop, Máy tính bảng..."
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: editingCategory ? prev.slug : name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Slug URL *</label>
                <input
                  type="text"
                  required
                  placeholder="laptop, may-tinh-bang..."
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-blue-400 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mô tả ngắn</label>
                <textarea
                  rows="2"
                  placeholder="Mô tả danh mục hiển thị trên storefront..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Thuộc tính đặc thù (cách nhau bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  placeholder="cpu, ram, vga, screen_size..."
                  value={formData.attributeKeys}
                  onChange={(e) => setFormData({ ...formData, attributeKeys: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Dùng để định nghĩa bộ lọc và cấu hình biến thể sản phẩm.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  {editingCategory ? 'Lưu thay đổi' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagementTab;
