import { useState } from 'react';
import { Store, MapPin, Phone, User, Package, Edit, Plus, Navigation, Building2 } from 'lucide-react';

export const BranchListCardGrid = ({
  branches = [],
  onEditBranch,
  onAddNewBranch
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBranches = branches.filter((b) => {
    const q = searchTerm.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.branchCode?.toLowerCase().includes(q) ||
      b.address?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 text-slate-100">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm chi nhánh theo tên, mã chi nhánh, địa chỉ..."
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

      {/* Empty State */}
      {filteredBranches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
          Không tìm thấy chi nhánh nào phù hợp với từ khóa tìm kiếm.
        </div>
      ) : (
        /* Grid Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.map((branch) => {
            const isOpen = branch.isActive !== false;
            const isHq = Boolean(branch.isHeadquarter || branch.branchCode === 'BR-HQ');

            return (
              <div
                key={branch._id || branch.branchCode}
                className={`bg-slate-900 border rounded-2xl p-4 space-y-3 transition-all hover:bg-slate-850/80 shadow-xl flex flex-col justify-between ${
                  isHq
                    ? 'border-cyan-500/40 ring-1 ring-cyan-500/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isHq
                            ? 'bg-cyan-500/15 text-cyan-400'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}
                      >
                        {isHq ? <Building2 className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-slate-100 line-clamp-1">
                            {branch.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[10px] font-mono font-bold text-cyan-400">
                            {branch.branchCode || branch.code}
                          </p>
                          {isHq && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 border border-cyan-500/40 text-[9px] font-bold text-cyan-300 uppercase">
                              Kho Tổng HQ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        isOpen
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {isOpen ? 'Đang hoạt động' : 'Tạm đóng'}
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
                      <span className="font-mono">{branch.phone}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-300 pt-0.5">
                      <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>
                        Phụ trách:{' '}
                        <strong>
                          {branch.managerName ||
                            (isHq ? 'Ban Quản Trị Trụ Sở (HQ)' : 'Chưa bổ nhiệm')}
                        </strong>
                      </span>
                    </p>

                    {/* GPS Coordinates GeoJSON */}
                    {branch.location?.coordinates && (
                      <p className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                        <Navigation className="w-3 h-3 text-cyan-400" />
                        <span>
                          GPS: [{branch.location.coordinates[0]}, {branch.location.coordinates[1]}]
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Metrics & Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 font-mono text-cyan-400" title="Tổng số lượng thiết bị tồn kho thực tế">
                      <Package className="w-3.5 h-3.5" />
                      <span>Tồn kho: {branch.stockCount ?? 0} SP</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditBranch(branch)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white rounded-lg bg-slate-800/80 hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Chỉnh sửa chi nhánh"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Sửa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BranchListCardGrid;
