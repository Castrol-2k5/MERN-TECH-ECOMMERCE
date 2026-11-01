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
  XCircle,
  Store,
  Phone,
  X
} from 'lucide-react';
import inventoryService from '../services/inventoryService.js';

export const BranchStockTable = ({
  items = [],
  onOpenSerials,
  onOpenAdjust,
  onSearch,
  onFilterCategory,
  onFilterStatus,
  selectedCategory = 'TẤT CẢ',
  selectedStatus = 'ALL',
  loading = false,
  canAdjust = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [crossBranchItem, setCrossBranchItem] = useState(null);
  const [crossBranchStocks, setCrossBranchStocks] = useState([]);
  const [loadingCrossBranch, setLoadingCrossBranch] = useState(false);

  const categories = ['TẤT CẢ', 'Điện thoại', 'Laptop', 'Phụ kiện', 'Máy tính bảng'];

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearch?.(val);
  };

  const handleOpenCrossBranchStock = async (item) => {
    setCrossBranchItem(item);
    setLoadingCrossBranch(true);
    try {
      const branches = await inventoryService.getBranchesWithSkuStock(item.productSkuId);
      setCrossBranchStocks(Array.isArray(branches) ? branches : []);
    } catch {
      setCrossBranchStocks([]);
    } finally {
      setLoadingCrossBranch(false);
    }
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
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenCrossBranchStock(item)}
                        className="px-2.5 py-1 bg-slate-800/80 hover:bg-blue-600/20 text-slate-300 hover:text-blue-300 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer border border-slate-700/60 hover:border-blue-500/40"
                        title="Tra cứu tồn kho SKU này tại các chi nhánh khác trong chuỗi (UC-ST09)"
                      >
                        <Store className="w-3 h-3 text-blue-400" />
                        <span>Tồn chuỗi</span>
                      </button>

                      {canAdjust && (
                        <button
                          type="button"
                          onClick={() => onOpenAdjust(item)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer border border-slate-700/60"
                          title="Kiểm kê / Điều chỉnh số lượng tồn"
                        >
                          <SlidersHorizontal className="w-3 h-3 text-blue-400" />
                          <span>Điều chỉnh</span>
                        </button>
                      )}
                    </div>
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

      {/* Cross-Branch Stock Inquiry Modal (UC-ST09 4.a) */}
      {crossBranchItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-400" />
                  Tra Cứu Tồn Kho Liên Chi Nhánh (UC-ST09)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {crossBranchItem.productName} • <span className="font-mono text-blue-400">{crossBranchItem.sku}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCrossBranchItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[65vh] overflow-y-auto space-y-2.5">
              {loadingCrossBranch ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Đang kiểm tra tồn kho tại các chi nhánh trên toàn chuỗi...
                </div>
              ) : crossBranchStocks.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
                  Hiện không có chi nhánh nào còn tồn kho khả dụng cho mã SKU này.
                </div>
              ) : (
                crossBranchStocks.map((b) => (
                  <div
                    key={b.branchId}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        <span>{b.branchName}</span>
                        {b.isHeadquarter && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px]">
                            Kho Trung Tâm
                          </span>
                        )}
                      </div>
                      {b.address && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{b.address}</span>
                        </div>
                      )}
                      {b.phone && (
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{b.phone}</span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold shrink-0 ${
                        b.quantity > 0
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {b.statusLabel || `Còn ${b.quantity}`}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                type="button"
                onClick={() => setCrossBranchItem(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchStockTable;
