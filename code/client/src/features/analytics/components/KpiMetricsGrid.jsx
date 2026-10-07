import { Wallet, ShoppingBag, Receipt, TrendingUp } from 'lucide-react';

export const KpiMetricsGrid = ({ data }) => {
  const kpis = [
    {
      title: 'Doanh thu thuần',
      value: data?.totalRevenue || '18,42 tỷ',
      change: '↑ 18,6% so với kỳ trước',
      changeType: 'positive',
      icon: Wallet,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Đơn hàng thành công',
      value: data?.totalOrders || '4.862',
      change: '↑ 12,4% • 187 đơn/ngày',
      changeType: 'positive',
      icon: ShoppingBag,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      title: 'Giá trị đơn TB (AOV)',
      value: data?.avgOrderValue || '3,79 triệu',
      change: '↑ 5,5% giá trị trung bình',
      changeType: 'positive',
      icon: Receipt,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10'
    },
    {
      title: 'Tốc độ tăng trưởng',
      value: data?.growth || '+18,6%',
      change: 'Vượt mục tiêu quý 6,6 điểm',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-slate-100">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all hover:bg-slate-850 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className={`w-8 h-8 rounded-xl ${kpi.bgColor} ${kpi.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight ${kpi.color}`}>
              {kpi.value}
            </div>
            <p className="text-[11px] text-emerald-400 font-semibold mt-1">
              {kpi.change}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default KpiMetricsGrid;
