import { useState, useEffect } from 'react';
import { Store, ShieldCheck, Users } from 'lucide-react';
import BranchListCardGrid from '../../features/branches/components/BranchListCardGrid';
import BranchFormModal from '../../features/branches/components/BranchFormModal';
import UserRbacTable from '../../features/users/components/UserRbacTable';
import { branchService } from '../../features/branches/services/branchService.js';
import { isMockEnabled } from '../../config/dataMode.js';

const INITIAL_BRANCHES = [
  {
    _id: '65f0a1000000000000000001',
    code: 'BR-Q1-TQK',
    name: 'TechOne Q1 • 138 Trần Quang Khải',
    address: '138 Trần Quang Khải, P. Tân Định, Quận 1, TP.HCM',
    phone: '028 3822 6868',
    managerName: 'Phạm Quốc Huy',
    stockCount: 3864,
    revenueText: '4,28 tỷ',
    location: { type: 'Point', coordinates: [106.6912, 10.7915] },
    isActive: true
  },
  {
    _id: '65f0a1000000000000000002',
    code: 'BR-TD-VVN',
    name: 'TechOne Thủ Đức • 214 Võ Văn Ngân',
    address: '214 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức, TP.HCM',
    phone: '028 3722 6868',
    managerName: 'Lê Thanh Tùng',
    stockCount: 2950,
    revenueText: '3,62 tỷ',
    location: { type: 'Point', coordinates: [106.7725, 10.8504] },
    isActive: true
  },
  {
    _id: '65f0a1000000000000000003',
    code: 'BR-Q5-THD',
    name: 'TechOne Q5 • 382 Trần Hưng Đạo',
    address: '382 Trần Hưng Đạo, Phường 11, Quận 5, TP.HCM',
    phone: '028 3855 6868',
    managerName: 'Hoàng Minh Đức',
    stockCount: 2180,
    revenueText: '2,94 tỷ',
    location: { type: 'Point', coordinates: [106.6668, 10.7532] },
    isActive: true
  }
];

const INITIAL_USERS = [
  {
    _id: 'user-001',
    fullName: 'Nguyễn Minh Anh',
    email: 'admin@techone.vn',
    phone: '090 999 8888',
    role: 'SUPER_ADMIN',
    branchId: '',
    isActive: true
  },
  {
    _id: 'user-002',
    fullName: 'Phạm Quốc Huy',
    email: 'huy.pham@techone.vn',
    phone: '091 234 5678',
    role: 'BRANCH_MANAGER',
    branchId: '65f0a1000000000000000001',
    isActive: true
  },
  {
    _id: 'user-003',
    fullName: 'Nguyễn Văn Thu Ngân',
    email: 'thungan.q1@techone.vn',
    phone: '098 765 4321',
    role: 'STAFF',
    branchId: '65f0a1000000000000000001',
    isActive: true
  },
  {
    _id: 'user-004',
    fullName: 'Trần Kỹ Thuật',
    email: 'kythuat.q1@techone.vn',
    phone: '097 112 3344',
    role: 'STAFF',
    branchId: '65f0a1000000000000000001',
    isActive: true
  }
];

export const AdminBranchesUsersPage = () => {
  const [activeTab, setActiveTab] = useState('BRANCHES'); // 'BRANCHES' | 'USERS'
  const [branches, setBranches] = useState(INITIAL_BRANCHES);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [editingBranch, setEditingBranch] = useState(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    let ignore = false;
    if (isMockEnabled()) {
      setBranches(INITIAL_BRANCHES);
      return;
    }

    branchService.getBranches().then((list) => {
      if (!ignore && list && list.length > 0) {
        setBranches(list);
      }
    }).catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  const handleSaveBranch = (saved) => {
    if (editingBranch) {
      setBranches((prev) => prev.map((b) => (b._id === saved._id ? saved : b)));
      setToastMsg({ type: 'success', message: `Đã cập nhật chi nhánh ${saved.name}!` });
    } else {
      setBranches((prev) => [saved, ...prev]);
      setToastMsg({ type: 'success', message: `Đã tạo mới chi nhánh ${saved.name}!` });
    }
    setEditingBranch(null);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleUpdateUserRole = (userId, role) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, role } : u))
    );
    setToastMsg({ type: 'success', message: `Đã cập nhật quyền ${role} cho nhân sự!` });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleUpdateUserBranch = (userId, branchId) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, branchId } : u))
    );
    setToastMsg({ type: 'success', message: 'Đã phân bổ lại chi nhánh công tác!' });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleToggleUserActive = (userId, isActive) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, isActive } : u))
    );
    setToastMsg({
      type: 'success',
      message: `Đã ${isActive ? 'kích hoạt' : 'tạm khóa'} tài khoản nhân sự!`
    });
    setTimeout(() => setToastMsg(null), 3000);
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
            Cấu hình tọa độ GeoJSON chi nhánh, quản trị nhân sự và kiểm soát vai trò SUPER_ADMIN, BRANCH_MANAGER, STAFF
          </p>
        </div>

        {/* Tab switchers */}
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

      {/* Toast */}
      {toastMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs font-semibold text-emerald-300 flex items-center justify-between animate-in fade-in">
          <span>{toastMsg.message}</span>
          <button onClick={() => setToastMsg(null)} className="opacity-70 hover:opacity-100">✕</button>
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
        onClose={() => setShowBranchModal(false)}
        branch={editingBranch}
        onSaveBranch={handleSaveBranch}
      />
    </div>
  );
};

export default AdminBranchesUsersPage;
