import { useState } from 'react';
import { Search, Plus, Filter, Eye, EyeOff } from 'lucide-react';

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

  const formatVnd = (num) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  const filteredProducts = products.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.skuCode && p.skuCode.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (Array.isArray(p.skus) && p.skus.some((s) => (s.sku || s.code || '').toLowerCase().includes(q)));

    const matchCategory =
      categoryFilter === 'ALL' ||
      String(p.categoryId) === String(categoryFilter) ||
      p.category?.toLowerCase() === String(categoryFilter).toLowerCase();

    return matchSearch && matchCategory;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl text-slate-100">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/60">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-sm text-slate-100">Danh mục sản phẩm</h3>
            <p className="text-[11px] text-slate-400">
              Hiển thị {filteredProducts.length}/{products.length} sản phẩm
            </p>
          </div>
          <button
            type="button"
            onClick={onAddNewProduct}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm sản phẩm</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, hãng, mã SKU..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer max-w-[130px]"
            >
              <option value="ALL" className="bg-slate-900">
                Tất cả danh mục
              </option>
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <option key={cat._id} value={cat._id} className="bg-slate-900">
                    {cat.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="laptop" className="bg-slate-900">Laptop</option>
                  <option value="smartphone" className="bg-slate-900">Điện thoại</option>
                  <option value="phu-kien" className="bg-slate-900">Phụ kiện</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1">
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Không tìm thấy sản phẩm phù hợp.
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isSelected = p._id === selectedProductId;
            const skuCount = p.skus?.length || 0;
            const isActive = p.isActive !== false;

            return (
              <div
                key={p._id}
                onClick={() => onSelectProduct(p)}
                className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-blue-950/40 border border-blue-500/50 shadow-md shadow-blue-500/5'
                    : 'hover:bg-slate-850/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Product Image */}
                  <div className="w-11 h-11 rounded-lg bg-slate-950 border border-slate-800 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={p.images?.[0] || 'https://placehold.co/100x100/1e293b/94a3b8?text=SP'}
                      alt={p.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 leading-snug">
                      {p.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="font-mono text-[10px] text-cyan-400">
                        {p.skuCode || p.skus?.[0]?.sku || 'CHƯA-CÓ-SKU'}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[10px] text-slate-400">{p.brand}</span>
                      {p.categoryName && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-[10px] text-blue-400">{p.categoryName}</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-100 mt-1">
                      {formatVnd(p.price)}
                    </div>
                  </div>
                </div>

                {/* Badges & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                    {skuCount} SKU
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        isActive &&
                        !window.confirm(
                          `Bạn có chắc chắn muốn tạm ẩn sản phẩm "${p.name}" khỏi Storefront B2C?`
                        )
                      ) {
                        return;
                      }
                      onToggleActive(p._id, !isActive);
                    }}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                    }`}
                    title={isActive ? 'Nhấn để ẩn sản phẩm' : 'Nhấn để hiện sản phẩm'}
                  >
                    {isActive ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                    <span>{isActive ? 'Hiện' : 'Ẩn'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProductManagementTable;
