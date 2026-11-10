import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  BarChart3,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Store,
  Globe
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import analyticsService from '../../features/analytics/services/analyticsService.js';
import { branchService } from '../../features/branches/services/branchService.js';

const formatVND = (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫`;

export const BranchAnalyticsPage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';
  const myBranchId =
    typeof authUser?.branchId === 'object' ? authUser?.branchId?._id || '' : authUser?.branchId || '';

  const [days, setDays] = useState(30);
  const [selectedBranchId, setSelectedBranchId] = useState(isSuperAdmin ? '' : myBranchId);
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const effectiveBranchId = isSuperAdmin ? selectedBranchId : myBranchId;
  const requestKey = `${days}:${effectiveBranchId}:${refreshTick}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;
    branchService
      .getBranches()
      .then((list) => {
        if (active) setBranches(list || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    analyticsService
      .getBranchStrategy({ days, branchId: effectiveBranchId })
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setErrorMsg('');
          setLoadedKey(requestKey);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(err?.response?.data?.message || err?.message || 'Lỗi tải dữ liệu chiến lược.');
          setLoadedKey(requestKey);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [days, effectiveBranchId, requestKey]);

  const omni = data?.omnichannel || {
    totalRevenue: 0,
    posRevenue: 0,
    onlineRevenue: 0,
    posOrders: 0,
    onlineOrders: 0,
    posSharePercent: 0,
    onlineSharePercent: 0
  };
  const peakHours = data?.peakHours || [];
  const salesVelocity = data?.salesVelocity || [];
  const agingStock = data?.agingStock || [];

  return (
    <div className="space-y-5 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Báo Cáo Chiến Lược Chi Nhánh • UC-BM-07</span>
          </div>
          <h1 className="text-xl font-black text-white">
            Phân Tích Đa Kênh, Khung Giờ Vàng &amp; Tồn Kho Chậm
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo dõi tỷ trọng Offline POS vs Online B2C, giờ cao điểm để tối ưu ca trực và cảnh báo hàng lưu kho &gt; 30 ngày
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && branches.length > 0 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 cursor-pointer"
            >
              <option value="">Toàn chuỗi</option>
              {branches
                .filter((b) => !b.isHeadquarter && b.branchCode !== 'BR-HQ')
                .map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
            </select>
          )}

          <div className="inline-flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            {[7, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  days === d ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {d} ngày qua
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
        <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* 4 Strategic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Tổng doanh thu đa kênh ({days}d)</p>
            <p className="text-2xl font-black font-mono text-emerald-400 mt-1">{formatVND(omni.totalRevenue)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{omni.posOrders + omni.onlineOrders} đơn trong kỳ</p>
          </div>
          <TrendingUp className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Tỷ trọng Offline POS vs Online</p>
            <p className="text-xl font-black font-mono text-cyan-400 mt-1">
              {omni.posSharePercent}% POS • {omni.onlineSharePercent}% B2C
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {omni.posOrders} đơn quầy / {omni.onlineOrders} đơn web
            </p>
          </div>
          <div className="flex gap-1 text-cyan-400">
            <Store className="w-4 h-4" />
            <Globe className="w-4 h-4 text-blue-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-blue-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Khung giờ cao điểm (Peak)</p>
            <p className="text-2xl font-black font-mono text-blue-400 mt-1">
              {data?.peakHourSlot?.hourLabel || 'Chưa có'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {data?.peakHourSlot ? `${data.peakHourSlot.totalOrders} đơn trong khung giờ` : 'Chờ phát sinh đơn'}
            </p>
          </div>
          <Clock className="w-6 h-6 text-blue-400" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Cảnh báo tồn kho &gt; 30 ngày</p>
            <p className="text-2xl font-black font-mono text-amber-400 mt-1">{agingStock.length} mã SKU</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cần cân nhắc xả hàng / điều chuyển</p>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>
      </div>

      {/* Peak Hours Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-white">Biểu đồ Khung giờ cao điểm (08:00 – 22:00)</h2>
          <p className="text-xs text-slate-400">Số lượng đơn hàng theo giờ giúp Quản lý tối ưu lịch phân ca nhân viên</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakHours} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.45} vertical={false} />
              <XAxis dataKey="hourLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  color: '#f8fafc'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="posOrders" name="Đơn quầy POS" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
              <Bar dataKey="onlineOrders" name="Đơn Online B2C" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Velocity & Aging Stock Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Velocity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white">Tốc độ bán hàng (Sales Velocity)</h2>
            <p className="text-xs text-slate-400">Top SKU bán chạy nhất &amp; số ngày tồn kho dự kiến</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-2.5 px-4">Sản phẩm / SKU</th>
                  <th className="py-2.5 px-3 text-center">Đã bán</th>
                  <th className="py-2.5 px-3 text-center">Tồn kho</th>
                  <th className="py-2.5 px-4 text-right">Cảnh báo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {salesVelocity.map((v) => (
                  <tr key={v.productSkuId || v.sku}>
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-100">{v.productName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{v.sku}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">{v.unitsSold}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-200">{v.currentStock}</td>
                    <td className="py-2.5 px-4 text-right">
                      {v.restockAlert ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          Cần xin nhập ({v.daysOfSupply ?? 0}d)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          Đủ ~{v.daysOfSupply ?? '—'} ngày
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {salesVelocity.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500">Chưa có dữ liệu bán hàng trong kỳ.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Aging Stock (> 30 days) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white">Hàng tồn kho lưu lâu (&gt; 30 ngày)</h2>
            <p className="text-xs text-slate-400">Ưu tiên điều chuyển sang chi nhánh khác hoặc đẩy bán</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-2.5 px-4">Sản phẩm / SKU</th>
                  <th className="py-2.5 px-3 text-center">SL tồn lâu</th>
                  <th className="py-2.5 px-4 text-right">Tuổi tồn kho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {agingStock.map((a) => (
                  <tr key={a.productSkuId || a.sku}>
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-100">{a.productName}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {a.sku} {a.sampleSerials?.length ? `• ${a.sampleSerials.join(', ')}` : ''}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-400">{a.agedQuantity}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-400">
                      {a.ageDays} ngày
                    </td>
                  </tr>
                ))}
                {agingStock.length === 0 && (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-slate-500">
                      Tuyệt vời! Không có hàng tồn kho lưu quá 30 ngày.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchAnalyticsPage;
