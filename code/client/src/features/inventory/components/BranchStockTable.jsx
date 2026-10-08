import { useState } from 'react';
import { 
  MapPin, 
  Hash, 
  SlidersHorizontal, 
  Search, 
  Filter, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';

export const BranchStockTable = ({
  items = [],
  onOpenSerials,
  onOpenAdjust,
  onSearch,
  onFilterCategory,
  onFilterStatus,
  selectedCategory = 'TẤT CẢ',
  selectedStatus = 'ALL',
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['TẤT CẢ', 'Điện thoại', 'Laptop', 'Phụ kiện', 'Máy tính bảng'];

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearch?.(val);
  };

  const getStockStatusBadge = (item) => {
    const avail = item.quantityAvailable || 0;
    const threshold = item.lowStockThreshold || 5;

    if (avail <= 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 w-fit">
          <XCircle className="w-3 h-3" /> Hết hàng
        </span>
      );
    }
    if (avail <= threshold) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
          <AlertTriangle className="w-3 h-3" /> Sắp hết ({avail})
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
        <CheckCircle2 className="w-3 h-3" /> Sẵn sàng
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Table Toolbar & Filters */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/60">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Tìm theo Tên sản phẩm, SKU, Vị trí quầy kệ (A-01-03)..."
            className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => onFilterCategory?.(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-slate-200">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => onFilterStatus?.(e.target.value)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">Tất cả trạng thái</option>
              <option value="IN_STOCK" className="bg-slate-900 text-slate-200">Còn hàng (&gt; min)</option>
              <option value="LOW_STOCK" className="bg-slate-900 text-slate-200">Sắp hết hàng</option>
              <option value="OUT_OF_STOCK" className="bg-slate-900 text-slate-200">Đã hết hàng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Sản phẩm / SKU</th>
              <th className="py-3 px-4">Danh mục</th>
              <th className="py-3 px-4">Vị trí quầy kệ</th>
              <th className="py-3 px-3 text-center">Tồn thực tế</th>
              <th className="py-3 px-3 text-center">Tạm giữ</th>
              <th className="py-3 px-3 text-center">Khả dụng</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-center">Quản lý Serial</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {loading ? (
              <tr>
                <td colSpan="9" className="py-12 text-center text-slate-500">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Đang tải dữ liệu tồn kho chi nhánh...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-12 text-center text-slate-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  Không tìm thấy sản phẩm nào khớp với bộ lọc
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id || item.sku} className="hover:bg-slate-850/60 transition-colors">
                  {/* Name & SKU */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100 text-xs leading-snug">
                      {item.productName}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                      {item.sku}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 text-slate-400">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300">
                      {item.category}
                    </span>
                  </td>

                  {/* Shelf Location */}
                  <td className="py-3 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-blue-400 font-mono font-bold text-[11px]">
                      <MapPin className="w-3 h-3 text-blue-400" />
                      {item.shelfLocation}
                    </div>
                  </td>

                  {/* Quantities */}
                  <td className="py-3 px-3 text-center font-mono font-semibold text-slate-300">
                    {item.quantityPhysical}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {item.quantityReserved || 0}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-sm text-emerald-400">
                    {item.quantityAvailable}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    {getStockStatusBadge(item)}
                  </td>

                  {/* Serial Manager */}
                  <td className="py-3 px-4 text-center">
                    {item.hasSerial ? (
                      <button
                        type="button"
                        onClick={() => onOpenSerials(item)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800 text-cyan-300 text-[11px] font-mono font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Hash className="w-3 h-3 text-cyan-400" />
                        <span>Xem {item.serials?.length || 0} Serials</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono italic">
                        Không quản lý
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenAdjust(item)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer border border-slate-700/60"
                      title="Kiểm kê / Điều chỉnh số lượng tồn"
                    >
                      <SlidersHorizontal className="w-3 h-3 text-blue-400" />
                      <span>Điều chỉnh</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400 flex items-center justify-between">
        <span>Hiển thị {items.length} mặt hàng SKU tại kho</span>
        <span className="text-[11px]">Đồng bộ dữ liệu thời gian thực với Server</span>
      </div>
    </div>
  );
};

export default BranchStockTable;
