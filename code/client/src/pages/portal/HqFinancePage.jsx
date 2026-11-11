import { useState, useEffect, useCallback } from 'react';
import {
  Landmark,
  Receipt,
  Award,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Plus
} from 'lucide-react';
import { hqService } from '../../features/hq/services/hqService.js';
import { branchService } from '../../features/branches/services/branchService.js';
import categoryService from '../../features/categories/services/categoryService.js';

const formatVnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')} ₫`;

const EXPENSE_CAT_LABELS = {
  RENT: 'Thuê mặt bằng',
  UTILITIES: 'Điện / Nước / Internet',
  PAYROLL: 'Quỹ lương cố định',
  MARKETING: 'Marketing chi nhánh',
  MAINTENANCE: 'Sửa chữa & Bảo trì',
  OTHER: 'Chi phí khác'
};

export const HqFinancePage = () => {
  const [activeTab, setActiveTab] = useState('PNL'); // 'PNL' | 'EXPENSES' | 'COMMISSIONS'
  const [pnlData, setPnlData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [execApprovals, setExecApprovals] = useState([]);
  const [rules, setRules] = useState([]);
  const [commReport, setCommReport] = useState(null);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  const [expenseForm, setExpenseForm] = useState(() => {
    const now = new Date();
    return {
      branchId: '',
      monthKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      category: 'RENT',
      amount: '',
      description: ''
    };
  });

  const [ruleForm, setRuleForm] = useState({
    name: '',
    categoryId: '',
    ruleType: 'FIXED_PER_UNIT',
    value: ''
  });

  const showToast = (type, message) => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pnl, expRes, execRes, rulesRes, commRes, brList, catList] = await Promise.all([
        hqService.getConsolidatedPnl(),
        hqService.getExpenses(),
        hqService.getExecutiveApprovals(),
        hqService.getCommissionRules(),
        hqService.getCommissionReport(),
        branchService.getBranches(),
        categoryService.getCategories()
      ]);
      setPnlData(pnl);
      setExpenses(expRes?.expenses || []);
      setExecApprovals(execRes?.requests || []);
      setRules(rulesRes?.rules || []);
      setCommReport(commRes);
      setBranches(brList || []);
      setCategories(catList || []);
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Lỗi tải dữ liệu Tài chính HQ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      hqService.getConsolidatedPnl(),
      hqService.getExpenses(),
      hqService.getExecutiveApprovals(),
      hqService.getCommissionRules(),
      hqService.getCommissionReport(),
      branchService.getBranches(),
      categoryService.getCategories()
    ])
      .then(([pnl, expRes, execRes, rulesRes, commRes, brList, catList]) => {
        if (ignore) return;
        setPnlData(pnl);
        setExpenses(expRes?.expenses || []);
        setExecApprovals(execRes?.requests || []);
        setRules(rulesRes?.rules || []);
        setCommReport(commRes);
        setBranches(brList || []);
        setCategories(catList || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleExportPnlCsv = () => {
    const rows = (pnlData?.branchPnl || []).map((r) => [
      `"${r.branchCode}"`,
      `"${String(r.branchName || '').replace(/"/g, '""')}"`,
      r.ordersCount,
      r.netRevenue,
      r.cogs,
      r.grossProfit,
      `"${r.grossMarginPct}%"`,
      r.totalOpex,
      r.estimatedCommission,
      r.netProfit
    ]);
    const headers = [
      'Mã CN',
      'Tên Chi Nhánh',
      'Số Đơn',
      'Doanh Thu Thuần',
      'Giá Vốn (COGS)',
      'Lợi Nhuận Gộp',
      'Biên LN Gộp',
      'Chi Phí Vận Hành (OPEX)',
      'Hoa Hồng',
      'Lợi Nhuận Ròng (P&L)'
    ];
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-pnl-chuoi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await hqService.createExpense({
        ...expenseForm,
        amount: Number(expenseForm.amount)
      });
      showToast('success', 'Đã ghi nhận chi phí vận hành chi nhánh.');
      setExpenseForm({ ...expenseForm, amount: '', description: '' });
      await fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const handleExecutiveAction = async (reqId, approve) => {
    try {
      if (approve) {
        await hqService.approveExecutiveRequest(reqId, 'CEO phê duyệt tối cao');
        showToast('success', 'Đã phê duyệt yêu cầu cấp Executive.');
      } else {
        await hqService.rejectExecutiveRequest(reqId, 'CEO từ chối yêu cầu');
        showToast('success', 'Đã từ chối yêu cầu cấp Executive.');
      }
      await fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      await hqService.createCommissionRule({
        name: ruleForm.name,
        categoryId: ruleForm.categoryId || null,
        ruleType: ruleForm.ruleType,
        value: Number(ruleForm.value)
      });
      showToast('success', 'Đã tạo quy tắc hoa hồng toàn chuỗi.');
      setRuleForm({ name: '', categoryId: '', ruleType: 'FIXED_PER_UNIT', value: '' });
      await fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const handleToggleRule = async (r) => {
    try {
      await hqService.toggleCommissionRule(r._id, !r.isActive);
      await fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message);
    }
  };

  const totals = pnlData?.totals || {};
  const paymentBreakdown = pnlData?.paymentBreakdown || {};
  const pendingExecCount = execApprovals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-5 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <Landmark className="w-4 h-4" />
            <span>Financial Consolidation • Executive P&amp;L</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Tài Chính Hợp Nhất, Phê Duyệt Tối Cao &amp; Hoa Hồng</h1>
          <p className="text-xs text-slate-400 mt-1">
            Báo cáo Lỗ/Lãi (P&amp;L) từng chi nhánh từ doanh thu thực, giá vốn (COGS), chi phí mặt bằng/quầy (OPEX) và cấu trúc hoa hồng toàn chuỗi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAll}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleExportPnlCsv}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV P&amp;L</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
          }`}
        >
          <span>{toastMsg.message}</span>
          <button type="button" onClick={() => setToastMsg(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Doanh thu thuần (30d)</div>
          <div className="text-xl font-black text-white mt-1">{formatVnd(totals.netRevenue)}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            Tiền mặt: {formatVnd(paymentBreakdown.CASH)} • VNPay: {formatVnd(paymentBreakdown.VNPAY)}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] text-amber-300 uppercase font-semibold">Giá vốn hàng bán (COGS)</div>
          <div className="text-xl font-black text-amber-300 mt-1">{formatVnd(totals.cogs)}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] text-cyan-300 uppercase font-semibold">Lợi nhuận gộp</div>
          <div className="text-xl font-black text-cyan-400 mt-1">{formatVnd(totals.grossProfit)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Biên LN gộp: {totals.grossMarginPct ?? 0}%</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] text-rose-300 uppercase font-semibold">Tổng OPEX &amp; Hoa hồng</div>
          <div className="text-xl font-black text-rose-400 mt-1">
            {formatVnd(Number(totals.totalOpex || 0) + Number(totals.estimatedCommission || 0))}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            OPEX: {formatVnd(totals.totalOpex)} • HH: {formatVnd(totals.estimatedCommission)}
          </div>
        </div>
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4">
          <div className="text-[11px] text-emerald-300 uppercase font-semibold">Lợi nhuận ròng (Net P&amp;L)</div>
          <div className={`text-xl font-black mt-1 ${(totals.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatVnd(totals.netProfit)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('PNL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'PNL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>P&amp;L Từng Chi Nhánh</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('EXPENSES')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'EXPENSES' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Chi Phí &amp; Duyệt Tối Cao ({pendingExecCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('COMMISSIONS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'COMMISSIONS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Cấu Trúc Hoa Hồng ({rules.length})</span>
        </button>
      </div>

      {/* Tab 1: Branch P&L */}
      {activeTab === 'PNL' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                <th className="py-3 px-4">Chi nhánh</th>
                <th className="py-3 px-4 text-right">Đơn hàng</th>
                <th className="py-3 px-4 text-right">Doanh thu thuần</th>
                <th className="py-3 px-4 text-right">COGS</th>
                <th className="py-3 px-4 text-right">LN Gộp (%)</th>
                <th className="py-3 px-4 text-right">OPEX</th>
                <th className="py-3 px-4 text-right">Hoa hồng</th>
                <th className="py-3 px-4 text-right">Lợi nhuận ròng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(pnlData?.branchPnl || []).map((row) => (
                <tr key={row.branchId} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{row.branchName}</div>
                    <div className="text-[10px] font-mono text-cyan-400">{row.branchCode}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{row.ordersCount}</td>
                  <td className="py-3 px-4 text-right font-mono text-white">{formatVnd(row.netRevenue)}</td>
                  <td className="py-3 px-4 text-right font-mono text-amber-300">{formatVnd(row.cogs)}</td>
                  <td className="py-3 px-4 text-right font-mono text-cyan-300">
                    {formatVnd(row.grossProfit)} ({row.grossMarginPct}%)
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-300">{formatVnd(row.totalOpex)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatVnd(row.estimatedCommission)}</td>
                  <td className={`py-3 px-4 text-right font-mono font-bold ${row.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatVnd(row.netProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Expenses & Executive Approvals */}
      {activeTab === 'EXPENSES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleCreateExpense} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Ghi nhận Chi phí Vận hành (OPEX)</span>
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-400 block mb-1">Chi nhánh *</label>
                  <select
                    required
                    value={expenseForm.branchId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, branchId: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                  >
                    <option value="">-- Chọn CN --</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.branchCode} - {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Tháng (YYYY-MM) *</label>
                  <input
                    required
                    value={expenseForm.monthKey}
                    onChange={(e) => setExpenseForm({ ...expenseForm, monthKey: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-400 block mb-1">Hạng mục *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                  >
                    {Object.entries(EXPENSE_CAT_LABELS).map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Số tiền (VND) *</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-amber-300"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Diễn giải chi tiết *</label>
                <input
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="VD: Thuê mặt bằng Q1 tháng 11"
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer">
                Lưu Chi Phí Chi Nhánh
              </button>
            </form>

            {/* Executive Approvals Queue */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-sm text-amber-300">Hàng đợi Phê Duyệt Tối Cao (Executive)</h3>
              {execApprovals.length === 0 ? (
                <p className="text-xs text-slate-500">Không có yêu cầu cấp Executive nào.</p>
              ) : (
                execApprovals.map((req) => (
                  <div key={req._id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-cyan-400">{req.requestCode}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold">{req.status}</span>
                    </div>
                    <div className="font-semibold text-white">
                      {req.type} • {formatVnd(req.estimatedAmount)}
                    </div>
                    <p className="text-slate-400">{req.reason}</p>
                    {req.status === 'PENDING' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleExecutiveAction(req._id, true)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Duyệt Tối Cao</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExecutiveAction(req._id, false)}
                          className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Từ chối</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-4">Mã &amp; CN</th>
                  <th className="py-2.5 px-4">Kỳ / Hạng mục</th>
                  <th className="py-2.5 px-4 text-right">Số tiền</th>
                  <th className="py-2.5 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expenses.map((ex) => (
                  <tr key={ex._id}>
                    <td className="py-2.5 px-4">
                      <div className="font-mono font-bold text-cyan-400">{ex.expenseCode}</div>
                      <div className="text-[10px] text-slate-400">{ex.branchId?.branchCode || ''}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-white">{EXPENSE_CAT_LABELS[ex.category] || ex.category} ({ex.monthKey})</div>
                      <div className="text-[11px] text-slate-400">{ex.description}</div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-300">{formatVnd(ex.amount)}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold">{ex.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Commission Structure & Report */}
      {activeTab === 'COMMISSIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleCreateRule} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <h3 className="font-bold text-sm text-white">Thiết lập Quy tắc Hoa hồng Toàn chuỗi</h3>
              <div>
                <label className="text-slate-400 block mb-1">Tên chính sách thưởng *</label>
                <input
                  required
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="VD: Phụ kiện 15% hoặc Laptop 100k/máy"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-400 block mb-1">Áp dụng Danh mục</label>
                  <select
                    value={ruleForm.categoryId}
                    onChange={(e) => setRuleForm({ ...ruleForm, categoryId: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                  >
                    <option value="">Mặc định toàn hệ thống</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Công thức tính</label>
                  <select
                    value={ruleForm.ruleType}
                    onChange={(e) => setRuleForm({ ...ruleForm, ruleType: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                  >
                    <option value="FIXED_PER_UNIT">Cố định (VND / máy)</option>
                    <option value="PERCENT_OF_REVENUE">Phần trăm (% doanh thu)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">
                  Giá trị ({ruleForm.ruleType === 'PERCENT_OF_REVENUE' ? '%' : 'VND'}) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={ruleForm.value}
                  onChange={(e) => setRuleForm({ ...ruleForm, value: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-emerald-400"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer">
                Thêm Quy Tắc Hoa Hồng
              </button>
            </form>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
              <h4 className="font-bold text-slate-200">Quy tắc đang cấu hình</h4>
              {rules.map((r) => (
                <div key={r._id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{r.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {r.categoryId?.name || 'Mặc định toàn chuỗi'} •{' '}
                      {r.ruleType === 'FIXED_PER_UNIT' ? `${formatVnd(r.value)}/máy` : `${r.value}%`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleRule(r)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                      r.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {r.isActive ? 'Đang bật' : 'Đang tắt'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
            <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
              <span className="font-bold text-sm text-white">Ước tính Quỹ Hoa hồng Nhân sự (30 ngày)</span>
              <span className="font-mono font-bold text-emerald-400">
                Tổng: {formatVnd(commReport?.totalCommission)}
              </span>
            </div>
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-4">Nhân viên</th>
                  <th className="py-2.5 px-4">Chi nhánh</th>
                  <th className="py-2.5 px-4 text-right">Đơn bán</th>
                  <th className="py-2.5 px-4 text-right">Doanh số thuần</th>
                  <th className="py-2.5 px-4 text-right">Hoa hồng tạm tính</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(commReport?.staffCommissions || []).map((st) => (
                  <tr key={st.staffId}>
                    <td className="py-2.5 px-4 font-bold text-white">{st.fullName}</td>
                    <td className="py-2.5 px-4 font-mono text-cyan-400">{st.branchCode}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{st.ordersCount}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{formatVnd(st.netRevenue)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatVnd(st.commissionAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HqFinancePage;
