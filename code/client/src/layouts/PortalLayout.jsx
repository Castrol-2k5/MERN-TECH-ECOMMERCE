import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Store, 
  Layers, 
  Wrench, 
  ExternalLink, 
  Menu, 
  X, 
  LogOut, 
  ShoppingBag,
  Box,
  Barcode,
  Truck,
  ShieldCheck,
  BarChart3,
  ArrowLeftRight,
  ShieldAlert,
  Coins,
  CreditCard,
  Users
} from 'lucide-react';
import { logout } from '../store/slices/authSlice.js';
import { clearCart } from '../store/slices/posCartSlice.js';
import axiosClient from '../services/axiosClient.js';
import ErrorBoundary from '../components/common/ErrorBoundary.jsx';
import OrderAlertBell from '../features/orders/components/OrderAlertBell.jsx';
import ApprovalAlertBell from '../features/approvals/components/ApprovalAlertBell.jsx';

export const PortalLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth?.user);
  const posCartItems = useSelector((state) => state.posCart?.items || []);

  // If on POS Page, POS has its own specialized fullscreen layout
  const isPosPage = location.pathname.includes('/portal/pos');

  const userRole = authUser?.role || 'STAFF';
  const displayName = authUser?.fullName || 'Nhân sự TechOne';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'TO';

  const handleLogout = async () => {
    if (loggingOut) return;
    if (posCartItems.length > 0) {
      const confirmed = window.confirm(
        'Giỏ hàng hiện tại đang có sản phẩm. Bạn có chắc chắn muốn đăng xuất và hủy giỏ hàng này không?'
      );
      if (!confirmed) return;
    }
    setLoggingOut(true);
    try {
      await axiosClient.post('/auth/logout');
    } catch {
      // Kịch bản phụ 2.a: Mất kết nối mạng vẫn xóa phiên cục bộ
    } finally {
      dispatch(clearCart());
      dispatch(logout());
      setLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  const handleLogoutAllDevices = async () => {
    if (loggingOut) return;
    if (!window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi TẤT CẢ thiết bị đang đăng nhập không?')) {
      return;
    }
    setLoggingOut(true);
    try {
      await axiosClient.post('/auth/logout-all');
    } catch {
      // Kịch bản phụ 2.a: Mất kết nối mạng vẫn xóa phiên cục bộ
    } finally {
      dispatch(logout());
      setLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  const operationsLinks = [
    {
      to: '/portal/pos',
      label: 'Web POS Thu Ngân',
      badge: 'F9',
      icon: ShoppingBag,
      roles: ['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN']
    },
    {
      to: '/portal/inventory',
      label: 'Kho Chi Nhánh',
      badge: 'Quầy kệ',
      icon: Layers,
      roles: ['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN']
    },
    {
      to: '/portal/warranty-reception',
      label: 'Tiếp Nhận Bảo Hành',
      badge: 'E-Warranty',
      icon: Wrench,
      roles: ['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN']
    },
    {
      to: '/portal/branch/orders',
      label: 'Đơn Hàng Chi Nhánh',
      badge: 'POS & B2C',
      icon: ShoppingBag,
      roles: ['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN']
    },
    {
      to: '/portal/admin/orders-dispatch',
      label: userRole === 'SUPER_ADMIN' ? 'Điều Phối Đơn B2C' : userRole === 'STAFF' ? 'Đóng Gói & Quét Serial' : 'Xử Lý Đơn B2C Chi Nhánh',
      badge: userRole === 'STAFF' ? 'Kho CN' : 'SLA',
      icon: Truck,
      roles: ['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN']
    },
    {
      to: '/portal/branch/transfers',
      label: userRole === 'STAFF' ? 'Kiểm Nhận Điều Chuyển' : 'Điều Chuyển Kho',
      badge: 'P-20',
      icon: ArrowLeftRight,
      roles: ['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN']
    },
    {
      to: '/portal/shifts',
      label: 'Két Tiền & Ca Thu Ngân',
      badge: 'Kiểm quỹ',
      icon: Coins,
      roles: ['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN']
    },
    {
      to: '/portal/my-performance',
      label: 'Doanh Số Cá Nhân',
      badge: 'KPI',
      icon: BarChart3,
      roles: ['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN']
    },
    {
      to: '/portal/manager/approvals',
      label: userRole === 'STAFF' ? 'Yêu Cầu Đã Gửi' : 'Phê Duyệt Đặc Quyền',
      badge: 'Duyệt',
      icon: ShieldCheck,
      roles: ['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN']
    }
  ].filter((item) => item.roles.includes(userRole));

  const hqAdminLinks = [
    {
      to: '/portal/branch/staff',
      label: 'Nhân Sự & KPI Đội Ngũ',
      badge: 'Team',
      icon: Users,
      roles: ['BRANCH_MANAGER', 'SUPER_ADMIN']
    },
    {
      to: '/portal/settlements',
      label: 'Đối Soát & Bù Trừ Chuỗi',
      badge: 'Clearing',
      icon: CreditCard,
      roles: ['BRANCH_MANAGER', 'SUPER_ADMIN']
    },
    {
      to: '/portal/admin/products',
      label: 'Quản Trị Sản Phẩm',
      badge: 'Dynamic',
      icon: Box,
      roles: ['SUPER_ADMIN']
    },
    {
      to: '/portal/admin/import-serials',
      label: 'Nhập Lô Serial / IMEI',
      badge: userRole === 'SUPER_ADMIN' ? 'Kho HQ' : 'Kho CN',
      icon: Barcode,
      roles: ['BRANCH_MANAGER', 'SUPER_ADMIN']
    },
    {
      to: '/portal/admin/branches-rbac',
      label: 'Chi Nhánh & RBAC',
      badge: 'Hệ thống',
      icon: Store,
      roles: ['SUPER_ADMIN']
    },
    {
      to: '/portal/admin/analytics',
      label: 'Báo Cáo Doanh Thu',
      badge: 'BI',
      icon: BarChart3,
      roles: ['SUPER_ADMIN']
    },
    {
      to: '/portal/admin/audit-logs',
      label: 'Nhật Ký & Kiểm Toán',
      badge: '5W1H',
      icon: ShieldAlert,
      roles: ['SUPER_ADMIN']
    }
  ].filter((item) => item.roles.includes(userRole));

  if (isPosPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        ></div>
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & Scrollable Navigation */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Brand */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-600/30">
                T
              </div>
              <div>
                <h2 className="font-extrabold text-sm tracking-wider text-white">TECHONE PORTAL</h2>
                <p className="text-[10px] text-slate-400 font-medium uppercase">Operations &amp; Admin</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-slate-400 hover:text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links scrollable */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Nhóm 1: Vận hành quầy & kho */}
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Vận hành quầy &amp; kho
              </div>
              <nav className="space-y-1 mt-1">
                {operationsLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-950/60 text-slate-300">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Nhóm 2: Quản trị trụ sở (HQ ADMIN) */}
            {hqAdminLinks.length > 0 && (
              <div>
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400/90 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{userRole === 'SUPER_ADMIN' ? 'Quản trị trụ sở (HQ Admin)' : 'Điều vận đơn hàng B2C'}</span>
                </div>
                <nav className="space-y-1 mt-1">
                  {hqAdminLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-950/60 text-cyan-300">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Nhóm 3: Storefront B2C Link */}
            <div className="pt-2 border-t border-slate-800">
              <NavLink
                to="/"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>Storefront B2C</span>
                </div>
                <span className="text-[10px] text-slate-500">Mở web</span>
              </NavLink>
            </div>
          </div>
        </div>

        {/* User profile footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 font-bold text-xs">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate" title={displayName}>
                  {displayName}
                </p>
                <p className="text-[10px] text-cyan-400 font-mono font-bold">{userRole}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleLogoutAllDevices}
                disabled={loggingOut}
                title="Đăng xuất khỏi mọi thiết bị (Global Logout)"
                className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                title="Đăng xuất"
                className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-semibold text-slate-200">Hệ Thống Trụ Sở &amp; Quản Trị Chuỗi TechOne</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/portal/pos"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Mở Màn Hình POS</span>
            </NavLink>
            <ApprovalAlertBell />
            <OrderAlertBell compact />
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
