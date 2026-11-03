import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  ClipboardList,
  Calendar,
  ShieldAlert,
  ArrowRight,
  User,
  Phone,
  KeyRound,
  Zap,
  Package,
  FileText
} from 'lucide-react';

const getDefaultReturnDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().slice(0, 10);
};

export const RmaTicketForm = ({ warrantyData, onSubmit, isSubmitting = false }) => {
  const authUser = useSelector((state) => state.auth?.user);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [appearanceCondition, setAppearanceCondition] = useState('');
  const [devicePassword, setDevicePassword] = useState('');
  const [powerStatus, setPowerStatus] = useState('Lên nguồn bình thường');
  const [accessoriesText, setAccessoriesText] = useState('Thân máy');
  const [estimatedReturnDate, setEstimatedReturnDate] = useState(getDefaultReturnDate);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (warrantyData?.customer) {
      setCustomerName(warrantyData.customer.fullName || '');
      setCustomerPhone(warrantyData.customer.phone || '');
      setCustomerAddress(warrantyData.customer.address || '');
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
    }
  }, [warrantyData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!warrantyData || !issueDescription.trim()) return;

    // Convert comma-separated or newline-separated accessories into array
    const accessoriesArray = accessoriesText
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    onSubmit({
      serialNumber: warrantyData.serialNumber,
      productName: warrantyData.productName,
      staffName: authUser?.fullName || 'Kỹ thuật viên',
      customerInfo: {
        fullName: customerName.trim() || warrantyData.customer?.fullName || 'Khách hàng',
        phone: customerPhone.trim() || warrantyData.customer?.phone || '',
        address: customerAddress.trim() || warrantyData.customer?.address || ''
      },
      issueDescription: issueDescription.trim(),
      appearanceCondition: appearanceCondition.trim(),
      devicePassword: devicePassword.trim(),
      powerStatus,
      accessories: accessoriesArray.length > 0 ? accessoriesArray : ['Thân máy'],
      estimatedReturnDate,
      notes: notes.trim()
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-slate-100"
    >
      <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
          <ClipboardList className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-100">
            Biên Bản Tiếp Nhận Thiết Bị Bảo Hành &amp; Sửa Chữa
          </h3>
          <p className="text-xs text-slate-400">
            Nhân viên điền trung thực hiện trạng thiết bị thực tế bàn giao tại quầy
          </p>
        </div>
      </div>

      {/* Thông tin khách hàng gửi máy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Họ tên khách hàng gửi máy:
          </label>
          <div className="relative">
            <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nhập tên khách hàng..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Số điện thoại liên hệ nhận máy:
          </label>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Ví dụ: 0912345678"
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tình trạng nguồn & Mật khẩu mở máy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            <span className="inline-flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Tình trạng nguồn khi tiếp nhận:
            </span>
          </label>
          <select
            value={powerStatus}
            onChange={(e) => setPowerStatus(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="Lên nguồn bình thường">Lên nguồn bình thường</option>
            <option value="Chập chờn / Khởi động lại">Chập chờn / Khởi động lại</option>
            <option value="Mất nguồn hoàn toàn">Mất nguồn hoàn toàn (Không kích nguồn được)</option>
            <option value="Treo logo / Lỗi phần mềm">Treo logo / Lỗi hệ điều hành</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            <span className="inline-flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> Mật khẩu mở khóa màn hình / PIN:
            </span>
          </label>
          <input
            type="text"
            value={devicePassword}
            onChange={(e) => setDevicePassword(e.target.value)}
            placeholder="Mật khẩu hoặc 'Khách đã tắt mật khẩu'..."
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Lỗi mô tả từ khách */}
      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-1">
          Hiện trạng lỗi theo mô tả của khách hàng <span className="text-rose-400">*</span>:
        </label>
        <textarea
          rows="2"
          required
          value={issueDescription}
          onChange={(e) => setIssueDescription(e.target.value)}
          placeholder="Mô tả chi tiết lỗi khách phản ánh (ví dụ: máy không nhận sạc, màn hình có sọc, loa rè...)"
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
        />
      </div>

      {/* Tình trạng ngoại quan */}
      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-1">
          Đánh giá ngoại quan thiết bị (Màn hình, thân vỏ, trầy xước, cấn móp, tem seal):
        </label>
        <textarea
          rows="2"
          value={appearanceCondition}
          onChange={(e) => setAppearanceCondition(e.target.value)}
          placeholder="Nhập tự do hiện trạng thực tế (ví dụ: góc phải trầy nhẹ, lưng đẹp, tem ốc chưa có dấu hiệu tháo mở...)"
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Phụ kiện đi kèm */}
      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-1">
          <span className="inline-flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-blue-400" /> Phụ kiện nhận kèm thiết bị:
          </span>
        </label>
        <input
          type="text"
          value={accessoriesText}
          onChange={(e) => setAccessoriesText(e.target.value)}
          placeholder="Ví dụ: Thân máy, Củ sạc 67W, Dây cáp sạc, Hộp zin, Khay SIM..."
          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Ngày hẹn trả & Ghi chú thêm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Ngày hẹn bàn giao dự kiến:
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="date"
              value={estimatedReturnDate}
              onChange={(e) => setEstimatedReturnDate(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            <span className="inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Ghi chú nội bộ tiếp nhận:
            </span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú kỹ thuật nếu có..."
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Cảnh báo nếu thiết bị hết bảo hành */}
      {warrantyData && !warrantyData.isEligible && (
        <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl flex items-center gap-2 text-xs text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Máy đã hết bảo hành chính hãng. Sau khi kỹ thuật viên kiểm tra sẽ lập Báo giá chi tiết
            để khách hàng phê duyệt trước khi tiến hành sửa chữa.
          </span>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2 border-t border-slate-800 flex justify-end">
        <button
          type="submit"
          disabled={!warrantyData || !issueDescription.trim() || isSubmitting}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>XUẤT PHIẾU TIẾP NHẬN BẢO HÀNH</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default RmaTicketForm;
