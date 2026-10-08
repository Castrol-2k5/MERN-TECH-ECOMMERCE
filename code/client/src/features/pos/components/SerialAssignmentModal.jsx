import { useState } from 'react';
import { X, Hash, ScanBarcode, Check, Plus, AlertTriangle } from 'lucide-react';

export const SerialAssignmentModal = ({
  isOpen,
  onClose,
  item,
  onSaveSerials
}) => {
  const [inputSerial, setInputSerial] = useState('');
  const [serials, setSerials] = useState(item?.serialsAssigned || []);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !item) return null;

  const requiredCount = item.quantity || 1;
  const availableDemoSerials = item.availableSerials || [];

  const handleAddSerial = (sn) => {
    const cleanSn = String(sn || inputSerial).trim().toUpperCase();
    if (!cleanSn) return;

    if (serials.includes(cleanSn)) {
      setErrorMsg(`Mã Serial [${cleanSn}] đã được thêm vào danh sách!`);
      return;
    }

    if (serials.length >= requiredCount) {
      setErrorMsg(`Đã đủ số lượng ${requiredCount} Serial cho mặt hàng này!`);
      return;
    }

    setSerials([...serials, cleanSn]);
    setInputSerial('');
    setErrorMsg('');
  };

  const handleRemove = (sn) => {
    setSerials(serials.filter((s) => s !== sn));
    setErrorMsg('');
  };

  const handleSave = () => {
    if (serials.length !== requiredCount) {
      setErrorMsg(`Cần gán chính xác ${requiredCount} Serial (hiện có ${serials.length})!`);
      return;
    }
    onSaveSerials(item.productSkuId, serials);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Gán Serial / IMEI cho sản phẩm</h3>
              <p className="text-xs text-slate-400 truncate max-w-sm">{item.name}</p>
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
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Status summary */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400">Tiến độ gán Serial:</span>
            <span
              className={`font-mono font-bold text-xs px-2.5 py-1 rounded-md ${
                serials.length === requiredCount
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {serials.length} / {requiredCount} SERIAL
            </span>
          </div>

          {/* Barcode scanner input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddSerial();
            }}
            className="space-y-1.5"
          >
            <label className="text-xs font-semibold text-slate-300">
              Quét barcode hoặc nhập mã Serial/IMEI:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={inputSerial}
                  onChange={(e) => {
                    setInputSerial(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Ví dụ: SN-IP16-VN-9081"
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs font-mono focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <button
                type="submit"
                disabled={!inputSerial.trim()}
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {errorMsg}
              </p>
            )}
          </form>

          {/* Danh sách Serial đã chọn */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2">
              Mã Serial đã gán:
            </label>
            {serials.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                Chưa có mã Serial nào được gán cho sản phẩm này
              </div>
            ) : (
              <div className="space-y-1.5">
                {serials.map((sn, idx) => (
                  <div
                    key={sn}
                    className="flex items-center justify-between px-3 py-2 bg-slate-950 rounded-lg border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span className="font-mono font-medium text-slate-200">{sn}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(sn)}
                      className="text-slate-500 hover:text-rose-400 text-xs font-semibold transition-colors"
                    >
                      Gỡ bỏ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gợi ý Serials có sẵn trong kho chi nhánh */}
          {availableDemoSerials.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Gợi ý tồn kho chi nhánh ({availableDemoSerials.length} khả dụng):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableDemoSerials.map((sn) => {
                  const isSelected = serials.includes(sn);
                  return (
                    <button
                      key={sn}
                      type="button"
                      disabled={isSelected || serials.length >= requiredCount}
                      onClick={() => handleAddSerial(sn)}
                      className={`px-2 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed line-through'
                          : 'bg-slate-800/80 hover:bg-cyan-600 hover:text-white text-slate-300 border border-slate-700/60'
                      }`}
                    >
                      + {sn}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
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
            onClick={handleSave}
            disabled={serials.length !== requiredCount}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer disabled:cursor-not-allowed"
          >
            <Check className="w-3.5 h-3.5" />
            Lưu danh sách Serial
          </button>
        </div>
      </div>
    </div>
  );
};

export default SerialAssignmentModal;
