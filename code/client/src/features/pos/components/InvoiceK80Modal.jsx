import { Printer, CheckCircle, RotateCcw, X, QrCode } from 'lucide-react';

export const InvoiceK80Modal = ({ isOpen, onClose, orderData, onNewOrder }) => {
  if (!isOpen || !orderData) return null;

  const formatVnd = (num) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  const handlePrint = () => {
    window.print();
  };

  const {
    orderCode = 'POS-260930-1092',
    createdAt = new Date().toISOString(),
    items = [],
    subtotal = 0,
    discount = 0,
    tax = 0,
    total = 0,
    customerPaid = 0,
    change = 0,
    paymentMethod = 'CASH',
    customerInfo = {}
  } = orderData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle className="w-4 h-4" />
            <span>Thanh toán hoàn tất</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              In K80
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Paper Bill K80 Preview */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950/40">
          <div
            id="k80-print-area"
            className="bg-white text-slate-900 p-5 rounded-lg font-mono text-[11px] leading-tight shadow-md max-w-[80mm] mx-auto space-y-3"
          >
            {/* Header */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
              <h2 className="font-extrabold text-sm tracking-wider uppercase">TECHONE RETAIL</h2>
              <p className="text-[10px] text-slate-600">HỆ THỐNG THIẾT BỊ CÔNG NGHỆ CHÍNH HÃNG</p>
              <p className="text-[10px] text-slate-600">138 Trần Quang Khải, P. Tân Định, Q.1, TP.HCM</p>
              <p className="text-[10px] text-slate-600">Hotline: 1900.6369 - www.techone.vn</p>
              <h3 className="font-bold text-xs uppercase pt-2">HÓA ĐƠN BÁN HÀNG</h3>
            </div>

            {/* Bill Meta */}
            <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>Số HĐ:</span>
                <span className="font-bold">{orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span>Ngày:</span>
                <span>{new Date(createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Thu ngân:</span>
                <span>Nguyễn Văn Thu Ngân</span>
              </div>
              <div className="flex justify-between">
                <span>Khách hàng:</span>
                <span>{customerInfo.fullName || 'Khách vãng lai'} - {customerInfo.phone || ''}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between font-bold text-[10px] border-b border-slate-200 pb-1 mb-1">
                <span className="w-1/2">Tên hàng</span>
                <span className="w-12 text-center">SL</span>
                <span className="text-right flex-1">T.Tiền</span>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-start">
                      <div className="w-1/2 font-semibold">
                        {item.name}
                      </div>
                      <div className="w-12 text-center">
                        {item.quantity}
                      </div>
                      <div className="text-right flex-1 font-bold">
                        {formatVnd((item.price || 0) * (item.quantity || 1))}
                      </div>
                    </div>

                    {/* Serial/IMEI warranty detail */}
                    {item.serialsAssigned && item.serialsAssigned.length > 0 && (
                      <div className="pl-1 mt-0.5 text-[9px] text-slate-600">
                        {item.serialsAssigned.map((sn, sIdx) => (
                          <div key={sIdx}>
                            S/N: <strong className="font-mono text-slate-800">{sn}</strong> (BH: 12T)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Calculation */}
            <div className="space-y-1 text-[10px] border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>Tiền hàng:</span>
                <span>{formatVnd(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Chiết khấu:</span>
                  <span>-{formatVnd(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Thuế VAT (10%):</span>
                <span>{formatVnd(tax)}</span>
              </div>
              <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-200">
                <span>TỔNG CỘNG:</span>
                <span>{formatVnd(total)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Phương thức:</span>
                <span className="font-semibold">{paymentMethod === 'CASH' ? 'Tiền mặt' : 'VNPAY QR'}</span>
              </div>
              {paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between">
                    <span>Tiền khách đưa:</span>
                    <span>{formatVnd(customerPaid)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Tiền thừa:</span>
                    <span>{formatVnd(change)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer QR & Note */}
            <div className="text-center pt-1 space-y-1.5">
              <div className="w-16 h-16 mx-auto border border-slate-300 p-1 flex items-center justify-center">
                <QrCode className="w-full h-full text-slate-800" />
              </div>
              <p className="text-[9px] text-slate-500 font-semibold">
                Quét mã để tra cứu hóa đơn điện tử & BH
              </p>
              <p className="text-[9px] text-slate-500 italic">
                Đổi mới 30 ngày nếu có lỗi NSX. Cảm ơn quý khách!
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onNewOrder}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tạo đơn hàng mới [Esc]</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceK80Modal;
