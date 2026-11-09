import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  X,
  Truck,
  ArrowRight
} from 'lucide-react';
import inventoryService from '../services/inventoryService.js';
import DataTablePagination from '../../../components/common/DataTablePagination.jsx';

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const categories = ['TẤT CẢ', 'Điện thoại', 'Laptop', 'Phụ kiện', 'Máy tính bảng'];

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus]);

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

  // Live stock counts for status tabs
  const { inStockCount, lowStockCount, outOfStockCount } = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    for (const it of items) {
      const avail = it.quantityAvailable || 0;
      const threshold = it.lowStockThreshold || 5;
      if (avail <= 0) {
        outOfStock++;
      } else if (avail <= threshold) {
        lowStock++;
      } else {
        inStock++;
      }
    }

    return { inStockCount: inStock, lowStockCount: lowStock, outOfStockCount: outOfStock };
  }, [items]);

  // Client-side filtering & search if not handled by server
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      // Search match
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        (it.productName && it.productName.toLowerCase().includes(q)) ||
        (it.sku && it.sku.toLowerCase().includes(q)) ||
        (it.shelfLocation && it.shelfLocation.toLowerCase().includes(q));

      // Category match
      const matchCategory =
        selectedCategory === 'TẤT CẢ' ||
        (it.category && it.category.toLowerCase() === selectedCategory.toLowerCase());

      // Status match
      const avail = it.quantityAvailable || 0;
      const threshold = it.lowStockThreshold || 5;
      let matchStatus = true;
      if (selectedStatus === 'IN_STOCK') {
        matchStatus = avail > threshold;
      } else if (selectedStatus === 'LOW_STOCK') {
        matchStatus = avail > 0 && avail <= threshold;
      } else if (selectedStatus === 'OUT_OF_STOCK') {
        matchStatus = avail <= 0;
      }

      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, searchTerm, selectedCategory, selectedStatus]);

  // Paginated items for current page
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;

  const getStockStatusBadge = (item) => {
    const avail = item.quantityAvailable || 0;
    const threshold = item.lowStockThreshold || 5;

    if (avail <= 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 w-fit">
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Hết hàng</span>
        </span>
      );
    }
    if (avail <= threshold) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 w-fit animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Sắp hết (Còn {avail})</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Sẵn sàng ({avail})</span>
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-0">
      {/* 4 Quick Filter Status Tabs */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onFilterStatus?.('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              selectedStatus === 'ALL'
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>Tất cả</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFilterStatus?.('IN_STOCK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              selectedStatus === 'IN_STOCK'
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Còn an toàn</span>
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px]">
              {inStockCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFilterStatus?.('LOW_STOCK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              selectedStatus === 'LOW_STOCK'
                ? 'bg-amber-600 border-amber-500 text-white shadow-xs'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>⚠️ Sắp hết hàng</span>
            <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px]">
              {lowStockCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onFilterStatus?.('OUT_OF_STOCK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              selectedStatus === 'OUT_OF_STOCK'
                ? 'bg-rose-600 border-rose-500 text-white shadow-xs'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-rose-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>❌ Đã hết hàng</span>
            <span className="px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-300 text-[10px]">
              {outOfStockCount}
            </span>
          </button>
        </div>

        {/* Quick Stock Transfer Link */}
        <Link
          to="/portal/branch/transfers"
          className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors w-fit"
        >
          <Truck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Điều phối &amp; Chuyển kho</span>
          <ArrowRight className="w-3 h-3 opacity-70" />
        </Link>
      </div>

      {/* Table Toolbar & Search Filters */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/60">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Tìm theo Tên sản phẩm, SKU, Vị trí quầy kệ (A-01-03)..."
            className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => handleSearchChange({ target: { value: '' } })}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Danh mục:</span>
            <select
              value={selectedCategory}
              onChange={(e) => onFilterCategory?.(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-semibold"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-slate-200">
                  {c}
                </option>
              ))}
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
              <th className="py-3 px-4">Trạng thái tồn</th>
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
            ) : paginatedItems.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-12 text-center text-slate-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  Không tìm thấy sản phẩm nào khớp với bộ lọc
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const avail = item.quantityAvailable || 0;
                const threshold = item.lowStockThreshold || 5;
                const isLow = avail > 0 && avail <= threshold;
                const isOut = avail <= 0;

                return (
                  <tr
                    key={item._id || item.sku}
                    className={`transition-colors ${
                      isOut
                        ? 'bg-rose-950/10 hover:bg-rose-950/20'
                        : isLow
                        ? 'bg-amber-950/10 hover:bg-amber-950/20'
                        : 'hover:bg-slate-850/60'
                    }`}
                  >
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
                    <td className="py-3 px-3 text-center font-mono font-bold text-sm">
                      <span
                        className={
                          isOut
                            ? 'text-rose-400'
                            : isLow
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {avail}
                      </span>
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
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer border ${
                            isLow || isOut
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-blue-600/20 hover:text-blue-300'
                          }`}
                          title="Tra cứu tồn kho SKU này tại các chi nhánh khác trong chuỗi (UC-ST09)"
                        >
                          <Store className="w-3 h-3 text-blue-400" />
                          <span>{isLow || isOut ? 'Tìm nguồn xin hàng' : 'Tồn chuỗi'}</span>
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <DataTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredItems.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20, 50]}
        variant="dark"
        itemName="mặt hàng SKU"
      />

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
                            Kho Trung Tâm (HQ)
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

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <Link
                to="/portal/branch/transfers"
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Tạo lệnh điều chuyển kho ngay</span>
              </Link>
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
