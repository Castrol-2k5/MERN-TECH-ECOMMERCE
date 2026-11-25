import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check } from 'lucide-react';

export const BrandCombobox = ({
  brands = [],
  value = '',
  onChange,
  placeholder = 'Chọn hoặc nhập tên thương hiệu...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const uniqueBrands = useMemo(() => {
    const map = new Map();
    brands.forEach((b) => {
      const clean = String(b || '').trim();
      if (clean && !map.has(clean.toLowerCase())) {
        map.set(clean.toLowerCase(), clean);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [brands]);

  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return uniqueBrands;
    return uniqueBrands.filter((b) => b.toLowerCase().includes(q));
  }, [uniqueBrands, search]);

  const exactMatchExists = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? uniqueBrands.some((b) => b.toLowerCase() === q) : true;
  }, [uniqueBrands, search]);

  const handleSelect = (brandName) => {
    onChange?.(brandName);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={isOpen ? search : value}
          onFocus={() => {
            setSearch(value || '');
            setIsOpen(true);
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange?.(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-8 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-semibold"
        />
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 max-h-52 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1">
          {filteredBrands.map((b) => {
            const isSelected = value?.toLowerCase() === b.toLowerCase();
            return (
              <button
                key={b}
                type="button"
                onClick={() => handleSelect(b)}
                className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between hover:bg-slate-800 cursor-pointer ${
                  isSelected ? 'text-blue-400 font-bold bg-blue-600/10' : 'text-slate-200'
                }`}
              >
                <span>{b}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            );
          })}

          {search.trim() && !exactMatchExists && (
            <button
              type="button"
              onClick={() => handleSelect(search.trim())}
              className="w-full px-3 py-2 text-xs text-left flex items-center gap-1.5 text-emerald-400 hover:bg-emerald-500/10 font-bold border-t border-slate-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sử dụng thương hiệu mới: &quot;{search.trim()}&quot;</span>
            </button>
          )}

          {filteredBrands.length === 0 && !search.trim() && (
            <div className="px-3 py-3 text-center text-xs text-slate-500">
              Nhập tên thương hiệu mới để thêm...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandCombobox;
