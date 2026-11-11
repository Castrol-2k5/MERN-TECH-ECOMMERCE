import { useState } from 'react';
import { ShieldAlert, Wrench, RotateCcw, MessageSquareWarning, X, Send } from 'lucide-react';
import complaintService from '../services/complaintService.js';

const REQUEST_TYPE_OPTIONS = [
  {
    value: 'WARRANTY_REQUEST',
    label: 'Yêu cầu Bảo hành',
    icon: Wrench,
    hint: 'Máy lỗi phần cứng, màn hình, pin, loa cần kiểm tra bảo hành tại chi nhánh'
  },
  {
    value: 'RETURN_REQUEST',
    label: 'Yêu cầu Đổi trả',
    icon: RotateCcw,
    hint: 'Lỗi kỹ thuật trong thời hạn 30 ngày cần đổi máy mới hoặc hoàn trả tại quầy'
  },
  {
    value: 'SERVICE_COMPLAINT',
    label: 'Khiếu nại dịch vụ',
    icon: MessageSquareWarning,
    hint: 'Phản ánh thái độ tư vấn, quy trình xuất hóa đơn hoặc sai sót đơn hàng'
  }
];

export const CustomerSupportModal = ({
  open,
  onClose,
  initialOrderCode = '',
  initialSerialNumber = '',
  initialRequestType = 'WARRANTY_REQUEST',
  deviceName = '',
  onSubmitted
}) => {
  const [requestType, setRequestType] = useState(initialRequestType);
  const [orderCode, setOrderCode] = useState(initialOrderCode);
  const [serialNumber, setSerialNumber] = useState(initialSerialNumber);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const created = await complaintService.createCustomerRequest({
        requestType,
        orderCode: orderCode.trim(),
        serialNumber: serialNumber.trim(),
        description: description.trim()
      });
      if (onSubmitted) {
        onSubmitted(created);
      }
      setDescription('');
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Không thể gửi yêu cầu. Vui lòng thử lại.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                Gửi Yêu cầu Bảo hành / Hỗ trợ Trực tuyến
              </h3>
              {deviceName && (
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{deviceName}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-2">Chọn loại yêu cầu</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {REQUEST_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = requestType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRequestType(opt.value)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                      active
                        ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-[11px] leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              {REQUEST_TYPE_OPTIONS.find((o) => o.value === requestType)?.hint}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mã đơn hàng</label>
              <input
                type="text"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                placeholder="VD: ORD-2026..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Serial / IMEI thiết bị</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="VD: SN-MBA-001"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Mô tả chi tiết tình trạng / vấn đề <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              minLength={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả lỗi thiết bị gặp phải, thời điểm xuất hiện hoặc vấn đề cần chi nhánh hỗ trợ..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-600 leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Đang gửi...' : 'Gửi yêu cầu tới Chi nhánh'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerSupportModal;
