import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import axiosClient from '../../services/axiosClient.js';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Vui lòng nhập Email hoặc Số điện thoại đã đăng ký');
      return;
    }

    try {
      setLoading(true);
      const res = await axiosClient.post('/auth/forgot-password', {
        identifier: identifier.trim()
      });

      setSuccessData({
        message: res.message || 'Yêu cầu khôi phục mật khẩu đã được xử lý.',
        resetToken: res.data?.resetToken
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Không thể xử lý yêu cầu. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/10">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quên mật khẩu?</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Nhập Email hoặc Số điện thoại tài khoản của bạn để nhận liên kết xác thực đặt lại mật khẩu
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl shadow-slate-200/40">
          {successData ? (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-emerald-900">Yêu cầu đã được gửi!</p>
                  <p className="mt-1 leading-relaxed text-emerald-700">
                    {successData.message}
                  </p>
                </div>
              </div>

              {/* Development / E2E Manual testing link */}
              {successData.resetToken && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 text-xs space-y-3">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <span>🎯 Liên kết đặt lại mật khẩu nhanh (Test Mode):</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-blue-200 text-[11px] font-mono text-slate-700 break-all select-all">
                    /reset-password?token={successData.resetToken}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/reset-password?token=${successData.resetToken}`)}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Mở trang đặt lại mật khẩu ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại trang Đăng nhập</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-start gap-3 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{error}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email hoặc Số điện thoại đã đăng ký
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@example.com hoặc 0909000001"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ĐANG GỬI YÊU CẦU...</span>
                  </>
                ) : (
                  <>
                    <span>GỬI LIÊN KẾT XÁC THỰC</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay về Đăng nhập</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
