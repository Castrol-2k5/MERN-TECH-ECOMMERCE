import { useState, useEffect } from 'react';
import { Store, Clock } from 'lucide-react';
import inventoryService from '../services/inventoryService.js';

export const MultiBranchStockBox = ({ skuId, onSelectBranch }) => {
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStock = async () => {
      setLoading(true);
      const data = await inventoryService.getBranchesWithSkuStock(skuId || 'default-sku');
      setStockList(data);
      setLoading(false);
    };
    fetchStock();
  }, [skuId]);

  const badgeStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
  };

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
      ) : (
        <div className="space-y-2">
          {stockList.map((branch) => {
            const isAvailable = branch.quantity > 0;
            return (
              <div
                key={branch.branchId}
                onClick={() => isAvailable && onSelectBranch && onSelectBranch(branch)}
                className={`p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3 transition-colors ${
                  isAvailable ? 'hover:bg-slate-50 cursor-pointer' : 'opacity-60 bg-slate-50/50'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-900">{branch.branchName}</span>
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
