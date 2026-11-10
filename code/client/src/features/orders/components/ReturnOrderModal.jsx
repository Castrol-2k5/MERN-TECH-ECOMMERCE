import { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Package,
  Banknote,
  Landmark,
  AlertTriangle,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { orderService } from '../services/orderService.js';
import approvalService, { HIGH_VALUE_RETURN_THRESHOLD } from '../../approvals/services/approvalService.js';

const formatVND = (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫`;

export const ReturnOrderModal = ({ isOpen, onClose, order, onReturnSuccess }) => {
  const authUser = useSelector((state) => state.auth?.user);
  const [selectedMap, setSelectedMap] = useState({});
  const [refundMethod, setRefundMethod] = useState('CASH');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Khởi tạo map item có thể trả khi mở modal
  useEffect(() => {
    if (!isOpen || !order) return;
    setErrorMsg('');
    setReason('');
    setRefundMethod('CASH');

    const initialMap = {};
    (order.items || []).forEach((it) => {
      const remainingQty = Number(it.quantity || 0) - Number(it.returnedQuantity || 0);
      if (remainingQty <= 0) return;

      const returnedSet = new Set((it.returnedSerials || []).map((s) => s.trim().toUpperCase()));
      const activeSerials = (it.serialsAssigned || [])
        .map((s) => s.trim().toUpperCase())
        .filter((s) => !returnedSet.has(s));

      const key = it._id || it.productSkuId;
      initialMap[key] = {
        checked: false,
        orderItemId: it._id,
        productSkuId: it.productSkuId,
        productName: it.productName,
        sku: it.sku,
        unitPrice: Number(it.unitPrice || 0),
        remainingQty,
        quantity: activeSerials.length > 0 ? 0 : 1,
        activeSerials,
        selectedSerials: [],
        condition: 'GOOD'
      };
    });
    setSelectedMap(initialMap);
  }, [isOpen, order]);

  const toggleItemChecked = (key) => {
    setSelectedMap((prev) => {
      const curr = prev[key];
      if (!curr) return prev;
      const nextChecked = !curr.checked;
      let nextSerials = curr.selectedSerials;
      let nextQty = curr.quantity;

      if (nextChecked && curr.activeSerials.length > 0 && curr.selectedSerials.length === 0) {
        nextSerials = [curr.activeSerials[0]];
        nextQty = 1;
      } else if (!nextChecked) {
        nextSerials = [];
        nextQty = curr.activeSerials.length > 0 ? 0 : 1;
      }

      return {
        ...prev,
        [key]: { ...curr, checked: nextChecked, selectedSerials: nextSerials, quantity: nextQty }
      };
    });
  };

  const toggleSerial = (key, sn) => {
    setSelectedMap((prev) => {
      const curr = prev[key];
      if (!curr) return prev;
      const exists = curr.selectedSerials.includes(sn);
      const nextSerials = exists
        ? curr.selectedSerials.filter((s) => s !== sn)
        : [...curr.selectedSerials, sn];

      return {
        ...prev,
        [key]: {
          ...curr,
          checked: nextSerials.length > 0,
          selectedSerials: nextSerials,
          quantity: nextSerials.length
        }
      };
    });
  };

  const updateItemField = (key, field, value) => {
    setSelectedMap((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const selectedItemsList = useMemo(() => {
    return Object.values(selectedMap).filter((it) => it.checked && it.quantity > 0);
  }, [selectedMap]);

  const totalRefundAmount = useMemo(() => {
    return selectedItemsList.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  }, [selectedItemsList]);

  const needsManagerApproval =
    authUser?.role === 'STAFF' && totalRefundAmount > HIGH_VALUE_RETURN_THRESHOLD;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItemsList.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 sản phẩm (và mã Serial nếu có) để trả hàng.');
      return;
    }
    if (reason.trim().length < 2) {
      setErrorMsg('Vui lòng nhập lý do trả hàng (tối thiểu 2 ký tự).');
      return;
    }

    for (const it of selectedItemsList) {
      if (it.activeSerials.length > 0 && it.selectedSerials.length !== it.quantity) {
        setErrorMsg(`Vui lòng chọn đủ mã Serial trả lại cho '${it.productName}'.`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        items: selectedItemsList.map((it) => ({
          orderItemId: it.orderItemId,
          productSkuId: it.productSkuId,
          quantity: Number(it.quantity),
          condition: it.condition,
          serialsReturned: it.selectedSerials
        })),
        refundMethod,
        reason: reason.trim()
      };

      if (needsManagerApproval) {
        const request = await approvalService.createRequest({
          type: 'HIGH_VALUE_RETURN',
          targetId: order._id,
          reason: payload.reason,
          payload: {
            items: payload.items,
            refundMethod: payload.refundMethod
          }
        });
        if (onReturnSuccess) {
          onReturnSuccess({ approvalPending: true, request });
        }
        onClose();
        return;
      }

      const result = await orderService.returnOrder(order._id, payload);
      if (onReturnSuccess) {
        onReturnSuccess(result);
      }
      onClose();
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message || err?.message || 'Không thể xử lý trả hàng hoàn tiền.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  const returnableEntries = Object.entries(selectedMap);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Xử Lý Trả Hàng &amp; Hoàn Tiền Tại Quầy</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Đơn hàng: <strong className="font-mono text-blue-400">{order.orderCode}</strong> • Khách hàng:{' '}
                <strong className="text-slate-200">{order.customerInfo?.fullName || order.shippingAddress?.fullName || 'Khách lẻ'}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Danh sách sản phẩm có thể trả */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              1. Chọn sản phẩm &amp; Serial trả lại kho
            </h3>

            {returnableEntries.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-slate-800 bg-slate-950 text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                Tất cả sản phẩm trong đơn này đã được hoàn trả hết.
              </div>
            ) : (
              <div className="space-y-3">
                {returnableEntries.map(([key, item]) => {
                  const hasSerials = item.activeSerials.length > 0;
                  return (
                    <div
                      key={key}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        item.checked
                          ? 'bg-slate-950 border-rose-500/40'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleItemChecked(key)}
                            className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-slate-100 text-xs">{item.productName}</div>
                            <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                              SKU: {item.sku} • Đơn giá: <strong className="text-slate-200">{formatVND(item.unitPrice)}</strong> • Còn lại có thể trả: {item.remainingQty}
                            </div>
                          </div>
                        </label>

                        {!hasSerials && item.checked && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] text-slate-400">SL trả:</span>
                            <input
                              type="number"
                              min={1}
                              max={item.remainingQty}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(item.remainingQty, Number(e.target.value) || 1));
                                updateItemField(key, 'quantity', val);
                              }}
                              className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-center font-mono font-bold text-white"
                            />
                          </div>
                        )}
                      </div>

                      {/* Serial selection */}
                      {hasSerials && (
                        <div className="mt-3 pl-6 space-y-1.5">
                          <div className="text-[11px] text-slate-400">
                            Chọn đúng mã Serial / IMEI khách trả:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.activeSerials.map((sn) => {
                              const isPicked = item.selectedSerials.includes(sn);
                              return (
                                <button
                                  key={sn}
                                  type="button"
                                  onClick={() => toggleSerial(key, sn)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                                    isPicked
                                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  <Cpu className="w-3 h-3" />
                                  {sn}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tình trạng máy thu hồi */}
                      {item.checked && (
                        <div className="mt-3 pl-6 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400 font-semibold">Tình trạng máy thu hồi:</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateItemField(key, 'condition', 'GOOD')}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                                item.condition === 'GOOD'
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Nguyên vẹn (Nhập lại kho bán)
                            </button>
                            <button
                              type="button"
                              onClick={() => updateItemField(key, 'condition', 'DEFECTIVE')}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                                item.condition === 'DEFECTIVE'
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Lỗi kỹ thuật (Cách ly DEFECTIVE)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Phương thức hoàn tiền & Lý do */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                2. Hình thức hoàn tiền cho khách
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRefundMethod('CASH')}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    refundMethod === 'CASH'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  Tiền mặt (Trừ két)
                </button>
                <button
                  type="button"
                  onClick={() => setRefundMethod('TRANSFER')}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    refundMethod === 'TRANSFER'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  Chuyển khoản
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                3. Lý do trả hàng (Bắt buộc)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Khách đổi ý trong 7 ngày / Lỗi màn hình..."
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-rose-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Tổng tiền hoàn trả */}
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-300 block">Tổng tiền cần hoàn trả cho khách:</span>
              <span className="text-[11px] text-slate-400">
                {refundMethod === 'CASH'
                  ? 'Hệ thống sẽ tự động trừ vào quỹ tiền mặt Ca POS đang mở'
                  : 'Hoàn trả qua chuyển khoản ngân hàng (không trừ két tiền mặt)'}
              </span>
            </div>
            <span className="text-xl font-black font-mono text-rose-400">
              {formatVND(totalRefundAmount)}
            </span>
          </div>

          {/* Cảnh báo vượt ngưỡng phê duyệt cho STAFF */}
          {needsManagerApproval && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-2.5 text-amber-200 text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">
                  Khoản hoàn tiền vượt ngưỡng {formatVND(HIGH_VALUE_RETURN_THRESHOLD)}
                </p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Hệ thống sẽ gửi yêu cầu tới Quản lý Chi nhánh. Ngay khi Quản lý bấm Duyệt, kho/Serial và quỹ ca sẽ tự động được cập nhật.
                </p>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedItemsList.length === 0}
              className={`px-5 py-2.5 rounded-xl disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-lg cursor-pointer ${
                needsManagerApproval
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
              }`}
            >
              {needsManagerApproval ? <ShieldCheck className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
              <span>
                {isSubmitting
                  ? 'Đang xử lý...'
                  : needsManagerApproval
                  ? 'Gửi Quản Lý Phê Duyệt'
                  : 'Xác Nhận Trả Hàng & Hoàn Tiền'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnOrderModal;
