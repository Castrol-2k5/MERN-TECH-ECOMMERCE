import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Download,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  SlidersHorizontal,
  Coins,
  Truck,
  UserCheck,
  FileText,
  Calendar,
  X,
  Eye,
  Store
} from 'lucide-react';
import auditLogService from '../../features/audit/services/auditLogService.js';
import branchService from '../../features/branches/services/branchService.js';
import AuditDiffModal from '../../features/audit/components/AuditDiffModal.jsx';
import DataTablePagination from '../../components/common/DataTablePagination.jsx';

const ACTION_LABELS = {
  ALL: 'Tất cả hành vi',
  STOCK_ADJUST: 'Điều chỉnh tồn kho',
  TRANSFER_CREATE: 'Tạo phiếu chuyển kho',
  TRANSFER_RECEIVE: 'Nhập hàng chuyển kho',
  POS_SHIFT_OPEN: 'Mở ca thu ngân',
  POS_SHIFT_CASH_DROP: 'Rút tiền nộp két',
  POS_SHIFT_VOUCHER: 'Phiếu Thu/Chi két ca POS',
  POS_SHIFT_CLOSE: 'Chốt ca kiểm đếm két',
  ORDER_POS_CHECKOUT: 'Thanh toán tại quầy',
  ORDER_CANCEL: 'Hủy đơn hàng',
  ORDER_RETURN: 'Trả hàng & Hoàn tiền',
  USER_ROLE_CHANGE: 'Thay đổi quyền nhân sự',
  USER_STATUS_TOGGLE: 'Khóa / Mở tài khoản',
  AUTH_LOGIN_FAILED: 'Đăng nhập thất bại'
};

