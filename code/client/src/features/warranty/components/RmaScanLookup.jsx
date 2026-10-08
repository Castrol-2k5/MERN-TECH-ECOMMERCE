import { useState } from 'react';
import { ScanBarcode, Search, ShieldCheck, AlertTriangle, User, Calendar, MapPin } from 'lucide-react';

export const RmaScanLookup = ({ onLookup, result, loading = false }) => {
  const [serialInput, setSerialInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!serialInput.trim()) return;
    onLookup(serialInput.trim());
  };

  const handleQuickLookup = (sn) => {
    setSerialInput(sn);
    onLookup(sn);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
          <ScanBarcode className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-bold text-sm text-slate-100">Tra cứu thông tin E-Warranty theo Serial / IMEI</h2>
          <p className="text-xs text-slate-400">
            Quét mã vạch trên thân máy, vỏ hộp hoặc tra cứu theo số Serial mua tại hệ thống
          </p>
        </div>
      </div>

      {/* Barcode Search Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <ScanBarcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={serialInput}
            onChange={(e) => setSerialInput(e.target.value)}
            placeholder="Quét mã vạch hoặc nhập Serial/IMEI (Ví dụ: SN-IP16-VN-9075, C02ZQ0ABQ6L7)..."
            className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={!serialInput.trim() || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>Tra cứu</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Test Demo Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] font-semibold text-slate-500">Mẫu tra cứu nhanh:</span>
        <button
          type="button"
          onClick={() => handleQuickLookup('SN-IP16-VN-9075')}
          className="px-2 py-0.5 rounded-md bg-slate-850 hover:bg-slate-800 text-cyan-300 font-mono text-[11px] border border-cyan-800/40 cursor-pointer transition-colors"
        >
          SN-IP16-VN-9075 (iPhone 16 PM)
        </button>
        <button
          type="button"
          onClick={() => handleQuickLookup('C02ZQ0ABQ6L7')}
          className="px-2 py-0.5 rounded-md bg-slate-850 hover:bg-slate-800 text-cyan-300 font-mono text-[11px] border border-cyan-800/40 cursor-pointer transition-colors"
        >
          C02ZQ0ABQ6L7 (MacBook Air M4)
        </button>
        <button
          type="button"
          onClick={() => handleQuickLookup('SN-EXPIRED-2023')}
          className="px-2 py-0.5 rounded-md bg-slate-850 hover:bg-slate-800 text-amber-300 font-mono text-[11px] border border-amber-800/40 cursor-pointer transition-colors"
        >
          SN-EXPIRED-2023 (Hết hạn BH)
        </button>
      </div>

      {/* Tra cứu Result Card */}
      {result && (
        <div className="pt-3 border-t border-slate-800 animate-in fade-in duration-200 space-y-3">
          {/* Eligibility Banner */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
              result.isEligible
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/50 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {result.isEligible ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
              <span>{result.statusLabel}</span>
            </div>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/30">
              {result.daysRemaining > 0 ? `Còn ${result.daysRemaining} ngày` : 'Hết hạn'}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            {/* Product Meta */}
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                <img
                  src={result.image}
                  alt={result.productName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-100">{result.productName}</h4>
                <p className="text-[11px] font-mono text-cyan-400">S/N: {result.serialNumber}</p>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>Mua: {result.saleDate}</span>
                  <span>•</span>
                  <span className="text-emerald-400">Hạn BH: {result.warrantyEndDate}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{result.branchPurchased}</span>
                </div>
              </div>
            </div>

            {/* Customer Meta */}
            <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4 space-y-1 text-xs">
              <div className="text-slate-400 font-semibold flex items-center gap-1.5 mb-1 text-[11px] uppercase">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Chủ sở hữu thiết bị:
              </div>
              <p className="font-bold text-slate-200">{result.customer?.fullName}</p>
              <p className="font-mono text-slate-300">SĐT: {result.customer?.phone}</p>
              <p className="text-slate-400 text-[11px]">{result.customer?.address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RmaScanLookup;
