import { useMemo } from 'react';
import { Hash, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const SerialParserTextarea = ({
  rawText,
  onChangeText,
  existingSerials = [],
  onParsedResult
}) => {
  // Parse and validate serials in real-time
  const parseReport = useMemo(() => {
    if (!rawText.trim()) {
      return { total: 0, valid: 0, duplicate: 0, malformed: 0, items: [] };
    }

    const lines = rawText
      .split(/[\r\n,;]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const seen = new Set();
    const items = [];
    let validCount = 0;
    let duplicateCount = 0;
    let malformedCount = 0;

    lines.forEach((sn, idx) => {
      let status = 'VALID';
      let detail = 'Hợp lệ';

      if (sn.length < 6) {
        status = 'MALFORMED';
        detail = 'Mã quá ngắn (< 6 ký tự)';
        malformedCount++;
      } else if (seen.has(sn)) {
        status = 'DUPLICATE_INTERNAL';
        detail = 'Trùng lặp trong danh sách dán';
        duplicateCount++;
      } else if (existingSerials.includes(sn)) {
        status = 'DUPLICATE_DB';
        detail = 'Đã tồn tại trong hệ thống kho';
        duplicateCount++;
      } else {
        seen.add(sn);
        validCount++;
      }

      items.push({
        line: idx + 1,
        serialNumber: sn,
        status,
        detail
      });
    });

    const report = {
      total: lines.length,
      valid: validCount,
      duplicate: duplicateCount,
      malformed: malformedCount,
      items
    };

    onParsedResult?.(report);
    return report;
  }, [rawText, existingSerials, onParsedResult]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-sm text-slate-100">Danh sách Serial / IMEI (Paste trực tiếp)</h3>
        </div>
        <span className="text-[11px] text-slate-400">
          Hỗ trợ phân cách bằng xuống dòng, dấu phẩy (,) hoặc chấm phẩy (;)
        </span>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          rows="5"
          value={rawText}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Dán danh sách mã Serial/IMEI vào đây...&#10;Ví dụ:&#10;C02ZQ0ABQ6L7&#10;C02ZQ0ABQ8T4&#10;C02ZQ0ABQ9P2"
          className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-medium leading-relaxed"
        ></textarea>
      </div>

      {/* Live Validation Counter Badge Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Tổng mã:</span>
          <span className="font-mono text-sm font-bold text-slate-100">{parseReport.total}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Hợp lệ:
          </span>
          <span className="font-mono text-sm font-bold text-emerald-400">{parseReport.valid}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Trùng serial:
          </span>
          <span className="font-mono text-sm font-bold text-amber-400">{parseReport.duplicate}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-400" /> Sai format:
          </span>
          <span className="font-mono text-sm font-bold text-rose-400">{parseReport.malformed}</span>
        </div>
      </div>
    </div>
  );
};

export default SerialParserTextarea;
