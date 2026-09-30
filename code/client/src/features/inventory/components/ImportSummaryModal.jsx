import { X, Download, PackagePlus } from 'lucide-react';

export const ImportSummaryModal = ({
  isOpen,
  onClose,
  skuCode,
  branchName,
  validationReport,
  onConfirmImport,
  isImporting = false
}) => {
  if (!isOpen || !validationReport) return null;

  const { total = 0, valid = 0, duplicate = 0, malformed = 0, items = [] } = validationReport;

  const handleDownloadErrors = () => {
    const errorItems = items.filter((i) => i.status !== 'VALID');
    const content = 'Line,SerialNumber,Status,Detail\n' +
      errorItems.map((i) => `${i.line},${i.serialNumber},${i.status},${i.detail}`).join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error_serials_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="font-bold text-sm text-slate-100">Xác nhận nhập kho danh sách Serial / IMEI</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              SKU: <span className="font-mono text-cyan-400">{skuCode}</span> • Chi nhánh: <span className="text-slate-300 font-semibold">{branchName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Stats */}
        <div className="grid grid-cols-4 gap-2.5 p-4 bg-slate-950 border-b border-slate-800 text-center">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Tổng dòng</span>
            <span className="font-mono font-bold text-base text-slate-100">{total}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Hợp lệ</span>
            <span className="font-mono font-bold text-base text-emerald-400">{valid}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Trùng lặp</span>
            <span className="font-mono font-bold text-base text-amber-400">{duplicate}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Sai định dạng</span>
            <span className="font-mono font-bold text-base text-rose-400">{malformed}</span>
          </div>
        </div>

        {/* Preview Items Table */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Xem trước kết quả kiểm tra ({items.length} dòng):</span>
            {(duplicate > 0 || malformed > 0) && (
              <button
                type="button"
                onClick={handleDownloadErrors}
                className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải danh sách lỗi ({duplicate + malformed})</span>
              </button>
            )}
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-2 px-3 w-12 text-center">Dòng</th>
                  <th className="py-2 px-3">Mã Serial / IMEI</th>
                  <th className="py-2 px-3 text-center">Trạng thái</th>
                  <th className="py-2 px-3">Ghi chú kiểm tra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {items.slice(0, 100).map((item) => (
                  <tr key={item.line} className="hover:bg-slate-850/50">
                    <td className="py-2 px-3 text-center font-mono text-slate-500 text-[11px]">
                      {item.line}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-200">
                      {item.serialNumber}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {item.status === 'VALID' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Hợp lệ
                        </span>
                      ) : item.status.includes('DUPLICATE') ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Trùng serial
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Sai format
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-400">
                      {item.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notice & Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400 leading-snug">
            Khi bấm xác nhận, hệ thống sẽ tạo <strong className="text-emerald-400">{valid}</strong> Serial trạng thái <code>IN_STOCK</code> và tự động tăng tồn kho tương ứng.
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="button"
              disabled={valid === 0 || isImporting}
              onClick={onConfirmImport}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/25 cursor-pointer"
            >
              {isImporting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <PackagePlus className="w-4 h-4" />
                  <span>XÁC NHẬN NHẬP KHO • {valid} SERIAL</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportSummaryModal;
