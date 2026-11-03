import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import WarrantySearchBar from '../../features/warranty/components/WarrantySearchBar.jsx';
import WarrantyResultCard from '../../features/warranty/components/WarrantyResultCard.jsx';
import warrantyService from '../../features/warranty/services/warrantyService.js';
import { HelpCircle, CheckCircle2 } from 'lucide-react';

export const WarrantyCheckPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSerial = searchParams.get('serial') || searchParams.get('sn') || '';
  const urlTicket = searchParams.get('ticket') || searchParams.get('rma') || '';
  const urlPhone = searchParams.get('phone') || '';

  const [warrantyData, setWarrantyData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const handleSearchSerial = useCallback(async (serial) => {
    if (!serial || !serial.trim()) return;
    const cleanSerial = serial.trim().toUpperCase();
    setIsLoading(true);
    setSearchError(null);
    setActionSuccess(null);

    setSearchParams({ serial: cleanSerial }, { replace: true });

    try {
      const data = await warrantyService.verifySerial(cleanSerial);
      if (data) {
        setWarrantyData(data);
      } else {
        setSearchError(`Không tìm thấy mã Serial/IMEI '${cleanSerial}' trong hệ thống bảo hành.`);
        setWarrantyData(null);
      }
    } catch (err) {
      setSearchError(
        err.response?.data?.message ||
          err.response?.data?.error?.message ||
          err.message ||
          `Không tìm thấy mã Serial/IMEI '${cleanSerial}' trong hệ thống bảo hành.`
      );
      setWarrantyData(null);
    } finally {
      setIsLoading(false);
    }
  }, [setSearchParams]);

  const handleSearchRma = useCallback(async (ticketCode, phone) => {
    if (!ticketCode || !phone) return;
    const cleanCode = ticketCode.trim().toUpperCase();
    const cleanPhone = phone.trim();
    setIsLoading(true);
    setSearchError(null);
    setActionSuccess(null);

    setSearchParams({ ticket: cleanCode, phone: cleanPhone }, { replace: true });

    try {
      const ticket = await warrantyService.trackTicketPublic(cleanCode, cleanPhone);
      if (ticket) {
        // Adapt single RMA ticket into warrantyData structure
        const formattedData = {
          serialNumber: ticket.serialNumber,
          productName: ticket.productId?.name || 'Thiết bị bảo hành',
          image: ticket.productId?.images?.[0] || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
          branchPurchased: ticket.branchId?.name || 'TechOne Store',
          customer: ticket.customerInfo || {},
          saleDate: ticket.createdAt,
          warrantyEndDate: ticket.estimatedReturnDate || ticket.createdAt,
          daysRemaining: 30,
          statusLabel: `PHIẾU RMA: ${ticket.status}`,
          history: [
            {
              id: ticket.ticketCode,
              ticketCode: ticket.ticketCode,
              title: `Phiếu bảo hành ${ticket.ticketCode}`,
              date: ticket.createdAt,
              description: ticket.issueDescription,
              status: ticket.status,
              branchName: ticket.branchId?.name || '',
              issueDescription: ticket.issueDescription,
              appearanceCondition: ticket.appearanceCondition,
              devicePassword: ticket.devicePassword,
              powerStatus: ticket.powerStatus,
              accessories: ticket.accessories,
              estimatedReturnDate: ticket.estimatedReturnDate,
              diagnosis: ticket.diagnosis,
              quotation: ticket.quotation,
              customerApproval: ticket.customerApproval,
              resolution: ticket.resolution,
              handover: ticket.handover
            }
          ]
        };
        setWarrantyData(formattedData);
      } else {
        setSearchError(`Không tìm thấy phiếu bảo hành '${cleanCode}'. Vui lòng kiểm tra lại mã và số điện thoại.`);
        setWarrantyData(null);
      }
    } catch (err) {
      setSearchError(
        err.response?.data?.message ||
          err.response?.data?.error?.message ||
          err.message ||
          `Không tìm thấy phiếu bảo hành '${cleanCode}'.`
      );
      setWarrantyData(null);
    } finally {
      setIsLoading(false);
    }
  }, [setSearchParams]);

  // Customer online approval / rejection
  const handleApproveQuotation = async (ticketCode, payload) => {
    try {
      await warrantyService.customerApprovePublic(ticketCode, payload);
      setActionSuccess(
        `✓ Đã ghi nhận quyết định của bạn (${
          payload.approved ? 'Đồng ý sửa chữa' : 'Từ chối sửa chữa & nhận lại máy'
        }). Kỹ thuật viên sẽ tiến hành xử lý ngay!`
      );
      // Re-fetch to refresh data
      if (warrantyData?.serialNumber) {
        handleSearchSerial(warrantyData.serialNumber);
      } else if (ticketCode && payload.phone) {
        handleSearchRma(ticketCode, payload.phone);
      }
    } catch (err) {
      alert(
        err.response?.data?.error?.message ||
          err.message ||
          'Không thể ghi nhận phản hồi. Vui lòng thử lại.'
      );
    }
  };

  // Auto trigger query if query params present
  useEffect(() => {
    if (urlSerial) {
      handleSearchSerial(urlSerial);
    } else if (urlTicket && urlPhone) {
      handleSearchRma(urlTicket, urlPhone);
    }
  }, [urlSerial, urlTicket, urlPhone, handleSearchSerial, handleSearchRma]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-4">
      {/* 1. Large Hero Search Bar with Serial & RMA Tabs */}
      <WarrantySearchBar
        onSearchSerial={handleSearchSerial}
        onSearchRma={handleSearchRma}
        initialSerial={urlSerial}
        isLoading={isLoading}
      />

      {searchError && (
        <div className="my-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center animate-in fade-in">
          {searchError}
        </div>
      )}

      {actionSuccess && (
        <div className="my-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2. Interactive Warranty Result Display Card */}
      <WarrantyResultCard
        data={warrantyData}
        onApproveQuotation={handleApproveQuotation}
      />

      {/* 3. FAQ / Help Guide Section */}
      <section className="my-14 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-base">Hướng dẫn quy trình bảo hành TechOne Care</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-1.5">1. Tiếp nhận &amp; Lập biên bản</h4>
            <p>
              Khách hàng mang thiết bị tới bất kỳ chi nhánh TechOne nào. Nhân viên kỹ thuật sẽ kiểm tra ngoại quan, ghi nhận phụ kiện và xuất phiếu tiếp nhận bảo hành có mã QR.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-1.5">2. Thẩm định &amp; Phê duyệt báo giá</h4>
            <p>
              Kỹ thuật viên kiểm tra chi tiết. Nếu thuộc diện bảo hành chính hãng sẽ được sửa chữa miễn phí 100%. Nếu phát sinh chi phí linh kiện ngoài bảo hành, khách hàng có thể duyệt trực tiếp trên website.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-1.5">3. Nghiệm thu &amp; Nhận lại thiết bị</h4>
            <p>
              Khi sửa xong, hệ thống thông báo mời khách tới nhận máy. Quý khách kiểm tra vận hành thực tế, nhân viên in biên bản bàn giao và kích hoạt bảo hành linh kiện mới.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WarrantyCheckPage;
