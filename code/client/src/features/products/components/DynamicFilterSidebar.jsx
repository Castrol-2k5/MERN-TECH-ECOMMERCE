import { Filter, RotateCcw } from 'lucide-react';

export const DynamicFilterSidebar = ({
  selectedFilters = {},
  onFilterChange,
  onResetFilters,
}) => {
  const filterGroups = [
    {
      key: 'brand',
      label: 'Hãng sản xuất',
      options: ['Apple', 'ASUS', 'Lenovo', 'Dell', 'Acer', 'HP'],
    },
    {
      key: 'priceRange',
      label: 'Khoảng giá',
      options: ['Dưới 20 triệu', '20–30 triệu', '30–45 triệu', 'Trên 45 triệu'],
    },
    {
      key: 'cpu',
      label: 'Vi xử lý (CPU)',
      options: ['Apple M Series', 'Intel Core Ultra', 'AMD Ryzen 7/9', 'Intel Core i7/i9'],
    },
    {
      key: 'ram',
      label: 'Dung lượng RAM',
      options: ['16GB', '32GB', '64GB'],
    },
    {
      key: 'vga',
      label: 'Card đồ họa (VGA)',
      options: ['RTX 5060/5070', 'RTX 4050', 'Card đồ họa tích hợp'],
    },
    {
      key: 'screenSize',
      label: 'Màn hình',
      options: ['13–14 inch', '15–16 inch', 'Màn hình OLED'],
    },
    {
      key: 'stockStatus',
      label: 'Tình trạng tồn kho',
      options: ['Còn hàng tại showroom', 'Sẵn hàng giao 2h'],
    },
  ];

  const handleCheckboxToggle = (groupKey, value) => {
    const currentList = selectedFilters[groupKey] || [];
    const exists = currentList.includes(value);
    const updated = exists
      ? currentList.filter((item) => item !== value)
      : [...currentList, value];

    onFilterChange({
      ...selectedFilters,
      [groupKey]: updated,
    });
  };

  const totalActiveFilters = Object.values(selectedFilters).reduce(
    (count, arr) => count + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  return (
    <aside className="w-full lg:w-64 bg-white rounded-2xl border border-slate-200/80 p-5 shrink-0 h-fit sticky top-28 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-sm">Bộ lọc sản phẩm</h3>
          {totalActiveFilters > 0 && (
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center">
              {totalActiveFilters}
            </span>
          )}
        </div>
        {totalActiveFilters > 0 && (
          <button
            onClick={onResetFilters}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa tất cả</span>
          </button>
        )}
      </div>

      <div className="space-y-5 divide-y divide-slate-100">
        {filterGroups.map((group, idx) => (
          <div key={group.key} className={idx > 0 ? 'pt-4' : ''}>
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2.5">
              {group.label}
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
              {group.options.map((opt) => {
                const isChecked = (selectedFilters[group.key] || []).includes(opt);
                return (
                  <label
                    key={opt}
                    className="flex items-center gap-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer py-0.5 select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCheckboxToggle(group.key, opt)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className={isChecked ? 'font-bold text-blue-600' : ''}>
                      {opt}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default DynamicFilterSidebar;
