import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search,
  MapPin,
  ShieldCheck,
  User,
  ShoppingBag,
  Truck,
  RotateCcw,
  ChevronDown,
  Menu,
  X,
  Scale,
  LogOut,
  Package,
  LayoutDashboard
} from 'lucide-react';
import { logout } from '../store/slices/authSlice.js';
import axiosClient from '../services/axiosClient.js';
import branchService from '../features/branches/services/branchService.js';
import categoryService from '../features/categories/services/categoryService.js';

export const StorefrontLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const totalCartQuantity = useSelector((state) => state.cart.totalQuantity);
  const compareCount = useSelector((state) => state.compare.products.length);
  const authUser = useSelector((state) => state.auth?.user);
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [branchList, catList] = await Promise.all([
        branchService.getBranches(),
        categoryService.getCategories(),
      ]);
      setBranches(branchList);
      if (branchList.length > 0) {
        setSelectedBranch(branchList[0]);
      }
      setCategories(catList);
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/category/laptop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* 1. UTILITY BAR (FIGMA #11:1092) */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 md:px-12 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-3 text-slate-300">
            <span className="flex items-center gap-1.5 text-blue-400 font-medium">
              <Truck className="w-3.5 h-3.5" /> Miễn phí giao hàng đơn từ 500.000đ
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline">Đổi trả trong 30 ngày tận nơi</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>
              Hotline: <strong className="text-white hover:text-blue-400 cursor-pointer">1800 6868</strong>
            </span>
            <span>•</span>
            <span>Hệ thống 48 cửa hàng toàn quốc</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (FIGMA #11:1095) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-12 h-20 flex items-center justify-between gap-4 md:gap-8">
          {/* Brand Mark */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md group-hover:bg-blue-700 transition-colors">
              T
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                Tech<span className="text-blue-600">One</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
                Technology Retail
              </span>
            </div>
          </Link>

          {/* Search Bar Auto-suggest */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-xl relative hidden md:block"
          >
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm MacBook Air M4, ASUS ROG, Gaming Gear... (⌘K)"
                className="w-full h-11 pl-10 pr-24 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          {/* Header Action Items */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Branch Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-xs leading-tight">
                  <span className="text-slate-400 font-medium">Chi nhánh:</span>
                  <span className="text-slate-800 font-bold max-w-[130px] truncate">
                    {selectedBranch ? selectedBranch.name.replace('TechOne ', '') : 'Chọn cửa hàng'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {isBranchDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                  <div className="text-xs font-bold text-slate-400 uppercase px-3 py-1.5 tracking-wider">
                    Chọn chi nhánh gần bạn
                  </div>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {branches.map((b) => (
                      <button
                        key={b._id}
                        onClick={() => {
                          setSelectedBranch(b);
                          setIsBranchDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs hover:bg-blue-50 transition-colors flex flex-col gap-0.5 ${
                          selectedBranch?._id === b._id ? 'bg-blue-50/70 border-l-3 border-blue-600' : ''
                        }`}
                      >
                        <span className="font-bold text-slate-900">{b.name}</span>
                        <span className="text-slate-500 text-[11px] leading-relaxed line-clamp-1">
                          {b.address}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Compare Link */}
            <Link
              to="/compare"
              className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors"
              title="So sánh sản phẩm"
            >
              <Scale className="w-5 h-5 text-slate-600" />
              {compareCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {compareCount}
                </span>
              )}
            </Link>

            {/* Warranty Check Portal Link */}
            <Link
              to="/warranty-check"
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-xs leading-tight">
                <span className="text-slate-400 font-medium">Bảo hành</span>
                <span className="text-slate-800 font-bold">Tra cứu e-Warranty</span>
              </div>
            </Link>

            {/* User Account / Auth Dropdown */}
            {isAuthenticated && authUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    {authUser.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden xl:flex flex-col text-xs leading-tight text-left">
                    <span className="text-slate-400 font-medium">{authUser.role}</span>
                    <span className="text-slate-800 font-bold max-w-[120px] truncate">
                      {authUser.fullName}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-fade-in text-xs">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">{authUser.fullName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{authUser.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {authUser.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/account/orders"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
                      >
                        <Package className="w-4 h-4 text-blue-600" />
                        <span>Đơn hàng của tôi</span>
                      </Link>

                      {authUser.role !== 'CUSTOMER' && (
                        <Link
                          to={authUser.role === 'SUPER_ADMIN' ? '/portal/admin/products' : '/portal/pos'}
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-purple-600" />
                          <span>Cổng quản trị Portal</span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={async () => {
                          try {
                            await axiosClient.post('/auth/logout');
                          } catch {
                            // ignore
                          }
                          dispatch(logout());
                          setIsUserDropdownOpen(false);
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 font-semibold transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden xl:flex flex-col text-xs leading-tight text-left">
                  <span className="text-slate-400 font-medium">Tài khoản</span>
                  <span className="text-slate-800 font-bold">Đăng nhập</span>
                </div>
              </Link>
            )}

            {/* Cart Icon & Badge */}
            <Link
              to="/cart"
              className="relative p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCartQuantity > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-scale">
                  {totalCartQuantity}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 md:hidden"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* 3. NAVIGATION BAR (FIGMA #11:1123) */}
        <nav className="border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-12 flex items-center gap-6 overflow-x-auto scrollbar-none h-12 text-sm font-semibold text-slate-600">
            <Link
              to="/category/laptop"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 shrink-0 font-bold"
            >
              <span>☰</span>
              <span>Danh mục sản phẩm</span>
            </Link>
            <div className="h-4 w-px bg-slate-200 shrink-0" />
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className={`hover:text-blue-600 transition-colors shrink-0 ${
                  location.pathname.includes(`/category/${cat.slug}`) ? 'text-blue-600 font-bold' : ''
                }`}
              >
                {cat.name.replace(' chính hãng', '').replace(' cao cấp', '')}
              </Link>
            ))}
            <Link
              to="/warranty-check"
              className={`hover:text-blue-600 transition-colors shrink-0 text-slate-500 font-medium ${
                location.pathname === '/warranty-check' ? 'text-blue-600 font-bold' : ''
              }`}
            >
              Tra cứu bảo hành
            </Link>
          </div>
        </nav>
      </header>

      {/* 4. MAIN CONTENT AREA */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 5. STOREFRONT FOOTER (FIGMA #11:1368 - #11:1436) */}
      <footer className="bg-slate-900 text-slate-300 mt-20">
        <div className="border-b border-slate-800 py-10 px-4 md:px-12 bg-slate-900/50">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Giao nhanh 2 giờ</h4>
                <p className="text-slate-400 text-xs mt-0.5">Áp dụng đơn nội thành TP.HCM</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Đổi trả 30 ngày</h4>
                <p className="text-slate-400 text-xs mt-0.5">Miễn phí đổi sản phẩm lỗi</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Bảo hành chính hãng</h4>
                <p className="text-slate-400 text-xs mt-0.5">Tra cứu trực tuyến theo Serial</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">48 cửa hàng toàn quốc</h4>
                <p className="text-slate-400 text-xs mt-0.5">Hỗ trợ trải nghiệm & tại chỗ</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-12 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black">
                T
              </div>
              <span className="text-xl font-bold text-white">TechOne Retail</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Chuỗi bán lẻ thiết bị công nghệ chính hãng hàng đầu. Đồng hành cùng bạn trong mọi trải nghiệm số với cam kết chất lượng chuẩn quốc tế.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
              <span className="px-2 py-1 bg-slate-800 rounded text-slate-300 font-semibold">
                ✓ Bộ Công Thương
              </span>
              <span className="px-2 py-1 bg-slate-800 rounded text-slate-300 font-semibold">
                ✓ Thanh toán bảo mật SSL
              </span>
            </div>
          </div>

          <div>
            <h5 className="text-white font-bold text-sm mb-4">Sản phẩm</h5>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/category/laptop" className="hover:text-white transition-colors">Laptop AI & Gaming</Link></li>
              <li><Link to="/category/smartphone" className="hover:text-white transition-colors">Điện thoại Flagship</Link></li>
              <li><Link to="/category/linh-kien" className="hover:text-white transition-colors">Linh kiện PC & CPU</Link></li>
              <li><Link to="/category/phu-kien" className="hover:text-white transition-colors">Phụ kiện & Gaming Gear</Link></li>
              <li><Link to="/category/man-hinh" className="hover:text-white transition-colors">Màn hình OLED 2K/4K</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold text-sm mb-4">Hỗ trợ khách hàng</h5>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/warranty-check" className="hover:text-white transition-colors">Tra cứu e-Warranty</Link></li>
              <li><a href="#return" className="hover:text-white transition-colors">Chính sách đổi trả 30 ngày</a></li>
              <li><a href="#installment" className="hover:text-white transition-colors">Hướng dẫn trả góp 0%</a></li>
              <li><a href="#shipping" className="hover:text-white transition-colors">Phương thức giao hàng 2h</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold text-sm mb-4">Tổng đài hỗ trợ</h5>
            <div className="space-y-2 text-sm">
              <div className="text-2xl font-black text-blue-400">1800 6868</div>
              <p className="text-slate-400 text-xs">08:00 – 22:00 (Tất cả các ngày trong tuần)</p>
              <p className="text-slate-400 text-xs">Email: <span className="text-white">hotro@techone.vn</span></p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 py-6 px-4 md:px-12 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© 2026 TechOne Retail Omnichannel Platform. Bảo lưu mọi quyền.</span>
            <div className="flex gap-4 text-slate-400">
              <span>Điều khoản sử dụng</span>
              <span>•</span>
              <span>Chính sách bảo mật</span>
              <span>•</span>
              <span>Sitemap</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StorefrontLayout;
