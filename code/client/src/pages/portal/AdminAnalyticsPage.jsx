import { useState } from 'react';
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

const BRANCH_PERFORMANCE = [
  { rank: '01', branch: 'TechOne Q1 • Nguyễn Thị Minh Khai', revenue: '4,28 tỷ', orders: '1.042', aov: '4,11 triệu', returnRate: '1,8%', growth: '+22,4%' },
  { rank: '02', branch: 'TechOne Thủ Đức • Võ Văn Ngân', revenue: '3,62 tỷ', orders: '968', aov: '3,74 triệu', returnRate: '2,1%', growth: '+18,2%' },
  { rank: '03', branch: 'TechOne Q5 • Trần Hưng Đạo', revenue: '2,94 tỷ', orders: '842', aov: '3,49 triệu', returnRate: '2,4%', growth: '+15,7%' },
  { rank: '04', branch: 'TechOne Q3 • CMT8', revenue: '2,36 tỷ', orders: '710', aov: '3,32 triệu', returnRate: '2,6%', growth: '+12,0%' }
];

export const AdminAnalyticsPage = () => {
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [dateRange, setDateRange] = useState('01/09/2026 — 30/09/2026');

  return (
    <div className="space-y-5 select-none font-sans text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Phân Tích Kinh Doanh • Business Intelligence</span>
          </div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight">
            Báo Cáo Doanh Thu Đa Kênh &amp; Hiệu Quả Chuỗi
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu cập nhật thời gian thực • Đối soát doanh thu Web POS quầy và Storefront B2C trực tuyến
          </p>
        </div>

        {/* Export action */}
        <button
          type="button"
          onClick={() => alert('Đang xuất báo cáo tài chính doanh thu đa kênh (Excel/PDF)...')}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer w-fit"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Xuất Báo Cáo Doanh Thu</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-2.5 text-xs">
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-transparent text-slate-200 text-xs focus:outline-none w-48 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700">
          <Store className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900">Chi nhánh: Toàn chuỗi (48 điểm)</option>
            <option value="Q1" className="bg-slate-900">Chi nhánh: Q1 • 138 Trần Quang Khải</option>
            <option value="TD" className="bg-slate-900">Chi nhánh: Thủ Đức • 214 Võ Văn Ngân</option>
            <option value="Q5" className="bg-slate-900">Chi nhánh: Q5 • 382 Trần Hưng Đạo</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => alert('Đã áp dụng bộ lọc dữ liệu kỳ báo cáo!')}
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          Áp dụng
        </button>
      </div>

      {/* 4 KPI Metrics Cards */}
      <KpiMetricsGrid />

      {/* Charts Row: Revenue Over Time (60%) + Branch Breakdown (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8">
          <RevenueChart />
        </div>
        <div className="lg:col-span-4">
          <BranchSalesBreakdown />
        </div>
      </div>

      {/* Second Row: Channel Donut Pie (40%) + Top Products (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5">
          <ChannelBreakdownPie />
        </div>
        <div className="lg:col-span-7">
          <TopProductsTable />
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
              {BRANCH_PERFORMANCE.map((row) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
