import { useState } from 'react';
import { useSelector } from 'react-redux';
import { X, SlidersHorizontal, AlertCircle, Plus, Minus, Check } from 'lucide-react';

export const StockAdjustModal = ({ isOpen, onClose, item, onSubmit }) => {
  const authUser = useSelector((state) => state.auth?.user);
  const [adjustmentType, setAdjustmentType] = useState('INCREASE'); // 'INCREASE' | 'DECREASE'
  const [delta, setDelta] = useState(1);
  const [reason, setReason] = useState('Kiểm kê định kỳ phát hiện thừa/thiếu');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const reasonsList = [
    'Kiểm kê định kỳ phát hiện thừa/thiếu',
    'Hàng hư hỏng linh kiện / móp méo bao bì',
    'Nhập nhầm mã SKU / barcode',
    'Xuất hủy sản phẩm lỗi kỹ thuật',
    'Điều chuyển nội bộ khẩn cấp'
  ];

  const currentAvailable = item.quantityAvailable || 0;
  const quantityDelta = adjustmentType === 'INCREASE' ? delta : -delta;
  const newAvailable = Math.max(0, currentAvailable + quantityDelta);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (delta <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        branchId: item.branchId || authUser?.branchId,
        productId: item.productId,
        productSkuId: item.productSkuId,
        quantityDelta,
        reason: `${reason}${note ? ` - ${note}` : ''}`
      });
      onClose();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Điều chỉnh tồn kho kiểm kê</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{item.productName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Current vs New Stock Indicator */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Tồn khả dụng hiện tại:</span>
              <span className="font-mono text-lg font-bold text-slate-200">{currentAvailable}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Tồn sau điều chỉnh:</span>
              <span className={`font-mono text-lg font-bold ${newAvailable < currentAvailable ? 'text-amber-400' : 'text-emerald-400'}`}>
                {newAvailable}
              </span>
            </div>
          </div>

          {/* Adjustment Direction Toggle */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Chiều hướng điều chỉnh:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('INCREASE')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  adjustmentType === 'INCREASE'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                Cộng thêm kho (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('DECREASE')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  adjustmentType === 'DECREASE'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Minus className="w-4 h-4" />
                Giảm trừ kho (-)
              </button>
            </div>
          </div>

          {/* Quantity Delta Input */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Số lượng điều chỉnh (Delta):
            </label>
            <input
              type="number"
              min="1"
              value={delta}
              onChange={(e) => setDelta(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Reason Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Lý do điều chỉnh (Bắt buộc theo chuẩn kiểm toán):
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            >
              {reasonsList.map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Note / Memo */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Ghi chú chi tiết biên bản:
            </label>
            <textarea
              rows="2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập mã biên bản kiểm kê hoặc số chứng từ giải trình..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500 placeholder-slate-600"
            ></textarea>
          </div>

          {item.hasSerial && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl text-xs text-cyan-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
              <span>
                Sản phẩm này có quản lý Serial. Nếu số lượng giảm trừ, vui lòng cập nhật trạng thái serial tương ứng trong Drawer Serials.
              </span>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || delta <= 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Xác nhận điều chỉnh
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustModal;
