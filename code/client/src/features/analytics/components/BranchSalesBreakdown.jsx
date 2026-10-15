import { Store } from 'lucide-react';

const BRANCH_SALES = [
  { name: 'TechOne Q1 • Trần Quang Khải', revenue: '4,28 tỷ', percentage: 100, color: 'bg-blue-600' },
  { name: 'TechOne Thủ Đức • Võ Văn Ngân', revenue: '3,62 tỷ', percentage: 84, color: 'bg-cyan-400' },
  { name: 'TechOne Q5 • Trần Hưng Đạo', revenue: '2,94 tỷ', percentage: 68, color: 'bg-purple-500' },
  { name: 'TechOne Q3 • CMT8', revenue: '2,36 tỷ', percentage: 55, color: 'bg-emerald-500' }
];

export const BranchSalesBreakdown = ({ data }) => {
  const branchSales = data && data.length > 0 ? data : BRANCH_SALES;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-slate-100">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="font-bold text-sm text-slate-100">So sánh doanh thu chi nhánh</h3>
        <p className="text-xs text-slate-400 mt-0.5">Xếp hạng tỷ trọng đóng góp của các điểm bán</p>
      </div>

      <div className="space-y-4 pt-1">
        {branchSales.map((b) => (
          <div key={b.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-500" />
                <span>{b.name}</span>
              </span>
              <span className="font-mono font-bold text-slate-100">{b.revenue}</span>
            </div>
            {/* Progress Bar Track */}
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full ${b.color} transition-all duration-500`}
                style={{ width: `${b.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BranchSalesBreakdown;
