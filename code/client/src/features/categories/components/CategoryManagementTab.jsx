import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  FolderTree,
  Tag,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
} from 'lucide-react';
import categoryService from '../services/categoryService.js';

export const CategoryManagementTab = ({ onCategoriesChanged }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parentId: '',
    attributeKeys: '',
  });

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await categoryService.getCategories();
      const list = data || [];
      setCategories(list);
      // Mở sẵn cấp 1 mặc định để dễ quan sát cây
      setExpandedIds(new Set(list.filter((c) => !c.parentId).map((c) => String(c._id))));
    } catch (err) {
      setToastMsg({
        type: 'error',
        message: 'Lỗi tải danh mục: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    categoryService
      .getCategories()
      .then((data) => {
        if (!ignore) {
          const list = data || [];
          setCategories(list);
          setExpandedIds(new Set(list.filter((c) => !c.parentId).map((c) => String(c._id))));
        }
      })
      .catch((err) => {
        if (!ignore) {
          setToastMsg({
            type: 'error',
            message: 'Lỗi tải danh mục: ' + (err.response?.data?.message || err.message),
          });
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Xây dựng cây phân cấp danh mục
  const { treeNodes, flattenedTree } = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => {
      map.set(String(c._id), { ...c, children: [] });
    });

    const roots = [];
    categories.forEach((c) => {
      const node = map.get(String(c._id));
      const pId = c.parentId ? String(c.parentId) : null;
      if (pId && map.has(pId)) {
        map.get(pId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    const flat = [];
    const walk = (nodes, depth = 0) => {
      nodes.forEach((n) => {
        flat.push({ ...n, depth });
        if (n.children?.length) walk(n.children, depth + 1);
      });
    };
    walk(roots);

    return { treeNodes: roots, flattenedTree: flat };
  }, [categories]);

  // Tập ID của chính danh mục đang sửa và toàn bộ con cháu của nó (chặn vòng lặp cha-con)
  const disallowedParentIds = useMemo(() => {
    if (!editingCategory) return new Set();
    const blocked = new Set([String(editingCategory._id)]);
    let added = true;
    while (added) {
      added = false;
      categories.forEach((c) => {
        if (c.parentId && blocked.has(String(c.parentId)) && !blocked.has(String(c._id))) {
          blocked.add(String(c._id));
          added = true;
        }
      });
    }
    return blocked;
  }, [editingCategory, categories]);

  const toggleExpand = (catId) => {
    const idStr = String(catId);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) next.delete(idStr);
      else next.add(idStr);
      return next;
    });
  };

  const handleOpenAdd = (defaultParentId = '') => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      parentId: defaultParentId ? String(defaultParentId) : '',
      attributeKeys: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      parentId: cat.parentId ? String(cat.parentId) : '',
      attributeKeys: Array.isArray(cat.attributeKeys) ? cat.attributeKeys.join(', ') : '',
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
      parentId: formData.parentId ? formData.parentId : null,
      attributeKeys: formData.attributeKeys
        ? formData.attributeKeys
            .split(',')
            .map((k) => k.trim().toLowerCase())
            .filter(Boolean)
        : [],
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
      await loadCategories();
      onCategoriesChanged?.();
    } catch (err) {
      setToastMsg({
        type: 'error',
        message: 'Lỗi khi lưu danh mục: ' + (err.response?.data?.message || err.message),
      });
    }
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${cat.name}"?`)) return;
    try {
      await categoryService.deleteCategory(cat._id);
      setToastMsg({ type: 'success', message: `Đã xóa danh mục "${cat.name}"` });
      await loadCategories();
      onCategoriesChanged?.();
    } catch (err) {
      setToastMsg({
        type: 'error',
        message: 'Không thể xóa: ' + (err.response?.data?.message || err.message),
      });
    }
    setTimeout(() => setToastMsg(null), 3500);
  };

  const renderTreeRows = (nodes, depth = 0) =>
    nodes.flatMap((cat) => {
      const idStr = String(cat._id);
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expandedIds.has(idStr);

      const row = (
        <tr key={idStr} className="hover:bg-slate-800/40 transition-colors">
          <td className="py-3 px-4 font-bold text-slate-100">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 22}px` }}>
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(idStr)}
                  className="p-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              ) : (
                <span className="w-5 inline-block text-center text-slate-600">{depth > 0 ? '└' : ''}</span>
              )}

              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                )
              ) : (
                <Tag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              )}

              <span>{cat.name}</span>

              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  depth === 0
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                Cấp {depth + 1}
              </span>
            </div>
          </td>
          <td className="py-3 px-4 font-mono text-slate-400">/{cat.slug}</td>
          <td className="py-3 px-4">
            <div className="flex flex-wrap gap-1">
              {(cat.attributeKeys || []).length === 0 ? (
                <span className="text-slate-600 italic text-[11px]">Không có</span>
              ) : (
                cat.attributeKeys.map((key) => (
                  <span
                    key={key}
                    className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-cyan-400"
                  >
                    {key}
                  </span>
                ))
              )}
            </div>
          </td>
          <td className="py-3 px-4 text-center">
            <span className="px-2.5 py-0.5 bg-slate-800 rounded-full text-[11px] font-bold text-slate-200">
              {cat.productCount || 0} SP
            </span>
            {hasChildren && (
              <span className="block text-[10px] text-slate-500 mt-0.5">
                (gồm {cat.children.length} nhánh con)
              </span>
            )}
          </td>
          <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
            <button
              type="button"
              onClick={() => handleOpenAdd(cat._id)}
              title="Thêm danh mục con"
              className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleOpenEdit(cat)}
              title="Sửa danh mục"
              className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(cat)}
              title="Xóa danh mục"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </td>
        </tr>
      );

      const childRows = hasChildren && isExpanded ? renderTreeRows(cat.children, depth + 1) : [];
      return [row, ...childRows];
    });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-blue-400" />
            <span>Quản Lý Danh Mục Đa Cấp &amp; Thuộc Tính Động</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hiển thị cây phân cấp cha-con trực quan; số lượng sản phẩm tự động cộng dồn từ các nhánh con.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenAdd('')}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm danh mục gốc</span>
        </button>
      </div>

      {toastMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMsg.message}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Tên danh mục (Cây phân cấp)</th>
              <th className="py-3 px-4">Đường dẫn (Slug)</th>
              <th className="py-3 px-4">Khóa thuộc tính (attributeKeys)</th>
              <th className="py-3 px-4 text-center">Tổng sản phẩm</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Đang tải danh mục...
                </td>
              </tr>
            ) : treeNodes.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Chưa có danh mục nào trong hệ thống.
                </td>
              </tr>
            ) : (
              renderTreeRows(treeNodes)
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-black text-slate-100 border-b border-slate-800 pb-3">
              {editingCategory ? `Chỉnh sửa danh mục: ${editingCategory.name}` : 'Thêm danh mục mới'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: prev.slug || name.toLowerCase().replace(/\s+/g, '-'),
                    }));
                  }}
                  placeholder="VD: Laptop Gaming"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Đường dẫn (Slug) *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="laptop-gaming"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Danh mục cha (Tùy chọn)</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Không có (Là danh mục gốc Cấp 1) --</option>
                  {flattenedTree
                    .filter((c) => !disallowedParentIds.has(String(c._id)))
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.depth > 0 ? `${'— '.repeat(c.depth)}${c.name}` : c.name} (Cấp {c.depth + 1})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Các khóa thuộc tính kỹ thuật (cách nhau bởi dấu phẩy)
                </label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2">
                  <Tag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <input
                    type="text"
                    value={formData.attributeKeys}
                    onChange={(e) => setFormData({ ...formData, attributeKeys: e.target.value })}
                    placeholder="cpu, ram, storage, vga, screen_size"
                    className="w-full bg-transparent text-xs font-mono text-cyan-300 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Lưu danh mục
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CategoryManagementTab;
