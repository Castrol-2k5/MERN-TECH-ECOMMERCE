import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

const CHART_DATA = [
  { day: '01/09', online: 320, pos: 180, total: 500 },
  { day: '02/09', online: 450, pos: 280, total: 730 },
  { day: '03/09', online: 380, pos: 220, total: 600 },
  { day: '04/09', online: 580, pos: 350, total: 930 },
  { day: '05/09', online: 510, pos: 310, total: 820 },
  { day: '06/09', online: 680, pos: 420, total: 1100 },
  { day: '07/09', online: 620, pos: 390, total: 1010 },
  { day: '08/09', online: 780, pos: 490, total: 1270 },
  { day: '09/09', online: 660, pos: 410, total: 1070 },
  { day: '10/09', online: 880, pos: 550, total: 1430 },
  { day: '11/09', online: 830, pos: 520, total: 1350 },
  { day: '12/09', online: 980, pos: 610, total: 1590 }
];

export const RevenueChart = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-100">Doanh thu theo thời gian</h3>
          <p className="text-xs text-slate-400">Triệu đồng • Phân tách giữa kênh Online B2C &amp; Web POS tại quầy</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span className="text-slate-300">B2C Online (62%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-slate-300">Web POS (38%)</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Tổng 18,42 tỷ
          </span>
        </div>
      </div>

      {/* Recharts BarChart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '11px',
                color: '#f8fafc'
              }}
              formatter={(value, name) => [
                `${value} triệu đ`,
                name === 'online' ? 'Online B2C' : 'Web POS'
              ]}
            />
            <Bar dataKey="online" fill="#2563eb" radius={[4, 4, 0, 0]} stackId="a" />
            <Bar dataKey="pos" fill="#06b6d4" radius={[4, 4, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
