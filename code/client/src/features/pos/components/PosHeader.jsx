import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Store, 
  User, 
  Printer, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Wifi, 
  ShoppingBag,
  ArrowLeft,
  LogOut,
  Coins
} from 'lucide-react';
import { logout } from '../../../store/slices/authSlice.js';
import { clearCart } from '../../../store/slices/posCartSlice.js';
import axiosClient from '../../../services/axiosClient.js';

export const PosHeader = ({
  activeCartCount = 0,
  branches = [],
  selectedBranchId = '',
  onSelectBranch,
  isSuperAdmin = false,
  currentShift = null,
  onOpenShiftModal
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth?.user);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loggingOut, setLoggingOut] = useState(false);

  const activeBranch = branches.find((b) => String(b._id) === String(selectedBranchId));

  const branchName =
    activeBranch?.name ||
    authUser?.branch?.name ||
    (typeof authUser?.branchId === 'object' ? authUser?.branchId?.name : '') ||
    'Chi nhánh TechOne';
  const branchCode =
    activeBranch?.branchCode ||
    authUser?.branch?.branchCode ||
    (typeof authUser?.branchId === 'object' ? authUser?.branchId?.branchCode : '') ||
    'POS #01';
  const staffName = authUser?.fullName || 'Nhân viên Thu Ngân';
  const roleLabel =
    authUser?.role === 'BRANCH_MANAGER'
      ? 'Quản lý Chi nhánh'
      : authUser?.role === 'SUPER_ADMIN'
      ? 'Super Admin'
      : 'Thu ngân tại quầy';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handlePosLogout = async () => {
    if (loggingOut) return;
    if (activeCartCount > 0) {
      const confirmed = window.confirm(
        'Giỏ hàng hiện tại đang có sản phẩm. Bạn có chắc chắn muốn đăng xuất và hủy giỏ hàng này không?'
      );
      if (!confirmed) return;
    }

    setLoggingOut(true);
    try {
      await axiosClient.post('/auth/logout');
    } catch {
      // Vẫn xóa phiên cục bộ nếu mất kết nối mạng
    } finally {
      dispatch(clearCart());
      dispatch(logout());
      setLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 flex items-center justify-between select-none">
      {/* Brand & Branch Info */}
      <div className="flex items-center gap-4">
        <Link
          to="/portal/inventory"
          title="Quay lại Cổng Quản Lý Chi Nhánh"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Về Cổng Quản Lý</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/30 text-white">
            T
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base text-white">TECHONE POS</span>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE
              </span>
            </div>
            
            {/* Branch selector or static badge */}
            {isSuperAdmin && branches.length > 0 ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Store className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => onSelectBranch && onSelectBranch(e.target.value)}
                  className="bg-slate-800/90 text-xs font-medium text-slate-200 border border-slate-700/80 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                  title="Chọn chi nhánh hoạt động của quầy POS"
                >
                  {branches.map((b) => (
                    <option key={b._id} value={b._id} className="bg-slate-900 text-slate-100">
                      {b.name} ({b.branchCode})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Store className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium text-slate-300">{branchName}</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-slate-400">{branchCode}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ca trực & Thu ngân */}
        <div className="hidden lg:flex items-center gap-4 pl-4 border-l border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">{staffName}</p>
              <p className="text-[11px] text-slate-400">{roleLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700/50">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-slate-200">{currentTime.toLocaleTimeString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* POS Quick Shortcuts Guide */}
      <div className="hidden xl:flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Phím tắt:</span>
        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-[11px]"><strong className="text-blue-400">F2</strong> Quét mã</span>
        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-[11px]"><strong className="text-blue-400">F4</strong> Khách hàng</span>
        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-[11px]"><strong className="text-blue-400">F8</strong> Giảm giá</span>
        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-[11px]"><strong className="text-blue-400">F9</strong> Thanh toán</span>
      </div>

      {/* Control Actions & Status */}
      <div className="flex items-center gap-2">
        {/* Két tiền & Ca thu ngân Button */}
        <button
          type="button"
          onClick={onOpenShiftModal}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            currentShift
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
              : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 animate-pulse'
          }`}
          title="Quản lý két tiền và chốt ca thu ngân"
        >
          <Coins className="w-3.5 h-3.5" />
          <span>{currentShift ? `Ca: ${currentShift.shiftCode}` : '⚠️ Mở ca bán hàng'}</span>
        </button>

        {/* Máy in nhiệt K80 Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-md border border-slate-700/60 text-xs">
          <Printer className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300 font-medium">In K80:</span>
          <span className="text-emerald-400 font-semibold">Sẵn sàng</span>
        </div>

        {/* Active Cart Counter badge */}
        <div className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <ShoppingBag className="w-5 h-5" />
          {activeCartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-slate-900">
              {activeCartCount}
            </span>
          )}
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          title="Toàn màn hình quầy thu ngân"
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Network status */}
        <div className="p-2 text-emerald-400" title="Mạng nội bộ ổn định">
          <Wifi className="w-4 h-4" />
        </div>

        {/* Kết thúc ca / Đăng xuất (UC-ST13) */}
        <button
          type="button"
          onClick={handlePosLogout}
          disabled={loggingOut}
          title="Kết thúc ca làm việc & Đăng xuất"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-400 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{loggingOut ? 'Đang thoát...' : 'Kết thúc ca'}</span>
        </button>
      </div>
    </header>
  );
};

export default PosHeader;
