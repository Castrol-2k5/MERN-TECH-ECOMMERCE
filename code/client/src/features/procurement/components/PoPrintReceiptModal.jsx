import { X, Printer, FileText } from 'lucide-react';

const formatVnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')} ₫`;

const STATUS_LABEL = {
  DRAFT: 'Nháp',
  ORDERED: 'Đã đặt hàng (Chờ nhận)',
  RECEIVED: 'Đã nhập kho (RECEIVED)',
  CANCELLED: 'Đã hủy'
};

const PAYMENT_LABEL = {
  UNPAID: 'Chưa thanh toán',
  PARTIAL: 'Thanh toán một phần',
  PAID: 'Đã tất toán'
};

export const PoPrintReceiptModal = ({ po, onClose }) => {
  if (!po) return null;

  const vendor = po.vendorId || {};
  const warehouse = po.warehouseBranchId || {};
  const remainingDebt = Math.max(0, Number(po.totalAmount || 0) - Number(po.paidAmount || 0));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm print:bg-white print:p-0 print:static">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #po-print-sheet, #po-print-sheet * { visibility: visible !important; }
          #po-print-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 16px !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto print:overflow-visible print:max-h-none">
        {/* Top Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Phiếu Nhập Kho Tổng ({po.poCode})</h3>
              <p className="text-[11px] text-slate-400">Xem trước bản in lưu hồ sơ kế toán &amp; ký nhận NCC</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Phiếu Nhập</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div id="po-print-sheet" className="bg-white text-slate-900 rounded-2xl p-6 space-y-5 font-sans text-xs">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
            <div>
              <div className="text-lg font-black uppercase tracking-tight">TECHONE RETAIL CHAIN</div>
              <div className="text-[11px] text-slate-600">
                Kho nhận: {warehouse.branchCode || 'BR-HQ'} — {warehouse.name || 'Kho Tổng HQ'}
              </div>
              {warehouse.address && <div className="text-[11px] text-slate-500">{warehouse.address}</div>}
            </div>
            <div className="text-right">
              <div className="text-base font-black uppercase">PHIẾU NHẬP KHO (PO)</div>
              <div className="font-mono font-bold text-sm">{po.poCode}</div>
              <div className="text-[11px] text-slate-600">
                Ngày lập: {new Date(po.createdAt).toLocaleString('vi-VN')}
              </div>
              {po.receivedAt && (
                <div className="text-[11px] text-slate-600">
                  Ngày nhận kho: {new Date(po.receivedAt).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          </div>

          {/* Vendor & Status Info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="space-y-1">
              <div className="font-bold text-slate-700 uppercase text-[10px]">Nhà cung cấp</div>
              <div className="font-bold text-sm">{vendor.name || '--'}</div>
              <div className="text-slate-600">
                Mã NCC: <span className="font-mono font-semibold">{vendor.vendorCode || '--'}</span>
                {vendor.taxCode ? ` • MST: ${vendor.taxCode}` : ''}
              </div>
              {vendor.phone && <div className="text-slate-600">SĐT: {vendor.phone}</div>}
              {vendor.address && <div className="text-slate-600">Địa chỉ: {vendor.address}</div>}
            </div>
            <div className="space-y-1 text-right">
              <div className="font-bold text-slate-700 uppercase text-[10px]">Trạng thái chứng từ</div>
              <div className="font-semibold">Kho: {STATUS_LABEL[po.status] || po.status}</div>
              <div className="font-semibold">Thanh toán: {PAYMENT_LABEL[po.paymentStatus] || po.paymentStatus}</div>
              <div className="text-slate-600">Người lập: {po.createdBy?.fullName || 'Quản trị viên HQ'}</div>
              {po.receivedBy?.fullName && <div className="text-slate-600">Thủ kho nhận: {po.receivedBy.fullName}</div>}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse border border-slate-300 text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-300 px-2.5 py-2 w-10 text-center">STT</th>
                <th className="border border-slate-300 px-2.5 py-2">Sản phẩm &amp; SKU</th>
                <th className="border border-slate-300 px-2.5 py-2 text-center w-16">SL Đặt</th>
                <th className="border border-slate-300 px-2.5 py-2 text-center w-16">SL Nhận</th>
                <th className="border border-slate-300 px-2.5 py-2 text-right w-28">Đơn giá nhập</th>
                <th className="border border-slate-300 px-2.5 py-2 text-right w-28">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {(po.items || []).map((it, idx) => (
                <tr key={it.productSkuId || idx} className="align-top">
                  <td className="border border-slate-300 px-2.5 py-2 text-center">{idx + 1}</td>
                  <td className="border border-slate-300 px-2.5 py-2">
                    <div className="font-bold">{it.productName}</div>
                    <div className="font-mono text-[10px] text-slate-600">SKU: {it.sku}</div>
                    {Array.isArray(it.serials) && it.serials.length > 0 && (
                      <div className="mt-1 text-[10px] font-mono text-slate-700 break-all">
                        Serial ({it.serials.length}): {it.serials.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="border border-slate-300 px-2.5 py-2 text-center font-mono">{it.orderedQty}</td>
                  <td className="border border-slate-300 px-2.5 py-2 text-center font-mono font-bold">
                    {po.status === 'RECEIVED' ? it.receivedQty : '--'}
                  </td>
                  <td className="border border-slate-300 px-2.5 py-2 text-right font-mono">{formatVnd(it.unitCost)}</td>
                  <td className="border border-slate-300 px-2.5 py-2 text-right font-mono font-bold">
                    {formatVnd(
                      po.status === 'RECEIVED'
                        ? it.subtotal ?? Number(it.receivedQty || 0) * Number(it.unitCost || 0)
                        : Number(it.orderedQty || 0) * Number(it.unitCost || 0)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="flex flex-col items-end space-y-1 border-t border-slate-300 pt-3">
            <div className="flex justify-between w-64">
              <span className="text-slate-600">Tổng giá trị phiếu nhập:</span>
              <span className="font-mono font-black text-sm">{formatVnd(po.totalAmount)}</span>
            </div>
            <div className="flex justify-between w-64">
              <span className="text-slate-600">Đã thanh toán:</span>
              <span className="font-mono font-bold text-emerald-700">{formatVnd(po.paidAmount)}</span>
            </div>
            <div className="flex justify-between w-64">
              <span className="text-slate-600">Còn nợ NCC:</span>
              <span className="font-mono font-bold text-rose-700">{formatVnd(remainingDebt)}</span>
            </div>
          </div>

          {po.notes && (
            <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <strong>Ghi chú:</strong> {po.notes}
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[11px]">
            <div>
              <div className="font-bold uppercase">Người lập phiếu</div>
              <div className="text-slate-500 italic">(Ký, ghi rõ họ tên)</div>
              <div className="h-14" />
            </div>
            <div>
              <div className="font-bold uppercase">Thủ kho Tổng HQ</div>
              <div className="text-slate-500 italic">(Ký, ghi rõ họ tên)</div>
              <div className="h-14" />
            </div>
            <div>
              <div className="font-bold uppercase">Đại diện Giao hàng / NCC</div>
              <div className="text-slate-500 italic">(Ký, ghi rõ họ tên)</div>
              <div className="h-14" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoPrintReceiptModal;
