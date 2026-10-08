import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';
import axiosClient from '../../../services/axiosClient.js';
import { setCredentials } from '../../../store/slices/authSlice.js';

export const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || null;

  const handleLoginSuccess = (user, accessToken) => {
    dispatch(setCredentials({ user, accessToken }));

    // RBAC Navigation
    if (user.role === 'SUPER_ADMIN') {
      navigate('/portal/admin/products', { replace: true });
    } else if (user.role === 'BRANCH_MANAGER' || user.role === 'STAFF') {
      navigate('/portal/pos', { replace: true });
    } else {
      // CUSTOMER
      navigate(from || '/', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Vui lòng nhập Email hoặc Số điện thoại');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    try {
      setLoading(true);
      const res = await axiosClient.post('/auth/login', {
        identifier: identifier.trim(),
        password
      });

      const { user, accessToken } = res.data;
      handleLoginSuccess(user, accessToken);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick fill demo credentials for manual E2E testing convenience
  const handleQuickFill = (email) => {
    setIdentifier(email);
    setPassword('123456');
    setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30">
            T
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Tech<span className="text-blue-600">One</span>
          </span>
        </Link>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Đăng nhập hệ thống</h1>
        <p className="text-xs text-slate-500 mt-1">
          Hệ thống Bán lẻ Đa kênh & Cổng Quản trị Tác nghiệp
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl shadow-slate-200/40">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email hoặc Số điện thoại
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@techstore.com hoặc 0909000001"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Mật khẩu</label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu (123456)"
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs text-slate-600 font-medium">Ghi nhớ đăng nhập</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ĐANG XÁC THỰC...</span>
              </>
            ) : (
              <>
                <span>ĐĂNG NHẬP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Selector (Ideal for E2E Manual Testing) */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Tài khoản kiểm thử nhanh (1-Click Fill):</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@techstore.com', 'SUPER_ADMIN')}
              className="px-2.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 text-purple-800 font-bold text-left transition-colors cursor-pointer truncate"
              title="Super Admin (admin@techstore.com / 123456)"
            >
              👑 Super Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('manager.q1@techstore.com', 'BRANCH_MANAGER')}
              className="px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/80 text-indigo-800 font-bold text-left transition-colors cursor-pointer truncate"
              title="Quản lý Q1 (manager.q1@techstore.com / 123456)"
            >
              🏬 Quản lý Q1
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('staff.q1@techstore.com', 'STAFF')}
              className="px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-amber-800 font-bold text-left transition-colors cursor-pointer truncate"
              title="Thu ngân Q1 (staff.q1@techstore.com / 123456)"
            >
              💼 Thu ngân Q1
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('customer@gmail.com', 'CUSTOMER')}
              className="px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-800 font-bold text-left transition-colors cursor-pointer truncate"
              title="Khách hàng (customer@gmail.com / 123456)"
            >
              🛒 Khách hàng B2C
            </button>
          </div>
        </div>
      </div>

      {/* Footer Register Link */}
      <div className="text-center mt-6 text-xs text-slate-500">
        Chưa có tài khoản thành viên?{' '}
        <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;
