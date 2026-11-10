import { useState, useEffect } from 'react';
import { X, Printer, PackageCheck, MapPin, User, Phone, CreditCard } from 'lucide-react';
import { orderService } from '../services/orderService.js';

const formatVND = (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫`;

export const PickPackSlipModal = ({ isOpen, onClose, order }) => {
  const [fetchedSlip, setFetchedSlip] = useState(null);
  const [loadedOrderId, setLoadedOrderId] = useState(null);

  useEffect(() => {
    const orderId = order?._id;
    const isMongoId = typeof orderId === 'string' && /^[0-9a-fA-F]{24}$/.test(orderId);
    if (!isOpen || !isMongoId) {
      return undefined;
    }

    let cancelled = false;
    orderService
      .getPickPackSlip(orderId)
      .then((enriched) => {
        if (!cancelled) {
          if (enriched) setFetchedSlip(enriched);
          setLoadedOrderId(orderId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedOrderId(orderId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, order?._id]);

  if (!isOpen || !order) return null;

  const isMongoId = typeof order._id === 'string' && /^[0-9a-fA-F]{24}$/.test(order._id);
  const isLoading = isMongoId && loadedOrderId !== order._id;
  const slipOrder = fetchedSlip && fetchedSlip._id === order._id ? fetchedSlip : order;

  const customerName =
    slipOrder.customerInfo?.fullName ||
    slipOrder.shippingAddress?.fullName ||
    slipOrder.customerName ||
    'Khách hàng';
  const customerPhone =
    slipOrder.customerInfo?.phone ||
    slipOrder.shippingAddress?.phone ||
    slipOrder.phone ||
    '---';
  const customerAddress =
    slipOrder.customerInfo?.address ||
    slipOrder.shippingAddress?.address ||
    slipOrder.shippingAddress ||
    'Nhận trực tiếp tại cửa hàng (Click & Collect)';

  const branchName =
    slipOrder.branchId?.name ||
    slipOrder.assignedBranchName ||
    'Chi nhánh TechOne';
  const branchAddress = slipOrder.branchId?.address || '';
  const isPaid = slipOrder.paymentStatus === 'PAID';
  const items = Array.isArray(slipOrder.items) ? slipOrder.items : [];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm print:bg-white print:p-0 print:static">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #pick-pack-print-sheet, #pick-pack-print-sheet * { visibility: visible !important; }
          #pick-pack-print-sheet {
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
        {/* Top Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Phiếu Nhặt Hàng &amp; Đóng Gói (Pick &amp; Pack)</h3>
              <p className="text-[11px] text-slate-400">
                {isLoading ? 'Đang tải vị trí kệ kho chi nhánh...' : 'Kiểm đếm hàng hóa, vị trí kệ & Serial/IMEI trước khi niêm phong'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In phiếu Pick &amp; Pack</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div
          id="pick-pack-print-sheet"
          className="bg-white text-slate-900 rounded-2xl p-6 space-y-5 font-sans text-xs"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
            <div>
              <h2 className="text-lg font-black uppercase tracking-wide text-slate-900">
                TECHONE • PHIẾU NHẶT HÀNG &amp; ĐÓNG GÓI
              </h2>
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{branchName}</p>
              {branchAddress && <p className="text-[11px] text-slate-500">{branchAddress}</p>}
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase text-slate-500 font-semibold">Mã đơn hàng</p>
              <p className="font-mono text-base font-black text-slate-900">{slipOrder.orderCode}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {slipOrder.orderType === 'POS_STORE' ? 'Đơn tại quầy POS' : 'Đơn Online / Click & Collect'}
              </p>
            </div>
          </div>

          {/* Recipient & Payment Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-slate-500">Thông tin người nhận</p>
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{customerName}</span>
              </p>
              <p className="font-mono text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{customerPhone}</span>
              </p>
              <p className="text-slate-600 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>{customerAddress}</span>
              </p>
            </div>

            <div className="space-y-1 sm:text-right flex flex-col sm:items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500">Trạng thái thanh toán</p>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-xs bg-white border-slate-300">
                  <CreditCard className="w-3.5 h-3.5 text-slate-700" />
                  <span>{isPaid ? 'ĐÃ THANH TOÁN (0 ₫ thu hộ)' : `THU HỘ COD: ${formatVND(slipOrder.totalAmount)}`}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Ngày tạo: {slipOrder.createdAt ? new Date(slipOrder.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Picking Items Table */}
          <div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold">
                  <th className="border border-slate-300 px-2 py-2 text-center w-8">#</th>
                  <th className="border border-slate-300 px-2.5 py-2 text-left">Sản phẩm &amp; SKU</th>
                  <th className="border border-slate-300 px-2.5 py-2 text-left">Vị trí quầy / Kệ</th>
                  <th className="border border-slate-300 px-2 py-2 text-center w-12">SL</th>
                  <th className="border border-slate-300 px-2.5 py-2 text-left">Serial / IMEI đã gán</th>
                  <th className="border border-slate-300 px-2 py-2 text-center w-14">Kiểm</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const serials = Array.isArray(item.serialsAssigned) ? item.serialsAssigned : [];
                  return (
                    <tr key={item._id || item.sku || idx} className="align-top">
                      <td className="border border-slate-300 px-2 py-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 px-2.5 py-2">
                        <p className="font-bold text-slate-900">{item.productName || 'Sản phẩm'}</p>
                        <p className="font-mono text-[11px] text-slate-500">SKU: {item.sku}</p>
                      </td>
                      <td className="border border-slate-300 px-2.5 py-2 font-semibold text-slate-800">
                        {item.shelfLocation || 'Quầy / Kho chung'}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-center font-mono font-bold">
                        {item.quantity || 1}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-2 font-mono text-[11px]">
                        {serials.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {serials.map((sn) => (
                              <span key={sn} className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded">
                                {sn}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="italic text-slate-500">Chưa gán Serial (Quét khi xuất)</span>
                        )}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-center">
                        <span className="inline-block w-4 h-4 border-2 border-slate-500 rounded-sm mt-0.5"></span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Sign-off Footer */}
          <div className="grid grid-cols-2 gap-6 pt-3 text-center border-t border-dashed border-slate-300">
            <div>
              <p className="font-bold text-slate-800">Nhân viên nhặt hàng (Pick)</p>
              <p className="text-[10px] text-slate-500 mt-0.5">(Ký &amp; ghi rõ họ tên)</p>
              <div className="h-14"></div>
            </div>
            <div>
              <p className="font-bold text-slate-800">Thu ngân / Đóng gói (Pack)</p>
              <p className="text-[10px] text-slate-500 mt-0.5">(Đã kiểm tra đủ tem &amp; Serial)</p>
              <div className="h-14"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickPackSlipModal;
