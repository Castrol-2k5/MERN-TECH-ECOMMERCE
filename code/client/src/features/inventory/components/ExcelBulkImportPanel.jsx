import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Loader2,
  Trash2,
} from 'lucide-react';
import inventoryService from '../services/inventoryService.js';

export const ExcelBulkImportPanel = ({
  products = [],
  selectedBranchId = '',
  selectedBranchName = '',
  onImportSuccess,
  onError,
}) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [reason, setReason] = useState('Nhập lô hàng đa sản phẩm từ Excel');
  const [parsedGroups, setParsedGroups] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDownloadTemplate = () => {
    const serialProd = products.find((p) => p.isSerialManaged !== false && p.skus?.length > 0);
    const qtyProd = products.find((p) => p.isSerialManaged === false && p.skus?.length > 0);

    const serialSku = serialProd?.skus?.[0]?.sku || serialProd?.skus?.[0]?.code || 'IP16PM-256-DESERT';
    const qtySku = qtyProd?.skus?.[0]?.sku || qtyProd?.skus?.[0]?.code || 'CHG-ANKER-65W';

    const rows = [
      { sku: serialSku, quantity: 1, serialNumber: 'SN-DEMO-2026-0001' },
      { sku: serialSku, quantity: 1, serialNumber: 'SN-DEMO-2026-0002' },
      { sku: qtySku, quantity: 25, serialNumber: '' },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: ['sku', 'quantity', 'serialNumber'] });
    worksheet['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 28 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_Nhap_Kho');
    XLSX.writeFile(workbook, 'Mau_Nhap_Kho_TechOne.xlsx');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setParsedGroups([]);
    setFileErrors([]);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

      if (!rawRows || rawRows.length === 0) {
        setFileErrors(['Tệp Excel/CSV trống hoặc không có dòng dữ liệu nào.']);
        return;
      }

      // Build SKU lookup from loaded catalog
      const skuMap = new Map();
      for (const p of products) {
        for (const s of p.skus || []) {
          const code = String(s.sku || s.code || '').trim().toUpperCase();
          if (code) {
            skuMap.set(code, { product: p, skuObj: s });
          }
        }
      }

      // Fetch existing serials in DB to catch duplicates early
      let existingSerialSet = new Set();
      try {
        const allDbSerials = await inventoryService.getSerials({});
        existingSerialSet = new Set(
          (allDbSerials || []).map((s) => String(s.serialNumber || '').trim().toUpperCase()).filter(Boolean)
        );
      } catch {
        // Backend will also enforce duplicate check All-or-Nothing
      }

      const groupMap = new Map();
      const errors = [];
      const seenSerialsInFile = new Map(); // serial -> rowNumber

      rawRows.forEach((row, index) => {
        const rowNum = index + 2; // Excel row number (header = 1)
        const rawSku = String(
          row.sku ?? row.SKU ?? row.Ma_SKU ?? row['Mã SKU'] ?? ''
        )
          .trim()
          .toUpperCase();
        const rawQty = row.quantity ?? row.Quantity ?? row.So_luong ?? row['Số lượng'] ?? '';
        const rawSerial = String(
          row.serialNumber ?? row.serial ?? row.Serial ?? row.imei ?? row.IMEI ?? row['Serial/IMEI'] ?? ''
        )
          .trim()
          .toUpperCase();

        if (!rawSku && !rawSerial && !rawQty) return; // skip blank row

        if (!rawSku) {
          errors.push(`Dòng ${rowNum}: Thiếu mã SKU.`);
          return;
        }

        const matched = skuMap.get(rawSku);
        if (!matched) {
          errors.push(`Dòng ${rowNum}: Mã SKU "${rawSku}" không tồn tại trong hệ thống.`);
          return;
        }

        const { product } = matched;
        const isSerialManaged = product.isSerialManaged !== false;

        if (!groupMap.has(rawSku)) {
          groupMap.set(rawSku, {
            sku: rawSku,
            productName: product.name,
            unit: product.unit || 'Cái',
            isSerialManaged,
            quantity: 0,
            serials: [],
            rowErrors: [],
          });
        }
        const grp = groupMap.get(rawSku);

        if (isSerialManaged) {
          if (!rawSerial) {
            const msg = `Dòng ${rowNum} (${rawSku}): Sản phẩm quản lý theo Serial/IMEI nhưng cột serialNumber bị trống.`;
            errors.push(msg);
            grp.rowErrors.push(msg);
            return;
          }
          if (seenSerialsInFile.has(rawSerial)) {
            const msg = `Dòng ${rowNum} (${rawSku}): Mã Serial "${rawSerial}" trùng lặp với dòng ${seenSerialsInFile.get(rawSerial)} trong file.`;
            errors.push(msg);
            grp.rowErrors.push(msg);
            return;
          }
          if (existingSerialSet.has(rawSerial)) {
            const msg = `Dòng ${rowNum} (${rawSku}): Mã Serial "${rawSerial}" đã tồn tại trong kho hệ thống.`;
            errors.push(msg);
            grp.rowErrors.push(msg);
            return;
          }
          seenSerialsInFile.set(rawSerial, rowNum);
          grp.serials.push(rawSerial);
          grp.quantity += 1;
        } else {
          if (rawSerial) {
            const msg = `Dòng ${rowNum} (${rawSku}): Sản phẩm quản lý theo Số lượng, không được điền mã Serial "${rawSerial}".`;
            errors.push(msg);
            grp.rowErrors.push(msg);
            return;
          }
          const qtyNum = parseInt(rawQty, 10);
          if (Number.isNaN(qtyNum) || qtyNum <= 0) {
            const msg = `Dòng ${rowNum} (${rawSku}): Số lượng phải là số nguyên dương.`;
            errors.push(msg);
            grp.rowErrors.push(msg);
            return;
          }
          grp.quantity += qtyNum;
        }
      });

      setParsedGroups(Array.from(groupMap.values()));
      setFileErrors(errors);
    } catch (err) {
      setFileErrors([`Không thể đọc file Excel/CSV: ${err.message}`]);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmBulkImport = async () => {
    if (!selectedBranchId || parsedGroups.length === 0 || fileErrors.length > 0) return;

    setIsSubmitting(true);
    try {
      const items = parsedGroups.map((g) => ({
        sku: g.sku,
        quantity: g.quantity,
        serials: g.isSerialManaged ? g.serials : [],
      }));

      const res = await inventoryService.bulkImport({
        branchId: selectedBranchId,
        reason: reason.trim() || 'Nhập lô hàng đa sản phẩm từ Excel',
        items,
      });

      setParsedGroups([]);
      setFileName('');
      setFileErrors([]);
      onImportSuccess?.(res);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Lỗi nhập lô đa sản phẩm.';
      setFileErrors([msg]);
      onError?.(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalUnits = parsedGroups.reduce((sum, g) => sum + g.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Guide & Download Template */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Import Excel (.xlsx) / CSV Đa Sản Phẩm (Chuẩn 3 Cột)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Mỗi dòng ứng với <strong>1 mã Serial/IMEI</strong> (hàng máy) hoặc <strong>1 dòng tổng số lượng</strong> (phụ kiện) — không lo vỡ ô khi nhập 100–1.000 máy.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Tải File Mẫu (.xlsx)</span>
        </button>
      </div>

      {/* Dropzone & Reason */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="relative border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-7 bg-slate-950/60 transition-colors text-center cursor-pointer group">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              {isParsing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">
                {fileName ? `Đã chọn tệp: ${fileName}` : 'Kéo thả file Excel (.xlsx / .csv) vào đây hoặc bấm để chọn'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cấu trúc cột: <code className="text-cyan-400">sku</code> •{' '}
                <code className="text-cyan-400">quantity</code> •{' '}
                <code className="text-cyan-400">serialNumber</code>
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            Ghi chú / Lý do nhập lô hàng:
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Nhập tồn đầu kỳ Q1, Nhập lô hàng bổ sung..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Errors Banner (All-or-Nothing) */}
      {fileErrors.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/40 space-y-2">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Phát hiện {fileErrors.length} lỗi trong file (Hệ thống áp dụng All-or-Nothing — vui lòng sửa sạch lỗi trước khi nhập):
            </span>
          </div>
          <ul className="list-disc list-inside text-[11px] text-rose-200/90 space-y-1 max-h-40 overflow-y-auto pl-1">
            {fileErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Grouped Preview Table */}
      {parsedGroups.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/50">
            <div>
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Bảng Xem Trước Đã Gom Nhóm ({parsedGroups.length} SKU • {totalUnits} đơn vị)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Chi nhánh tiếp nhận: <strong className="text-blue-400">{selectedBranchName}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setParsedGroups([]);
                  setFileErrors([]);
                  setFileName('');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa file</span>
              </button>
              <button
                type="button"
                disabled={fileErrors.length > 0 || isSubmitting}
                onClick={handleConfirmBulkImport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
                <span>{isSubmitting ? 'Đang nhập kho...' : 'Xác nhận Nhập toàn bộ lô'}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-4">Mã SKU</th>
                  <th className="py-2.5 px-3">Sản phẩm</th>
                  <th className="py-2.5 px-3 text-center">Loại quản lý</th>
                  <th className="py-2.5 px-3 text-right">Số lượng nhập</th>
                  <th className="py-2.5 px-3">Mã Serial/IMEI mẫu</th>
                  <th className="py-2.5 px-4 text-center">Kiểm tra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {parsedGroups.map((g) => {
                  const hasErr = g.rowErrors.length > 0;
                  return (
                    <tr key={g.sku} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-300">{g.sku}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-200">{g.productName}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            g.isSerialManaged
                              ? 'bg-cyan-500/15 text-cyan-300'
                              : 'bg-purple-500/15 text-purple-300'
                          }`}
                        >
                          {g.isSerialManaged ? 'Serial / IMEI' : 'Số lượng'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        +{g.quantity} {g.unit}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                        {g.isSerialManaged
                          ? g.serials.slice(0, 3).join(', ') +
                            (g.serials.length > 3 ? ` (+${g.serials.length - 3} mã)` : '')
                          : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {hasErr ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                            <AlertCircle className="w-3 h-3" /> {g.rowErrors.length} lỗi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Hợp lệ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelBulkImportPanel;
