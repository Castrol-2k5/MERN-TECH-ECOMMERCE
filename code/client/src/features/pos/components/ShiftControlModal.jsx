import { useState, useMemo, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  Calculator,
  Printer,
  Receipt
} from 'lucide-react';
import posShiftService from '../services/posShiftService.js';
import ShiftHandoverPrintModal from './ShiftHandoverPrintModal.jsx';

const DENOMINATIONS = [
  500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000
];

const VOUCHER_CATEGORIES = {
  OUT: [
    'Văn phòng phẩm / Tiếp khách',
    'Chi phí vận chuyển / Gửi hàng lẻ',
    'Mua vật tư vệ sinh / Tạp vụ',
    'Chi phí phát sinh khác'
  ],
  IN: [
    'Thu tiền bồi thường / Đền bù',
    'Thu tiền thanh lý vật tư lẻ',
    'Thu hộ / Hoàn ứng tiền mặt',
    'Thu khác ngoài bán hàng'
  ]
};

const formatVND = (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫`;

export const ShiftControlModal = ({
  isOpen,
  onClose,
  currentShift,
  onShiftUpdated,
  branchName = 'Showroom'
}) => {
  const [activeTab, setActiveTab] = useState(currentShift ? 'close' : 'open');
  const [openingBalance, setOpeningBalance] = useState(1000000);
  const [dropAmount, setDropAmount] = useState(500000);
  const [dropReason, setDropReason] = useState('Nộp két an toàn');

  // Voucher (Thu / Chi nội bộ) state
  const [voucherType, setVoucherType] = useState('OUT');
  const [voucherCategory, setVoucherCategory] = useState(VOUCHER_CATEGORIES.OUT[0]);
  const [voucherAmount, setVoucherAmount] = useState(50000);
  const [voucherReason, setVoucherReason] = useState('');

  // Mảng đếm tiền theo mệnh giá
  const [denomCounts, setDenomCounts] = useState(
    DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d]: 0 }), {})
  );
  const [discrepancyNote, setDiscrepancyNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Biên bản bàn giao sau khi chốt ca / in tạm tính
  const [printShiftData, setPrintShiftData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      if (!currentShift) {
        setActiveTab('open');
      } else if (activeTab === 'open') {
        setActiveTab('close');
      }
    }
  }, [isOpen, currentShift]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVoucherTypeChange = (type) => {
    setVoucherType(type);
    setVoucherCategory(VOUCHER_CATEGORIES[type][0]);
  };

  // Tính tổng tiền đếm thực tế
  const actualEndingBalance = useMemo(() => {
    return Object.entries(denomCounts).reduce(
      (sum, [denom, count]) => sum + Number(denom) * (Number(count) || 0),
      0
    );
  }, [denomCounts]);

  const expectedEndingBalance = currentShift?.expectedEndingBalance || 0;
  const discrepancy = actualEndingBalance - expectedEndingBalance;

  const totalDrops = useMemo(
    () => (currentShift?.cashDrops || []).reduce((s, d) => s + (Number(d.amount) || 0), 0),
    [currentShift]
  );

  const cashInTotal = Number(currentShift?.cashInTotal) || 0;
  const cashOutTotal = Number(currentShift?.cashOutTotal) || 0;

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

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    if (!currentShift) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const shift = await posShiftService.recordCashVoucher(currentShift._id, {
        type: voucherType,
        category: voucherCategory,
        amount: Number(voucherAmount),
        reason: voucherReason.trim()
      });
      setSuccessMsg(
        `Đã lập phiếu ${voucherType === 'IN' ? 'Thu' : 'Chi'} ${formatVND(voucherAmount)} thành công!`
      );
      setVoucherReason('');
      if (onShiftUpdated) onShiftUpdated(shift);
      setTimeout(() => {
        setSuccessMsg('');
      }, 2000);
    } catch (err) {
      setErrorMsg(err?.response?.data?.error?.message || err?.message || 'Không thể lập phiếu thu/chi');
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

      const closedShift = await posShiftService.closeShift(currentShift._id, {
        actualEndingBalance,
        denominations: denominationsArray,
        discrepancyNote: discrepancyNote.trim()
      });

      setSuccessMsg('Chốt ca thu ngân & bàn giao két tiền thành công!');
      if (onShiftUpdated) onShiftUpdated(null);
      if (closedShift) {
        setPrintShiftData(closedShift);
      } else {
        onClose();
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.error?.message || err?.message || 'Không thể chốt ca');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !printShiftData) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">Quản Lý Két Tiền &amp; Ca Thu Ngân POS</h2>
                  <p className="text-[11px] text-slate-400">
                    Chi nhánh: {branchName} {currentShift ? `• Ca: ${currentShift.shiftCode}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {currentShift && (
                  <button
                    type="button"
                    onClick={() => setPrintShiftData(currentShift)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Xem & In biên bản tạm tính ca hiện tại"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                    <span>In tạm tính</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tab Selection (nếu ca đang mở) */}
            {currentShift && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('close')}
                  className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'close'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Chốt ca kiểm quỹ
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('voucher')}
                  className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'voucher'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  Thu / Chi nội bộ
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('drop')}
                  className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'drop'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                  Rút nộp két sắt
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

            {/* FORM 2: THU / CHI NỘI BỘ TRONG CA (UC-POS-10) */}
            {currentShift && activeTab === 'voucher' && (
              <div className="space-y-4">
                <form onSubmit={handleCreateVoucher} className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Tiền mặt lý thuyết đang có trong két:</span>
                    <strong className="text-blue-400 font-mono text-sm">{formatVND(expectedEndingBalance)}</strong>
                  </div>

                  {/* Loại phiếu IN / OUT */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleVoucherTypeChange('OUT')}
                      className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        voucherType === 'OUT'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                      Phiếu Chi Tiền Mặt (-)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVoucherTypeChange('IN')}
                      className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        voucherType === 'IN'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      Phiếu Thu Tiền Mặt (+)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Danh mục thu / chi</label>
                      <select
                        value={voucherCategory}
                        onChange={(e) => setVoucherCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                      >
                        {VOUCHER_CATEGORIES[voucherType].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Số tiền (Tối thiểu 1.000 ₫)</label>
                      <input
                        type="number"
                        step="1000"
                        min="1000"
                        value={voucherAmount}
                        onChange={(e) => setVoucherAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Lý do chi tiết (Bắt buộc):
                    </label>
                    <input
                      type="text"
                      value={voucherReason}
                      onChange={(e) => setVoucherReason(e.target.value)}
                      placeholder={
                        voucherType === 'OUT'
                          ? 'Ví dụ: Mua 2 thùng nước suối tiếp khách showroom'
                          : 'Ví dụ: Thu tiền bồi thường làm trầy phụ kiện trưng bày'
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || (voucherType === 'OUT' && Number(voucherAmount) > expectedEndingBalance)}
                    className={`w-full py-2.5 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 ${
                      voucherType === 'OUT'
                        ? 'bg-rose-600 hover:bg-rose-500'
                        : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
                  >
                    {isSubmitting
                      ? 'Đang lưu phiếu...'
                      : voucherType === 'OUT'
                      ? 'Xác Nhận Lập Phiếu Chi'
                      : 'Xác Nhận Lập Phiếu Thu'}
                  </button>
                </form>

                {/* Danh sách phiếu thu/chi đã lập trong ca */}
                {Array.isArray(currentShift.cashVouchers) && currentShift.cashVouchers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-300 uppercase">
                      Phiếu Thu / Chi đã lập trong ca ({currentShift.cashVouchers.length})
                    </h4>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {currentShift.cashVouchers.map((v, idx) => (
                        <div
                          key={v._id || idx}
                          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-slate-400">{v.voucherCode}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  v.type === 'IN'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {v.type === 'IN' ? 'THU' : 'CHI'}
                              </span>
                              <span className="text-slate-300 font-semibold truncate">{v.category}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{v.reason}</p>
                          </div>
                          <span
                            className={`font-mono font-bold shrink-0 ${
                              v.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {v.type === 'IN' ? '+' : '-'}{formatVND(v.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FORM 3: RÚT TIỀN KÉT AN TOÀN (CASH DROP) */}
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

            {/* FORM 4: CHỐT CA & ĐẾM TIỀN KIỂM QUỸ */}
            {currentShift && activeTab === 'close' && (
              <form onSubmit={handleCloseShift} className="space-y-4">
                {/* Thống kê thu chi trong ca */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Đầu ca</span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatVND(currentShift.openingBalance)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Thu bán POS (Mặt)</span>
                    <span className="font-mono font-bold text-emerald-400">
                      +{formatVND(currentShift.cashSales)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Thu / Chi nội bộ</span>
                    <span className="font-mono font-bold text-slate-200">
                      <span className="text-emerald-400">+{formatVND(cashInTotal)}</span>
                      {' / '}
                      <span className="text-rose-400">-{formatVND(cashOutTotal)}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Hoàn trả khách (Mặt)</span>
                    <span className="font-mono font-bold text-rose-400">
                      -{formatVND(currentShift.cashRefunds)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Đã rút nộp két sắt</span>
                    <span className="font-mono font-bold text-amber-400">
                      -{formatVND(totalDrops)}
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
                        setDenomCounts({
                          500000: Math.floor(expectedEndingBalance / 500000),
                          200000: Math.floor((expectedEndingBalance % 500000) / 200000),
                          100000: Math.floor((expectedEndingBalance % 200000) / 100000),
                          50000: Math.floor((expectedEndingBalance % 100000) / 50000),
                          20000: Math.floor((expectedEndingBalance % 50000) / 20000),
                          10000: Math.floor((expectedEndingBalance % 20000) / 10000),
                          5000: Math.floor((expectedEndingBalance % 10000) / 5000),
                          2000: Math.floor((expectedEndingBalance % 5000) / 2000),
                          1000: Math.floor((expectedEndingBalance % 2000) / 1000)
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
                  <span>{isSubmitting ? 'Đang chốt ca...' : 'Xác Nhận Chốt Ca & In Biên Bản Bàn Giao'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal In Biên Bản Bàn Giao Ca */}
      <ShiftHandoverPrintModal
        isOpen={Boolean(printShiftData)}
        onClose={() => {
          const wasClosed = printShiftData?.status === 'CLOSED';
          setPrintShiftData(null);
          if (wasClosed) onClose();
        }}
        shift={printShiftData}
        branchName={branchName}
      />
    </>
  );
};

export default ShiftControlModal;
