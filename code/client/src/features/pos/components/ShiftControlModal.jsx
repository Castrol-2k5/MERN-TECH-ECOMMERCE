import { useState, useMemo } from 'react';
import {
  X,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  ArrowDownCircle,
  Coins,
  Calculator,
  ShieldCheck,
  Building2,
  Clock,
  User,
  DollarSign
} from 'lucide-react';
import posShiftService from '../services/posShiftService.js';

const DENOMINATIONS = [
  500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000
];

const formatVND = (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫`;

export const ShiftControlModal = ({
  isOpen,
  onClose,
  currentShift,
  onShiftUpdated,
  branchName = 'Showroom'
}) => {
  const [activeTab, setActiveTab] = useState(currentShift ? 'close' : 'open');
  const [openingBalance, setOpeningBalance] = useState(1000000); // 1.000.000đ mặc định
  const [dropAmount, setDropAmount] = useState(500000);
  const [dropReason, setDropReason] = useState('Nộp két an toàn');

  // Mảng đếm tiền theo mệnh giá
  const [denomCounts, setDenomCounts] = useState(
    DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d]: 0 }), {})
  );
  const [discrepancyNote, setDiscrepancyNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tính tổng tiền đếm thực tế
  const actualEndingBalance = useMemo(() => {
    return Object.entries(denomCounts).reduce(
      (sum, [denom, count]) => sum + Number(denom) * (Number(count) || 0),
      0
    );
  }, [denomCounts]);

  const expectedEndingBalance = currentShift?.expectedEndingBalance || 0;
  const discrepancy = actualEndingBalance - expectedEndingBalance;

  const handleDenomChange = (denom, count) => {
    const val = Math.max(0, parseInt(count, 10) || 0);
    setDenomCounts((prev) => ({ ...prev, [denom]: val }));
  };

  const handleOpenShift = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const shift = await posShiftService.openShift({
        openingBalance: Number(openingBalance)
      });
      setSuccessMsg('Mở ca thu ngân thành công!');
      if (onShiftUpdated) onShiftUpdated(shift);
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 800);
    } catch (err) {
      setErrorMsg(err?.response?.data?.error?.message || err?.message || 'Không thể mở ca thu ngân');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCashDrop = async (e) => {
    e.preventDefault();
    if (!currentShift) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const shift = await posShiftService.recordCashDrop(currentShift._id, {
        amount: Number(dropAmount),
        reason: dropReason
      });
      setSuccessMsg('Đã ghi nhận rút tiền nộp két an toàn!');
      if (onShiftUpdated) onShiftUpdated(shift);
      setTimeout(() => {
        setSuccessMsg('');
      }, 1500);
    } catch (err) {
      setErrorMsg(err?.response?.data?.error?.message || err?.message || 'Không thể rút tiền');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!currentShift) return;

    if (discrepancy !== 0 && !discrepancyNote.trim()) {
      setErrorMsg('Két tiền có chênh lệch. Vui lòng nhập lý do giải trình trước khi chốt ca.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const denominationsArray = Object.entries(denomCounts)
        .map(([denom, count]) => ({
          denomination: Number(denom),
          count: Number(count)
        }))
        .filter((d) => d.count > 0);

      const shift = await posShiftService.closeShift(currentShift._id, {
        actualEndingBalance,
        denominations: denominationsArray,
        discrepancyNote: discrepancyNote.trim()
      });

      setSuccessMsg('Chốt ca thu ngân & bàn giao két tiền thành công!');
      if (onShiftUpdated) onShiftUpdated(null);
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1000);
    } catch (err) {
      setErrorMsg(err?.response?.data?.error?.message || err?.message || 'Không thể chốt ca');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-xs space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Quản Lý Két Tiền & Ca Thu Ngân POS</h2>
              <p className="text-[11px] text-slate-400">Chi nhánh: {branchName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection (nếu ca đang mở) */}
        {currentShift && (
          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setActiveTab('close')}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'close'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Chốt ca kiểm quỹ
            </button>
            <button
              onClick={() => setActiveTab('drop')}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'drop'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              Rút tiền két sắt
            </button>
          </div>
        )}

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM 1: MỞ CA THU NGÂN */}
        {!currentShift && (
          <form onSubmit={handleOpenShift} className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] leading-relaxed">
              💡 <strong>Bắt đầu ca bán hàng:</strong> Vui lòng nhập số tiền lẻ ban đầu có sẵn trong két để thối tiền cho khách hàng. Hệ thống sẽ căn cứ số tiền này để đối soát cuối ca.
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                Tiền mặt đầu ca (Tiền thối trong két)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="10000"
                  min="0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-base focus:border-blue-500 focus:outline-none"
                  required
                />
                <span className="absolute right-4 top-2.5 font-bold text-slate-400">₫</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[500000, 1000000, 2000000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setOpeningBalance(quick)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    {formatVND(quick)}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/30 disabled:opacity-50"
            >
              <Unlock className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang mở ca...' : 'Xác Nhận Mở Ca Bán Hàng'}</span>
            </button>
          </form>
        )}

        {/* FORM 2: RÚT TIỀN KÉT AN TOÀN (CASH DROP) */}
        {currentShift && activeTab === 'drop' && (
          <form onSubmit={handleCashDrop} className="space-y-4">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Tiền hiện có trong két:</span>
              <strong className="text-white font-mono text-sm">{formatVND(expectedEndingBalance)}</strong>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Số tiền rút nộp két sắt
              </label>
              <input
                type="number"
                step="50000"
                min="1000"
                max={expectedEndingBalance}
                value={dropAmount}
                onChange={(e) => setDropAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Lý do rút tiền
              </label>
              <input
                type="text"
                value={dropReason}
                onChange={(e) => setDropReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || dropAmount > expectedEndingBalance}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Rút Tiền Két Sắt'}
            </button>
          </form>
        )}

        {/* FORM 3: CHỐT CA & ĐẾM TIỀN KIỂM QUỸ */}
        {currentShift && activeTab === 'close' && (
          <form onSubmit={handleCloseShift} className="space-y-4">
            {/* Thống kê thu chi trong ca */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block">Đầu ca</span>
                <span className="font-mono font-bold text-slate-200">
                  {formatVND(currentShift.openingBalance)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Thu POS (Tiền mặt)</span>
                <span className="font-mono font-bold text-emerald-400">
                  +{formatVND(currentShift.cashSales)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Đã rút nộp</span>
                <span className="font-mono font-bold text-amber-400">
                  -{formatVND(
                    (currentShift.cashDrops || []).reduce(
                      (s, d) => s + (Number(d.amount) || 0),
                      0
                    )
                  )}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-blue-400 block font-bold">Lý thuyết trong két</span>
                <span className="font-mono font-extrabold text-blue-400 text-sm">
                  {formatVND(expectedEndingBalance)}
                </span>
              </div>
            </div>

            {/* Bảng đếm mệnh giá tiền mặt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-blue-400" />
                  Kiểm đếm tiền mặt thực tế trong két:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    // Quick fill: Tự điền khớp tiền lý thuyết
                    setDenomCounts({
                      500000: Math.floor(expectedEndingBalance / 500000),
                      200000: Math.floor((expectedEndingBalance % 500000) / 200000),
                      100000: Math.floor((expectedEndingBalance % 200000) / 100000),
                      50000: Math.floor((expectedEndingBalance % 100000) / 50000),
                      20000: 0,
                      10000: 0,
                      5000: 0,
                      2000: 0,
                      1000: 0
                    });
                  }}
                  className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                >
                  ⚡ Tự động khớp lý thuyết
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                {DENOMINATIONS.map((d) => (
                  <div key={d} className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-mono text-[10px] font-semibold text-slate-400">
                      {(d / 1000).toLocaleString('vi-VN')}k
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={denomCounts[d] || ''}
                      placeholder="0"
                      onChange={(e) => handleDenomChange(d, e.target.value)}
                      className="w-12 px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-center text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Khối hiển thị Chênh lệch quỹ (Discrepancy) */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-colors ${
                discrepancy === 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : discrepancy > 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <div>
                <span className="font-bold block">
                  Tổng tiền đếm thực tế: <strong>{formatVND(actualEndingBalance)}</strong>
                </span>
                <span className="text-[11px] opacity-80">
                  {discrepancy === 0
                    ? '✅ Két tiền cân khớp 100%'
                    : discrepancy > 0
                    ? `⚠️ Thừa tiền trong két (+${formatVND(discrepancy)})`
                    : `🔴 Thiếu tiền trong két (${formatVND(discrepancy)})`}
                </span>
              </div>
              <span className="font-mono font-black text-sm">
                {discrepancy >= 0 ? `+${formatVND(discrepancy)}` : formatVND(discrepancy)}
              </span>
            </div>

            {/* Ô nhập giải trình nếu lệch */}
            {discrepancy !== 0 && (
              <div>
                <label className="block text-[11px] font-bold text-rose-300 mb-1">
                  Lý do giải trình chênh lệch quỹ (Bắt buộc):
                </label>
                <textarea
                  rows="2"
                  value={discrepancyNote}
                  onChange={(e) => setDiscrepancyNote(e.target.value)}
                  placeholder="Ví dụ: Khách không lấy 2.000đ tiền thối, hoặc thối nhầm đơn lúc 11h..."
                  className="w-full px-3 py-2 bg-slate-950 border border-rose-500/40 rounded-xl text-white text-xs focus:outline-none focus:border-rose-400"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-600/30 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang chốt ca...' : 'Xác Nhận Chốt Ca & Bàn Giao Két'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ShiftControlModal;
