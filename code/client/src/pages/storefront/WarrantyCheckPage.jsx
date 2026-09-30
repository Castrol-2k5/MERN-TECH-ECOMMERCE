import { useState } from 'react';
import WarrantySearchBar from '../../features/warranty/components/WarrantySearchBar.jsx';
import WarrantyResultCard from '../../features/warranty/components/WarrantyResultCard.jsx';
import warrantyService, { fallbackWarrantyData } from '../../features/warranty/services/warrantyService.js';
import { HelpCircle } from 'lucide-react';

export const WarrantyCheckPage = () => {
  const [warrantyData, setWarrantyData] = useState(fallbackWarrantyData);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const handleSearch = async (serial) => {
    setIsLoading(true);
    setSearchError(null);
    try {
      const data = await warrantyService.verifySerial(serial);
      if (data) {
        setWarrantyData(data);
      } else {
        setSearchError('Không tìm thấy thông tin bảo hành cho mã này.');
      }
    } catch {
      setWarrantyData(fallbackWarrantyData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-4">
      {/* 1. Large Hero Search Bar (Figma #21:28103) */}
      <WarrantySearchBar
        onSearch={handleSearch}
        initialValue="C02ZQ0ABQ6L7"
        isLoading={isLoading}
      />

      {searchError && (
        <div className="my-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
          {searchError}
        </div>
      )}

      {/* 2. Warranty Result Display Card (Figma #21:28116) */}
      <WarrantyResultCard data={warrantyData} />

      {/* 3. FAQ / Help Guide Section */}
      <section className="my-14 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-base">Hướng dẫn tra cứu mã Serial / IMEI</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-1.5">Với các dòng máy Apple (MacBook, iPhone)</h4>
            <p>
              Vào <strong>Cài đặt (Settings) ➔ Cài đặt chung (General) ➔ Giới thiệu (About)</strong> để xem Serial. Hoặc kiểm tra ở mặt đáy thân máy MacBook.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-1.5">Với các dòng Laptop Windows (ASUS, Dell, Lenovo)</h4>
            <p>
              Xem tem nhãn dán ở đáy máy ghi <strong>S/N (Serial Number)</strong> hoặc <strong>Service Tag</strong> (với máy Dell).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-1.5">Tra cứu qua Hóa đơn điện tử</h4>
            <p>
              Mã Serial/IMEI được in trực tiếp trên hóa đơn VAT hoặc tin nhắn kích hoạt e-Warranty gửi về SĐT khi mua tại TechOne.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WarrantyCheckPage;
