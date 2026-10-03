import { useState, useEffect } from 'react';
import { isMockEnabled, setMockEnabled, isDevOrTest } from '../../config/dataMode.js';
import { Database, Beaker, RefreshCw } from 'lucide-react';

export const DataModeToggle = () => {
  const [mockActive, setMockActive] = useState(isMockEnabled());

  useEffect(() => {
    const handleModeChange = (e) => {
      setMockActive(e.detail.isMock);
    };

    window.addEventListener('techone:datamode-change', handleModeChange);
    return () => {
      window.removeEventListener('techone:datamode-change', handleModeChange);
    };
  }, []);

  if (!isDevOrTest()) {
    return null;
  }

  const handleToggle = () => {
    const nextState = !mockActive;
    setMockEnabled(nextState);
    setMockActive(nextState);
    // Tự động reload lại trang để áp dụng nguồn dữ liệu mới tức thì
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center shadow-2xl rounded-full border p-1 bg-slate-900/90 backdrop-blur-md transition-all duration-200 hover:scale-105 select-none">
      <button
        onClick={handleToggle}
        title="Nhấn để chuyển đổi nguồn dữ liệu giữa Mock và Live Database (không cần restart Vite)"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          mockActive
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
        }`}
      >
        {mockActive ? (
          <>
            <Beaker className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>Nguồn: <strong>Mock Data</strong></span>
          </>
        ) : (
          <>
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nguồn: <strong>Live Database</strong></span>
          </>
        )}
        <span className="text-[10px] opacity-70 border-l border-slate-700 pl-1.5 flex items-center gap-1">
          <RefreshCw className="w-2.5 h-2.5" /> Đổi
        </span>
      </button>
    </div>
  );
};

export default DataModeToggle;
