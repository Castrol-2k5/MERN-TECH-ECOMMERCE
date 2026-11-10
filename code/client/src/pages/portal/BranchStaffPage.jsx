import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Users,
  Trophy,
  UserPlus,
  Search,
  Lock,
  Unlock,
  Edit2,
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  Award,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { userService } from '../../features/users/services/userService.js';
import { analyticsService } from '../../features/analytics/services/analyticsService.js';
import { branchService } from '../../features/branches/services/branchService.js';
import UserFormModal from '../../features/users/components/UserFormModal.jsx';

const formatVND = (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫`;

const RANGE_OPTIONS = [
  { id: 'today', label: 'Hôm nay' },
  { id: '7d', label: '7 ngày qua' },
  { id: '30d', label: '30 ngày qua' }
];

export const BranchStaffPage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';
  const managerBranchId =
    typeof authUser?.branchId === 'object' ? authUser?.branchId?._id || '' : authUser?.branchId || '';

  const [activeTab, setActiveTab] = useState('KPI'); // 'KPI' | 'STAFF'
  const [range, setRange] = useState('7d');
  const [selectedBranchId, setSelectedBranchId] = useState(isSuperAdmin ? '' : managerBranchId);
  const [branches, setBranches] = useState([]);
  const [kpiData, setKpiData] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [toast, setToast] = useState(null);

  const effectiveBranchId = isSuperAdmin ? selectedBranchId : managerBranchId;
  const requestKey = `${range}:${effectiveBranchId}:${refreshTick}`;
  const isLoading = loadedKey !== requestKey;

  const notify = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let active = true;
    branchService
      .getBranches()
      .then((list) => {
        if (active) setBranches(list || []);
      })
      .catch(() => {
        if (active) setBranches([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const userParams = effectiveBranchId ? { branchId: effectiveBranchId, limit: 100 } : { limit: 100 };

    Promise.all([
      analyticsService.getBranchStaffKpi({ range, branchId: effectiveBranchId }),
      userService.getUsers(userParams)
    ])
      .then(([kpiRes, usersRes]) => {
        if (!cancelled) {
          setKpiData(kpiRes);
          setStaffList(Array.isArray(usersRes) ? usersRes : []);
          setLoadedKey(requestKey);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          notify('error', err?.response?.data?.message || err?.message || 'Lỗi tải dữ liệu nhân sự.');
          setLoadedKey(requestKey);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [range, effectiveBranchId, requestKey]);

  const handleCreateUser = async (payload) => {
    await userService.createUser(payload);
    notify('success', 'Đã khởi tạo tài khoản nhân viên mới thành công.');
    setRefreshTick((t) => t + 1);
  };

  const handleUpdateUser = async (id, payload) => {
    await userService.updateUser(id, payload);
    notify('success', 'Đã cập nhật thông tin nhân viên.');
    setRefreshTick((t) => t + 1);
  };

  const handleToggleStatus = async (member) => {
    const nextActive = !member.isActive;
    try {
      await userService.toggleUserStatus(member._id, nextActive);
      notify(
        'success',
        nextActive
          ? `Đã mở khóa tài khoản ${member.fullName}.`
          : `Đã tạm khóa tài khoản ${member.fullName} và thu hồi phiên đăng nhập.`
      );
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Không thể thay đổi trạng thái.');
    }
  };

  const filteredStaff = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return staffList.filter((u) => {
      const matchRole = u.role === 'STAFF' || u.role === 'BRANCH_MANAGER';
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.isActive) ||
        (statusFilter === 'LOCKED' && !u.isActive);
      const matchSearch =
        !q ||
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q);
      return matchRole && matchStatus && matchSearch;
    });
  }, [staffList, searchTerm, statusFilter]);

  const summary = kpiData?.summary || {
    totalTeamRevenue: 0,
    totalTeamOrders: 0,
    activeStaffCount: 0,
    totalStaffCount: 0,
    topPerformer: null
  };
  const ranking = kpiData?.ranking || [];

  return (
    <div className="space-y-5 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <Users className="w-4 h-4" />
            <span>Quản Trị Đội Ngũ Chi Nhánh • UC-BM-01 &amp; UC-BM-02</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Nhân Sự Chi Nhánh &amp; Bảng Xếp Hạng KPI
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo dõi doanh số từng thu ngân, tỷ lệ hoàn hàng và cấp/khóa tài khoản STAFF tại chi nhánh
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && branches.length > 0 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">Tất cả chi nhánh</option>
              {branches
                .filter((b) => !b.isHeadquarter && b.branchCode !== 'BR-HQ')
                .map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.branchCode})
                  </option>
                ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingUser(null);
              setShowModal(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Thêm nhân viên (STAFF)</span>
          </button>

          <button
            type="button"
            onClick={() => setRefreshTick((t) => t + 1)}
            disabled={isLoading}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Tabs & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="inline-flex bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setActiveTab('KPI')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'KPI' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Bảng Xếp Hạng KPI</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('STAFF')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'STAFF' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tài Khoản Nhân Sự ({filteredStaff.length})</span>
          </button>
        </div>

        {activeTab === 'KPI' && (
          <div className="inline-flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRange(opt.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  range === opt.id ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'KPI' ? (
        <div className="space-y-5">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Tổng doanh số đội ngũ</p>
                <p className="text-2xl font-black font-mono text-emerald-400 mt-1">
                  {formatVND(summary.totalTeamRevenue)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {summary.activeStaffCount}/{summary.totalStaffCount || ranking.length} nhân sự đang hoạt động
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-blue-500/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Tổng đơn hoàn tất</p>
                <p className="text-2xl font-black font-mono text-blue-400 mt-1">
                  {summary.totalTeamOrders}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Tính trên tất cả nhân viên chi nhánh</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Top 1 doanh số</p>
                <p className="text-base font-black text-amber-300 mt-1 truncate">
                  {summary.topPerformer?.fullName || 'Chưa có dữ liệu'}
                </p>
                <p className="text-xs font-mono text-amber-400 mt-0.5">
                  {formatVND(summary.topPerformer?.netRevenue || 0)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div>
              <h2 className="text-sm font-bold text-white">So sánh doanh số thuần theo nhân viên</h2>
              <p className="text-xs text-slate-400">Đơn vị: VNĐ (Đã trừ giá trị đơn trả/hoàn)</p>
            </div>
            {ranking.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-xs text-slate-500">
                Chưa có dữ liệu nhân viên tại chi nhánh này.
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ranking} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.45} vertical={false} />
                    <XAxis dataKey="fullName" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `${Math.round(v / 1000000)}tr`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        color: '#f8fafc'
                      }}
                      formatter={(val) => [formatVND(val), 'Doanh số thuần']}
                    />
                    <Bar dataKey="netRevenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Ranking Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                    <th className="py-3 px-4 w-14 text-center">Hạng</th>
                    <th className="py-3 px-4">Nhân viên</th>
                    <th className="py-3 px-4 text-right">Doanh số thuần</th>
                    <th className="py-3 px-4 text-center">Đơn hoàn tất</th>
                    <th className="py-3 px-4 text-right">Giá trị TB (AOV)</th>
                    <th className="py-3 px-4 text-center">Ca / Bảo hành</th>
                    <th className="py-3 px-4 text-center">Tỷ lệ hoàn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {ranking.map((row) => (
                    <tr key={row.staffId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-center font-mono font-black">
                        <span
                          className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-[11px] ${
                            row.rank === 1
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : row.rank === 2
                              ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40'
                              : row.rank === 3
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                              : 'text-slate-400'
                          }`}
                        >
                          {row.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          <span>{row.fullName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                            {row.role}
                          </span>
                          {!row.isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                              Đã khóa
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{row.email}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatVND(row.netRevenue)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="font-bold text-slate-200">{row.completedOrders}</span>
                        <span className="text-[10px] text-slate-500 block">({row.posOrdersCount} POS)</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-cyan-300">
                        {formatVND(row.avgOrderValue)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        {row.shiftCount} ca • {row.warrantyCount} BH
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            row.returnRate > 15
                              ? 'bg-rose-500/15 text-rose-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {row.returnRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {ranking.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-slate-500">
                        Không có nhân viên nào trong chi nhánh.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: Quản lý tài khoản STAFF */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên, email, SĐT nhân viên..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'ACTIVE', label: 'Đang hoạt động' },
                { id: 'LOCKED', label: 'Đã khóa' }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-4">Nhân sự</th>
                  <th className="py-3 px-4">Số điện thoại</th>
                  <th className="py-3 px-4">Vai trò</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredStaff.map((member) => {
                  const canManageRow = isSuperAdmin || member.role === 'STAFF';
                  return (
                    <tr key={member._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100">{member.fullName}</div>
                        <div className="text-[11px] text-slate-400">{member.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{member.phone}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                            member.role === 'BRANCH_MANAGER'
                              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                              : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            member.isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {member.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canManageRow ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUser(member);
                                setShowModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3 text-blue-400" />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(member)}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                                member.isActive
                                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              {member.isActive ? (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>Khóa</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3 h-3" />
                                  <span>Mở khóa</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Chỉ HQ sửa</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-500">
                      Không tìm thấy nhân sự phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Staff */}
      {showModal && (
        <UserFormModal
          key={editingUser?._id || 'create-branch-staff'}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          branches={branches}
          editingUser={editingUser}
          restrictedToStaff={!isSuperAdmin}
          fixedBranchId={!isSuperAdmin ? managerBranchId : effectiveBranchId}
          onCreateUser={handleCreateUser}
          onUpdateUser={handleUpdateUser}
        />
      )}
    </div>
  );
};

export default BranchStaffPage;
