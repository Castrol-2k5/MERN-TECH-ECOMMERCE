import { Printer, CheckCircle, RotateCcw, X, QrCode } from 'lucide-react';

export const RmaPrintReceiptModal = ({ isOpen, onClose, ticketData, onNewTicket }) => {
  if (!isOpen || !ticketData) return null;

  const handlePrint = () => {
    window.print();
  };

  const isHandover = ticketData.status === 'RETURNED';

  const {
    ticketCode = 'RMA-20261103-0001',
    serialNumber = '',
    productName = '',
    customerInfo = {},
    issueDescription = '',
    appearanceCondition = '',
    devicePassword = '',
    powerStatus = 'Lên nguồn bình thường',
    accessories = [],
    estimatedReturnDate = '',
    staffName = 'Kỹ thuật viên',
    createdAt = new Date().toISOString(),
    quotation = {},
    resolution = {},
    handover = {}
  } = ticketData;

  const formatVND = (v) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle className="w-4 h-4" />
            <span>
              {isHandover
                ? 'Biên bản bàn giao thiết bị & Đóng phiếu'
                : 'Tiếp nhận bảo hành thành công'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              In Phiếu (K80/A5)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Paper Receipt Preview */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950/40">
          <div
            id="rma-print-area"
            className="bg-white text-slate-900 p-5 rounded-lg font-mono text-[11px] leading-tight shadow-md max-w-[80mm] mx-auto space-y-3"
          >
            {/* Header */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-2">
              <h2 className="font-extrabold text-sm uppercase">TECHONE SERVICE CARE</h2>
              <p className="text-[10px] text-slate-600">TRUNG TÂM TIẾP NHẬN &amp; BẢO HÀNH CHÍNH HÃNG</p>
              <p className="text-[10px] text-slate-600">Hotline Kỹ thuật: 1900.6369 (Ext 2)</p>
              <h3 className="font-bold text-xs uppercase pt-1 text-blue-900">
                {isHandover ? 'BIÊN BẢN BÀN GIAO THIẾT BỊ' : 'PHIẾU TIẾP NHẬN SỬA CHỮA & BẢO HÀNH'}
              </h3>
            </div>

            {/* Ticket Code & Date */}
            <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>Mã phiếu:</span>
                <span className="font-bold text-blue-800">{ticketCode}</span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian:</span>
                <span>{new Date(createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Nhân viên phụ trách:</span>
                <span>{staffName}</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-300 pb-2">
              <div className="font-bold text-slate-800">THÔNG TIN KHÁCH HÀNG:</div>
              <div>Họ tên: {customerInfo.fullName || 'Khách hàng'}</div>
              <div>SĐT: {customerInfo.phone || 'Chưa cung cấp'}</div>
              {customerInfo.address && <div>Địa chỉ: {customerInfo.address}</div>}
            </div>

            {/* Device Details */}
            <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-300 pb-2">
              <div className="font-bold text-slate-800">THIẾT BỊ TIẾP NHẬN:</div>
              <div className="font-semibold">{productName}</div>
              <div className="text-[10px]">
                S/N (IMEI): <strong className="font-mono">{serialNumber}</strong>
              </div>
              <div>Nguồn khi nhận: {powerStatus}</div>
              {devicePassword && <div>Mật khẩu PIN/Mở máy: {devicePassword}</div>}
            </div>

            {/* Fault & Condition Description */}
            <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 pb-2">
              <div>
                <span className="font-bold">Lỗi phản ánh: </span>
                <span>{issueDescription}</span>
              </div>
              {appearanceCondition && (
                <div>
                  <span className="font-bold">Ngoại quan: </span>
                  <span>{appearanceCondition}</span>
                </div>
              )}
              <div>
                <span className="font-bold">Phụ kiện kèm: </span>
                <span>{accessories.join(', ') || 'Chỉ thân máy'}</span>
              </div>
            </div>

            {/* If Handover, show repair result and payment */}
            {isHandover ? (
              <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 pb-2 bg-emerald-50/50 p-2 rounded">
                <div className="font-bold text-emerald-800">KẾT QUẢ SỬA CHỮA &amp; NGHIỆM THU:</div>
                <div>Xử lý: {resolution.repairNotes || 'Đã kiểm tra và hoàn tất bảo hành'}</div>
                {resolution.partsReplaced?.length > 0 && (
                  <div>Linh kiện thay thế: {resolution.partsReplaced.join(', ')}</div>
                )}
                <div className="pt-1 flex justify-between font-bold text-slate-900 border-t border-slate-200">
                  <span>Chi phí thanh toán:</span>
                  <span>{formatVND(handover.amountPaid || quotation.totalCost || 0)}</span>
                </div>
                <div className="text-[9px] text-slate-600">
                  Hình thức: {handover.paymentMethod || 'Miễn phí chính hãng'}
                </div>
              </div>
            ) : (
              /* Return Date Schedule for reception */
              <div className="text-[10px] border-b border-dashed border-slate-300 pb-2 bg-slate-50 p-1.5 rounded">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>HẸN TRẢ DỰ KIẾN:</span>
                  <span>{estimatedReturnDate || '3 ngày làm việc'}</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  Quý khách có thể tra cứu tiến độ bằng Mã phiếu và SĐT tại website.
                </p>
              </div>
            )}

            {/* Barcode & Signature */}
            <div className="text-center pt-2 space-y-2">
              <div className="w-14 h-14 mx-auto border border-slate-300 p-1 flex items-center justify-center">
                <QrCode className="w-full h-full text-slate-800" />
              </div>
              <p className="text-[9px] text-slate-600 font-mono font-bold">
                MÃ TRA CỨU: {ticketCode}
              </p>

              {/* Signatures */}
              <div className="grid grid-cols-2 text-center text-[9px] pt-2">
                <div>
                  <p className="font-bold">Khách hàng</p>
                  <p className="text-slate-400 italic mt-6">
                    {isHandover ? '(Đã nhận đủ thiết bị)' : '(Ký & ghi rõ họ tên)'}
                  </p>
                </div>
                <div>
                  <p className="font-bold">Kỹ thuật viên</p>
                  <p className="text-slate-400 italic mt-6">(Đã xác nhận)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onNewTicket || onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tiếp nhận thiết bị mới [Esc]</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RmaPrintReceiptModal;
