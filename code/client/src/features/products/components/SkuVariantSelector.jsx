export const SkuVariantSelector = ({
  options = [],
  selectedOptions = {},
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

              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => onSelectOption(opt.name, val)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {dotClass && (
                    <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${dotClass}`} />
                  )}
                  <span>{val}</span>
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
