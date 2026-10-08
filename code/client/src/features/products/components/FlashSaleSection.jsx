import { useState, useEffect } from 'react';
import { Zap, Clock } from 'lucide-react';
import ProductCard from './ProductCard.jsx';

export const FlashSaleSection = ({ products = [] }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 18,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num) => String(num).padStart(2, '0');

  const flashSaleItems = products.slice(0, 4);

  return (
    <section className="my-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-red-500/10 via-amber-500/10 to-orange-500/10 border border-orange-200/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md animate-pulse">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-xs font-black text-red-600 uppercase tracking-widest block">
              FLASH SALE HÔM NAY
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              Giá sốc — Số lượng có hạn
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-orange-200 shadow-xs">
          <Clock className="w-4 h-4 text-orange-600 shrink-0" />
          <span className="text-xs font-bold text-slate-600">Kết thúc sau:</span>
          <div className="flex items-center gap-1 font-mono font-black text-sm text-slate-900">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              {formatNumber(timeLeft.hours)}
            </span>
            <span className="text-slate-400">:</span>
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              {formatNumber(timeLeft.minutes)}
            </span>
            <span className="text-slate-400">:</span>
            <span className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center">
              {formatNumber(timeLeft.seconds)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {flashSaleItems.map((product) => (
          <ProductCard key={product._id || product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default FlashSaleSection;
