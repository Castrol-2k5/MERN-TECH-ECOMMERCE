export const Input = ({
  label,
  error,
  icon: Icon,
  rightElement,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 pointer-events-none text-slate-400 flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${Icon ? 'pl-10' : ''} ${rightElement ? 'pr-11' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300'} ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};

export default Input;
