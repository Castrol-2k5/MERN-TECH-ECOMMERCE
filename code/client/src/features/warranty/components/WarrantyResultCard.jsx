import { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Check,
  X,
  FileText,
  Printer
} from 'lucide-react';
import RmaPrintReceiptModal from './RmaPrintReceiptModal';

const STATUS_MAP = {
  RECEIVED: { label: 'Đã tiếp nhận tại quầy', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  DIAGNOSING: { label: 'Kỹ thuật đang kiểm tra', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  QUOTATION_PENDING: { label: 'Chờ bạn duyệt báo giá', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  REPAIRING: { label: 'Đang sửa chữa linh kiện', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  REPAIR_REJECTED: { label: 'Đã từ chối sửa (Chờ trả máy)', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  READY_FOR_PICKUP: { label: 'Đã xong • Mời bạn đến nhận máy', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  RETURNED: { label: 'Đã bàn giao hoàn tất', color: 'bg-slate-100 text-slate-700 border-slate-200' }
};

const formatVND = (v) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`;

export const WarrantyResultCard = ({ data, onApproveQuotation }) => {
  const [selectedTicketForPrint, setSelectedTicketForPrint] = useState(null);
  const [approvingCode, setApprovingCode] = useState('');

  if (!data) return null;

  const handleDecision = async (ticketCode, approved) => {
    if (!onApproveQuotation) return;
    const confirmText = approved
      ? 'Bạn xác nhận ĐỒNG Ý với phương án và chi phí sửa chữa này?'
      : 'Bạn xác nhận TỪ CHỐI sửa chữa? Thiết bị sẽ được hoàn trả nguyên trạng 0₫ tại cửa hàng.';
    if (!window.confirm(confirmText)) return;

    setApprovingCode(ticketCode);
    try {
      await onApproveQuotation(ticketCode, {
        approved,
        phone: data.customer?.phone || '',
        note: approved ? 'Khách hàng duyệt trực tuyến trên web' : 'Khách từ chối báo giá trên web'
      });
    } finally {
      setApprovingCode('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8">
      {/* Device Summary Card */}
      <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Trạng thái thiết bị
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                data.isExpired
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{data.statusLabel || (data.isExpired ? 'Hết hạn bảo hành' : '✓ Còn hạn bảo hành')}</span>
            </span>
          </div>

          <div className="w-full h-48 rounded-2xl bg-slate-50 flex items-center justify-center p-4 mb-4 border border-slate-100">
            <img
              src={data.image || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'}
              alt={data.productName}
              className="max-h-full object-contain"
            />
          </div>

          <h3 className="text-lg font-black text-slate-900 leading-snug">
            {data.productName}
          </h3>
          {data.skuCode && (
            <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {data.skuCode}</p>
          )}

          <div className="mt-5 space-y-3 divide-y divide-slate-50 text-xs">
            <div className="pt-2 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Mã Serial / IMEI:</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {data.serialNumber}
              </span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày bán kích hoạt:
              </span>
              <span className="font-bold text-slate-900">
                {data.saleDate ? new Date(data.saleDate).toLocaleDateString('vi-VN') : '—'}
              </span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Ngày hết hạn:
              </span>
              <span className="font-bold text-slate-900">
                {data.warrantyEndDate ? new Date(data.warrantyEndDate).toLocaleDateString('vi-VN') : '—'}
              </span>
            </div>

            {data.branchPurchased && (
              <div className="pt-2 flex justify-between items-start">
                <span className="text-slate-500 font-medium flex items-center gap-1 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Showroom:
                </span>
                <span className="font-bold text-slate-900 text-right max-w-[220px]">
                  {data.branchPurchased}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 bg-blue-50/50 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-slate-700">Thời gian bảo hành còn lại:</span>
          </div>
          <span className="text-sm font-black text-blue-600">
            {data.daysRemaining || 0} ngày
          </span>
        </div>
      </div>

      {/* Warranty History Timeline & Interactive Action Cards */}
      <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <h3 className="text-base sm:text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
          <span>Tiến Độ Tiếp Nhận &amp; Lịch Sử Sửa Chữa</span>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {data.history?.length || 0} sự kiện
          </span>
        </h3>

        {data.history && data.history.length > 0 ? (
          <div className="space-y-5">
            {data.history.map((event, idx) => {
              const statusMeta = STATUS_MAP[event.status] || {
                label: event.status || 'Đang xử lý',
                color: 'bg-slate-100 text-slate-700 border-slate-200'
              };
              const totalCost = event.quotation?.totalCost || 0;
              const isPendingApproval = event.status === 'QUOTATION_PENDING';

              return (
                <div
                  key={event.ticketCode || event.id || idx}
                  className="rounded-2xl border border-slate-200/80 p-5 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 text-xs">
                          {event.ticketCode || `Lần ${idx + 1}`}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusMeta.color}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Ngày nhận:{' '}
                        {event.date ? new Date(event.date).toLocaleDateString('vi-VN') : '—'}
                        {event.branchName && ` • Chi nhánh: ${event.branchName}`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTicketForPrint({
                          ticketCode: event.ticketCode || 'RMA-TICKET',
                          serialNumber: data.serialNumber,
                          productName: data.productName,
                          customerInfo: data.customer || {},
                          issueDescription: event.issueDescription || event.title,
                          appearanceCondition: event.appearanceCondition || '',
                          devicePassword: event.devicePassword || '',
                          powerStatus: event.powerStatus || 'Lên nguồn bình thường',
                          accessories: event.accessories || [],
                          estimatedReturnDate: event.estimatedReturnDate || '',
                          quotation: event.quotation || {},
                          resolution: event.resolution || {},
                          handover: event.handover || {},
                          status: event.status
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Xem &amp; In biên bản</span>
                    </button>
                  </div>

                  {/* Fault Description */}
                  <div className="text-xs text-slate-700 space-y-1">
                    <div>
                      <span className="font-bold text-slate-900">Lỗi khách phản ánh: </span>
                      <span>{event.issueDescription || event.description}</span>
                    </div>
                    {event.appearanceCondition && (
                      <div>
                        <span className="font-bold text-slate-900">Ngoại quan: </span>
                        <span>{event.appearanceCondition}</span>
                      </div>
                    )}
                  </div>

                  {/* Technician Diagnosis & Quotation Box */}
                  {event.diagnosis?.technicianNotes && (
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-purple-700 font-bold">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Kết luận kỹ thuật viên:</span>
                      </div>
                      <p className="text-slate-700 font-medium">{event.diagnosis.technicianNotes}</p>

                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-500">Chế độ sửa: </span>
                          <span className="font-semibold text-slate-900">
                            {event.quotation?.isUnderWarranty
                              ? 'Bảo hành chính hãng (Miễn phí 0₫)'
                              : 'Sửa chữa có tính phí'}
                          </span>
                        </div>
                        {!event.quotation?.isUnderWarranty && totalCost > 0 && (
                          <div className="font-mono font-bold text-amber-600 text-sm">
                            Báo giá: {formatVND(totalCost)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interactive Approval Bar for Customer */}
                  {isPendingApproval && !event.quotation?.isUnderWarranty && totalCost > 0 && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Thiết bị cần thay thế linh kiện với chi phí {formatVND(totalCost)}. Quý khách vui lòng xác nhận phương án để kỹ thuật viên tiến hành:
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={approvingCode === event.ticketCode}
                          onClick={() => handleDecision(event.ticketCode, true)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>✓ Đồng ý sửa chữa ({formatVND(totalCost)})</span>
                        </button>
                        <button
                          type="button"
                          disabled={approvingCode === event.ticketCode}
                          onClick={() => handleDecision(event.ticketCode, false)}
                          className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          <span>Từ chối &amp; Nhận lại máy</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Repair Resolution (If completed) */}
                  {event.resolution?.repairNotes && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kết quả sửa chữa hoàn tất:</span>
                      </div>
                      <p>{event.resolution.repairNotes}</p>
                      {event.resolution.partsReplaced?.length > 0 && (
                        <div className="text-[11px] text-emerald-800">
                          Linh kiện thay thế: {event.resolution.partsReplaced.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-600">Chưa có lịch sử bảo hành hoặc sửa chữa</p>
            <p className="mt-0.5">Thiết bị chưa từng phát sinh yêu cầu bảo hành tại chuỗi cửa hàng.</p>
          </div>
        )}
      </div>

      {/* Print / Detail Receipt Modal */}
      <RmaPrintReceiptModal
        isOpen={Boolean(selectedTicketForPrint)}
        onClose={() => setSelectedTicketForPrint(null)}
        ticketData={selectedTicketForPrint}
        onNewTicket={() => setSelectedTicketForPrint(null)}
      />
    </div>
  );
};

export default WarrantyResultCard;
