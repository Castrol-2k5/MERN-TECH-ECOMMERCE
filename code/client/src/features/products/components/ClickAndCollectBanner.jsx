import { useState } from 'react';
import { Store, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ClickAndCollectBanner = () => {
  const [keyword, setKeyword] = useState('');
  const [searchFeedback, setSearchFeedback] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      setSearchFeedback(`Hệ thống tìm thấy 3 cửa hàng TechOne gần khu vực "${keyword.trim()}". Đang giữ máy.`);
    }
  };

  return (
    <section className="my-14 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 lg:p-12 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-white w-fit">
            <Store className="w-3.5 h-3.5" /> Click & Collect
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            Đặt online, nhận tại cửa hàng chỉ sau 30 phút.
          </h2>

          <p className="text-blue-100 text-sm leading-relaxed max-w-xl">
            Kiểm tra tồn kho thời gian thực trên toàn chuỗi 48 showroom TechOne.
            Giữ hàng miễn phí, mở hộp kiểm tra kỹ thuật trực tiếp trước khi thanh toán.
          </p>

          <form onSubmit={handleSearch} className="mt-2 flex flex-col sm:flex-row gap-2 max-w-lg">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập quận/huyện (VD: Quận 1, Thủ Đức, Quận 5...)"
              className="flex-1 px-4 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <span>Tìm chi nhánh</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {searchFeedback && (
            <div className="flex items-center gap-2 text-xs font-medium text-amber-200 mt-1">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{searchFeedback}</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 max-w-sm w-full">
            <img
              src="https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=700&q=80"
              alt="TechOne Store Experience"
              className="w-full h-56 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-xs font-semibold text-white">Showroom TechOne Flagship Q.1</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClickAndCollectBanner;
