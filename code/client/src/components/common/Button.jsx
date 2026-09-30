export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white shadow-sm border border-transparent active:bg-blue-800',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 active:bg-slate-300',
    outline:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 active:bg-slate-100',
    outlinePrimary:
      'bg-white hover:bg-blue-50 text-blue-600 border border-blue-600 active:bg-blue-100',
    dark:
      'bg-slate-900 hover:bg-slate-800 text-white shadow-sm border border-transparent active:bg-black',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-700 border border-transparent active:bg-slate-200',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-transparent active:bg-red-800',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 font-medium',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2 font-semibold',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5 font-semibold',
    icon: 'p-2 rounded-xl',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
