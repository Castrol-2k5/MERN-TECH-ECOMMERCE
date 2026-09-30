import { useState } from 'react';
import { ClipboardList, Camera, Calendar, CheckSquare, ShieldAlert, ArrowRight } from 'lucide-react';

const getDefaultReturnDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  return d.toISOString().slice(0, 10);
};

export const RmaTicketForm = ({ warrantyData, onSubmit, isSubmitting = false }) => {
  const [issueDescription, setIssueDescription] = useState('');
  const [appearanceCondition, setAppearanceCondition] = useState('Thân máy đẹp 98%, màn hình dán cường lực, không cấn móp góc');
  const [selectedAccessories, setSelectedAccessories] = useState(['Thân máy', 'Hộp gốc (Box)']);
  const [estimatedReturnDate, setEstimatedReturnDate] = useState(getDefaultReturnDate);
  const [photoCount, setPhotoCount] = useState(2); // Simulated photos

  const availableAccessories = [
    'Thân máy',
    'Hộp gốc (Box)',
    'Củ sạc chính hãng',
    'Dây cáp sạc',
    'Bút cảm ứng / Bàn phím',
    'Khay SIM'
  ];

  const toggleAccessory = (acc) => {
    if (selectedAccessories.includes(acc)) {
      setSelectedAccessories(selectedAccessories.filter((a) => a !== acc));
    } else {
      setSelectedAccessories([...selectedAccessories, acc]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!warrantyData || !issueDescription.trim()) return;

    onSubmit({
      serialNumber: warrantyData.serialNumber,
      productId: warrantyData.productId || '65f0a0000000000000000001',
      customerId: warrantyData.customer?._id || '65f0c0000000000000000001',
      customerInfo: warrantyData.customer,
      productName: warrantyData.productName,
      branchId: '65f0a1000000000000000001',
      staffId: '65f0d0000000000000000001',
      staffName: 'Trần Kỹ Thuật (KTV-02)',
      issueDescription: issueDescription.trim(),
      appearanceCondition,
      accessories: selectedAccessories,
      estimatedReturnDate,
      warrantyEndDate: warrantyData.warrantyEndDate,
      isEligible: warrantyData.isEligible
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-slate-100">
      <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
          <ClipboardList className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-100">Biên bản tiếp nhận kỹ thuật &amp; sửa chữa</h3>
          <p className="text-xs text-slate-400">Ghi nhận chi tiết tình trạng vật lý và lỗi phản ánh từ khách hàng</p>
        </div>
      </div>

      {/* 1. Lỗi mô tả từ khách */}
      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-1">
          Hiện trạng lỗi theo mô tả của khách hàng <span className="text-rose-400">*</span>:
        </label>
        <textarea
          rows="2"
          required
          value={issueDescription}
          onChange={(e) => setIssueDescription(e.target.value)}
          placeholder="Ví dụ: Màn hình xuất hiện sọc xanh dọc sau khi cập nhật iOS, thỉnh thoảng cảm ứng bị đơ..."
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
        ></textarea>
      </div>

      {/* 2. Tình trạng ngoại quan */}
      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-1">
          Đánh giá ngoại quan thiết bị (Màn hình, vỏ viền, tem ốc):
        </label>
        <input
          type="text"
          value={appearanceCondition}
          onChange={(e) => setAppearanceCondition(e.target.value)}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
        />
      </div>

      {/* 3. Phụ kiện đi kèm */}
      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-1.5">
          Phụ kiện nhận kèm theo thiết bị:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availableAccessories.map((acc) => {
            const isChecked = selectedAccessories.includes(acc);
            return (
              <button
                key={acc}
                type="button"
                onClick={() => toggleAccessory(acc)}
                className={`px-2.5 py-1.5 rounded-lg border text-left text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isChecked
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CheckSquare className={`w-3.5 h-3.5 ${isChecked ? 'text-blue-400' : 'text-slate-600'}`} />
                <span>{acc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Hình ảnh hiện trạng & Ngày hẹn trả */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Upload Ảnh */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Hình ảnh hiện trạng máy tiếp nhận:
          </label>
          <div className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setPhotoCount(prev => prev + 1)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>Chụp ảnh ({photoCount})</span>
            </button>
            <span className="text-[11px] text-slate-400">Đã lưu {photoCount} ảnh ngoại quan</span>
          </div>
        </div>

        {/* Ngày hẹn trả */}
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
      </div>

      {/* Notice if out of warranty */}
      {warrantyData && !warrantyData.isEligible && (
        <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-xl flex items-center gap-2 text-xs text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Máy đã hết bảo hành chính hãng. Chi phí sửa chữa hoặc thay thế linh kiện sẽ được báo giá cho khách trước khi tiến hành.
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
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
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
