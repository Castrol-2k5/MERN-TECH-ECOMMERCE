import { useState } from 'react';
import { ScanLine, Search, ShieldCheck, FileText, Phone } from 'lucide-react';

export const WarrantySearchBar = ({
  onSearchSerial,
  onSearchRma,
  initialSerial = '',
  isLoading = false
}) => {
  const [searchMode, setSearchMode] = useState('SERIAL'); // 'SERIAL' | 'RMA'
  const [serialInput, setSerialInput] = useState(initialSerial || 'C02ZQ0ABQ6L7');
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchMode === 'SERIAL') {
      if (serialInput.trim()) {
        onSearchSerial(serialInput.trim());
      }
    } else {
      if (ticketCodeInput.trim() && phoneInput.trim()) {
        onSearchRma(ticketCodeInput.trim(), phoneInput.trim());
      }
    }
  };

  return (
    <section className="bg-slate-900 text-white py-12 px-4 sm:px-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden my-6">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-3 border border-blue-400/30">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>TechOne Care • Trung Tâm Bảo Hành &amp; Dịch Vụ</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
          Tra Cứu Bảo Hành &amp; Tiến Độ Sửa Chữa
        </h1>

        <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed mb-6">
          Tra cứu thời hạn bảo hành điện tử chính hãng theo Serial hoặc theo dõi tiến độ phiếu sửa chữa (RMA) tại quầy theo thời gian thực.
        </p>

        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setSearchMode('SERIAL')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              searchMode === 'SERIAL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Theo Serial / IMEI</span>
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('RMA')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              searchMode === 'RMA'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Theo Phiếu Tiếp Nhận RMA</span>
          </button>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl bg-white p-2 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-slate-200"
        >
          {searchMode === 'SERIAL' ? (
            <div className="flex-1 flex items-center gap-3 px-3 w-full">
              <ScanLine className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                placeholder="Nhập mã Serial / IMEI (VD: C02ZQ0ABQ6L7)"
                className="w-full py-2.5 text-xs sm:text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-2 px-2 w-full">
              <div className="flex items-center gap-2 w-full sm:w-1/2 px-2 py-1 bg-slate-50 rounded-xl border border-slate-200">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={ticketCodeInput}
                  onChange={(e) => setTicketCodeInput(e.target.value)}
                  placeholder="Mã phiếu (VD: RMA-...)"
                  className="w-full py-1.5 text-xs text-slate-900 font-mono focus:outline-none bg-transparent"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-1/2 px-2 py-1 bg-slate-50 rounded-xl border border-slate-200">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Số điện thoại gửi máy"
                  className="w-full py-1.5 text-xs text-slate-900 font-mono focus:outline-none bg-transparent"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>{isLoading ? 'Đang tra cứu...' : 'TRA CỨU'}</span>
          </button>
        </form>

        {searchMode === 'SERIAL' && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span>Mã mẫu:</span>
            <button
              type="button"
              onClick={() => {
                setSerialInput('C02ZQ0ABQ6L7');
                onSearchSerial('C02ZQ0ABQ6L7');
              }}
              className="text-blue-400 font-mono font-bold hover:underline cursor-pointer"
            >
              C02ZQ0ABQ6L7
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setSerialInput('IP15-SOLD-VALID');
                onSearchSerial('IP15-SOLD-VALID');
              }}
              className="text-blue-400 font-mono font-bold hover:underline cursor-pointer"
            >
              IP15-SOLD-VALID
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default WarrantySearchBar;
