import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Coins,
  Search,
  Filter,
  Calendar,
  Building2,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Eye,
  X,
  Printer,
  FileSpreadsheet,
  ShieldCheck,
  Activity
} from 'lucide-react';
import posShiftService from '../../features/pos/services/posShiftService.js';
import { branchService } from '../../features/branches/services/branchService.js';
import DataTablePagination from '../../components/common/DataTablePagination.jsx';
import ShiftHandoverPrintModal from '../../features/pos/components/ShiftHandoverPrintModal.jsx';

const formatVND = (val) => `${Number(val || 0).toLocaleString('vi-VN')} ₫`;

export const PosShiftReportPage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';
  const isManagerOrAdmin = ['BRANCH_MANAGER', 'SUPER_ADMIN'].includes(authUser?.role);

  const [shifts, setShifts] = useState([]);
  const [monitorData, setMonitorData] = useState(null);
  const [resolutionType, setResolutionType] = useState('CONFIRMED');
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [selectedBranchId, setSelectedBranchId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Detail & Print Modals
  const [selectedShift, setSelectedShift] = useState(null);
  const [printShift, setPrintShift] = useState(null);

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

  const loadShifts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (selectedBranchId !== 'ALL') params.branchId = selectedBranchId;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const data = await posShiftService.getShiftHistory(params);
      setShifts(data?.shifts || []);
      setTotalItems(data?.pagination?.total || 0);
      setTotalPages(data?.pagination?.totalPages || 1);

      if (isManagerOrAdmin) {
        const monParams = selectedBranchId !== 'ALL' ? { branchId: selectedBranchId } : {};
        const mon = await posShiftService.getLiveCashMonitor(monParams).catch(() => null);
        setMonitorData(mon);
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Không thể tải lịch sử ca thu ngân');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedBranchId, statusFilter, isManagerOrAdmin]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranchId, statusFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalCashCollected = shifts.reduce((s, sh) => s + (Number(sh.cashSales) || 0), 0);
    const discrepancyCount = shifts.filter((sh) => Number(sh.discrepancy) !== 0).length;
    const totalDiscrepancyAmount = shifts.reduce((s, sh) => s + (Number(sh.discrepancy) || 0), 0);
    return { totalCashCollected, discrepancyCount, totalDiscrepancyAmount };
  }, [shifts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-amber-400" />
            Báo Cáo Két Tiền & Ca Thu Ngân POS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi dòng tiền mặt tại từng quầy thu ngân, phát hiện chênh lệch quỹ và đối soát kiểm đếm ca chốt
          </p>
        </div>

        {/* Top Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Tiền mặt thu tại quầy</span>
            <span className="font-mono font-black text-emerald-400 text-sm">{formatVND(stats.totalCashCollected)}</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Ca có lệch két</span>
            <span className={`font-mono font-black text-sm ${stats.discrepancyCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {stats.discrepancyCount} ca
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      {isManagerOrAdmin && monitorData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-300 uppercase flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Két tiền đang mở (Live)
              </span>
              <p className="text-xl font-black font-mono text-emerald-400 mt-1">
                {formatVND(monitorData.totalLiveCashInDrawers)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {monitorData.openShiftsCount} ca đang hoạt động tại quầy
              </p>
            </div>
            <Unlock className="w-6 h-6 text-emerald-400/70" />
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-amber-300 uppercase flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Ca lệch tiền chưa lập biên bản xử lý
              </span>
              <p className="text-sm font-bold text-white mt-1">
                {monitorData.unresolvedDiscrepancyCount > 0
                  ? `${monitorData.unresolvedDiscrepancyCount} ca đóng quỹ có chênh lệch cần Quản lý xác nhận`
                  : 'Tất cả ca có chênh lệch đều đã được đối soát xong'}
              </p>
            </div>
            {monitorData.unresolvedShifts?.[0] && (
              <button
                type="button"
                onClick={() => {
                  setSelectedShift(monitorData.unresolvedShifts[0]);
                  setResolutionType('CONFIRMED');
                  setResolutionNote('');
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 cursor-pointer"
              >
                Xử lý ca {monitorData.unresolvedShifts[0].shiftCode}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Filter (nếu là Super Admin) */}
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
              <option value="ALL">Tất cả trạng thái</option>
              <option value="OPEN">🟢 Đang mở ca</option>
              <option value="CLOSED">🔒 Đã chốt ca</option>
            </select>
          </div>
        </div>

        <button
          onClick={loadShifts}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          Làm mới
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-400 text-xs">
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
                <th className="py-3.5 px-4">Mã Ca Trực</th>
                <th className="py-3.5 px-4">Chi Nhánh & Thu Ngân</th>
                <th className="py-3.5 px-4">Thời Gian Ca</th>
                <th className="py-3.5 px-4 text-right">Tiền Đầu Ca</th>
                <th className="py-3.5 px-4 text-right">Thu Tiền Mặt</th>
                <th className="py-3.5 px-4 text-right">Đã Rút Nộp</th>
                <th className="py-3.5 px-4 text-right">Đếm Thực Tế</th>
                <th className="py-3.5 px-4 text-center">Chênh Lệch Quỹ</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    Đang tải danh sách ca thu ngân...
                  </td>
                </tr>
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 text-xs">
                    Không có ca làm việc nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => {
                  const isOpen = shift.status === 'OPEN';
                  const discrepancy = Number(shift.discrepancy) || 0;
                  const totalDrops = (shift.cashDrops || []).reduce(
                    (s, d) => s + (Number(d.amount) || 0),
                    0
                  );

                  return (
                    <tr key={shift._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                        {shift.shiftCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{shift.branchId?.name || 'Showroom'}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{shift.cashierId?.fullName || 'Thu ngân'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-300">
                          Mở: {new Date(shift.openedAt).toLocaleString('vi-VN')}
                        </div>
                        {shift.closedAt && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Đóng: {new Date(shift.closedAt).toLocaleString('vi-VN')}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatVND(shift.openingBalance)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        +{formatVND(shift.cashSales)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-400">
                        {totalDrops > 0 ? `-${formatVND(totalDrops)}` : '0 ₫'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        {isOpen ? (
                          <span className="text-slate-400 font-normal italic">Đang hoạt động</span>
                        ) : (
                          formatVND(shift.actualEndingBalance)
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isOpen ? (
                          <span className="text-slate-400">—</span>
                        ) : discrepancy === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3" />
                            CÂN KHỚP
                          </span>
                        ) : discrepancy > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-500/40">
                            +{formatVND(discrepancy)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-500/40">
                            {formatVND(discrepancy)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isOpen ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-400 border border-blue-500/40">
                            <Unlock className="w-3 h-3" />
                            ĐANG MỞ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            <Lock className="w-3 h-3" />
                            ĐÃ CHỐT
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPrintShift(shift)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="In biên bản bàn giao ca"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>In</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedShift(shift)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chi tiết</span>
                          </button>
                        </div>
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
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          variant="dark"
          itemName="ca thu ngân"
        />
      </div>

      {/* Shift Detail Modal */}
      {selectedShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <h3 className="font-black text-sm text-white">
                  Chi Tiết Ca: {selectedShift.shiftCode}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPrintShift(selectedShift);
                    setSelectedShift(null);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Biên Bản</span>
                </button>
                <button
                  onClick={() => setSelectedShift(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Chi nhánh:</span>
                <span className="font-bold text-white">{selectedShift.branchId?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thu ngân:</span>
                <span className="font-bold text-white">{selectedShift.cashierId?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thời gian mở:</span>
                <span className="font-mono text-slate-200">{new Date(selectedShift.openedAt).toLocaleString('vi-VN')}</span>
              </div>
              {selectedShift.closedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Thời gian đóng:</span>
                  <span className="font-mono text-slate-200">{new Date(selectedShift.closedAt).toLocaleString('vi-VN')}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400">Thu / Chi nội bộ:</span>
                <span className="font-mono font-bold">
                  <span className="text-emerald-400">+{formatVND(selectedShift.cashInTotal || 0)}</span>
                  {' / '}
                  <span className="text-rose-400">-{formatVND(selectedShift.cashOutTotal || 0)}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tiền lý thuyết trong két:</span>
                <span className="font-mono font-bold text-blue-400">{formatVND(selectedShift.expectedEndingBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tiền đếm thực tế:</span>
                <span className="font-mono font-bold text-white">{formatVND(selectedShift.actualEndingBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chênh lệch két:</span>
                <span className={`font-mono font-bold ${selectedShift.discrepancy !== 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatVND(selectedShift.discrepancy)}
                </span>
              </div>
              {selectedShift.discrepancyNote && (
                <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] mb-0.5">Lý do giải trình chênh lệch:</span>
                  <p className="text-amber-300 italic">{selectedShift.discrepancyNote}</p>
                </div>
              )}

              {/* Biên bản xử lý chênh lệch của Quản lý (UC-BM-03) */}
              {selectedShift.status === 'CLOSED' && Number(selectedShift.discrepancy) !== 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800">
                  {selectedShift.discrepancyResolution?.status === 'RESOLVED' ? (
                    <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-300 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Đã lập biên bản xử lý ({selectedShift.discrepancyResolution.resolutionType})
                        </span>
                        <span className="text-slate-400">{selectedShift.discrepancyResolution.resolvedByName}</span>
                      </div>
                      <p className="text-[11px] text-slate-200">{selectedShift.discrepancyResolution.note}</p>
                    </div>
                  ) : isManagerOrAdmin ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setResolving(true);
                        try {
                          const updated = await posShiftService.resolveDiscrepancy(selectedShift._id, {
                            resolutionType,
                            note: resolutionNote.trim()
                          });
                          if (updated) setSelectedShift(updated);
                          setResolutionNote('');
                          await loadShifts();
                        } catch (err) {
                          setError(err?.response?.data?.message || err?.message || 'Lỗi lưu biên bản xử lý lệch ca');
                        } finally {
                          setResolving(false);
                        }
                      }}
                      className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2"
                    >
                      <p className="text-[11px] font-bold text-amber-300">
                        Lập biên bản xử lý lệch tiền cuối ca (Quản lý):
                      </p>
                      <select
                        value={resolutionType}
                        onChange={(e) => setResolutionType(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100"
                      >
                        <option value="CONFIRMED">Xác nhận khớp sau kiểm tra</option>
                        <option value="DEDUCT_STAFF">Khấu trừ vào trách nhiệm thu ngân</option>
                        <option value="BRANCH_EXPENSE">Hạch toán chi phí/hao hụt chi nhánh</option>
                        <option value="FOUND_LATER">Đã tìm lại tiền / điều chỉnh bổ sung</option>
                      </select>
                      <input
                        type="text"
                        required
                        minLength={3}
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Nhập kết luận đối soát camera / biên bản xử lý..."
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100"
                      />
                      <button
                        type="submit"
                        disabled={resolving}
                        className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-50"
                      >
                        {resolving ? 'Đang lưu...' : 'Xác nhận Đã Xử Lý Lệch Ca'}
                      </button>
                    </form>
                  ) : null}
                </div>
              )}
            </div>

            {/* Phiếu thu / chi nội bộ trong ca */}
            {Array.isArray(selectedShift.cashVouchers) && selectedShift.cashVouchers.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-300 mb-2">Phiếu Thu / Chi nội bộ ({selectedShift.cashVouchers.length}):</h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedShift.cashVouchers.map((v, i) => (
                    <div key={v._id || i} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="min-w-0">
                        <span className={`font-bold mr-1.5 ${v.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          [{v.type === 'IN' ? 'THU' : 'CHI'}]
                        </span>
                        <span className="text-slate-200">{v.reason}</span>
                      </div>
                      <span className={`font-mono font-bold shrink-0 ${v.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {v.type === 'IN' ? '+' : '-'}{formatVND(v.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chi tiết từng mệnh giá đã đếm */}
            {selectedShift.denominations && selectedShift.denominations.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-300 mb-2">Chi tiết mệnh giá tiền đã kiểm đếm:</h4>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {selectedShift.denominations.map((d, i) => (
                    <div key={i} className="flex justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="font-mono text-slate-400">{formatVND(d.denomination)}</span>
                      <span className="font-mono font-bold text-white">x{d.count} tờ</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Handover Print Modal */}
      <ShiftHandoverPrintModal
        isOpen={Boolean(printShift)}
        onClose={() => setPrintShift(null)}
        shift={printShift}
      />
    </div>
  );
};

export default PosShiftReportPage;
