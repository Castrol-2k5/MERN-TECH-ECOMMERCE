import { useState } from 'react';
import { Wrench, ShieldCheck } from 'lucide-react';
import warrantyService from '../../features/warranty/services/warrantyService';
import usePosAudio from '../../features/pos/hooks/usePosAudio';
import RmaScanLookup from '../../features/warranty/components/RmaScanLookup';
import RmaTicketForm from '../../features/warranty/components/RmaTicketForm';
import RmaPrintReceiptModal from '../../features/warranty/components/RmaPrintReceiptModal';

export const WarrantyReceptionPage = () => {
  const [lookupResult, setLookupResult] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedTicket, setCompletedTicket] = useState(null);

  const { playSuccessBeep, playErrorBeep } = usePosAudio();

  const handleLookup = async (serialNumber) => {
    setIsLookingUp(true);
    try {
      const data = await warrantyService.verifySerial(serialNumber);
      setLookupResult(data);
      playSuccessBeep();
    } catch {
      playErrorBeep();
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleCreateTicket = async (formData) => {
    setIsSubmitting(true);
    try {
      const result = await warrantyService.createWarrantyTicket(formData);
      playSuccessBeep();
      setCompletedTicket(result);
    } catch {
      playErrorBeep();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewTicket = () => {
    setLookupResult(null);
    setCompletedTicket(null);
  };

  return (
    <div className="space-y-5 select-none font-sans text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4" />
            <span>Tiếp Nhận Dịch Vụ • TechOne Care</span>
          </div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight">
            Tiếp Nhận &amp; Thẩm Định Thiết Bị Bảo Hành Tại Quầy
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Xác thực E-Warranty theo Serial/IMEI, lập biên bản ghi nhận lỗi và in phiếu hẹn trả máy cho khách
          </p>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Chính sách đổi mới 30 ngày</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Lookup) & Right (Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Step 1: Scan & Tra cứu E-Warranty (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <RmaScanLookup
            onLookup={handleLookup}
            result={lookupResult}
            loading={isLookingUp}
          />
        </div>

        {/* Step 2: Biên bản tiếp nhận kỹ thuật (7 cols) */}
        <div className="lg:col-span-7">
          <RmaTicketForm
            warrantyData={lookupResult}
            onSubmit={handleCreateTicket}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      {/* Print Receipt Modal */}
      <RmaPrintReceiptModal
        isOpen={Boolean(completedTicket)}
        onClose={() => setCompletedTicket(null)}
        ticketData={completedTicket}
        onNewTicket={handleNewTicket}
      />
    </div>
  );
};

export default WarrantyReceptionPage;
