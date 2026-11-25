import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Filter,
  Eye,
  EyeOff,
  X,
  ChevronRight,
  ChevronDown,
  Columns3,
  Edit3,
  Star,
} from 'lucide-react';
import DataTablePagination from '../../../components/common/DataTablePagination.jsx';

const COLUMN_STORAGE_KEY = 'techone_admin_product_cols_v1';

const OPTIONAL_COLUMNS = [
  { key: 'category', label: 'Danh mục', defaultVisible: true },
  { key: 'brand', label: 'Thương hiệu', defaultVisible: true },
  { key: 'skus', label: 'Biến thể (SKU)', defaultVisible: true },
  { key: 'price', label: 'Giá bán', defaultVisible: true },
  { key: 'status', label: 'Trạng thái', defaultVisible: true },
  { key: 'unit', label: 'Đơn vị tính', defaultVisible: false },
  { key: 'costPrice', label: 'Giá vốn', defaultVisible: false },
  { key: 'slug', label: 'Đường dẫn (Slug)', defaultVisible: false },
  { key: 'serialManaged', label: 'Quản lý Serial', defaultVisible: false },
  { key: 'rating', label: 'Đánh giá', defaultVisible: false },
  { key: 'updatedAt', label: 'Ngày cập nhật', defaultVisible: false },
];

const getInitialColumns = () => {
  try {
    const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore
  }
  const defaults = {};
  OPTIONAL_COLUMNS.forEach((c) => {
    defaults[c.key] = c.defaultVisible;
  });
  return defaults;
};

