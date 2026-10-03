import { useState } from 'react';
import { X, MapPin, CheckCircle2, Navigation, Send } from 'lucide-react';

export const BranchAllocationModal = ({
  isOpen,
  onClose,
  order,
  branches = [],
  onConfirmAllocation,
  isAllocating = false
}) => {
  const displayBranches = branches && branches.length > 0
    ? branches.map((b, idx) => ({
        _id: b._id,
        name: b.name || b.branchName || 'Chi nhánh TechOne',
        distanceKm: b.distanceKm || (idx === 0 ? 1.2 : 3.5),
        stockAvailable: b.stockAvailable ?? 10,
        isRecommended: idx === 0
      }))
    : [];

  const [selectedBranchId, setSelectedBranchId] = useState(
    displayBranches[0]?._id || ''
  );

  if (!isOpen || !order) return null;

  const handleConfirm = () => {
    const branch = displayBranches.find((b) => b._id === selectedBranchId) || displayBranches[0];
    if (branch) {
      onConfirmAllocation(order.orderCode, branch);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Điều phối đơn hàng B2C sang chi nhánh</h3>
              <p className="text-xs text-slate-400 font-mono">Đơn #{order.orderCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Customer Destination Info */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Địa chỉ giao hàng của khách:
            </span>
            <p className="text-xs font-bold text-slate-200">{order.customerName} • {order.phone}</p>
            <p className="text-xs text-slate-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{order.shippingAddress || '124 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM'}</span>
            </p>
          </div>

          {/* Branch Candidates */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Lựa chọn chi nhánh xuất kho tối ưu:
            </label>
            <div className="space-y-2">
              {displayBranches.map((branch) => {
                const isSelected = branch._id === selectedBranchId;
                return (
                  <div
                    key={branch._id}
                    onClick={() => setSelectedBranchId(branch._id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 text-white shadow-md shadow-blue-500/10'
                        : 'bg-slate-950 border-slate-800 hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{branch.name}</span>
                        {branch.isRecommended && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Gần nhất
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Khoảng cách: <strong>{branch.distanceKm} km</strong> • Tồn khả dụng: <strong className="text-cyan-400">{branch.stockAvailable} máy</strong>
                      </p>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-900'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isAllocating}
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            {isAllocating ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Xác nhận chuyển đơn sang chi nhánh</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchAllocationModal;
