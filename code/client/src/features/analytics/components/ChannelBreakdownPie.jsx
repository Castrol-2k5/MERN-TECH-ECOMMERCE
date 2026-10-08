import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHANNEL_DATA = [
  { name: 'B2C Web Online', value: 62, revenue: '11,42 tỷ', color: '#2563EB' },
  { name: 'Web POS Quầy', value: 38, revenue: '7,00 tỷ', color: '#06B6D4' }
];

export const ChannelBreakdownPie = ({ data }) => {
  const channelData = data && data.length > 0 ? data : CHANNEL_DATA;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-slate-100">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="font-bold text-sm text-slate-100">Cơ cấu kênh bán hàng</h3>
        <p className="text-xs text-slate-400 mt-0.5">Tỷ trọng doanh thu giữa Online và Offline quầy</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut Chart */}
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={channelData}
                innerRadius={32}
                outerRadius={52}
                paddingAngle={4}
                dataKey="value"
              >
                {channelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5 text-xs">
          {channelData.map((ch) => (
            <div key={ch.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ch.color }}></span>
                <span className="font-medium text-slate-200">{ch.name}</span>
              </div>
              <div className="text-right font-mono font-bold" style={{ color: ch.color }}>
                {ch.value}% • {ch.revenue}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 leading-snug">
            Kênh trực tuyến tăng trưởng mạnh nhờ chương trình giao hàng hỏa tốc 2 giờ.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChannelBreakdownPie;
