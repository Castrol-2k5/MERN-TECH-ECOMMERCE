export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
    xl: 'w-14 h-14 border-4',
  };

  return (
    <div
      className={`animate-spin rounded-full border-blue-600 border-t-transparent ${sizeMap[size] || sizeMap.md} ${className}`}
      role="status"
    >
      <span className="sr-only">Đang tải...</span>
    </div>
  );
};

export default Spinner;
