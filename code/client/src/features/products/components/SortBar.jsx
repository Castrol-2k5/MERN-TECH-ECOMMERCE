import { LayoutGrid, List } from 'lucide-react';

export const SortBar = ({
  currentSort = 'popular',
  onSortChange,
  viewMode = 'grid',
  onViewModeChange,
  totalResults = 0,
}) => {
  const sortOptions = [
    { key: 'popular', label: 'Bán chạy' },
    { key: 'newest', label: 'Mới nhất' },
    { key: 'price_asc', label: 'Giá thấp → cao' },
    { key: 'price_desc', label: 'Giá cao → thấp' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:px-4 flex flex-wrap items-center justify-between gap-3 shadow-xs mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 mr-1">Sắp xếp theo:</span>
        {sortOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onSortChange(opt.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentSort === opt.key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 font-medium">
          <strong className="text-slate-700 font-bold">{totalResults}</strong> kết quả phù hợp
        </span>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Dạng lưới"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Dạng danh sách"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SortBar;
