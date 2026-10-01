import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  Store, 
  Layers, 
  Wrench, 
  ExternalLink, 
  Menu, 
  X, 
  LogOut, 
  Bell, 
  ShoppingBag,
  Box,
  Barcode,
  Truck,
  ShieldCheck,
  BarChart3,
  ArrowLeftRight
} from 'lucide-react';

export const PortalLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // If on POS Page, POS has its own specialized fullscreen layout
  const isPosPage = location.pathname.includes('/portal/pos');

  const operationsLinks = [
    {
      to: '/portal/pos',
      label: 'Web POS Thu Ngân',
      badge: 'F9',
      icon: ShoppingBag
    },
    {
      to: '/portal/inventory',
      label: 'Kho Chi Nhánh',
      badge: 'Quầy kệ',
      icon: Layers
    },
    {
      to: '/portal/warranty-reception',
      label: 'Tiếp Nhận Bảo Hành',
      badge: 'E-Warranty',
      icon: Wrench
    },
    {
      to: '/portal/branch/transfers',
      label: 'Điều Chuyển Kho',
      badge: 'P-20',
      icon: ArrowLeftRight
    }
  ];

  const hqAdminLinks = [
    {
      to: '/portal/admin/products',
      label: 'Quản Trị Sản Phẩm',
      badge: 'Dynamic',
      icon: Box
    },
    {
      to: '/portal/admin/import-serials',
      label: 'Nhập Lô Serial / IMEI',
      badge: 'Batch',
      icon: Barcode
    },
    {
      to: '/portal/admin/orders-dispatch',
      label: 'Điều Phối Đơn B2C',
      badge: 'SLA',
      icon: Truck
    },
    {
      to: '/portal/admin/branches-rbac',
      label: 'Chi Nhánh & RBAC',
      badge: '48 CN',
      icon: Store
    },
    {
      to: '/portal/admin/analytics',
      label: 'Báo Cáo Doanh Thu',
      badge: 'BI',
      icon: BarChart3
    }
  ];

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
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400/90 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Quản trị trụ sở (HQ Admin)</span>
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
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 font-bold text-xs">
                MA
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">Nguyễn Minh Anh</p>
                <p className="text-[10px] text-cyan-400 font-mono font-bold">SUPER_ADMIN</p>
              </div>
            </div>
            <button
              type="button"
              title="Đăng xuất"
              className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
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
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute top-2 right-2"></span>
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
