import { useState } from 'react';
import { ScanLine, Search, ShieldCheck } from 'lucide-react';

export const WarrantySearchBar = ({ onSearch, initialValue = '', isLoading = false }) => {
  const [serialInput, setSerialInput] = useState(initialValue || 'C02ZQ0ABQ6L7');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (serialInput.trim()) {
      onSearch(serialInput.trim());
    }
  };

  return (
    <section className="bg-slate-900 text-white py-14 px-4 sm:px-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden my-6">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-400/30">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>E-Warranty • Dữ liệu thời gian thực</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
          Tra cứu bảo hành thiết bị TechOne
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed mb-8">
          Nhập mã Serial / IMEI hoặc số điện thoại mua hàng để xem thời hạn và lịch sử bảo hành điện tử chính hãng.
        </p>

        {/* Large Search Box */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl bg-white p-2 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-slate-200"
        >
          <div className="flex-1 flex items-center gap-3 px-3 w-full">
            <ScanLine className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
              placeholder="Nhập mã Serial / IMEI (VD: C02ZQ0ABQ6L7)"
              className="w-full py-2.5 text-sm sm:text-base text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>{isLoading ? 'Đang tra cứu...' : 'TRA CỨU'}</span>
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span>Gợi ý Serial mẫu để kiểm tra:</span>
          <button
            type="button"
            onClick={() => {
              setSerialInput('C02ZQ0ABQ6L7');
              onSearch('C02ZQ0ABQ6L7');
            }}
            className="text-blue-400 font-mono font-bold hover:underline cursor-pointer"
          >
            C02ZQ0ABQ6L7
          </button>
        </div>
      </div>
    </section>
  );
};

export default WarrantySearchBar;
