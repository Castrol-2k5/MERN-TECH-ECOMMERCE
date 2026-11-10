import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  Wrench,
  RefreshCw,
  Award,
  Layers
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
import { analyticsService } from '../../features/analytics/services/analyticsService.js';
import DataTablePagination from '../../components/common/DataTablePagination.jsx';

const formatVND = (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫`;

const RANGE_OPTIONS = [
  { id: 'today', label: 'Hôm nay' },
  { id: '7d', label: '7 ngày qua' },
  { id: '30d', label: '30 ngày qua' }
];

const ORDER_STATUS_BADGE = {
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  PARTIALLY_RETURNED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  RETURNED: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  PENDING: 'bg-slate-700/60 text-slate-300 border-slate-600',
  CANCELLED: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
};

export const MyPerformancePage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const [range, setRange] = useState('7d');
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const requestKey = `${range}:${refreshTick}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    analyticsService
      .getMyPerformance(range)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setErrorMsg('');
          setLoadedKey(requestKey);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể tải báo cáo doanh số cá nhân.');
          setLoadedKey(requestKey);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [range, requestKey]);

  const kpis = data?.kpis || {
    totalRevenue: 0,
    completedOrders: 0,
    posOrdersCount: 0,
    avgOrderValue: 0,
    shiftCount: 0,
    warrantyCount: 0
  };
  const dailyChart = data?.dailyChart || [];
  const categoryBreakdown = data?.categoryBreakdown || [];
  const recentOrders = useMemo(() => data?.recentOrders || [], [data]);

  const totalPages = Math.max(1, Math.ceil(recentOrders.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = recentOrders.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
            <Award className="w-4 h-4" />
            <span>Hiệu Suất Thu Ngân &amp; Tư Vấn • UC-POS-14</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Doanh Số &amp; Giao Dịch Cá Nhân — {authUser?.fullName || 'Nhân viên'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Chỉ thống kê các đơn hàng, ca trực &amp; phiếu bảo hành do chính tài khoản của bạn lập
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setRange(opt.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  range === opt.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

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

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Doanh số thuần cá nhân</p>
            <p className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {formatVND(kpis.totalRevenue)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Đã trừ giá trị hàng trả/hoàn</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-blue-500/30 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Đơn hoàn tất đã lập</p>
            <p className="text-2xl font-black font-mono text-blue-400 mt-1">
              {kpis.completedOrders}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Trong đó {kpis.posOrdersCount} đơn bán tại quầy POS
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Giá trị đơn trung bình</p>
            <p className="text-2xl font-black font-mono text-cyan-400 mt-1">
              {formatVND(kpis.avgOrderValue)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Trung bình mỗi hóa đơn hoàn tất</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Ca trực &amp; Phiếu bảo hành</p>
            <p className="text-2xl font-black font-mono text-amber-400 mt-1">
              {kpis.shiftCount} ca • {kpis.warrantyCount} phiếu
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Số ca đã mở &amp; máy đã tiếp nhận</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Chart + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Biểu đồ doanh số cá nhân theo ngày</h2>
              <p className="text-xs text-slate-400">Tổng doanh thu thuần từng ngày trong kỳ lọc</p>
            </div>
          </div>

          {dailyChart.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-slate-500">
              Chưa có doanh số hoàn tất nào trong khoảng thời gian đã chọn.
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.45} vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                    formatter={(value) => [formatVND(value), 'Doanh số']}
                  />
                  <Bar dataKey="revenue" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Tỷ trọng theo danh mục</h2>
              <p className="text-xs text-slate-400">Top nhóm sản phẩm bạn chốt đơn tốt nhất</p>
            </div>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Chưa có dữ liệu danh mục sản phẩm.
            </div>
          ) : (
            <div className="space-y-3.5">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 truncate">{cat.name}</span>
                    <span className="font-mono text-cyan-400 font-bold shrink-0">
                      {formatVND(cat.revenue)} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      style={{ width: `${Math.min(100, Math.max(4, cat.percentage))}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">{cat.units} sản phẩm đã bán</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Personal Recent Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Danh sách hóa đơn cá nhân gần nhất</h2>
            <p className="text-xs text-slate-400">Hiển thị tối đa 20 giao dịch bạn vừa lập trong kỳ</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{recentOrders.length} hóa đơn</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Mã hóa đơn</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Sản phẩm chính</th>
                <th className="py-3 px-4">Kênh / PTTT</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Doanh số thuần</th>
                <th className="py-3 px-4 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-500">
                    Chưa có giao dịch nào do tài khoản của bạn lập trong kỳ này.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((ord) => {
                  const netRev = Math.max(0, Number(ord.totalAmount || 0) - Number(ord.refundedAmount || 0));
                  const firstItem = ord.items?.[0]?.productName || 'Sản phẩm';
                  const extraItems = (ord.items?.length || 0) - 1;
                  const statusCls =
                    ORDER_STATUS_BADGE[ord.orderStatus] || 'bg-slate-800 text-slate-300 border-slate-700';

                  return (
                    <tr key={ord._id || ord.orderCode} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">{ord.orderCode}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{ord.customerInfo?.fullName || 'Khách vãng lai'}</div>
                        <div className="text-[11px] font-mono text-slate-500">{ord.customerInfo?.phone || '---'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-200 max-w-xs truncate">
                        {firstItem}{extraItems > 0 ? ` (+${extraItems} SP)` : ''}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">
                          {ord.orderType === 'POS_STORE' ? 'POS' : 'B2C'} • {ord.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCls}`}>
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatVND(netRev)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleString('vi-VN') : '---'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <DataTablePagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={recentOrders.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[5, 10, 20]}
          variant="dark"
          itemName="hóa đơn"
        />
      </div>
    </div>
  );
};

export default MyPerformancePage;
