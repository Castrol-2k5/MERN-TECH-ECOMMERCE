import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Shield,
  Key,
  Package,
  Plus,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Home,
  Briefcase,
  ExternalLink,
  Laptop,
  Check,
  Calendar,
  Lock,
  ArrowRight
} from 'lucide-react';
import userService from '../../features/users/services/userService.js';
import { orderService } from '../../features/orders/services/orderService.js';
import { setCredentials } from '../../store/slices/authSlice.js';

export const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth?.user);

  const [activeTab, setActiveTab] = useState('PROFILE'); // 'PROFILE' | 'ADDRESSES' | 'WARRANTY'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Personal Info Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Address Book State
  const [addresses, setAddresses] = useState([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Nhà riêng',
    recipientName: '',
    phone: '',
    address: '',
    isDefault: false
  });

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // My Devices & Warranties State (Derived from orders)
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  // Load User Profile Data
  useEffect(() => {
    let ignore = false;
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await userService.getMyProfile();
        if (!ignore && data) {
          setFullName(data.fullName || authUser?.fullName || '');
          setPhone(data.phone || authUser?.phone || '');
          setEmail(data.email || authUser?.email || '');
          const rawAddresses = Array.isArray(data.addresses) ? data.addresses : [];
          if (rawAddresses.length === 0 && data.address) {
            setAddresses([
              {
                label: 'Địa chỉ nhận hàng',
                recipientName: data.fullName || '',
                phone: data.phone || '',
                address: data.address,
                isDefault: true
              }
            ]);
          } else {
            setAddresses(rawAddresses);
          }
        }
      } catch (err) {
        if (!ignore) {
          setErrorMsg(err.response?.data?.message || err.message || 'Không thể tải hồ sơ.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      ignore = true;
    };
  }, [authUser]);

  // Load Purchased Devices for E-Warranty Tab
  useEffect(() => {
    let ignore = false;
    const loadDevices = async () => {
      try {
        setDevicesLoading(true);
        const orders = await orderService.getMyOrders();
        if (!ignore && Array.isArray(orders)) {
          const deviceList = [];
          for (const order of orders) {
            // Include completed orders or orders with serials assigned
            if (Array.isArray(order.items)) {
              for (const item of order.items) {
                const serials = Array.isArray(item.serialsAssigned)
                  ? item.serialsAssigned
                  : item.serial
                  ? [item.serial]
                  : [];
                if (serials.length > 0) {
                  for (const sn of serials) {
                    const purchaseDate = new Date(order.completedAt || order.createdAt || Date.now());
                    const expiryDate = new Date(purchaseDate);
                    expiryDate.setMonth(expiryDate.getMonth() + 12); // Standard 12-month warranty
                    const isExpired = Date.now() > expiryDate.getTime();

                    deviceList.push({
                      id: `${order._id}-${sn}`,
                      productName: item.productName || 'Thiết bị công nghệ',
                      sku: item.sku || 'SKU-DEVICE',
                      serialNumber: sn,
                      orderCode: order.orderCode || 'ORD-TECHONE',
                      orderId: order._id,
                      purchaseDate: purchaseDate.toLocaleDateString('vi-VN'),
                      expiryDate: expiryDate.toLocaleDateString('vi-VN'),
                      isExpired,
                      branchName: order.branchId?.name || 'Showroom TechOne'
                    });
                  }
                }
              }
            }
          }
          setDevices(deviceList);
        }
      } catch (err) {
        console.warn('Failed to load user devices for warranty:', err);
      } finally {
        if (!ignore) setDevicesLoading(false);
      }
    };

    if (activeTab === 'WARRANTY') {
      loadDevices();
    }
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  // Update Personal Info
  const handleSavePersonalInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updated = await userService.updateMyProfile({
        fullName,
        phone
      });
      setSuccessMsg('Đã cập nhật thông tin cá nhân thành công!');
      if (updated) {
        dispatch(setCredentials({ user: updated, token: localStorage.getItem('token') }));
      }
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword !== confirmPassword) {
      setPwdError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setPwdLoading(true);
    try {
      await userService.changePassword({
        currentPassword,
        newPassword
      });
      setPwdSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(''), 3500);
    } catch (err) {
      setPwdError(err.response?.data?.message || err.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setPwdLoading(false);
    }
  };

  // Address Book Management
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.address.trim()) return;

    let updatedList = [...addresses];
    const newEntry = {
      label: addressForm.label.trim() || 'Nhà riêng',
      recipientName: addressForm.recipientName.trim() || fullName,
      phone: addressForm.phone.trim() || phone,
      address: addressForm.address.trim(),
      isDefault: Boolean(addressForm.isDefault)
    };

    if (newEntry.isDefault) {
      updatedList = updatedList.map((a) => ({ ...a, isDefault: false }));
    }

    if (editingAddressIndex !== null) {
      updatedList[editingAddressIndex] = newEntry;
    } else {
      // If first address, automatically make it default
      if (updatedList.length === 0) newEntry.isDefault = true;
      updatedList.push(newEntry);
    }

    setSaving(true);
    try {
      const updatedUser = await userService.updateMyProfile({ addresses: updatedList });
      setAddresses(updatedList);
      setIsAddressModalOpen(false);
      setEditingAddressIndex(null);
      setSuccessMsg('Đã cập nhật sổ địa chỉ thành công!');
      if (updatedUser) {
        dispatch(setCredentials({ user: updatedUser, token: localStorage.getItem('token') }));
      }
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi lưu địa chỉ.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefaultAddress = async (index) => {
    const updatedList = addresses.map((a, i) => ({
      ...a,
      isDefault: i === index
    }));

    setSaving(true);
    try {
      const updatedUser = await userService.updateMyProfile({ addresses: updatedList });
      setAddresses(updatedList);
      setSuccessMsg(`Đã đặt "${addresses[index].label}" làm địa chỉ mặc định!`);
      if (updatedUser) {
        dispatch(setCredentials({ user: updatedUser, token: localStorage.getItem('token') }));
      }
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi cập nhật địa chỉ mặc định.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (index) => {
    const isTargetDefault = addresses[index]?.isDefault;
    let updatedList = addresses.filter((_, i) => i !== index);
    if (isTargetDefault && updatedList.length > 0) {
      updatedList[0].isDefault = true;
    }

    setSaving(true);
    try {
      const updatedUser = await userService.updateMyProfile({ addresses: updatedList });
      setAddresses(updatedList);
      setSuccessMsg('Đã xóa địa chỉ thành công!');
      if (updatedUser) {
        dispatch(setCredentials({ user: updatedUser, token: localStorage.getItem('token') }));
      }
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi xóa địa chỉ.');
    } finally {
      setSaving(false);
    }
  };

  const openAddAddressModal = () => {
    setEditingAddressIndex(null);
    setAddressForm({
      label: 'Nhà riêng',
      recipientName: fullName,
      phone,
      address: '',
      isDefault: addresses.length === 0
    });
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (index) => {
    const item = addresses[index];
    setEditingAddressIndex(index);
    setAddressForm({
      label: item.label || 'Nhà riêng',
      recipientName: item.recipientName || fullName,
      phone: item.phone || phone,
      address: item.address || '',
      isDefault: Boolean(item.isDefault)
    });
    setIsAddressModalOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs text-slate-500 font-medium">Đang tải hồ sơ tài khoản...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-slate-400 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-bold">Hồ sơ khách hàng</span>
      </nav>

      {/* Top Banner & User Profile Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/25 border-2 border-white/20 shrink-0">
            {fullName
              ? fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(-2)
                  .join('')
                  .toUpperCase()
              : 'KH'}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{fullName || 'Khách hàng'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Thành viên TechOne VIP
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>{email}</span>
              {phone && (
                <>
                  <span>•</span>
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{phone}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Quick Link to Orders */}
        <Link
          to="/account/orders"
          className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-2 transition-all w-fit backdrop-blur-xs"
        >
          <Package className="w-4 h-4 text-blue-400" />
          <span>Xem Lịch sử Đơn hàng</span>
          <ArrowRight className="w-3.5 h-3.5 opacity-70" />
        </Link>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800 font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Sidebar Tabs + Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 p-3 shadow-xs space-y-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`w-full p-3 rounded-2xl text-left text-xs font-bold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'PROFILE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông tin cá nhân &amp; Bảo mật</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ADDRESSES')}
            className={`w-full p-3 rounded-2xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
              activeTab === 'ADDRESSES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4" />
              <span>Sổ địa chỉ giao hàng</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'ADDRESSES' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {addresses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WARRANTY')}
            className={`w-full p-3 rounded-2xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
              activeTab === 'WARRANTY'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4" />
              <span>Thiết bị &amp; Bảo hành</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'WARRANTY' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              E-Warranty
            </span>
          </button>
        </div>

        {/* Tab Content Area (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: PERSONAL INFO & SECURITY */}
          {activeTab === 'PROFILE' && (
            <div className="space-y-6">
              {/* Personal Details Form */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
                <div className="pb-4 border-b border-slate-100 mb-5">
                  <h2 className="text-base font-bold text-slate-900">Thông tin cơ bản</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cập nhật họ tên và số điện thoại dùng để nhận hàng và kích hoạt bảo hành điện tử
                  </p>
                </div>

                <form onSubmit={handleSavePersonalInfo} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Họ và tên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Số điện thoại di động <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="0912345678"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Địa chỉ Email đăng nhập (Không thể thay đổi)
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                    >
                      {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password Change Form */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
                <div className="pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-blue-600" />
                    <h2 className="text-base font-bold text-slate-900">Bảo mật &amp; Đổi mật khẩu</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Để bảo vệ tài khoản, khuyến nghị sử dụng mật khẩu mạnh có tối thiểu 6 ký tự
                  </p>
                </div>

                {pwdSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{pwdSuccess}</span>
                  </div>
                )}
                {pwdError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{pwdError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Mật khẩu hiện tại <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Mật khẩu mới <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Ít nhất 6 ký tự"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={pwdLoading}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer disabled:opacity-50"
                    >
                      {pwdLoading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: ADDRESS BOOK */}
          {activeTab === 'ADDRESSES' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Sổ địa chỉ giao hàng</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quản lý danh sách địa chỉ nhận hàng. Địa chỉ mặc định sẽ tự động điền khi thanh toán và dùng làm tham chiếu vị trí.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddAddressModal}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer w-fit"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Địa Chỉ Mới</span>
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">Chưa có địa chỉ nào được lưu</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Hãy lưu địa chỉ nhà riêng hoặc nơi làm việc để thanh toán nhanh hơn và tự động gợi ý chi nhánh gần bạn.
                  </p>
                  <button
                    type="button"
                    onClick={openAddAddressModal}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Thêm địa chỉ ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                        addr.isDefault
                          ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              {addr.label?.toLowerCase().includes('công') || addr.label?.toLowerCase().includes('việc') ? (
                                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                              ) : (
                                <Home className="w-3.5 h-3.5 text-blue-600" />
                              )}
                              <span>{addr.label || 'Địa chỉ'}</span>
                            </span>
                          </div>
                          {addr.isDefault ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Mặc định
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(index)}
                              className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                            >
                              Đặt làm mặc định
                            </button>
                          )}
                        </div>

                        <div className="text-xs text-slate-800 font-semibold">
                          {addr.recipientName || fullName} • <span className="text-slate-500 font-normal">{addr.phone || phone}</span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {addr.address}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => openEditAddressModal(index)}
                          className="text-slate-600 hover:text-blue-600 font-medium cursor-pointer"
                        >
                          Chỉnh sửa
                        </button>
                        <span className="text-slate-200">•</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(index)}
                          className="text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY DEVICES & E-WARRANTY */}
          {activeTab === 'WARRANTY' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <h2 className="text-base font-bold text-slate-900">Thiết bị &amp; Bảo hành điện tử trọn đời</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hệ thống tự động kích hoạt bảo hành điện tử theo Serial/IMEI ngay khi bạn nhận máy thành công.
                  </p>
                </div>
                <Link
                  to="/warranty-check"
                  className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Tra cứu bảo hành độc lập</span>
                </Link>
              </div>

              {devicesLoading ? (
                <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Đang tải thông tin thiết bị và bảo hành...</span>
                </div>
              ) : devices.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">Chưa ghi nhận thiết bị nào</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Khi bạn hoàn tất đơn hàng mua máy (online hoặc tại showroom), mã Serial/IMEI và phiếu bảo hành điện tử sẽ tự động xuất hiện tại đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-2xs"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Laptop className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-xs text-slate-900">{device.productName}</h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                device.isExpired
                                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {device.isExpired ? 'Hết hạn bảo hành' : 'Bảo hành chính hãng'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                            <span>
                              Số Serial/IMEI: <strong className="font-mono text-slate-800 select-all">{device.serialNumber}</strong>
                            </span>
                            <span>•</span>
                            <span>Đơn hàng: <strong className="text-blue-600">{device.orderCode}</strong></span>
                            <span>•</span>
                            <span>Điểm mua: {device.branchName}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Kích hoạt: {device.purchaseDate} — Hạn bảo hành: <strong className="text-slate-700">{device.expiryDate}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <Link
                          to={`/warranty-check?serial=${encodeURIComponent(device.serialNumber)}`}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5 text-blue-600" />
                          <span>Chi tiết bảo hành</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Address Form Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {editingAddressIndex !== null ? 'Chỉnh sửa địa chỉ nhận hàng' : 'Thêm địa chỉ nhận hàng mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên gợi nhớ (Nhãn địa chỉ)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Nhà riêng', 'Văn phòng', 'Khác'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        addressForm.label === lbl
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên người nhận
                  </label>
                  <input
                    type="text"
                    value={addressForm.recipientName}
                    onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    required
                    placeholder="0912345678"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Địa chỉ chi tiết (Số nhà, đường, phường, quận, TP) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  required
                  placeholder="Ví dụ: 123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Đặt làm địa chỉ nhận hàng mặc định
                </span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu Địa Chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
