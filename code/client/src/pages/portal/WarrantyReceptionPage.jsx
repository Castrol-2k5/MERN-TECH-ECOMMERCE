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

  const [activeTab, setActiveTab] = useState('RECEPTION'); // 'RECEPTION' | 'TICKETS'
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const data = await warrantyService.getWarrantyTickets();
      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'TICKETS') {
      fetchTickets();
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-px text-xs font-bold">
        <button
          type="button"
          onClick={() => handleTabChange('RECEPTION')}
          className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'RECEPTION'
              ? 'border-blue-500 text-blue-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Tiếp Nhận &amp; Thẩm Định Mới
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('TICKETS')}
          className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'TICKETS'
              ? 'border-blue-500 text-blue-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Danh Sách Phiếu Bảo Hành RMA
        </button>
      </div>

      {activeTab === 'RECEPTION' ? (
        /* Main Grid: Left (Lookup) & Right (Form) */
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
      ) : (
        /* RMA Tickets Table Tab */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-100">Danh Sách Phiếu Tiếp Nhận RMA</h3>
              <p className="text-xs text-slate-400 mt-0.5">Quản lý tiến độ sửa chữa, bảo hành và lịch hẹn khách nhận máy</p>
            </div>
            <button
              type="button"
              onClick={fetchTickets}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Làm mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã Phiếu</th>
                  <th className="py-3 px-4">Serial/IMEI</th>
                  <th className="py-3 px-4">Sản Phẩm</th>
                  <th className="py-3 px-4">Khách Hàng</th>
                  <th className="py-3 px-4">Mô Tả Lỗi</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Ngày Nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium font-sans">
                {isLoadingTickets ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      Đang tải danh sách phiếu bảo hành...
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      Chưa có phiếu bảo hành nào tại chi nhánh.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t._id || t.ticketCode} className="hover:bg-slate-850/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">{t.ticketCode}</td>
                      <td className="py-3 px-4 font-mono text-cyan-300">{t.serialNumber}</td>
                      <td className="py-3 px-4 text-slate-200">{t.productName}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{t.customerName || t.customerInfo?.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{t.customerPhone || t.customerInfo?.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{t.issueDescription || t.faultDescription}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {t.status || 'RECEIVED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
