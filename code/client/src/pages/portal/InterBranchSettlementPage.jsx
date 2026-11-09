import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  ArrowLeftRight,
  Building2,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  CreditCard,
  Send,
  Eye,
  X
} from 'lucide-react';
import settlementService from '../../features/accounting/services/settlementService.js';
import { branchService } from '../../features/branches/services/branchService.js';
import DataTablePagination from '../../components/common/DataTablePagination.jsx';

const formatVND = (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫`;

export const InterBranchSettlementPage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';

  const [settlements, setSettlements] = useState([]);
  const [summary, setSummary] = useState({
    totalPendingPayable: 0,
    totalSettled: 0,
    totalFulfillmentFees: 0
  });
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [selectedBranchId, setSelectedBranchId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Settlement Modal (Super Admin confirm payment)
  const [selectedForPayout, setSelectedForPayout] = useState(null);
  const [bankTransferRef, setBankTransferRef] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Load branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const list = await branchService.getAllBranches();
        setBranches(Array.isArray(list) ? list : []);
      } catch {
        setBranches([]);
      }
    };
    fetchBranches();
  }, []);

  const loadSettlements = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (selectedBranchId !== 'ALL') params.branchId = selectedBranchId;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const data = await settlementService.getSettlements(params);
      setSettlements(data?.settlements || []);
      setSummary(data?.summary || {});
      setTotalItems(data?.pagination?.total || 0);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Không thể tải danh sách đối soát chuỗi');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedBranchId, statusFilter]);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranchId, statusFilter]);

  const handleConfirmPayout = async (e) => {
    e.preventDefault();
    if (!selectedForPayout) return;
    setIsSubmitting(true);
    setModalError('');
    try {
      await settlementService.settlePayment(selectedForPayout._id, {
        bankTransferRef,
        notes: payoutNotes
      });
      setSelectedForPayout(null);
      setBankTransferRef('');
      setPayoutNotes('');
      loadSettlements();
    } catch (err) {
      setModalError(err?.response?.data?.error?.message || err?.message || 'Không thể duyệt thanh toán bù trừ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <ArrowLeftRight className="w-5 h-5 text-blue-400" />
            Đối Soát & Bù Trừ Dòng Tiền Liên Chi Nhánh
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Minh bạch hóa dòng tiền giữa Trụ sở (HQ) và Showroom cho các đơn hàng Click & Collect hoặc điều phối xuất hộ
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={loadSettlements}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer self-start md:self-auto"
        >
          Làm mới số liệu
        </button>
      </div>

      {/* 3 Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Tổng tiền cần hoàn trả chi nhánh */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Trụ sở nợ chi nhánh (Chờ thanh toán)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-amber-400">
              {formatVND(summary.totalPendingPayable)}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Gồm giá vốn hàng bán + Phí dịch vụ showroom</p>
        </div>

        {/* Card 2: Hoa hồng dịch vụ showroom */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Hoa hồng dịch vụ Showroom (3%)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-blue-400">
              {formatVND(summary.totalFulfillmentFees)}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Thưởng KPI cho nhân sự showroom bàn giao máy</p>
        </div>

        {/* Card 3: Đã thanh toán bù trừ */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Đã thanh toán bù trừ</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-emerald-400">
              {formatVND(summary.totalSettled)}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Kế toán HQ đã chuyển khoản cho các chi nhánh</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Filter */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả chi nhánh</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái đối soát</option>
              <option value="PENDING_CLEARING">⏳ Chờ đối soát thanh toán</option>
              <option value="SETTLED">✅ Đã bù trừ hoàn tất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Mã Phiếu Đối Soát</th>
                <th className="py-3.5 px-4">Đơn Hàng Gốc</th>
                <th className="py-3.5 px-4">Kho Xuất Bàn Giao</th>
                <th className="py-3.5 px-4 text-right">Tổng Đơn Hàng</th>
                <th className="py-3.5 px-4 text-right">Giá Vốn (85%)</th>
                <th className="py-3.5 px-4 text-right">Hoa Hồng (3%)</th>
                <th className="py-3.5 px-4 text-right">HQ Cần Chuyển Hoàn</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    Đang tải danh sách đối soát chuỗi...
                  </td>
                </tr>
              ) : settlements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                    Không có khoản đối soát nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                settlements.map((item) => {
                  const isSettled = item.status === 'SETTLED';

                  return (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                        {item.settlementCode}
                        <div className="text-[10px] text-slate-500 font-normal">
                          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold text-slate-200">{item.orderCode}</span>
                        <div className="text-[10px] text-blue-400">Click & Collect</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{item.fulfillingBranchId?.name || 'Showroom'}</div>
                        <div className="text-[10px] text-slate-400">HQ giữ tiền VNPAY</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatVND(item.orderAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatVND(item.cogsAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-400">
                        +{formatVND(item.fulfillmentFee)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-amber-400 text-sm">
                        {formatVND(item.totalPayableToBranch)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3" />
                            ĐÃ BÙ TRỪ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-500/40">
                            <Clock className="w-3 h-3" />
                            CHỜ THANH TOÁN
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isSettled && isSuperAdmin ? (
                          <button
                            type="button"
                            onClick={() => setSelectedForPayout(item)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Duyệt trả</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">
                            {item.bankTransferRef || 'Đã tất toán'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <DataTablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          variant="dark"
          itemLabel="khoản đối soát"
        />
      </div>

      {/* Payout Confirmation Modal */}
      {selectedForPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                Xác Nhận Thanh Toán Bù Trừ
              </h3>
              <button
                onClick={() => setSelectedForPayout(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Chi nhánh thụ hưởng:</span>
                <span className="font-bold text-white">{selectedForPayout.fulfillingBranchId?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Đơn hàng liên quan:</span>
                <span className="font-mono text-blue-400">{selectedForPayout.orderCode}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold">
                <span className="text-slate-300">Tổng tiền chuyển hoàn:</span>
                <span className="font-mono text-amber-400 font-black">
                  {formatVND(selectedForPayout.totalPayableToBranch)}
                </span>
              </div>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-[11px]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleConfirmPayout} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Mã tham chiếu ngân hàng (FT/Trace code)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: VCB-FT261109-123456"
                  value={bankTransferRef}
                  onChange={(e) => setBankTransferRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Ghi chú thanh toán
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đã bù trừ tiền hàng đợt 1 tháng 11"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Đã Chuyển Khoản Cho Chi Nhánh'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterBranchSettlementPage;
