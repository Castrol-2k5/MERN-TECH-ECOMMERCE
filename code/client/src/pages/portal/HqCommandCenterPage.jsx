import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  RefreshCw,
  ArrowRight,
  Store,
  TrendingUp,
  BellRing,
  CheckCircle2
} from 'lucide-react';
import { hqService } from '../../features/hq/services/hqService.js';

const SEVERITY_CONFIG = {
  CRITICAL: {
    label: 'Báo động đỏ',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    cardClass: 'border-rose-500/40 bg-rose-950/20',
    icon: ShieldAlert,
    iconColor: 'text-rose-400'
  },
  WARNING: {
    label: 'Cảnh báo',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    cardClass: 'border-amber-500/30 bg-amber-950/10',
    icon: AlertTriangle,
    iconColor: 'text-amber-400'
  },
  INFO: {
    label: 'Lưu ý vận hành',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    cardClass: 'border-cyan-500/30 bg-slate-900',
    icon: Info,
    iconColor: 'text-cyan-400'
  }
};

const CATEGORY_LABELS = {
  ALL: 'Tất cả nhóm',
  FRAUD_RETURN: 'Gian lận / Hoàn hủy',
  CASH_DISCREPANCY: 'Lệch két thu ngân',
  LOW_STOCK: 'Cháy hàng / Dưới Min',
  DEAD_STOCK: 'Tồn chậm > 30 ngày',
  TARGET_MISS: 'Chậm chỉ tiêu tháng',
  PENDING_QUEUE: 'Hàng đợi chờ HQ'
};

const REGION_LABELS = {
  HCM: 'TP.HCM',
  HANOI: 'Hà Nội',
  MIEN_NAM: 'Miền Nam',
  MIEN_TRUNG: 'Miền Trung',
  MIEN_BAC: 'Miền Bắc',
  KHAC: 'Khác'
};

const formatVnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')} ₫`;

export const HqCommandCenterPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchCommandCenter = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await hqService.getCommandCenter();
      setData(res);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Không thể tải dữ liệu Trung tâm Điều hành HQ.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    hqService
      .getCommandCenter()
      .then((res) => {
        if (!ignore) {
          setData(res);
          setErrorMsg('');
        }
      })
      .catch((err) => {
        if (!ignore) {
          setErrorMsg(
            err.response?.data?.message ||
              err.message ||
              'Không thể tải dữ liệu Trung tâm Điều hành HQ.'
          );
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const summary = data?.summary || {};
  const alerts = data?.alerts || [];
  const branchSnapshot = data?.branchSnapshot || [];

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (categoryFilter !== 'ALL' && a.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
            <BellRing className="w-4 h-4" />
            <span>Management By Exception • Đầu Não Toàn Chuỗi</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Trung Tâm Điều Hành HQ (Báo Động Đỏ)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chỉ hiển thị các bất thường vượt ngưỡng an toàn: gian lận hoàn hủy, lệch két, cháy hàng, tồn chậm &gt; 30 ngày và chậm KPI.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCommandCenter}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-100 flex items-center gap-2 cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Đang quét toàn chuỗi...' : 'Quét lại bất thường'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-200">
          {errorMsg}
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-rose-300 uppercase">Báo động đỏ (Critical)</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{summary.criticalCount ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Cảnh báo: {summary.warningCount ?? 0} • Lưu ý: {summary.infoCount ?? 0}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-cyan-300 uppercase">Doanh thu hôm nay</div>
          <div className="text-2xl font-black text-white mt-1">{formatVnd(summary.todayRevenue)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary.todayOrdersCount ?? 0} đơn phát sinh trong ngày
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-emerald-300 uppercase">Lũy kế tháng (MTD)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{formatVnd(summary.mtdRevenue)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary.retailBranchesCount ?? 0} cửa hàng bán lẻ đang hoạt động
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-amber-300 uppercase">Hàng đợi chờ xử lý</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{summary.pendingHqActions ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Cấp hàng: {data?.pendingQueues?.transferRequestsToHq ?? 0} • Duyệt: {data?.pendingQueues?.pendingApprovals ?? 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                severityFilter === sev
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sev === 'ALL' ? `Tất cả (${alerts.length})` : SEVERITY_CONFIG[sev].label}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading && !data ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
            Đang tổng hợp tín hiệu bất thường từ toàn bộ chi nhánh...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-emerald-500/30 rounded-2xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-sm font-bold text-emerald-300">
              Hệ thống toàn chuỗi đang vận hành trong ngưỡng an toàn
            </div>
            <p className="text-xs text-slate-400">
              Không có cảnh báo bất thường nào khớp bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.INFO;
            const IconComp = cfg.icon;
            return (
              <div
                key={alert.id}
                className={`border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${cfg.cardClass}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 shrink-0">
                    <IconComp className={`w-5 h-5 ${cfg.iconColor}`} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badgeClass}`}>
                        {cfg.label}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold text-cyan-300">
                        {alert.branchCode}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {CATEGORY_LABELS[alert.category] || alert.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{alert.title}</h3>
                    <p className="text-xs text-slate-300">{alert.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-200">
                    {alert.metricLabel}
                  </span>
                  {alert.actionPath && (
                    <button
                      type="button"
                      onClick={() => navigate(alert.actionPath)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{alert.actionLabel || 'Xử lý ngay'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Branch Health Snapshot */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Sức khỏe Vận hành Chi nhánh Toàn chuỗi</h2>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            MTD vs Target tháng
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                <th className="py-2.5 px-4">Chi nhánh</th>
                <th className="py-2.5 px-4">Khu vực</th>
                <th className="py-2.5 px-4 text-right">Doanh thu tháng</th>
                <th className="py-2.5 px-4 text-right">Chỉ tiêu tháng</th>
                <th className="py-2.5 px-4 text-right">Hoàn/Hủy 7d</th>
                <th className="py-2.5 px-4 text-right">Ca lệch két</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {branchSnapshot.map((b) => (
                <tr key={b._id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4">
                    <div className="font-bold text-white">{b.name}</div>
                    <div className="text-[10px] font-mono text-cyan-400">
                      {b.branchCode} {b.isHeadquarter ? '• HQ' : ''}
                    </div>
                  </td>
                  <td className="py-2.5 px-4">{REGION_LABELS[b.region] || b.region}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                    {formatVnd(b.mtdRevenue)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {b.monthlyRevenueTarget > 0 ? (
                      <div>
                        <span>{formatVnd(b.monthlyRevenueTarget)}</span>
                        <span
                          className={`ml-1.5 text-[10px] font-bold ${
                            (b.mtdProgressPct || 0) >= 80
                              ? 'text-emerald-400'
                              : (b.mtdProgressPct || 0) < 40
                                ? 'text-rose-400'
                                : 'text-amber-400'
                          }`}
                        >
                          ({b.mtdProgressPct ?? 0}%)
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500">Chưa đặt</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    <span className={b.returnRate7d >= 15 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {b.returnRate7d}%
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {b.unresolvedShifts > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                        {b.unresolvedShifts} ca
                      </span>
                    ) : (
                      <span className="text-emerald-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HqCommandCenterPage;
