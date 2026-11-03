export const SkuVariantSelector = ({
  options = [],
  selectedOptions = {},
  skus = [],
  onSelectOption,
}) => {
  const colorDots = {
    Bạc: 'bg-slate-300',
    'Xanh đêm': 'bg-slate-800',
    'Ánh sao': 'bg-amber-100 border border-amber-300',
    'Xám Platinum': 'bg-slate-400',
    'Trắng Eclipse': 'bg-white border border-slate-300',
    'Tidal Teal': 'bg-teal-700',
  };

  return (
    <div className="space-y-4 my-4">
      {options.map((opt) => (
        <div key={opt.name} className="flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-800">
            {opt.name}: <span className="text-blue-600 font-semibold">{selectedOptions[opt.name] || opt.values[0]}</span>
          </span>
          <div className="flex flex-wrap gap-2.5">
            {opt.values.map((val) => {
              const isSelected = (selectedOptions[opt.name] || opt.values[0]) === val;
              const dotClass = colorDots[val];

              // Kiểm tra xem giá trị này có tồn tại trong bất kỳ SKU khả thi nào với các tùy chọn đã chọn khác không
              const isAvailableWithSelection = skus.length === 0 || skus.some((s) => {
                if (!s.options) return false;
                if (s.options[opt.name] !== val) return false;
                return Object.entries(selectedOptions).every(([k, v]) => {
                  if (k === opt.name) return true;
                  return s.options[k] === v;
                });
              });

              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => onSelectOption(opt.name, val)}
                  title={!isAvailableWithSelection ? 'Tổ hợp tùy chọn này hiện không có sẵn' : ''}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? isAvailableWithSelection
                        ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-xs'
                        : 'border-amber-500 bg-amber-50 text-amber-700 shadow-xs ring-1 ring-amber-400'
                      : !isAvailableWithSelection
                      ? 'border-dashed border-slate-300 bg-slate-50 text-slate-400 opacity-60 hover:opacity-100 hover:border-slate-400'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {dotClass && (
                    <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${dotClass}`} />
                  )}
                  <span>{val}</span>
                  {!isAvailableWithSelection && !isSelected && (
                    <span className="text-[10px] text-slate-400 font-normal italic">(Không có)</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkuVariantSelector;
