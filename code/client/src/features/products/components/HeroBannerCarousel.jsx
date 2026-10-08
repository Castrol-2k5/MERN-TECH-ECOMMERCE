import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export const HeroBannerCarousel = () => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white my-6 shadow-2xl border border-slate-800">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        <div className="lg:col-span-7 flex flex-col items-start gap-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Tech Fest 2026 • Giảm đến 40%</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
            Nâng cấp công nghệ. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Bứt phá mọi giới hạn.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
            Laptop AI thế hệ mới, smartphone flagship và phụ kiện cao cấp với ưu đãi độc quyền.
            Kiểm tra tồn kho thời gian thực và nhận hàng trong 2 giờ tại showroom gần bạn.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/category/laptop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:gap-3 cursor-pointer"
            >
              <span>Khám phá ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/category/laptop"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              <span>Xem bảng deal hot</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 text-xs font-medium text-slate-400 border-t border-slate-800/80 w-full">
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Chính hãng 100%
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Zap className="w-4 h-4 text-amber-400" /> Trả góp 0% lãi suất
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> Click & Collect 30 phút
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative flex items-center justify-center">
          <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center p-6">
            <img
              src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"
              alt="MacBook Air M4 Showcase"
              className="w-full h-full object-contain filter drop-shadow-2xl hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/70 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">Highlight Sản Phẩm</p>
                <p className="text-sm font-bold text-white">MacBook Air 13 M4 (2026)</p>
              </div>
              <span className="text-sm font-black text-emerald-400">26.490.000đ</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBannerCarousel;
