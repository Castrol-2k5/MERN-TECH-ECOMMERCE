import { Trophy } from 'lucide-react';

const TOP_PRODUCTS = [
  { rank: 1, name: 'MacBook Air 13 M4 16GB/256GB', sku: 'MBA-M4-16-256-SL', quantity: '286 máy', revenue: '7,58 tỷ', color: 'text-amber-400' },
  { rank: 2, name: 'Galaxy S26 Ultra 12GB/512GB', sku: 'SS-S26U-12-512', quantity: '174 máy', revenue: '5,56 tỷ', color: 'text-slate-300' },
  { rank: 3, name: 'ASUS ROG Zephyrus G14 R9', sku: 'ASG14-R9-32-1T', quantity: '82 máy', revenue: '4,06 tỷ', color: 'text-amber-600' },
  { rank: 4, name: 'Tai nghe Sony WH-1000XM6', sku: 'SNY-XM6-BLK', quantity: '318 chiếc', revenue: '2,54 tỷ', color: 'text-blue-400' },
  { rank: 5, name: 'Chuột Logitech MX Master 4', sku: 'LOG-MXM4-GR', quantity: '412 chiếc', revenue: '1,19 tỷ', color: 'text-cyan-400' }
];

export const TopProductsTable = ({ data }) => {
  const topProducts = data && data.length > 0 ? data : TOP_PRODUCTS;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-100">Top sản phẩm bán chạy nhất</h3>
          <p className="text-xs text-slate-400 mt-0.5">Xếp hạng theo tổng doanh thu thuần trong tháng</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <Trophy className="w-4 h-4" />
        </div>
      </div>

      <div className="divide-y divide-slate-800/60">
        {topProducts.map((prod) => (
          <div key={prod.rank} className="py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className={`w-5 text-center font-black font-mono text-sm ${prod.color}`}>
                #{prod.rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-200 truncate">{prod.name}</div>
                <div className="text-[11px] font-mono text-slate-400">{prod.sku}</div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="font-mono font-bold text-cyan-400">{prod.revenue}</div>
              <div className="text-[11px] text-slate-400 font-mono">{prod.quantity}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProductsTable;
