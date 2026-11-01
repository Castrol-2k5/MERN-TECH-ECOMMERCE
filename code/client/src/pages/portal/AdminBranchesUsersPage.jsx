import { useState, useEffect, useCallback } from 'react';
import { Store, ShieldCheck, Users, UserPlus } from 'lucide-react';
import BranchListCardGrid from '../../features/branches/components/BranchListCardGrid';
import BranchFormModal from '../../features/branches/components/BranchFormModal';
import UserRbacTable from '../../features/users/components/UserRbacTable';
import UserFormModal from '../../features/users/components/UserFormModal';
import { branchService } from '../../features/branches/services/branchService.js';
import { userService, fallbackUsers } from '../../features/users/services/userService.js';
import { isMockEnabled } from '../../config/dataMode.js';

export const AdminBranchesUsersPage = () => {
  const [activeTab, setActiveTab] = useState('BRANCHES'); // 'BRANCHES' | 'USERS'
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState(isMockEnabled() ? fallbackUsers : []);
  const [editingBranch, setEditingBranch] = useState(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (type, message) => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchBranches = useCallback(async () => {
    try {
      const list = await branchService.getBranches({ includeInactive: true });
      setBranches(list || []);
    } catch {
      setBranches([]);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const list = await userService.getUsers();
      setUsers(list || []);
    } catch {
      setUsers(isMockEnabled() ? fallbackUsers : []);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      await fetchBranches();
      if (!ignore) {
        await fetchUsers();
      }
    };
    init();
    return () => {
      ignore = true;
    };
  }, [fetchBranches, fetchUsers]);

  const handleSaveBranch = async (formData) => {
    if (editingBranch) {
      const saved = await branchService.updateBranch(editingBranch._id, formData);
      setBranches((prev) => prev.map((b) => (b._id === saved._id ? saved : b)));
      showToast('success', `Đã cập nhật chi nhánh ${saved.name}!`);
    } else {
      const saved = await branchService.createBranch(formData);
      setBranches((prev) => [saved, ...prev]);
      showToast('success', `Đã tạo mới chi nhánh ${saved.name}!`);
    }
    setEditingBranch(null);
    setShowBranchModal(false);
    await fetchBranches();
  };

  const handleCreateUser = async (userPayload) => {
    const created = await userService.createUser(userPayload);
    setUsers((prev) => [created, ...prev]);
    showToast('success', `Đã khởi tạo tài khoản ${created.fullName} thành công!`);
    await Promise.all([fetchUsers(), fetchBranches()]);
  };

  const handleUpdateUserRole = async (userId, role, currentBranchId) => {
    try {
      const payload = { role };
      if ((role === 'STAFF' || role === 'BRANCH_MANAGER') && !currentBranchId) {
        const defaultRetailBranch =
          branches.find((b) => !b.isHeadquarter && b.branchCode !== 'BR-HQ') || branches[0];
        if (defaultRetailBranch?._id) {
          payload.branchId = defaultRetailBranch._id;
        }
      } else if (role === 'SUPER_ADMIN' || role === 'CUSTOMER') {
        payload.branchId = null;
      }

      const updated = await userService.updateUser(userId, payload);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, ...updated } : u))
      );
      showToast('success', `Đã cập nhật quyền ${role} cho nhân sự!`);
      await fetchBranches();
    } catch (err) {
      showToast(
        'error',
        err.response?.data?.errors?.[0]?.message ||
          err.response?.data?.message ||
          err.message ||
          'Lỗi khi cập nhật vai trò'
      );
    }
  };

  const handleUpdateUserBranch = async (userId, branchId) => {
    try {
      const updated = await userService.updateUser(userId, { branchId: branchId || null });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, ...updated } : u))
      );
      showToast('success', 'Đã phân bổ lại chi nhánh công tác!');
      await fetchBranches();
    } catch (err) {
      showToast(
        'error',
        err.response?.data?.errors?.[0]?.message ||
          err.response?.data?.message ||
          err.message ||
          'Lỗi khi phân bổ chi nhánh'
      );
    }
  };

  const handleToggleUserActive = async (userId, isActive) => {
    try {
      await userService.toggleUserStatus(userId, isActive);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive } : u))
      );
      showToast(
        'success',
        `Đã ${isActive ? 'kích hoạt' : 'tạm khóa & thu hồi phiên đăng nhập của'} tài khoản nhân sự!`
      );
      await fetchBranches();
    } catch (err) {
      showToast(
        'error',
        err.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái'
      );
    }
  };

  return (
    <div className="space-y-5 select-none font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Trụ Sở Chính • HQ Administration</span>
          </div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight">
            Quản Lý Mạng Lưới Chi Nhánh &amp; Phân Quyền RBAC
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cấu hình Kho Trung Tâm (BR-HQ), tọa độ GeoJSON chi nhánh bán lẻ và kiểm soát vai trò SUPER_ADMIN, BRANCH_MANAGER, STAFF, CUSTOMER
          </p>
        </div>

        {/* Tab switchers & Action */}
        <div className="flex items-center gap-2">
          {activeTab === 'USERS' && (
            <button
              type="button"
              onClick={() => setShowUserModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Thêm Nhân Sự</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('BRANCHES')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'BRANCHES'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Mạng Lưới Chi Nhánh ({branches.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('USERS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'USERS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Nhân Sự &amp; Phân Quyền ({users.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
          }`}
        >
          <span>{toastMsg.message}</span>
          <button onClick={() => setToastMsg(null)} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Tab 1: Branches Grid */}
      {activeTab === 'BRANCHES' && (
        <BranchListCardGrid
          branches={branches}
          onAddNewBranch={() => {
            setEditingBranch(null);
            setShowBranchModal(true);
          }}
          onEditBranch={(b) => {
            setEditingBranch(b);
            setShowBranchModal(true);
          }}
        />
      )}

      {/* Tab 2: Users RBAC Table */}
      {activeTab === 'USERS' && (
        <UserRbacTable
          users={users}
          branches={branches}
          onUpdateUserRole={handleUpdateUserRole}
          onUpdateUserBranch={handleUpdateUserBranch}
          onToggleUserActive={handleToggleUserActive}
        />
      )}

      {/* Branch Form Modal */}
      <BranchFormModal
        isOpen={showBranchModal}
        onClose={() => {
          setShowBranchModal(false);
          setEditingBranch(null);
        }}
        branch={editingBranch}
        onSaveBranch={handleSaveBranch}
      />

      {/* User Form Modal */}
      <UserFormModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        branches={branches}
        onCreateUser={handleCreateUser}
      />
    </div>
  );
};

export default AdminBranchesUsersPage;
