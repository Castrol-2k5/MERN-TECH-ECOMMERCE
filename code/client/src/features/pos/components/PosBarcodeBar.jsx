import { useState } from 'react';
import { ScanBarcode, Search, X } from 'lucide-react';

const CATEGORIES = ['TẤT CẢ', 'Điện thoại', 'Laptop', 'Phụ kiện', 'Máy tính bảng'];

export const PosBarcodeBar = ({
  inputRef,
  onScan,
  onSearch,
  selectedCategory,
  onSelectCategory,
  isScanning = false
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) return;
    onScan(query);
    setInputValue('');
  };

  const handleClear = () => {
    setInputValue('');
    onSearch('');
    inputRef?.current?.focus();
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onSearch(val);
  };

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 p-3 space-y-2.5">
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <ScanBarcode className={`w-5 h-5 ${isScanning ? 'text-blue-400 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Quét mã vạch 1D/2D, Serial, IMEI hoặc nhập tên sản phẩm, SKU... [F2]"
            className="w-full pl-11 pr-24 py-2.5 bg-slate-950 border-2 border-slate-700 focus:border-blue-500 rounded-xl text-slate-100 placeholder-slate-500 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
            autoComplete="off"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1.5">
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-800 rounded border border-slate-700">
              F2
            </kbd>
          </div>
        </div>

        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Tìm / Quét</span>
        </button>
      </form>

      {/* Quick Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-xs font-semibold text-slate-400 shrink-0">Danh mục:</span>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PosBarcodeBar;
