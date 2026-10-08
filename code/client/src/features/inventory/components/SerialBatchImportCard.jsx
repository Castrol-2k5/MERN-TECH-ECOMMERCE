import { useState, useId } from 'react';
import { FileSpreadsheet, Upload, Store, Package } from 'lucide-react';

export const SerialBatchImportCard = ({
  branches = [],
  products = [],
  selectedBranchId,
  selectedSku,
  onSelectBranch,
  onSelectSku,
  onFileUploaded
}) => {
  const [fileName, setFileName] = useState('');
  const [fileDetails, setFileDetails] = useState('');
  const fileInputId = useId();

  const handleSimulateFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileDetails(`${(file.size / 1024).toFixed(1)} KB • Sẵn sàng parse`);
      // Giả lập đọc nội dung file serials
      const sampleSerials = [
        'C02ZQ0ABQ6L7',
        'C02ZQ0ABQ8T4',
        'C02ZQ0ABQ9P2',
        'C02ZQ0ABR1K8',
        'C02ZQ0ABR3V6',
        'C02ZQ0ABR4N1',
        'C02ZQ0ABR5X9',
        'C02ZQ0ABR6W2',
        'C02ZQ0ABR7Y8',
        'C02ZQ0ABR8Z3'
      ];
      onFileUploaded?.(sampleSerials.join('\n'));
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-slate-100">
      <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
          <Upload className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-100">Thiết lập lô hàng nhập kho</h3>
          <p className="text-xs text-slate-400">Chọn chi nhánh tiếp nhận và biến thể SKU thiết bị</p>
        </div>
      </div>

      {/* Selectors: Branch & SKU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Branch Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-blue-400" />
            <span>Chi nhánh nhập kho:</span>
          </label>
          <select
            value={selectedBranchId}
            onChange={(e) => onSelectBranch(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {branches.map((b) => (
              <option key={b._id || b.code} value={b._id || b.code}>
                {b.name} ({b.address})
              </option>
            ))}
          </select>
        </div>

        {/* SKU Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-blue-400" />
            <span>Sản phẩm &amp; Biến thể SKU:</span>
          </label>
          <select
            value={selectedSku?.code || ''}
            onChange={(e) => {
              const code = e.target.value;
              let foundSku = null;
              for (const p of products) {
                const s = p.skus?.find((sk) => sk.code === code);
                if (s) {
                  foundSku = { ...s, productName: p.name, productId: p._id };
                  break;
                }
              }
              onSelectSku(foundSku);
            }}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
          >
            {products.flatMap((p) =>
              (p.skus || []).map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} • {p.name} ({Object.values(s.options || {}).join(' / ') || 'Chuẩn'})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Dropzone File Upload */}
      <div className="relative border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 bg-slate-950/60 transition-colors text-center cursor-pointer group">
        <input
          id={fileInputId}
          type="file"
          accept=".xlsx,.xls,.csv,.txt"
          onChange={handleSimulateFile}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">
              {fileName || 'Kéo thả file Excel / CSV hoặc bấm để chọn tệp'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {fileDetails || 'Hỗ trợ .xlsx, .csv định dạng 1 cột chứa mã Serial/IMEI'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SerialBatchImportCard;
