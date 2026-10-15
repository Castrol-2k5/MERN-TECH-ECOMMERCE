import { useState } from 'react';
import { X, Store, Navigation, Check } from 'lucide-react';

export const BranchFormModal = ({
  isOpen,
  onClose,
  branch,
  onSaveBranch
}) => {
  const [name, setName] = useState(branch?.name || '');
  const [code, setCode] = useState(branch?.code || 'BR-NEW');
  const [address, setAddress] = useState(branch?.address || '');
  const [phone, setPhone] = useState(branch?.phone || '028 3822 6868');
  const [managerName, setManagerName] = useState(branch?.managerName || '');
  const [longitude, setLongitude] = useState(
    branch?.location?.coordinates?.[0]?.toString() || '106.6912'
  );
  const [latitude, setLatitude] = useState(
    branch?.location?.coordinates?.[1]?.toString() || '10.7915'
  );
  const [isActive, setIsActive] = useState(branch?.isActive !== false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name,
      code,
      address,
      phone,
      managerName,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude) || 106.6912, parseFloat(latitude) || 10.7915]
      },
      isActive
    };
    if (branch?._id) {
      payload._id = branch._id;
    }
    onSaveBranch(payload);
    onClose();
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
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Tên chi nhánh:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="TechOne Q1 • 138 Trần Quang Khải"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Mã định danh (code):</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="BR-Q1-TQK"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono font-bold text-cyan-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Địa chỉ chi nhánh:</label>
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
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Số điện thoại liên hệ:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="028 3822 6868"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Quản lý chi nhánh phụ trách:</label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Phạm Quốc Huy"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* GPS Coordinates GeoJSON */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              Tọa độ địa lý GPS (GeoJSON 2dsphere tìm cửa hàng gần nhất):
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Kinh độ (Longitude):</label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="106.6912"
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Vĩ độ (Latitude):</label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="10.7915"
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
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
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Lưu chi nhánh</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchFormModal;
