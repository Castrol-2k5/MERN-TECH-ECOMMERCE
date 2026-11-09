import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export const DataTablePagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  variant = 'dark', // 'dark' (portal) | 'light' (storefront)
  itemName = 'bản ghi'
}) => {
  if (totalItems === 0 && totalPages <= 1) return null;

  const isDark = variant === 'dark';

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  const containerClasses = isDark
    ? 'bg-slate-900 border-t border-slate-800 text-slate-300'
    : 'bg-white border-t border-slate-100 text-slate-600';

  const btnBase = isDark
    ? 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-950 disabled:hover:text-slate-300'
    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700';

  const activeBtnClass = isDark
    ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-xs'
    : 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs';

  return (
    <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs select-none ${containerClasses}`}>
      {/* Left: Records summary & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Hiển thị <strong className={isDark ? 'text-white' : 'text-slate-900'}>{startItem}</strong> –{' '}
          <strong className={isDark ? 'text-white' : 'text-slate-900'}>{endItem}</strong> trong tổng số{' '}
          <strong className={isDark ? 'text-blue-400' : 'text-blue-600'}>{totalItems}</strong> {itemName}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700/50">
            <span className="text-[11px] opacity-70">Số dòng:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                if (onPageChange) onPageChange(1); // Reset to page 1
              }}
              className={`px-2 py-1 rounded-lg border text-xs font-semibold focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-200 hover:border-slate-600'
                  : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
              }`}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className={isDark ? 'bg-slate-900' : 'bg-white'}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Buttons */}
      <div className="flex items-center gap-1 self-center sm:self-auto">
        {/* First Page */}
        <button
          type="button"
          onClick={() => currentPage > 1 && onPageChange(1)}
          disabled={currentPage <= 1}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${btnBase}`}
          title="Trang đầu"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${btnBase}`}
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 h-8 flex items-center justify-center text-slate-500 font-bold"
                >
                  …
                </span>
              );
            }
            const isActive = p === currentPage;
            return (
              <button
                key={`page-btn-${p}`}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg border text-xs transition-all cursor-pointer ${
                  isActive ? activeBtnClass : btnBase
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${btnBase}`}
          title="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => currentPage < totalPages && onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${btnBase}`}
          title="Trang cuối"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DataTablePagination;
