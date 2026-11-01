import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RefreshCw, Download, Store } from 'lucide-react';
import inventoryService from '../../features/inventory/services/inventoryService';
import branchService from '../../features/branches/services/branchService';
import BranchStockKpiCards from '../../features/inventory/components/BranchStockKpiCards';
import BranchStockTable from '../../features/inventory/components/BranchStockTable';
import SerialListDrawer from '../../features/inventory/components/SerialListDrawer';
import StockAdjustModal from '../../features/inventory/components/StockAdjustModal';

export const BranchInventoryPage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('TẤT CẢ');
  const [status, setStatus] = useState('ALL');

  // Modals state
  const [activeSerialItem, setActiveSerialItem] = useState(null);
  const [activeAdjustItem, setActiveAdjustItem] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Fetch branches on mount
  useEffect(() => {
    let ignore = false;
    branchService.getBranches().then((list) => {
      if (!ignore && list && list.length > 0) {
        const sortedList = [...list].sort((a, b) => {
          const aHq = Boolean(a.isHeadquarter || a.branchCode === 'BR-HQ');
          const bHq = Boolean(b.isHeadquarter || b.branchCode === 'BR-HQ');
          return Number(bHq) - Number(aHq);
        });
        setBranches(sortedList);
        const hqBranch = sortedList.find((b) => b.isHeadquarter || b.branchCode === 'BR-HQ');
        const defaultBranchId =
          authUser?.branchId && sortedList.some((b) => b._id === authUser.branchId)
            ? authUser.branchId
            : hqBranch?._id || sortedList[0]._id;
        setSelectedBranchId(defaultBranchId);
      }
    });
    return () => {
      ignore = true;
    };
  }, [authUser?.branchId]);

  const selectedBranch = branches.find((b) => b._id === selectedBranchId) || null;
  const canAdjustSelectedBranch =
    authUser?.role === 'BRANCH_MANAGER' ||
    Boolean(selectedBranch?.isHeadquarter || selectedBranch?.branchCode === 'BR-HQ');

  const handleExportCsv = () => {
    if (!items || items.length === 0) return;
    const headers = ['SKU', 'Tên sản phẩm', 'Danh mục', 'Vị trí kệ', 'Tồn thực tế', 'Tồn khả dụng', 'Số Serial'];
    const rows = items.map((it) => [
      `"${it.sku || ''}"`,
      `"${String(it.productName || '').replace(/"/g, '""')}"`,
      `"${it.category || ''}"`,
      `"${it.shelfLocation || ''}"`,
      it.quantityPhysical || 0,
      it.quantityAvailable || 0,
      it.serials?.length || 0
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kiem-ke-kho-${selectedBranch?.branchCode || 'branch'}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const fetchInventory = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const data = await inventoryService.getBranchInventory(selectedBranchId, {
        search,
        category,
        status,
      });
      setItems(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, search, category, status]);

  useEffect(() => {
    if (!selectedBranchId) return;
    let active = true;

    const loadInventory = async () => {
      try {
        const data = await inventoryService.getBranchInventory(selectedBranchId, {
          search,
          category,
          status,
        });
        if (active) {
          setItems(data);
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInventory();

    return () => {
      active = false;
    };
  }, [selectedBranchId, search, category, status]);

  const handleAdjustSubmit = async (payload) => {
    const res = await inventoryService.adjustStock({
      ...payload,
      branchId: selectedBranchId,
    });
    setToastMsg({
      type: 'success',
      message: res?.message || 'Cập nhật điều chỉnh tồn kho thành công!',
    });
    setTimeout(() => setToastMsg(null), 4000);
    fetchInventory();
  };

  return (
    <div className="space-y-5 select-none font-sans text-slate-100">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Kho Chi Nhánh:</span>
            {branches.length > 0 && (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer hover:bg-slate-700 transition-colors"
              >
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.branchName || b.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight">
            Quản Lý Tồn Kho &amp; Định Vị Quầy Kệ
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo dõi tồn khả dụng thời gian thực, quản lý Serial/IMEI và thực hiện kiểm kê định kỳ
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchInventory}
            disabled={loading}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={items.length === 0}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV Kiểm Kê</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {toastMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs font-semibold text-emerald-300 flex items-center justify-between animate-in fade-in">
          <span>{toastMsg.message}</span>
          <button onClick={() => setToastMsg(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* 4 KPI Cards */}
      <BranchStockKpiCards items={items} />

      {/* Branch Stock Table */}
      <BranchStockTable
        items={items}
        loading={loading}
        canAdjust={canAdjustSelectedBranch}
        onOpenSerials={(item) => setActiveSerialItem(item)}
        onOpenAdjust={(item) => setActiveAdjustItem(item)}
        onSearch={setSearch}
        onFilterCategory={setCategory}
        onFilterStatus={setStatus}
        selectedCategory={category}
        selectedStatus={status}
      />

      {/* Serial Drawer */}
      <SerialListDrawer
        isOpen={Boolean(activeSerialItem)}
        onClose={() => setActiveSerialItem(null)}
        item={activeSerialItem}
        branchId={selectedBranchId}
      />

      {/* Stock Adjust Modal */}
      <StockAdjustModal
        isOpen={Boolean(activeAdjustItem)}
        onClose={() => setActiveAdjustItem(null)}
        item={activeAdjustItem}
        onSubmit={handleAdjustSubmit}
      />
    </div>
  );
};

export default BranchInventoryPage;
