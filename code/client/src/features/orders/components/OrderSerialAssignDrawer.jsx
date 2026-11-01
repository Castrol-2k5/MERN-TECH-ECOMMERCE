import { useState, useEffect } from 'react';
import { X, ScanBarcode, CheckCircle2, PackageCheck, AlertCircle } from 'lucide-react';
import inventoryService from '../../inventory/services/inventoryService.js';
import { isMockEnabled } from '../../../config/dataMode.js';

export const OrderSerialAssignDrawer = ({
  isOpen,
  onClose,
  order,
  onCompletePacking
}) => {
  const [scannedSerial, setScannedSerial] = useState('');
  const [assignedSerials, setAssignedSerials] = useState(order?.serials || []);
  const [availableSerials, setAvailableSerials] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setAssignedSerials(order?.serials || []);
    setErrorMsg('');
    setScannedSerial('');

    if (!isOpen || !order || isMockEnabled()) {
      setAvailableSerials([]);
      return;
    }

    let ignore = false;
    const skuIds = Array.from(
      new Set(
        (Array.isArray(order.items) && order.items.length > 0
          ? order.items.map((it) => it.productSkuId)
          : [order.productSkuId]
        ).filter(Boolean)
      )
    );

    Promise.all(
      skuIds.map((skuId) =>
        inventoryService.getSerials({
          branchId: order.branchId,
          productSkuId: skuId,
          status: 'IN_STOCK'
        })
      )
    )
      .then((results) => {
        if (!ignore) {
          setAvailableSerials(results.flat());
        }
      })
      .catch(() => {
        if (!ignore) setAvailableSerials([]);
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const requiredCount = order.quantity || 1;

  const handleAddSerial = (e) => {
    e.preventDefault();
    const sn = scannedSerial.trim().toUpperCase();
    if (!sn) return;

    if (assignedSerials.includes(sn)) {
      setErrorMsg(`Mã Serial [${sn}] đã được gán vào đơn!`);
      return;
    }
    if (assignedSerials.length >= requiredCount) {
      setErrorMsg(`Đã đủ số lượng ${requiredCount} Serial cho đơn hàng này!`);
      return;
    }

    setAssignedSerials([...assignedSerials, sn]);
    setScannedSerial('');
    setErrorMsg('');
  };

  const handleRemoveSerial = (sn) => {
    setAssignedSerials(assignedSerials.filter((s) => s !== sn));
  };

  const handleFinish = () => {
    if (assignedSerials.length !== requiredCount) {
      setErrorMsg(`Cần gán đủ ${requiredCount} Serial trước khi bàn giao đóng gói!`);
      return;
    }
    onCompletePacking(order.orderCode, assignedSerials);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 text-slate-100">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <PackageCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">Đóng gói &amp; Gán Serial xuất kho</h3>
                <p className="text-xs text-slate-400 font-mono">Đơn #{order.orderCode}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {/* Customer & Item info */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-xs text-slate-200">{order.customerName}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">{order.phone}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {order.fulfillmentType || 'Giao 2 giờ'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-900 text-xs space-y-1.5">
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  order.items.map((it, idx) => (
                    <div key={it.productSkuId || idx} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-200">{it.productName}</p>
                        <p className="text-[11px] font-mono text-slate-400">SKU: {it.sku}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 font-bold">
                        SL: {it.quantity}
                      </span>
                    </div>
                  ))
                ) : (
                  <div>
                    <p className="font-semibold text-slate-200">{order.productName || 'Thiết bị công nghệ'}</p>
                    <p className="text-[11px] font-mono text-slate-400">SKU: {order.sku} • SL: {requiredCount}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Serial Barcode Scanner Input */}
            <form onSubmit={handleAddSerial} className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Quét mã vạch Serial / IMEI thiết bị vật lý:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScanBarcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={scannedSerial}
                    onChange={(e) => setScannedSerial(e.target.value)}
                    placeholder="Quét mã vạch Serial..."
                    autoFocus
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!scannedSerial.trim()}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Thêm
                </button>
              </div>
              {errorMsg && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errorMsg}
                </p>
              )}
            </form>

            {/* Quick Pick Available Serials at Branch */}
            {availableSerials.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span>Serial khả dụng trong kho chi nhánh ({availableSerials.length}):</span>
                  <span className="text-cyan-400">Bấm để chọn nhanh</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {availableSerials.map((s) => {
                    const sn = s.serialNumber;
                    const isPicked = assignedSerials.includes(sn);
                    return (
                      <button
                        key={sn}
                        type="button"
                        onClick={() => {
                          if (isPicked) {
                            handleRemoveSerial(sn);
                          } else if (assignedSerials.length < requiredCount) {
                            setAssignedSerials((prev) => [...prev, sn]);
                            setErrorMsg('');
                          }
                        }}
                        className={`px-2 py-1 rounded-lg font-mono text-[11px] border transition-colors cursor-pointer ${
                          isPicked
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {sn}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List of assigned serials */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                <span>Mã Serial đã gán cho đơn hàng:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {assignedSerials.length} / {requiredCount}
                </span>
              </div>

              {assignedSerials.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  Chưa có mã Serial nào được quét
                </div>
              ) : (
                <div className="space-y-1.5">
                  {assignedSerials.map((sn, idx) => (
                    <div
                      key={sn}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span className="font-mono font-bold text-slate-200">{sn}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSerial(sn)}
                        className="text-slate-500 hover:text-rose-400 text-xs font-semibold"
                      >
                        Gỡ
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={assignedSerials.length !== requiredCount}
              onClick={handleFinish}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Hoàn tất &amp; Bàn giao Shipper</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSerialAssignDrawer;
