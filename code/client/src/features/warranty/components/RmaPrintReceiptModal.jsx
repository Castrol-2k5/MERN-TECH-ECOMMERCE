import { Printer, CheckCircle, RotateCcw, X, QrCode } from 'lucide-react';

export const RmaPrintReceiptModal = ({ isOpen, onClose, ticketData, onNewTicket }) => {
  if (!isOpen || !ticketData) return null;

  const handlePrint = () => {
    window.print();
  };

  const {
    ticketCode = 'BH-Q1-260930-018',
    serialNumber = '',
    productName = '',
    customerInfo = {},
    issueDescription = '',
    appearanceCondition = '',
    accessories = [],
    estimatedReturnDate = '',
    staffName = 'Trần Kỹ Thuật (KTV-02)',
    createdAt = new Date().toISOString()
  } = ticketData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle className="w-4 h-4" />
            <span>Tiếp nhận bảo hành thành công</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              In Phiếu (K80/A5)
            </button>
            <button
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
              <h2 className="font-extrabold text-sm uppercase">TECHONE SERVICE</h2>
              <p className="text-[10px] text-slate-600">TRUNG TÂM TIẾP NHẬN & BẢO HÀNH CHÍNH HÃNG</p>
              <p className="text-[10px] text-slate-600">138 Trần Quang Khải, P. Tân Định, Q.1, TP.HCM</p>
              <p className="text-[10px] text-slate-600">Hotline Kỹ thuật: 1900.6369 (Ext 2)</p>
              <h3 className="font-bold text-xs uppercase pt-1">PHIẾU TIẾP NHẬN BẢO HÀNH</h3>
            </div>

            {/* Ticket Code & Date */}
            <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>Mã biên nhận:</span>
                <span className="font-bold text-blue-800">{ticketCode}</span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian:</span>
                <span>{new Date(createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between">
                <span>KTV tiếp nhận:</span>
                <span>{staffName}</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-300 pb-2">
              <div className="font-bold text-slate-800">THÔNG TIN KHÁCH HÀNG:</div>
              <div>Họ tên: {customerInfo.fullName || 'Khách hàng'}</div>
              <div>SĐT: {customerInfo.phone || 'Chưa cung cấp'}</div>
              <div>Địa chỉ: {customerInfo.address || 'TP.HCM'}</div>
            </div>

            {/* Device Details */}
            <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-300 pb-2">
              <div className="font-bold text-slate-800">THIẾT BỊ TIẾP NHẬN:</div>
              <div className="font-semibold">{productName}</div>
              <div className="text-[10px]">
                S/N (IMEI): <strong className="font-mono">{serialNumber}</strong>
              </div>
            </div>

            {/* Fault & Condition Description */}
            <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 pb-2">
              <div>
                <span className="font-bold">Lỗi phản ánh: </span>
                <span>{issueDescription}</span>
              </div>
              <div>
                <span className="font-bold">Ngoại quan: </span>
                <span>{appearanceCondition}</span>
              </div>
              <div>
                <span className="font-bold">Phụ kiện kèm: </span>
                <span>{accessories.join(', ') || 'Không'}</span>
              </div>
            </div>

            {/* Return Date Schedule */}
            <div className="text-[10px] border-b border-dashed border-slate-300 pb-2 bg-slate-50 p-1.5 rounded">
              <div className="flex justify-between font-bold text-slate-800">
                <span>HẸN TRẢ DỰ KIẾN:</span>
                <span>{estimatedReturnDate}</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5">
                Kỹ thuật viên sẽ gửi tin nhắn SMS/Zalo khi hoàn tất xử lý.
              </p>
            </div>

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
                  <p className="font-bold">Khách hàng gửi</p>
                  <p className="text-slate-400 italic mt-6">(Ký &amp; ghi rõ họ tên)</p>
                </div>
                <div>
                  <p className="font-bold">Kỹ thuật tiếp nhận</p>
                  <p className="text-slate-400 italic mt-6">(Đã ký nhận)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onNewTicket}
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
