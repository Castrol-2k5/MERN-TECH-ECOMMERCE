import { useState } from 'react';
import { Search, Filter } from 'lucide-react';

export const UserRbacTable = ({
  users = [],
  branches = [],
  onUpdateUserRole,
  onUpdateUserBranch,
  onToggleUserActive
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm);
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'BRANCH_MANAGER':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-slate-100">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/60">
        <div className="relative max-w-sm w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT nhân sự..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900">Tất cả vai trò</option>
            <option value="SUPER_ADMIN" className="bg-slate-900">SUPER_ADMIN (Trụ sở)</option>
            <option value="BRANCH_MANAGER" className="bg-slate-900">BRANCH_MANAGER (Cửa hàng trưởng)</option>
            <option value="STAFF" className="bg-slate-900">STAFF (Thu ngân / KTV)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Nhân sự</th>
              <th className="py-3 px-4">Liên hệ</th>
              <th className="py-3 px-4">Chi nhánh công tác</th>
              <th className="py-3 px-4">Vai trò RBAC</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredUsers.map((user) => {
              const isActive = user.isActive !== false;

              return (
                <tr key={user._id || user.email} className="hover:bg-slate-850/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                        {user.fullName?.slice(0, 2).toUpperCase() || 'NV'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-100">{user.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">ID: {user._id?.slice(-6) || '081245'}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-slate-300">{user.email}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{user.phone || '0901234567'}</div>
                  </td>

                  {/* Branch selector */}
                  <td className="py-3 px-4">
                    <select
                      value={user.branchId || ''}
                      onChange={(e) => onUpdateUserBranch(user._id, e.target.value)}
                      className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">-- Toàn chuỗi (HQ) --</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Role selector */}
                  <td className="py-3 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => onUpdateUserRole(user._id, e.target.value)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border focus:outline-none cursor-pointer ${getRoleBadge(
                        user.role
                      )}`}
                    >
                      <option value="STAFF" className="bg-slate-900 text-slate-200">STAFF</option>
                      <option value="BRANCH_MANAGER" className="bg-slate-900 text-blue-400">BRANCH_MANAGER</option>
                      <option value="SUPER_ADMIN" className="bg-slate-900 text-purple-400">SUPER_ADMIN</option>
                    </select>
                  </td>

                  {/* Active Toggle */}
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleUserActive(user._id, !isActive)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                      }`}
                    >
                      {isActive ? 'Hoạt động' : 'Tạm khóa'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserRbacTable;
