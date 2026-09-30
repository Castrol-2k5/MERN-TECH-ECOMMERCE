import { useState } from 'react';
import { X, Hash, Search, Calendar, ShieldCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const SerialListDrawer = ({ isOpen, onClose, item }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  if (!isOpen || !item) return null;

  const serials = item.serials || [];

  const filteredSerials = serials.filter((s) => {
    const matchSearch = s.serialNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const inStockCount = serials.filter((s) => s.status === 'IN_STOCK').length;
  const soldCount = serials.filter((s) => s.status === 'SOLD').length;
  const warrantyCount = serials.filter((s) => s.status === 'WARRANTY').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN_STOCK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Trong kho
          </span>
        );
      case 'SOLD':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Đã bán
          </span>
        );
      case 'WARRANTY':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Bảo hành
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 text-slate-100">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Hash className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-100">Danh sách Serial / IMEI</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.productName}</p>
              <p className="text-[11px] font-mono text-slate-400">SKU: {item.sku}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick stats tabs */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 border-b border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setFilterStatus('IN_STOCK')}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                filterStatus === 'IN_STOCK'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="font-mono font-bold text-sm text-emerald-400">{inStockCount}</div>
              <div className="text-[10px]">Trong kho</div>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('SOLD')}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                filterStatus === 'SOLD'
                  ? 'bg-slate-700/50 border-slate-600 text-slate-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="font-mono font-bold text-sm text-slate-300">{soldCount}</div>
              <div className="text-[10px]">Đã xuất bán</div>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('WARRANTY')}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                filterStatus === 'WARRANTY'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="font-mono font-bold text-sm text-amber-400">{warrantyCount}</div>
              <div className="text-[10px]">Bảo hành</div>
            </button>
          </div>

          {/* Search serial */}
          <div className="p-3 border-b border-slate-800 bg-slate-900">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm nhanh mã Serial, IMEI..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* List of serials */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredSerials.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Không tìm thấy mã Serial/IMEI nào phù hợp
              </div>
            ) : (
              filteredSerials.map((sn) => (
                <div
                  key={sn.serialNumber}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-cyan-300 tracking-wider">
                      {sn.serialNumber}
                    </span>
                    {getStatusBadge(sn.status)}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Nhập: {sn.importDate}
                    </span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      BH: {sn.warrantyMonths || 12} tháng
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 text-right">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Đóng Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SerialListDrawer;
