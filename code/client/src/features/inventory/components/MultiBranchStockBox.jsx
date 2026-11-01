import { useState, useEffect } from 'react';
import { Store, Clock, CheckCircle2 } from 'lucide-react';
import inventoryService from '../services/inventoryService.js';

export const MultiBranchStockBox = ({
  skuId,
  selectedBranchId,
  onSelectBranch,
  onStockSummaryChange,
}) => {
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStock = async () => {
      setLoading(true);
      const data = await inventoryService.getBranchesWithSkuStock(skuId || 'default-sku');
      if (!isMounted) return;
      const list = Array.isArray(data) ? data : [];
      setStockList(list);
      setLoading(false);

      const totalStock = list.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
      if (onStockSummaryChange) {
        onStockSummaryChange({ totalStock, branches: list });
      }
      // Auto-select first available branch if none selected
      const firstAvail = list.find((b) => Number(b.quantity) > 0);
      if (firstAvail && onSelectBranch && !selectedBranchId) {
        onSelectBranch(firstAvail);
      }
    };
    fetchStock();
    return () => {
      isMounted = false;
    };
  }, [skuId]); // eslint-disable-line react-hooks/exhaustive-deps

  const badgeStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const totalAvailable = stockList.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-blue-600" />
          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
            Tồn kho thực tế tại Showroom
          </h4>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" />
          <span>Thời gian thực</span>
        </div>
      </div>

      {loading ? (
        <div className="py-4 text-center text-xs text-slate-400">Đang kiểm tra tồn kho...</div>
      ) : stockList.length === 0 || totalAvailable === 0 ? (
        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
            Tạm thời hết hàng trên toàn hệ thống
          </div>
          {stockList.map((branch) => (
            <div
              key={branch.branchId}
              className="p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3 opacity-60 bg-slate-50/50"
            >
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-900">{branch.branchName}</span>
                <span className="text-[11px] text-slate-500 line-clamp-1">{branch.address}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 bg-rose-50 text-rose-700 border-rose-200">
                {branch.statusLabel || 'Hết hàng'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {stockList.map((branch) => {
            const isAvailable = branch.quantity > 0;
            const isSelected = selectedBranchId && String(selectedBranchId) === String(branch.branchId);
            return (
              <div
                key={branch.branchId}
                onClick={() => isAvailable && onSelectBranch && onSelectBranch(branch)}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 shadow-2xs cursor-pointer'
                    : isAvailable
                      ? 'border-slate-100 hover:bg-slate-50 hover:border-blue-200 cursor-pointer'
                      : 'border-slate-100 opacity-60 bg-slate-50/50'
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">{branch.branchName}</span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" /> Đang chọn
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 line-clamp-1">{branch.address}</span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${
                    badgeStyles[branch.badgeVariant] || badgeStyles.success
                  }`}
                >
                  {branch.statusLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiBranchStockBox;
