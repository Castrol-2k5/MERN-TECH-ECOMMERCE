import { useState } from 'react';
import { 
  User, 
  Banknote, 
  QrCode, 
  Tag, 
  AlertTriangle
} from 'lucide-react';

export const PosCheckoutPanel = ({
  customerInfo,
  onUpdateCustomer,
  subtotal = 0,
  discount = 0,
  tax = 0,
  total = 0,
  customerPaid = 0,
  change = 0,
  onUpdateDiscount,
  onUpdateCustomerPaid,
  paymentMethod = 'CASH',
  onSelectPaymentMethod,
  onCheckout,
  isProcessing = false,
  missingSerialCount = 0,
  itemCount = 0,
  customerInputRef,
  discountInputRef
}) => {
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState(customerInfo?.phone || '');
  const [nameInput, setNameInput] = useState(customerInfo?.fullName || 'Khách vãng lai');

  const formatVnd = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  const quickMoneyDenominations = [
    500000,
    1000000,
    2000000,
    5000000,
    10000000,
    total // Vừa đủ
  ];

  const handleSaveCustomer = (e) => {
    e.preventDefault();
    onUpdateCustomer({
      fullName: nameInput.trim() || 'Khách vãng lai',
      phone: phoneInput.trim() || '0901234567'
    });
    setShowCustomerModal(false);
  };

  const isCheckoutDisabled = itemCount === 0 || missingSerialCount > 0 || isProcessing;

  return (
    <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col justify-between h-full select-none text-slate-100">
      <div className="p-4 space-y-4 overflow-y-auto">
        {/* Customer Header Bar (F4) */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">{customerInfo?.fullName || 'Khách vãng lai'}</p>
              <p className="text-[11px] font-mono text-slate-400">{customerInfo?.phone || 'Chưa có SĐT'}</p>
            </div>
          </div>
          <button
            type="button"
            ref={customerInputRef}
            onClick={() => setShowCustomerModal(true)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-md border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Đổi</span>
            <kbd className="text-[10px] text-blue-400 font-bold bg-slate-900 px-1 py-0.2 rounded border border-slate-700">F4</kbd>
          </button>
        </div>

        {/* Payment Summary Lines */}
        <div className="space-y-2 py-2 border-y border-slate-800 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Tiền hàng ({itemCount} món)</span>
            <span className="font-mono text-slate-200">{formatVnd(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              Chiết khấu / Giảm giá:
            </span>
            <div className="flex items-center gap-1">
              <input
                ref={discountInputRef}
                type="number"
                min="0"
                step="10000"
                value={discount}
                onChange={(e) => onUpdateDiscount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-24 text-right bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-rose-400 font-mono focus:outline-none focus:border-blue-500"
              />
              <kbd className="text-[9px] text-slate-500 bg-slate-800 px-1 py-0.5 rounded border border-slate-700">F8</kbd>
            </div>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>Thuế GTGT (VAT 10%)</span>
            <span className="font-mono text-slate-300">{formatVnd(tax)}</span>
          </div>
        </div>

        {/* TỔNG THANH TOÁN (To, Nổi Bật) */}
        <div className="bg-blue-950/40 border border-blue-800/50 p-3.5 rounded-xl">
          <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">
            Khách phải thanh toán:
          </div>
          <div className="text-2xl font-black font-mono text-blue-400 tracking-tight">
            {formatVnd(total)}
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-2">
            Phương thức thanh toán:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSelectPaymentMethod('CASH')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                paymentMethod === 'CASH'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Banknote className="w-4 h-4" />
              Tiền mặt (CASH)
            </button>

            <button
              type="button"
              onClick={() => onSelectPaymentMethod('VNPAY')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                paymentMethod === 'VNPAY'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-md shadow-blue-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              VNPAY QR
            </button>
          </div>
        </div>

        {/* Conditional Payment Method Details */}
        {paymentMethod === 'CASH' ? (
          <div className="space-y-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Khách đưa:</span>
              <input
                type="number"
                min="0"
                step="50000"
                value={customerPaid}
                onChange={(e) => onUpdateCustomerPaid(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-32 text-right bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Quick cash buttons */}
            <div className="flex flex-wrap gap-1">
              {quickMoneyDenominations.map((denom, idx) => {
                const label = denom === total ? 'Vừa đủ' : (denom >= 1000000 ? `${denom / 1000000}Tr` : `${denom / 1000}k`);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onUpdateCustomerPaid(denom)}
                    className="px-2 py-1 bg-slate-850 hover:bg-slate-700 border border-slate-700/60 rounded text-[11px] font-mono text-slate-300 transition-colors cursor-pointer"
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Tiền thừa trả khách */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">Tiền thối lại:</span>
              <span className={`font-mono text-sm font-bold ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {change >= 0 ? formatVnd(change) : `Thiếu ${formatVnd(Math.abs(change))}`}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
            <div className="w-28 h-28 mx-auto bg-white p-2 rounded-lg flex items-center justify-center shadow-md">
              <QrCode className="w-full h-full text-slate-900" />
            </div>
            <p className="text-[11px] font-semibold text-slate-300">
              Quét mã VNPAY QR trên màn hình hiển thị phụ
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Auto-detect thanh toán qua WebSocket
            </p>
          </div>
        )}

        {/* Warning if missing serials */}
        {missingSerialCount > 0 && (
          <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <p className="leading-snug">
              Còn <strong>{missingSerialCount}</strong> sản phẩm chưa được gán mã Serial / IMEI. Vui lòng gán đủ để thanh toán.
            </p>
          </div>
        )}
      </div>

      {/* Checkout Submit Action (F9) */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <button
          type="button"
          disabled={isCheckoutDisabled}
          onClick={onCheckout}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/25 cursor-pointer disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span>THANH TOÁN & IN HÓA ĐƠN</span>
              <kbd className="px-1.5 py-0.5 bg-blue-800 text-white text-[11px] rounded font-mono font-bold">F9</kbd>
            </>
          )}
        </button>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Thông tin khách hàng tích điểm
            </h4>
            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Số điện thoại:</label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="0901234567"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Họ và tên khách:</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosCheckoutPanel;
