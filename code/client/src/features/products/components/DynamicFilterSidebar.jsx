import { Filter, RotateCcw } from 'lucide-react';

const ATTRIBUTE_LABEL_MAP = {
  cpu: 'Vi xử lý (CPU)',
  chip: 'Chip xử lý (SoC)',
  ram: 'Dung lượng RAM',
  storage: 'Ổ cứng / Bộ nhớ trong',
  vga: 'Card đồ họa (VGA)',
  gpu: 'Card đồ họa (GPU)',
  screen_size: 'Kích thước màn hình',
  screen: 'Màn hình',
  refresh_rate: 'Tần số quét',
  resolution: 'Độ phân giải',
  panel: 'Tấm nền màn hình',
  battery: 'Thời lượng Pin',
  os: 'Hệ điều hành',
  weight: 'Trọng lượng',
  connectivity: 'Kết nối',
  connection: 'Chuẩn kết nối',
  switch: 'Loại Switch',
  sensor: 'Cảm biến (Sensor)',
  warranty: 'Bảo hành',
};

const formatAttrLabel = (key) => {
  const clean = String(key || '').trim().toLowerCase();
  if (ATTRIBUTE_LABEL_MAP[clean]) return ATTRIBUTE_LABEL_MAP[clean];
  return clean
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const PRICE_RANGE_OPTIONS = [
  'Dưới 15 triệu',
  '15–25 triệu',
  '25–40 triệu',
  'Trên 40 triệu',
];

const FALLBACK_ATTR_GROUPS = [
  {
    key: 'cpu',
    options: [
      { value: 'Apple M4' },
      { value: 'Intel Core Ultra' },
      { value: 'AMD Ryzen 9' },
      { value: 'Intel Core i7' },
    ],
  },
  {
    key: 'ram',
    options: [{ value: '16GB' }, { value: '32GB' }],
  },
  {
    key: 'storage',
    options: [{ value: '256GB' }, { value: '512GB' }, { value: '1TB' }],
  },
  {
    key: 'vga',
    options: [{ value: 'RTX 5060' }, { value: 'RTX 4050' }, { value: 'GPU 10 lõi' }],
  },
];

export const DynamicFilterSidebar = ({
  selectedFilters = {},
  onFilterChange,
  onResetFilters,
  availableBrands = [],
  availableAttributes = [],
}) => {
  const attributeGroups =
    Array.isArray(availableAttributes) && availableAttributes.length > 0
      ? availableAttributes
      : FALLBACK_ATTR_GROUPS;

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
          <h3 className="font-bold text-slate-900 text-sm">Bộ lọc thông số</h3>
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
        {/* 1. Dynamic Brand Facets Section */}
        <div>
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2.5">
            Hãng sản xuất
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {availableBrands.length === 0 ? (
              <p className="text-xs text-slate-400 py-1 italic">Không có thương hiệu phù hợp</p>
            ) : (
              availableBrands.map((item) => {
                const brandName = typeof item === 'string' ? item : item.brand;
                const count = typeof item === 'object' && item.count !== undefined ? item.count : null;
                const isChecked = (selectedFilters.brand || []).includes(brandName);

                return (
                  <label
                    key={brandName}
                    className="flex items-center gap-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer py-0.5 select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCheckboxToggle('brand', brandName)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className={isChecked ? 'font-bold text-blue-600' : ''}>
                      {brandName} {count !== null ? `(${count})` : ''}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Price Range Filter Section */}
        <div className="pt-4">
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2.5">
            Khoảng giá
          </h4>
          <div className="space-y-1.5">
            {PRICE_RANGE_OPTIONS.map((opt) => {
              const isChecked = (selectedFilters.priceRange || []).includes(opt);
              return (
                <label
                  key={opt}
                  className="flex items-center gap-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer py-0.5 select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCheckboxToggle('priceRange', opt)}
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

        {/* 3. Dynamic Technical Attributes extracted from Category / DB */}
        {attributeGroups.map((group) => (
          <div key={group.key} className="pt-4">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2.5">
              {formatAttrLabel(group.key)}
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
              {(group.options || []).map((optItem) => {
                const optVal = typeof optItem === 'string' ? optItem : optItem.value;
                const optCount =
                  typeof optItem === 'object' && optItem.count !== undefined ? optItem.count : null;
                const isChecked = (selectedFilters[group.key] || []).includes(optVal);

                return (
                  <label
                    key={optVal}
                    className="flex items-center gap-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer py-0.5 select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCheckboxToggle(group.key, optVal)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                    <span className={`truncate ${isChecked ? 'font-bold text-blue-600' : ''}`} title={optVal}>
                      {optVal} {optCount !== null ? `(${optCount})` : ''}
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