export const AuditTrailPage = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    criticalToday: 0,
    stockAdjustmentsToday: 0,
    shiftDiscrepanciesToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);

  // Filters state
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedBranchId, setSelectedBranchId] = useState('ALL');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal detail
  const [activeLog, setActiveLog] = useState(null);

  // Load branches for filter
  useEffect(() => {
    branchService.getBranches().then((list) => {
      if (Array.isArray(list)) setBranches(list);
    }).catch(() => {});
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await auditLogService.getStats();
      if (data) setStats(data);
    } catch {
      // ignore
    }
  }, []);

  // Fetch logs with active filters & pagination
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (selectedAction !== 'ALL') params.action = selectedAction;
      if (selectedSeverity !== 'ALL') params.severity = selectedSeverity;
      if (selectedBranchId !== 'ALL') params.branchId = selectedBranchId;
      if (search.trim()) params.search = search.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await auditLogService.getLogs(params);
      const safeLogs = Array.isArray(res?.logs) ? res.logs : [];
      setLogs(safeLogs);
      setTotalItems(res?.pagination?.total || safeLogs.length);
      setTotalPages(res?.pagination?.totalPages || 1);
    } catch {
      setLogs([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedAction, selectedSeverity, selectedBranchId, search, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when filters change
  const handleFilterAction = (val) => {
    setSelectedAction(val);
    setCurrentPage(1);
  };

  const handleFilterSeverity = (val) => {
    setSelectedSeverity(val);
    setCurrentPage(1);
  };

  const handleFilterBranch = (val) => {
    setSelectedBranchId(val);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedAction('ALL');
    setSelectedSeverity('ALL');
    setSelectedBranchId('ALL');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    if (!logs || logs.length === 0) return;
    const headers = ['Thời gian', 'Nhân sự', 'Email', 'Vai trò', 'Chi nhánh', 'Hành động', 'Mức độ', 'Đối tượng', 'Lý do / Ghi chú', 'IP'];
    const rows = logs.map((l) => [
      `"${new Date(l.timestamp).toLocaleString('vi-VN')}"`,
      `"${l.actor?.fullName || ''}"`,
      `"${l.actor?.email || ''}"`,
      `"${l.actor?.role || ''}"`,
      `"${l.actor?.branchCode || ''}"`,
      `"${l.action || ''}"`,
      `"${l.severity || ''}"`,
      `"${String(l.target?.name || l.target?.code || '').replace(/"/g, '""')}"`,
      `"${String(l.context?.reason || l.context?.notes || '').replace(/"/g, '""')}"`,
      `"${l.context?.ipAddress || ''}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nhat-ky-kiem-toan-techone-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityBadge = (sev) => {
    if (sev === 'CRITICAL') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
          <AlertOctagon className="w-3 h-3" />
          <span>CRITICAL</span>
        </span>
      );
    }
    if (sev === 'WARNING') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
          <AlertTriangle className="w-3 h-3" />
          <span>WARNING</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 w-fit">
        <CheckCircle2 className="w-3 h-3" />
        <span>INFO</span>
      </span>
    );
  };

  return (
    <div className="space-y-5 select-none font-sans text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Trung Tâm An Ninh &amp; Giám Sát Tuân Thủ</span>
          </div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight">
            Sổ Nhật Ký Kiểm Toán Hệ Thống (Audit Trail)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ghi nhận bất biến 5W1H toàn bộ biến động tiền mặt, điều chỉnh kho, chuyển hàng và phân quyền
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchLogs();
            }}
            disabled={loading}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={logs.length === 0}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-rose-600/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Báo Cáo CSV</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900 border border-blue-500/20 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider">HOẠT ĐỘNG HÔM NAY</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-blue-400">
            {stats.totalToday || logs.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Sự kiện nhạy cảm được ghi nhận</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/20 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider">CẢNH BÁO RỦI RO CAO</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            {stats.criticalToday || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Cần kiểm tra đối soát ngay lập tức</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/20 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider">ĐIỀU CHỈNH TỒN KHO</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {stats.stockAdjustmentsToday || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Lệnh tăng / giảm tồn thực tế</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/20 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider">LỆCH KÉT TIỀN CA POS</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {stats.shiftDiscrepanciesToday || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Ca phát sinh chênh lệch tiền mặt</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-0">
        {/* Toolbar & Filter Rows */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Tìm theo Tên nhân sự, Mã phiếu, SKU, IP..."
                className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Branch Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                <Store className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-400">Chi nhánh:</span>
                <select
                  value={selectedBranchId}
                  onChange={(e) => handleFilterBranch(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-semibold"
                >
                  <option value="ALL" className="bg-slate-900">Tất cả chi nhánh</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id} className="bg-slate-900">
                      {b.branchName || b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">Hành vi:</span>
                <select
                  value={selectedAction}
                  onChange={(e) => handleFilterAction(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-semibold max-w-[140px] truncate"
                >
                  {Object.entries(ACTION_LABELS).map(([k, v]) => (
                    <option key={k} value={k} className="bg-slate-900">
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-slate-400">Mức độ:</span>
                <select
                  value={selectedSeverity}
                  onChange={(e) => handleFilterSeverity(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-semibold"
                >
                  <option value="ALL" className="bg-slate-900">Tất cả mức độ</option>
                  <option value="CRITICAL" className="bg-slate-900 text-rose-400">CRITICAL (Nghiêm trọng)</option>
                  <option value="WARNING" className="bg-slate-900 text-amber-300">WARNING (Cảnh báo)</option>
                  <option value="INFO" className="bg-slate-900 text-blue-300">INFO (Thông thường)</option>
                </select>
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-slate-200 text-[11px] focus:outline-none"
                />
                <span className="text-slate-500">→</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-slate-200 text-[11px] focus:outline-none"
                />
              </div>

              {(selectedAction !== 'ALL' || selectedSeverity !== 'ALL' || selectedBranchId !== 'ALL' || search || startDate || endDate) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Đặt lại
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Nhân sự thực hiện</th>
                <th className="py-3 px-3">Hành vi (Action)</th>
                <th className="py-3 px-3">Mức độ</th>
                <th className="py-3 px-4">Đối tượng tác động</th>
                <th className="py-3 px-4">Giải trình / Ghi chú</th>
                <th className="py-3 px-4 text-center">Biến động (Diff)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Đang nạp nhật ký kiểm toán hệ thống...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    Không tìm thấy bản ghi nhật ký kiểm toán nào khớp bộ lọc
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    day: '2-digit',
                    month: '2-digit'
                  });

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-850/60 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100 text-xs">
                          {log.actor?.fullName || 'Hệ thống'}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{log.actor?.email || 'N/A'}</span>
                          {log.actor?.branchCode && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 text-[10px] font-mono">
                              {log.actor.branchCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-[11px] text-slate-200">
                          {log.action}
                        </span>
                      </td>

                      {/* Severity */}
                      <td className="py-3 px-3">
                        {getSeverityBadge(log.severity)}
                      </td>

                      {/* Target */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200 truncate max-w-[200px]" title={log.target?.name || log.target?.code}>
                          {log.target?.name || log.target?.code || log.target?.model}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.target?.model} {log.target?.code ? `• ${log.target.code}` : ''}
                        </div>
                      </td>

                      {/* Context / Notes */}
                      <td className="py-3 px-4 text-slate-300 max-w-[240px]">
                        <p className="truncate text-xs" title={log.context?.reason || log.context?.notes || '—'}>
                          {log.context?.reason || log.context?.notes || '—'}
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono">
                          IP: {log.context?.ipAddress || '127.0.0.1'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-blue-400" />
                          <span>Chi tiết &amp; Diff</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          variant="dark"
          itemName="bản ghi kiểm toán"
        />
      </div>

      {/* Snapshot Diff Modal */}
      <AuditDiffModal
        isOpen={Boolean(activeLog)}
        onClose={() => setActiveLog(null)}
        log={activeLog}
      />
    </div>
  );
};

export default AuditTrailPage;
