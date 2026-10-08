import { useState } from 'react';
import { Store, MapPin, Phone, User, Package, TrendingUp, Edit, Plus, Navigation } from 'lucide-react';

export const BranchListCardGrid = ({
  branches = [],
  onEditBranch,
  onAddNewBranch
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 text-slate-100">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm chi nhánh theo tên, địa chỉ..."
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        <button
          type="button"
          onClick={onAddNewBranch}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer w-fit"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm Chi Nhánh Mới</span>
        </button>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBranches.map((branch) => {
          const isOpen = branch.isActive !== false;

          return (
            <div
              key={branch._id || branch.code}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-3 transition-all hover:bg-slate-850/80 shadow-xl flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-100 line-clamp-1">{branch.name}</h4>
                      <p className="text-[10px] font-mono text-cyan-400">{branch.code || 'BR-01'}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isOpen
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {isOpen ? 'Đang mở' : 'Tạm đóng'}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs text-slate-300">
                  <p className="flex items-start gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{branch.address}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-mono">{branch.phone || '028 3822 6868'}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-300 pt-0.5">
                    <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Quản lý: <strong>{branch.managerName || 'Nguyễn Văn Quản Lý'}</strong></span>
                  </p>

                  {/* GPS Coordinates GeoJSON */}
                  {branch.location?.coordinates && (
                    <p className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <Navigation className="w-3 h-3 text-cyan-400" />
                      <span>GPS: [{branch.location.coordinates[0]}, {branch.location.coordinates[1]}]</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Metrics & Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 font-mono text-cyan-400">
                    <Package className="w-3 h-3" />
                    <span>{branch.stockCount || 3864}</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono font-bold text-emerald-400">
                    <TrendingUp className="w-3 h-3" />
                    <span>{branch.revenueText || '4,28 tỷ'}</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onEditBranch(branch)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Chỉnh sửa chi nhánh"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BranchListCardGrid;
