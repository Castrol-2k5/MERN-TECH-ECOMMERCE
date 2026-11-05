import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Store 
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
import { isMockEnabled } from '../../config/dataMode.js';

export const AdminAnalyticsPage = () => {
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branches, setBranches] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(() =>
    isMockEnabled() ? fallbackAnalyticsOverview : emptyAnalyticsOverview
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleExportReport = () => {
    const perfRows = analyticsData.branchPerformance || [];
    const headers = ['Xếp hạng', 'Chi nhánh', 'Doanh thu thuần', 'Đơn hàng', 'AOV', 'Tỷ lệ hoàn', 'Tăng trưởng'];
    const rows = perfRows.map((r) => [
      `"${r.rank}"`,
      `"${String(r.branch || '').replace(/"/g, '""')}"`,
      `"${r.revenue}"`,
      `"${r.orders}"`,
      `"${r.aov}"`,
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
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await analyticsService.getOverview({ branchId: selectedBranch });
        if (!ignore) {
          setAnalyticsData(data);
        }
      } catch {
        if (!ignore) {
          setAnalyticsData(isMockEnabled() ? fallbackAnalyticsOverview : emptyAnalyticsOverview);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [selectedBranch]);

  return (
    <div className="space-y-5 select-none font-sans text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Phân Tích Kinh Doanh • Business Intelligence</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
            <h1 className="text-xl font-black text-slate-100 tracking-tight">
              Báo Cáo Doanh Thu Đa Kênh &amp; Hiệu Quả Chuỗi
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
            Dữ liệu cập nhật thời gian thực • Đối soát doanh thu Web POS quầy và Storefront B2C trực tuyến
          </p>
        </div>

        {/* Export action */}
        <button
          type="button"
          onClick={handleExportReport}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-blue-600/20 cursor-pointer w-fit"
          title="Xuất báo cáo hiệu quả chuỗi dạng CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Xuất Báo Cáo CSV</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

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
            <option value="ALL" className="bg-slate-900">Chi nhánh: Toàn chuỗi ({branches.length > 0 ? `${branches.length} điểm` : 'Tất cả'})</option>
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

      {/* 4 KPI Metrics Cards */}
      <KpiMetricsGrid data={analyticsData.kpis} />

      {/* Charts Row: Revenue Over Time (60%) + Branch Breakdown (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8">
          <RevenueChart data={analyticsData.revenueOverTime} />
        </div>
        <div className="lg:col-span-4">
          <BranchSalesBreakdown data={analyticsData.branchSales} />
        </div>
      </div>

      {/* Second Row: Channel Donut Pie (40%) + Top Products (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5">
          <ChannelBreakdownPie data={analyticsData.channelData} />
        </div>
        <div className="lg:col-span-7">
          <TopProductsTable data={analyticsData.topProducts} />
        </div>
      </div>

      {/* Branch Performance Detail Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60">
          <h3 className="font-bold text-sm text-slate-100">Bảng đối soát hiệu quả chi nhánh vật lý</h3>
          <p className="text-xs text-slate-400 mt-0.5">Thống kê chi tiết doanh thu, đơn hàng, giá trị đơn và tỷ lệ tăng trưởng</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-16 text-center">Xếp hạng</th>
                <th className="py-3 px-4">Chi nhánh</th>
                <th className="py-3 px-4 text-right">Doanh thu thuần</th>
                <th className="py-3 px-4 text-center">Đơn hàng</th>
                <th className="py-3 px-4 text-right">AOV (Giá trị TB)</th>
                <th className="py-3 px-4 text-center">Tỷ lệ hoàn</th>
                <th className="py-3 px-4 text-right">Tăng trưởng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {(analyticsData.branchPerformance || []).length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-500">
                    Chưa có dữ liệu đơn hàng phát sinh trong khoảng thời gian đã chọn.
                  </td>
                </tr>
              ) : (
                (analyticsData.branchPerformance || []).map((row) => (
                  <tr key={row.rank} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3 px-4 text-center font-mono font-bold text-cyan-400">
                      {row.rank}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {row.branch}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      {row.revenue}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-300">
                      {row.orders}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-cyan-400">
                      {row.aov}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      {row.returnRate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {row.growth}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
