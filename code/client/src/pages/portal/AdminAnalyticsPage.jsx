import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  Download,
  Store,
  TrendingUp,
  PackagePlus,
  AlertTriangle
} from 'lucide-react';
import KpiMetricsGrid from '../../features/analytics/components/KpiMetricsGrid';
import RevenueChart from '../../features/analytics/components/RevenueChart';
import BranchSalesBreakdown from '../../features/analytics/components/BranchSalesBreakdown';
import ChannelBreakdownPie from '../../features/analytics/components/ChannelBreakdownPie';
import TopProductsTable from '../../features/analytics/components/TopProductsTable';
import { branchService } from '../../features/branches/services/branchService.js';
import {
  analyticsService,
  fallbackAnalyticsOverview,
  emptyAnalyticsOverview
} from '../../features/analytics/services/analyticsService.js';
import { hqService } from '../../features/hq/services/hqService.js';
import { isMockEnabled } from '../../config/dataMode.js';

const URGENCY_BADGES = {
  CRITICAL: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
  WARNING: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  HEALTHY: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
};

export const AdminAnalyticsPage = () => {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth?.user);
  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'FORECAST'
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branches, setBranches] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(() =>
    isMockEnabled() ? fallbackAnalyticsOverview : emptyAnalyticsOverview
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Demand Forecast state (SUPER_ADMIN)
  const [daysWindow, setDaysWindow] = useState(30);
  const [targetCoverDays, setTargetCoverDays] = useState(21);
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  const fetchOverview = useCallback(async (branchId, start = startDate, end = endDate) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await analyticsService.getOverview({
        branchId,
        startDate: start || undefined,
        endDate: end || undefined
      });
      setAnalyticsData(data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Không thể tải dữ liệu phân tích.');
      setAnalyticsData(isMockEnabled() ? fallbackAnalyticsOverview : emptyAnalyticsOverview);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  const fetchForecast = useCallback(
    async (win = daysWindow, cover = targetCoverDays) => {
      if (!isSuperAdmin) return;
      setForecastLoading(true);
      try {
        const res = await hqService.getDemandForecast({
          daysWindow: win,
          targetCoverDays: cover
        });
        setForecastData(res);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || err.message || 'Không thể tải dữ liệu dự báo.');
      } finally {
        setForecastLoading(false);
      }
    },
    [daysWindow, targetCoverDays, isSuperAdmin]
  );

  const handleExportReport = () => {
    const perfRows = analyticsData.branchPerformance || [];
    const headers = [
      'Xếp hạng',
      'Chi nhánh',
      'Doanh thu thuần',
      'Đơn hàng',
      'AOV',
      'Biên LN gộp',
      'Đạt Target',
      'Tỷ lệ hoàn',
      'Tăng trưởng'
    ];
    const rows = perfRows.map((r) => [
      `"${r.rank}"`,
      `"${String(r.branch || '').replace(/"/g, '""')}"`,
      `"${r.revenue}"`,
      `"${r.orders}"`,
      `"${r.aov}"`,
      `"${r.grossMarginPct || '--'}"`,
      `"${r.targetAchievementPct || '--'}"`,
      `"${r.returnRate}"`,
      `"${r.growth}"`
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-doanh-thu-chuoi-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    let ignore = false;
    branchService.getBranches().then((list) => {
      if (!ignore && list) {
        setBranches(list);
      }
    }).catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    analyticsService
      .getOverview({ branchId: selectedBranch })
      .then((data) => {
        if (!ignore) setAnalyticsData(data);
      })
      .catch(() => {
        if (!ignore) {
          setAnalyticsData(isMockEnabled() ? fallbackAnalyticsOverview : emptyAnalyticsOverview);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedBranch]);

  useEffect(() => {
    if (!isSuperAdmin || activeTab !== 'FORECAST') return;
    let ignore = false;
    hqService
      .getDemandForecast({ daysWindow, targetCoverDays })
      .then((res) => {
        if (!ignore) setForecastData(res);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [isSuperAdmin, activeTab, daysWindow, targetCoverDays]);

  const handleCreatePoFromForecast = (itemsToOrder) => {
    if (!itemsToOrder || itemsToOrder.length === 0) return;
    navigate('/portal/hq/procurement', {
      state: { prefillItems: itemsToOrder }
    });
  };

  const forecastItems = forecastData?.items || [];
  const forecastSummary = forecastData?.summary || {};
  const restockableItems = forecastItems.filter((i) => i.recommendedOrderQty > 0);

  return (
    <div className="space-y-5 select-none font-sans text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Phân Tích Kinh Doanh • Business Intelligence &amp; Forecasting</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
            <h1 className="text-xl font-black text-slate-100 tracking-tight">
              Báo Cáo Doanh Thu Đa Kênh &amp; Dự Báo Nhập Hàng Chuỗi
            </h1>
            {isMockEnabled() ? (
              <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full text-[11px] font-bold">
                Dữ liệu thử nghiệm / Demo Preview
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold">
                Dữ liệu trực tiếp / Live Database
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tăng trưởng kỳ trước, tỷ lệ hoàn &amp; biên lợi nhuận tính từ đơn hàng thực tế • Dự báo nhập hàng Run-rate &amp; Days of Cover
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('OVERVIEW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  activeTab === 'OVERVIEW' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tổng Quan &amp; Ranking
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('FORECAST')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                  activeTab === 'FORECAST' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Dự Báo Nhập Hàng</span>
              </button>
            </div>
          )}

          {activeTab === 'OVERVIEW' && (
            <button
              type="button"
              onClick={handleExportReport}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-blue-600/20 cursor-pointer w-fit"
              title="Xuất báo cáo hiệu quả chuỗi dạng CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Báo Cáo CSV</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {activeTab === 'OVERVIEW' && (
        <>
          {/* Filter Bar */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Từ:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none font-medium"
              />
              <span className="text-slate-500">—</span>
              <span className="text-slate-400">Đến:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">
                  Chi nhánh: Toàn chuỗi ({branches.length > 0 ? `${branches.length} điểm` : 'Tất cả'})
                </option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id} className="bg-slate-900">
                    {b.branchName || b.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => fetchOverview(selectedBranch, startDate, endDate)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              {isLoading ? 'Đang tải...' : 'Áp dụng'}
            </button>
          </div>

          <KpiMetricsGrid data={analyticsData.kpis} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8">
              <RevenueChart data={analyticsData.revenueOverTime} />
            </div>
            <div className="lg:col-span-4">
              <BranchSalesBreakdown data={analyticsData.branchSales} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-5">
              <ChannelBreakdownPie data={analyticsData.channelData} />
            </div>
            <div className="lg:col-span-7">
              <TopProductsTable data={analyticsData.topProducts} />
            </div>
          </div>

          {/* Branch Performance Store Ranking Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60">
              <h3 className="font-bold text-sm text-slate-100">Bảng xếp hạng hiệu quả chi nhánh (Store Ranking)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                So sánh doanh thu thuần, đạt chỉ tiêu, biên lợi nhuận gộp, tỷ lệ hoàn thực tế &amp; tăng trưởng so với kỳ trước
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-16 text-center">Hạng</th>
                    <th className="py-3 px-4">Chi nhánh</th>
                    <th className="py-3 px-4 text-right">Doanh thu thuần</th>
                    <th className="py-3 px-4 text-center">Đơn hàng</th>
                    <th className="py-3 px-4 text-right">AOV</th>
                    <th className="py-3 px-4 text-right">Biên LN Gộp</th>
                    <th className="py-3 px-4 text-right">Đạt Target</th>
                    <th className="py-3 px-4 text-center">Tỷ lệ hoàn</th>
                    <th className="py-3 px-4 text-right">Tăng trưởng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {(analyticsData.branchPerformance || []).length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-10 text-center text-slate-500">
                        Chưa có dữ liệu đơn hàng phát sinh trong khoảng thời gian đã chọn.
                      </td>
                    </tr>
                  ) : (
                    (analyticsData.branchPerformance || []).map((row) => (
                      <tr key={row.rank} className="hover:bg-slate-850/60 transition-colors">
                        <td className="py-3 px-4 text-center font-mono font-bold text-cyan-400">{row.rank}</td>
                        <td className="py-3 px-4 font-semibold text-slate-200">{row.branch}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">{row.revenue}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-300">{row.orders}</td>
                        <td className="py-3 px-4 text-right font-mono text-cyan-400">{row.aov}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-300">
                          {row.grossMarginPct || '--'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-300">
                          {row.targetAchievementPct || '--'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{row.returnRate}</td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-bold ${
                            String(row.growth).startsWith('-') ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {row.growth}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Demand Forecasting */}
      {activeTab === 'FORECAST' && isSuperAdmin && (
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <span className="text-slate-400 mr-2">Cửa sổ lịch sử bán:</span>
                <select
                  value={daysWindow}
                  onChange={(e) => setDaysWindow(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                >
                  <option value={14}>14 ngày gần nhất</option>
                  <option value={30}>30 ngày gần nhất</option>
                  <option value={60}>60 ngày gần nhất</option>
                </select>
              </div>
              <div>
                <span className="text-slate-400 mr-2">Mục tiêu tồn dự trữ:</span>
                <select
                  value={targetCoverDays}
                  onChange={(e) => setTargetCoverDays(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                >
                  <option value={14}>14 ngày (2 tuần)</option>
                  <option value={21}>21 ngày (3 tuần)</option>
                  <option value={30}>30 ngày (1 tháng)</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => fetchForecast(daysWindow, targetCoverDays)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold cursor-pointer"
              >
                {forecastLoading ? 'Đang tính...' : 'Tính lại dự báo'}
              </button>
            </div>

            {restockableItems.length > 0 && (
              <button
                type="button"
                onClick={() => handleCreatePoFromForecast(restockableItems.slice(0, 10))}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>Tạo PO Nhập Hàng ({restockableItems.length} SKU thiếu)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-rose-300 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Nguy cấp (&lt; 7 ngày bán)</span>
              </div>
              <div className="text-2xl font-black text-rose-400 mt-1">{forecastSummary.criticalCount ?? 0} SKU</div>
            </div>
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-amber-300 uppercase">Cảnh báo (&lt; 14 ngày bán)</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{forecastSummary.warningCount ?? 0} SKU</div>
            </div>
            <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-cyan-300 uppercase">Tổng SKU đề xuất đặt NCC</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">{forecastSummary.skusNeedingRestock ?? 0} SKU</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-3 px-4">Sản phẩm / SKU</th>
                  <th className="py-3 px-4 text-right">Bán ({daysWindow}d)</th>
                  <th className="py-3 px-4 text-right">Tốc độ/ngày</th>
                  <th className="py-3 px-4 text-right">Tồn toàn chuỗi</th>
                  <th className="py-3 px-4 text-right">PO đang về</th>
                  <th className="py-3 px-4 text-right">Đủ bán (Ngày)</th>
                  <th className="py-3 px-4 text-right">Đề xuất nhập</th>
                  <th className="py-3 px-4">Mức độ</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {forecastItems.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-500">
                      Chưa có đủ dữ liệu bán hàng và tồn kho để tính dự báo.
                    </td>
                  </tr>
                ) : (
                  forecastItems.map((it) => (
                    <tr key={it.productSkuId} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{it.productName}</div>
                        <div className="text-[10px] font-mono text-cyan-400">{it.sku} • {it.brand}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">{it.soldQtyWindow}</td>
                      <td className="py-3 px-4 text-right font-mono text-cyan-300">{it.dailyRunRate}/ngày</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">{it.availableStock}</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-300">{it.incomingPoQty}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {it.daysOfCover >= 999 ? '999+' : `${it.daysOfCover} ngày`}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-400">
                        {it.recommendedOrderQty > 0 ? `+${it.recommendedOrderQty} máy` : 'Đủ hàng'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${URGENCY_BADGES[it.urgency] || ''}`}>
                          {it.urgency}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {it.recommendedOrderQty > 0 && (
                          <button
                            type="button"
                            onClick={() => handleCreatePoFromForecast([it])}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            Tạo PO
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;
