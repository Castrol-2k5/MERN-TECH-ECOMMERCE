export const SpecsTable = ({ attributes = {} }) => {
  const attributeLabels = {
    cpu: 'Vi xử lý (CPU)',
    ram: 'Bộ nhớ RAM',
    storage: 'Ổ cứng lưu trữ',
    screen_size: 'Màn hình hiển thị',
    vga: 'Card đồ họa (VGA)',
    connectivity: 'Cổng giao tiếp & Kết nối',
    battery: 'Dung lượng Pin',
    weight: 'Trọng lượng máy',
    os: 'Hệ điều hành',
    warranty: 'Thời gian bảo hành',
  };

  const entries = Object.entries(attributes);

  return (
    <div className="w-full rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-xs">
      <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200/80">
        <h3 className="font-bold text-slate-900 text-sm">Bảng thông số kỹ thuật chi tiết</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {entries.map(([key, value], idx) => (
          <div
            key={key}
            className={`grid grid-cols-1 sm:grid-cols-12 px-5 py-3 text-xs ${
              idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
            }`}
          >
            <span className="sm:col-span-4 font-bold text-slate-500">
              {attributeLabels[key] || key}
            </span>
            <span className="sm:col-span-8 font-semibold text-slate-900 mt-0.5 sm:mt-0">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecsTable;