export const ProductManagementTable = ({
  products = [],
  categories = [],
  selectedProductId,
  onSelectProduct,
  onToggleActive,
  onAddNewProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [visibleCols, setVisibleCols] = useState(getInitialColumns);
  const [showColMenu, setShowColMenu] = useState(false);
  const [expandedProductIds, setExpandedProductIds] = useState(new Set());
  const colMenuRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const handleOutside = (e) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target)) {
        setShowColMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const toggleColumn = (key) => {
    setVisibleCols((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleExpandRow = (e, prodId) => {
    e.stopPropagation();
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(prodId)) next.delete(prodId);
      else next.add(prodId);
      return next;
    });
  };

  const formatVnd = (num) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  const formatPriceRange = (values = []) => {
    const nums = values.map((v) => Number(v || 0)).filter((v) => !Number.isNaN(v));
    if (nums.length === 0) return formatVnd(0);
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    if (min === max) return formatVnd(min);
    return `${formatVnd(min)} – ${formatVnd(max)}`;
  };

  const flatTreeCategories = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(String(c._id), { ...c, children: [] }));
    const roots = [];
    categories.forEach((c) => {
      const node = map.get(String(c._id));
      const pId = c.parentId ? String(c.parentId) : null;
      if (pId && map.has(pId)) map.get(pId).children.push(node);
      else roots.push(node);
    });
    const flattened = [];
    const walk = (nodes, depth = 0) => {
      nodes.forEach((n) => {
        flattened.push({ ...n, depth });
        if (n.children?.length) walk(n.children, depth + 1);
      });
    };
    walk(roots);
    return flattened;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.skuCode && p.skuCode.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (Array.isArray(p.skus) && p.skus.some((s) => (s.sku || s.code || '').toLowerCase().includes(q)));

      const matchCategory =
        categoryFilter === 'ALL' ||
        String(p.categoryId) === String(categoryFilter) ||
        p.category?.toLowerCase() === String(categoryFilter).toLowerCase();

      const isActive = p.isActive !== false;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && isActive) ||
        (statusFilter === 'INACTIVE' && !isActive);

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const safeTotalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, safeTotalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safeCurrentPage, pageSize]);

  const visibleColCount =
    2 + OPTIONAL_COLUMNS.filter((c) => visibleCols[c.key]).length; // +2 for Product & Actions

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl text-slate-100">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-950/60">
        <div>
          <h3 className="font-extrabold text-sm text-slate-100">
            Danh mục sản phẩm hệ thống ({filteredProducts.length}/{products.length})
          </h3>
          <p className="text-[11px] text-slate-400">
            Bấm vào huy hiệu SKU để xem nhanh các biến thể con, hoặc chọn &quot;Cột hiển thị&quot; để tùy biến bảng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm tên, hãng, mã SKU..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer max-w-[160px]"
            >
              <option value="ALL" className="bg-slate-900">
                Tất cả danh mục
              </option>
              {flatTreeCategories.map((cat) => (
                <option key={cat._id} value={cat._id} className="bg-slate-900">
                  {cat.depth > 0 ? `${'— '.repeat(cat.depth)}${cat.name}` : cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang bán</option>
            <option value="INACTIVE">Đã ẩn</option>
          </select>

          {/* Column Visibility Dropdown */}
          <div ref={colMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowColMenu((prev) => !prev)}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Columns3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cột hiển thị</span>
            </button>

            {showColMenu && (
              <div className="absolute right-0 mt-1.5 w-56 p-2.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase px-1.5 pb-1 border-b border-slate-800">
                  Chọn trường hiển thị
                </div>
                {OPTIONAL_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-1.5 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(visibleCols[col.key])}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded accent-blue-500 cursor-pointer"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Add New Product Button */}
          <button
            type="button"
            onClick={onAddNewProduct}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm sản phẩm</span>
          </button>
        </div>
      </div>

      {/* Full-width Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4 min-w-[260px]">Sản phẩm</th>
              {visibleCols.category && <th className="py-3 px-3">Danh mục</th>}
              {visibleCols.brand && <th className="py-3 px-3">Thương hiệu</th>}
              {visibleCols.skus && <th className="py-3 px-3 text-center">Biến thể</th>}
              {visibleCols.price && <th className="py-3 px-3 text-right">Giá bán</th>}
              {visibleCols.unit && <th className="py-3 px-3 text-center">ĐVT</th>}
              {visibleCols.costPrice && <th className="py-3 px-3 text-right">Giá vốn</th>}
              {visibleCols.slug && <th className="py-3 px-3">Slug</th>}
              {visibleCols.serialManaged && <th className="py-3 px-3 text-center">Serial</th>}
              {visibleCols.rating && <th className="py-3 px-3 text-center">Đánh giá</th>}
              {visibleCols.updatedAt && <th className="py-3 px-3">Cập nhật</th>}
              {visibleCols.status && <th className="py-3 px-3 text-center">Trạng thái</th>}
              <th className="py-3 px-4 text-right w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-xs">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={visibleColCount} className="py-12 text-center text-slate-500">
                  Không tìm thấy sản phẩm phù hợp với điều kiện lọc.
                </td>
              </tr>
            ) : (
              paginatedProducts.map((p) => {
                const isSelected = selectedProductId === p._id;
                const isActive = p.isActive !== false;
                const isExpanded = expandedProductIds.has(p._id);
                const skus = Array.isArray(p.skus) ? p.skus : [];
                const defaultSku = skus.find((s) => s.isDefault) || skus[0];
                const coverImg = p.images?.[0] || defaultSku?.images?.[0] || '';

                return (
                  <>
                    <tr
                      key={p._id}
                      onClick={() => onSelectProduct(p)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/15'
                          : isActive
                          ? 'hover:bg-slate-800/40'
                          : 'opacity-65 hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Product Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl border border-slate-700 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                            {coverImg ? (
                              <img src={coverImg} alt={p.name} className="w-full h-full object-contain p-0.5" />
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold">IMG</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-100 truncate max-w-[260px]">{p.name}</p>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                              Mặc định: <span className="text-slate-300">{defaultSku?.sku || p.skuCode || 'N/A'}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {visibleCols.category && (
                        <td className="py-3 px-3 text-slate-300 font-medium">
                          {p.categoryName || p.category || '—'}
                        </td>
                      )}

                      {visibleCols.brand && (
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-semibold text-[11px]">
                            {p.brand}
                          </span>
                        </td>
                      )}

                      {visibleCols.skus && (
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => toggleExpandRow(e, p._id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                              isExpanded
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25'
                            }`}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                            <span>{skus.length} SKU</span>
                          </button>
                        </td>
                      )}

                      {visibleCols.price && (
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {formatPriceRange(skus.length > 0 ? skus.map((s) => s.price) : [p.price])}
                        </td>
                      )}

                      {visibleCols.unit && (
                        <td className="py-3 px-3 text-center text-slate-300 font-medium">
                          {p.unit || 'Cái'}
                        </td>
                      )}

                      {visibleCols.costPrice && (
                        <td className="py-3 px-3 text-right font-mono font-semibold text-amber-300 whitespace-nowrap">
                          {formatPriceRange(skus.map((s) => s.costPrice || 0))}
                        </td>
                      )}

                      {visibleCols.slug && (
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400 max-w-[160px] truncate">
                          /{p.slug}
                        </td>
                      )}

                      {visibleCols.serialManaged && (
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.isSerialManaged !== false
                                ? 'bg-cyan-500/15 text-cyan-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {p.isSerialManaged !== false ? 'Theo Serial' : 'Số lượng'}
                          </span>
                        </td>
                      )}

                      {visibleCols.rating && (
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {Number(p.rating || 0).toFixed(1)} ({p.reviewsCount || 0})
                          </span>
                        </td>
                      )}

                      {visibleCols.updatedAt && (
                        <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                          {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('vi-VN') : '—'}
                        </td>
                      )}

                      {visibleCols.status && (
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isActive ? 'Đang bán' : 'Đã ẩn'}
                          </span>
                        </td>
                      )}

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProduct(p);
                            }}
                            title="Xem & Sửa sản phẩm"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleActive(p._id, !isActive);
                            }}
                            title={isActive ? 'Tạm ẩn sản phẩm' : 'Kích hoạt hiển thị'}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          >
                            {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable SKU Sub-rows */}
                    {isExpanded && skus.length > 0 && (
                      <tr key={`${p._id}-skus`} className="bg-slate-950/75">
                        <td colSpan={visibleColCount} className="px-6 py-3">
                          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/70">
                            <table className="w-full text-left text-[11px]">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-400 uppercase bg-slate-950/50">
                                  <th className="py-2 px-3">Mã SKU</th>
                                  <th className="py-2 px-3">Tổ hợp tùy chọn</th>
                                  <th className="py-2 px-3 text-right">Giá vốn</th>
                                  <th className="py-2 px-3 text-right">Giá bán</th>
                                  <th className="py-2 px-3 text-center">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50">
                                {skus.map((s, sIdx) => {
                                  const optLabel =
                                    s.options && Object.keys(s.options).length > 0
                                      ? Object.entries(s.options)
                                          .map(([k, v]) => `${k}: ${v}`)
                                          .join(' • ')
                                      : 'Mặc định';

                                  return (
                                    <tr key={s._id || sIdx} className="hover:bg-slate-800/30">
                                      <td className="py-2 px-3 font-mono font-bold text-slate-200">
                                        {s.sku || s.code}
                                        {s.isDefault && (
                                          <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[9px] font-sans font-bold">
                                            Tiêu chuẩn
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-slate-300">{optLabel}</td>
                                      <td className="py-2 px-3 text-right font-mono text-amber-300">
                                        {formatVnd(s.costPrice || 0)}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                                        {formatVnd(s.price || 0)}
                                      </td>
                                      <td className="py-2 px-3 text-center">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            s.isActive !== false
                                              ? 'bg-emerald-500/15 text-emerald-300'
                                              : 'bg-slate-800 text-slate-400'
                                          }`}
                                        >
                                          {s.isActive !== false ? 'Đang bán' : 'Ngừng bán'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredProducts.length > 0 && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <DataTablePagination
            currentPage={safeCurrentPage}
            totalPages={safeTotalPages}
            totalItems={filteredProducts.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            dark
          />
        </div>
      )}
    </div>
  );
};

export default ProductManagementTable;
