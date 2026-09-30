import { Layers, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const BranchStockKpiCards = ({ items = [] }) => {
  const totalSku = items.length;
  const totalAvailable = items.reduce((sum, it) => sum + (it.quantityAvailable || 0), 0);
  const lowStockCount = items.filter(
    (it) => it.quantityAvailable > 0 && it.quantityAvailable <= it.lowStockThreshold
  ).length;
  const outOfStockCount = items.filter((it) => it.quantityAvailable <= 0).length;

  const kpis = [
    {
      title: 'TỔNG MẶT HÀNG (SKU)',
      value: totalSku,
      subtitle: 'Chi nhánh Q1 - Trần Quang Khải',
      icon: Layers,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'TỒN KHO KHẢ DỤNG',
      value: totalAvailable.toLocaleString('vi-VN'),
      subtitle: 'Sẵn sàng xuất bán tại quầy & online',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'SẮP HẾT HÀNG (LOW STOCK)',
      value: lowStockCount,
      subtitle: 'Cần đề xuất nhập kho bổ sung',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    },
    {
      title: 'ĐÃ HẾT HÀNG (OUT OF STOCK)',
      value: outOfStockCount,
      subtitle: 'Tồn khả dụng = 0 tại quầy',
      icon: XCircle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-2xl bg-slate-900 border ${kpi.borderColor} transition-all hover:bg-slate-850 shadow-lg shadow-black/20`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                {kpi.title}
              </span>
              <div className={`w-8 h-8 rounded-xl ${kpi.bgColor} ${kpi.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight ${kpi.color}`}>
              {kpi.value}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              {kpi.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default BranchStockKpiCards;
