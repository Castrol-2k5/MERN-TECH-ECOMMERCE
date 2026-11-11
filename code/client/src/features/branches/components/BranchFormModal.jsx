import { useState } from 'react';
import { X, Store, Navigation, Check } from 'lucide-react';

const REGION_OPTIONS = [
  { value: 'HCM', label: 'TP. Hồ Chí Minh' },
  { value: 'HANOI', label: 'Hà Nội' },
  { value: 'MIEN_NAM', label: 'Miền Nam' },
  { value: 'MIEN_TRUNG', label: 'Miền Trung' },
  { value: 'MIEN_BAC', label: 'Miền Bắc' },
  { value: 'KHAC', label: 'Khu vực khác' }
];

export const BranchFormModal = ({
  isOpen,
  onClose,
  branch,
  branches = [],
  onSaveBranch
}) => {
  const [name, setName] = useState(() => branch?.name || '');
  const [branchCode, setBranchCode] = useState(() => branch?.branchCode || branch?.code || '');
  const [address, setAddress] = useState(() => branch?.address || '');
  const [phone, setPhone] = useState(() => branch?.phone || (branch ? '' : '02838226868'));
  const [longitude, setLongitude] = useState(
    () => branch?.location?.coordinates?.[0]?.toString() ?? '106.6917'
  );
  const [latitude, setLatitude] = useState(
    () => branch?.location?.coordinates?.[1]?.toString() ?? '10.7725'
  );
  const [region, setRegion] = useState(() => branch?.region || (branch ? 'KHAC' : 'HCM'));
  const [monthlyRevenueTarget, setMonthlyRevenueTarget] = useState(() =>
    String(branch ? (branch.monthlyRevenueTarget ?? 0) : 500000000)
  );
  const [isHeadquarter, setIsHeadquarter] = useState(() =>
    Boolean(branch?.isHeadquarter || branch?.branchCode === 'BR-HQ')
  );
  const [isWarehouse, setIsWarehouse] = useState(() =>
    Boolean(branch?.isWarehouse || branch?.isHeadquarter || branch?.branchCode === 'BR-HQ')
  );
  const [bootstrapInventory, setBootstrapInventory] = useState(() => !branch);
  const [bootstrapFromBranchId, setBootstrapFromBranchId] = useState('');
  const [isActive, setIsActive] = useState(() => branch?.isActive !== false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const lngNum = parseFloat(longitude);
    const latNum = parseFloat(latitude);
    if (
      Number.isNaN(lngNum) ||
      Number.isNaN(latNum) ||
      lngNum < -180 ||
      lngNum > 180 ||
      latNum < -90 ||
      latNum > 90
    ) {
      setErrorMsg('Tọa độ GPS không hợp lệ (Kinh độ: -180..180, Vĩ độ: -90..90).');
      return;
    }

    const payload = {
      branchCode: branchCode.trim().toUpperCase(),
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      location: {
        type: 'Point',
        coordinates: [lngNum, latNum]
      },
      region,
      monthlyRevenueTarget: Math.max(0, Number(monthlyRevenueTarget || 0)),
      isHeadquarter,
      isWarehouse: Boolean(isWarehouse || isHeadquarter),
      isActive,
      ...(!branch
        ? {
            bootstrapInventory: Boolean(bootstrapInventory),
            ...(bootstrapFromBranchId ? { bootstrapFromBranchId } : {})
          }
        : {})
    };

    setSaving(true);
    try {
      await onSaveBranch(payload);
      onClose();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.errors?.[0]?.message ||
          err.response?.data?.message ||
          err.message ||
          'Lỗi khi lưu thông tin chi nhánh'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">
              {branch ? 'Cập nhật thông tin chi nhánh' : 'Thêm mới chi nhánh bán lẻ'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Tên chi nhánh:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Chi nhánh Quận 3 - TechOne"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Mã định danh (branchCode):
              </label>
              <input
                type="text"
                required
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                placeholder="BR-Q3"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono font-bold text-cyan-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Địa chỉ chi nhánh:
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="138 Trần Quang Khải, P. Tân Định, Quận 1, TP.HCM"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Số điện thoại liên hệ:
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="02838226868 hoặc 0909123456"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Khu vực quản lý (Region):
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {REGION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Chỉ tiêu doanh thu tháng (Monthly Target - VND):
            </label>
            <input
              type="number"
              min="0"
              step="1000000"
              value={monthlyRevenueTarget}
              onChange={(e) => setMonthlyRevenueTarget(e.target.value)}
              placeholder="500000000"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* GPS Coordinates GeoJSON */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              Tọa độ địa lý GPS (GeoJSON 2dsphere tìm cửa hàng gần nhất):
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">
                  Kinh độ (Longitude):
                </label>
                <input
                  type="text"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="106.6917"
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">
                  Vĩ độ (Latitude):
                </label>
                <input
                  type="text"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="10.7725"
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="branch-hq"
                checked={isHeadquarter}
                onChange={(e) => setIsHeadquarter(e.target.checked)}
                className="rounded border-slate-700 text-cyan-600 focus:ring-0"
              />
              <label htmlFor="branch-hq" className="text-xs text-cyan-300 cursor-pointer font-semibold">
                Là Kho Trung Tâm Trụ Sở Chính (HQ Warehouse)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="branch-warehouse"
                checked={isWarehouse}
                onChange={(e) => setIsWarehouse(e.target.checked)}
                className="rounded border-slate-700 text-cyan-600 focus:ring-0"
              />
              <label htmlFor="branch-warehouse" className="text-xs text-slate-300 cursor-pointer">
                Là Kho trung chuyển vùng (Warehouse Hub)
              </label>
            </div>

            {!branch && (
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="branch-bootstrap"
                    checked={bootstrapInventory}
                    onChange={(e) => setBootstrapInventory(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                  />
                  <label htmlFor="branch-bootstrap" className="text-xs text-emerald-300 cursor-pointer font-semibold">
                    Tự động khởi tạo danh mục tồn kho chuẩn (Auto-Bootstrap)
                  </label>
                </div>
                {bootstrapInventory && branches.length > 0 && (
                  <select
                    value={bootstrapFromBranchId}
                    onChange={(e) => setBootstrapFromBranchId(e.target.value)}
                    className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Khởi tạo toàn bộ SKU đang kinh doanh (Min/Max = 0) --</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        Sao chép định mức từ: {b.name} ({b.branchCode})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="branch-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0"
              />
              <label htmlFor="branch-active" className="text-xs text-slate-300 cursor-pointer">
                Chi nhánh đang hoạt động mở cửa đón khách
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Đang lưu...' : 'Lưu chi nhánh'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchFormModal;
