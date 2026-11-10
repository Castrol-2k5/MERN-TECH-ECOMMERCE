import { X, Printer, CheckCircle2, AlertTriangle } from 'lucide-react';

const formatVND = (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫`;

export const ShiftHandoverPrintModal = ({ isOpen, onClose, shift, branchName = 'TechOne Showroom' }) => {
  if (!isOpen || !shift) return null;

  const totalDrops = (shift.cashDrops || []).reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const cashInTotal = Number(shift.cashInTotal) || (shift.cashVouchers || []).filter((v) => v.type === 'IN').reduce((s, v) => s + (Number(v.amount) || 0), 0);
  const cashOutTotal = Number(shift.cashOutTotal) || (shift.cashVouchers || []).filter((v) => v.type === 'OUT').reduce((s, v) => s + (Number(v.amount) || 0), 0);
  const discrepancy = Number(shift.discrepancy) || 0;
  const resolvedBranchName = shift.branchId?.name || branchName;
  const resolvedBranchAddress = shift.branchId?.address || '';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm print:bg-white print:p-0 print:static">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #shift-handover-print-sheet, #shift-handover-print-sheet * { visibility: visible !important; }
          #shift-handover-print-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto print:overflow-visible print:max-h-none">
        {/* Top Modal Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 no-print">
          <div>
            <h3 className="text-sm font-black text-white">Biên Bản Bàn Giao Ca &amp; Két Tiền POS</h3>
            <p className="text-[11px] text-slate-400">Xem trước bản in khổ A5/K80 chuẩn đối soát nội bộ</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Biên Bản</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div
          id="shift-handover-print-sheet"
          className="bg-white text-slate-900 rounded-2xl p-6 text-xs space-y-4 shadow-inner"
        >
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-3">
            <div className="font-black text-base tracking-wide uppercase">
              TECHONE TECHNOLOGY RETAIL
            </div>
            <div className="text-[11px] text-slate-600 font-semibold mt-0.5">{resolvedBranchName}</div>
            {resolvedBranchAddress && (
              <div className="text-[10px] text-slate-500">{resolvedBranchAddress}</div>
            )}
            <h2 className="text-sm font-black uppercase mt-3 tracking-wider">
              BIÊN BẢN ĐỐI SOÁT &amp; BÀN GIAO CA THU NGÂN
            </h2>
            <div className="font-mono text-[11px] font-bold text-slate-700 mt-0.5">
              Mã ca: {shift.shiftCode} • Trạng thái: {shift.status === 'OPEN' ? 'TẠM TÍNH (ĐANG MỞ)' : 'ĐÃ CHỐT CA'}
            </div>
          </div>

          {/* Shift Info Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] border-b border-dashed border-slate-300 pb-3">
            <div>
              <span className="text-slate-500">Thu ngân phụ trách:</span>{' '}
              <strong className="text-slate-900">{shift.cashierId?.fullName || 'Nhân viên thu ngân'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Số đơn tiền mặt:</span>{' '}
              <strong className="font-mono">{shift.totalOrdersCount || 0} đơn</strong>
            </div>
            <div>
              <span className="text-slate-500">Giờ mở ca:</span>{' '}
              <strong className="font-mono">{new Date(shift.openedAt).toLocaleString('vi-VN')}</strong>
            </div>
            <div>
              <span className="text-slate-500">Giờ chốt ca:</span>{' '}
              <strong className="font-mono">
                {shift.closedAt ? new Date(shift.closedAt).toLocaleString('vi-VN') : 'Chưa chốt'}
              </strong>
            </div>
          </div>

          {/* Cash Flow Summary Table */}
          <div>
            <h4 className="font-bold text-[11px] uppercase text-slate-700 mb-2">
              1. Tổng hợp dòng tiền mặt trong ca
            </h4>
            <table className="w-full text-[11px] border border-slate-300 border-collapse">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-1.5 px-3 text-slate-600">Tiền lẻ đầu ca bàn giao</td>
                  <td className="py-1.5 px-3 text-right font-mono font-semibold">{formatVND(shift.openingBalance)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-slate-600">(+) Doanh thu bán hàng tiền mặt POS</td>
                  <td className="py-1.5 px-3 text-right font-mono font-semibold text-emerald-700">
                    +{formatVND(shift.cashSales)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-slate-600">(+) Thu tiền mặt nội bộ khác (Phiếu thu)</td>
                  <td className="py-1.5 px-3 text-right font-mono font-semibold text-emerald-700">
                    +{formatVND(cashInTotal)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-slate-600">(-) Hoàn tiền trả hàng bằng tiền mặt</td>
                  <td className="py-1.5 px-3 text-right font-mono font-semibold text-rose-700">
                    -{formatVND(shift.cashRefunds)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-slate-600">(-) Chi tiền mặt nội bộ (Phiếu chi)</td>
                  <td className="py-1.5 px-3 text-right font-mono font-semibold text-rose-700">
                    -{formatVND(cashOutTotal)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-slate-600">(-) Rút tiền nộp két sắt an toàn giữa ca</td>
                  <td className="py-1.5 px-3 text-right font-mono font-semibold text-amber-700">
                    -{formatVND(totalDrops)}
                  </td>
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <td className="py-2 px-3 text-slate-900">(=) TỒN QUỸ LÝ THUYẾT TRONG KÉT</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-900">{formatVND(shift.expectedEndingBalance)}</td>
                </tr>
                {shift.status === 'CLOSED' && (
                  <>
                    <tr className="font-bold">
                      <td className="py-2 px-3 text-slate-900">KIỂM ĐẾM THỰC TẾ CUỐI CA</td>
                      <td className="py-2 px-3 text-right font-mono text-blue-700">
                        {formatVND(shift.actualEndingBalance)}
                      </td>
                    </tr>
                    <tr className="font-black bg-slate-50">
                      <td className="py-2 px-3 flex items-center gap-1.5">
                        {discrepancy === 0 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span>CHÊNH LỆCH THỪA / THIẾU</span>
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono ${
                          discrepancy === 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {discrepancy > 0 ? `+${formatVND(discrepancy)}` : formatVND(discrepancy)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {shift.discrepancyNote && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                <strong>Giải trình chênh lệch:</strong> {shift.discrepancyNote}
              </div>
            )}
          </div>

          {/* Cash Vouchers List (if any) */}
          {Array.isArray(shift.cashVouchers) && shift.cashVouchers.length > 0 && (
            <div>
              <h4 className="font-bold text-[11px] uppercase text-slate-700 mb-1.5">
                2. Bảng kê phiếu Thu / Chi nội bộ ({shift.cashVouchers.length} phiếu)
              </h4>
              <table className="w-full text-[10px] border border-slate-300 border-collapse">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="py-1 px-2 text-left border-b border-slate-300">Mã phiếu</th>
                    <th className="py-1 px-2 text-left border-b border-slate-300">Loại</th>
                    <th className="py-1 px-2 text-left border-b border-slate-300">Danh mục / Lý do</th>
                    <th className="py-1 px-2 text-right border-b border-slate-300">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {shift.cashVouchers.map((v, idx) => (
                    <tr key={v._id || idx}>
                      <td className="py-1 px-2 font-mono">{v.voucherCode}</td>
                      <td className="py-1 px-2 font-bold">{v.type === 'IN' ? 'THU' : 'CHI'}</td>
                      <td className="py-1 px-2">
                        [{v.category}] {v.reason}
                      </td>
                      <td className="py-1 px-2 text-right font-mono font-bold">
                        {v.type === 'IN' ? '+' : '-'}{formatVND(v.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Denominations Table (if closed & counted) */}
          {Array.isArray(shift.denominations) && shift.denominations.length > 0 && (
            <div>
              <h4 className="font-bold text-[11px] uppercase text-slate-700 mb-1.5">
                {Array.isArray(shift.cashVouchers) && shift.cashVouchers.length > 0 ? '3.' : '2.'} Bảng kiểm đếm mệnh giá tiền mặt
              </h4>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                {shift.denominations.map((d, i) => (
                  <div key={i} className="flex justify-between px-2 py-1 border border-slate-200 rounded bg-slate-50">
                    <span className="font-mono">{formatVND(d.denomination)}</span>
                    <span className="font-mono font-bold">x{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-5 mt-4 border-t border-dashed border-slate-300 text-center text-[11px]">
            <div>
              <div className="font-bold uppercase">Người giao ca (Thu ngân)</div>
              <div className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
              <div className="h-14"></div>
              <div className="font-bold">{shift.cashierId?.fullName || '________________'}</div>
            </div>
            <div>
              <div className="font-bold uppercase">Quản lý xác nhận / Nhận ca</div>
              <div className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
              <div className="h-14"></div>
              <div className="font-bold">{shift.approvedById?.fullName || '________________'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftHandoverPrintModal;
