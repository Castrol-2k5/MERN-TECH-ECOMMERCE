import { useState, useEffect } from 'react';
import { 
  Store, 
  User, 
  Printer, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Wifi, 
  ShoppingBag
} from 'lucide-react';

export const PosHeader = ({ activeCartCount = 0 }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 flex items-center justify-between select-none">
      {/* Brand & Branch Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/30 text-white">
            T
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base text-white">TECHONE POS</span>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Store className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium text-slate-300">TechOne Q1 - 138 Trần Quang Khải</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Quầy #01</span>
            </div>
          </div>
        </div>

        {/* Ca trực & Thu ngân */}
        <div className="hidden lg:flex items-center gap-4 pl-4 border-l border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">Nguyễn Văn Thu Ngân</p>
              <p className="text-[11px] text-slate-400">Ca sáng (08:00 - 16:00)</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700/50">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono text-slate-200">{currentTime.toLocaleTimeString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* POS Quick Shortcuts Guide */}
      <div className="hidden xl:flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Phím tắt:</span>
        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-[11px]"><strong className="text-blue-400">F2</strong> Quét mã</span>
        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-[11px]"><strong className="text-blue-400">F4</strong> Khách hàng</span>
        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-[11px]"><strong className="text-blue-400">F8</strong> Giảm giá</span>
        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-[11px]"><strong className="text-blue-400">F9</strong> Thanh toán</span>
      </div>

      {/* Control Actions & Status */}
      <div className="flex items-center gap-2">
        {/* Máy in nhiệt K80 Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-md border border-slate-700/60 text-xs">
          <Printer className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300 font-medium">In K80:</span>
          <span className="text-emerald-400 font-semibold">Sẵn sàng</span>
        </div>

        {/* Active Cart Counter badge */}
        <div className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <ShoppingBag className="w-5 h-5" />
          {activeCartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-slate-900">
              {activeCartCount}
            </span>
          )}
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          title="Toàn màn hình quầy thu ngân"
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Network status */}
        <div className="p-2 text-emerald-400" title="Mạng nội bộ ổn định">
          <Wifi className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};

export default PosHeader;
