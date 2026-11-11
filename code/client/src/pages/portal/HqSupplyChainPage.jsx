import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight,
  SlidersHorizontal,
  Zap,
  RefreshCw,
  Save,
  Boxes
} from 'lucide-react';
import { hqService } from '../../features/hq/services/hqService.js';
import { branchService } from '../../features/branches/services/branchService.js';

export const HqSupplyChainPage = () => {
  const [activeTab, setActiveTab] = useState('REPLENISH'); // 'REPLENISH' | 'DEAD_STOCK' | 'THRESHOLDS'
  const [hqBranch, setHqBranch] = useState(null);
  const [replenishments, setReplenishments] = useState([]);
  const [deadStocks, setDeadStocks] = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [editedMap, setEditedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (type, message) => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchAll = useCallback(async (bId = branchFilter, search = searchTerm) => {
    setLoading(true);
    try {
      const [repRes, deadRes, thrRes, brList] = await Promise.all([
        hqService.getReplenishmentSuggestions(),
        hqService.getDeadStockSuggestions(30),
        hqService.getThresholds({ branchId: bId, search }),
        branchService.getBranches()
      ]);
      setHqBranch(repRes?.hqBranch || null);
      setReplenishments(repRes?.suggestions || []);
      setDeadStocks(deadRes?.suggestions || []);
      setThresholds(thrRes?.items || []);
      setBranches(brList || []);
      setEditedMap({});
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Lỗi tải dữ liệu điều phối chuỗi cung ứng.');
    } finally {
      setLoading(false);
    }
  }, [branchFilter, searchTerm]);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      hqService.getReplenishmentSuggestions(),
      hqService.getDeadStockSuggestions(30),
      hqService.getThresholds({ branchId: 'ALL' }),
      branchService.getBranches()
    ])
      .then(([repRes, deadRes, thrRes, brList]) => {
        if (ignore) return;
        setHqBranch(repRes?.hqBranch || null);
        setReplenishments(repRes?.suggestions || []);
        setDeadStocks(deadRes?.suggestions || []);
        setThresholds(thrRes?.items || []);
        setBranches(brList || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleReplenish = async (sug) => {
    const key = `rep-${sug.destinationBranchId}-${sug.productSkuId}`;
    setBusyKey(key);
    try {
      const res = await hqService.executeAutoReplenishment({
        sourceBranchId: sug.sourceBranchId,
        destinationBranchId: sug.destinationBranchId,
        productId: sug.productId,
        productSkuId: sug.productSkuId,
        quantity: sug.recommendedQty
      });
      const code = res?.transfer?.transferCode || '';
      showToast('success', `Đã xuất điều chuyển ${sug.recommendedQty} máy (${sug.sku}) -> ${sug.destinationBranchCode} (${code}).`);
      await fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Không thể xuất chuyển hàng từ HQ.');
    } finally {
      setBusyKey('');
    }
  };

  const handleRebalance = async (pair) => {
    const key = `reb-${pair.sourceBranchId}-${pair.destinationBranchId}-${pair.productSkuId}`;
    setBusyKey(key);
    try {
      const res = await hqService.executeDeadStockRebalance({
        sourceBranchId: pair.sourceBranchId,
        destinationBranchId: pair.destinationBranchId,
        productId: pair.productId,
        productSkuId: pair.productSkuId,
        quantity: pair.recommendedQty
      });
      const code = res?.transfer?.transferCode || '';
      showToast('success', `Đã tạo lệnh luân chuyển ${pair.recommendedQty} máy tồn chậm từ ${pair.sourceBranchCode} -> ${pair.destinationBranchCode} (${code}).`);
      await fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Không thể luân chuyển hàng tồn chậm.');
    } finally {
      setBusyKey('');
    }
  };

  const handleThresholdEdit = (row, field, value) => {
    const k = `${row.branchId}-${row.productSkuId}`;
    const num = Math.max(0, parseInt(value, 10) || 0);
    const curr = editedMap[k] || {
      branchId: row.branchId,
      productId: row.productId,
      productSkuId: row.productSkuId,
      minStock: row.minStock,
      maxStock: row.maxStock
    };
    setEditedMap({
      ...editedMap,
      [k]: { ...curr, [field]: num }
    });
  };

  const handleSaveThresholds = async () => {
    const items = Object.values(editedMap);
    if (items.length === 0) return;
    setBusyKey('save-thresholds');
    try {
      await hqService.updateThresholds(items);
      showToast('success', `Đã cập nhật định mức Min/Max cho ${items.length} dòng tồn kho.`);
      await fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message);
    } finally {
      setBusyKey('');
    }
  };

  const editedCount = Object.keys(editedMap).length;

  return (
    <div className="space-y-5 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <Boxes className="w-4 h-4" />
            <span>Auto-Replenishment &amp; Capital Balancing</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Điều Phối Chuỗi Cung Ứng Min/Max &amp; Hàng Tồn Chậm</h1>
          <p className="text-xs text-slate-400 mt-1">
            Kho Tổng {hqBranch ? `${hqBranch.branchCode} (${hqBranch.name})` : 'HQ'} tự động đề xuất châm hàng khi chi nhánh tụt dưới Min và giải phóng hàng đóng băng &gt; 30 ngày.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchAll()}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Quét lại chuỗi cung ứng</span>
        </button>
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

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('REPLENISH')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'REPLENISH' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Cấp hàng Tự động Min/Max ({replenishments.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('DEAD_STOCK')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'DEAD_STOCK' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Luân chuyển Tồn chậm &gt;30d ({deadStocks.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('THRESHOLDS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'THRESHOLDS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Cấu hình Min/Max ({thresholds.length})</span>
        </button>
      </div>

      {/* Tab 1: Auto-Replenishment */}
      {activeTab === 'REPLENISH' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                <th className="py-3 px-4">Chi nhánh cần bổ sung</th>
                <th className="py-3 px-4">Sản phẩm / SKU</th>
                <th className="py-3 px-4 text-right">Tồn CN / Min / Max</th>
                <th className="py-3 px-4 text-right">Khả dụng HQ</th>
                <th className="py-3 px-4 text-right">Đề xuất xuất</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {replenishments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    Không có chi nhánh nào tụt dưới ngưỡng Min Stock đã cấu hình.
                  </td>
                </tr>
              ) : (
                replenishments.map((sug) => {
                  const k = `rep-${sug.destinationBranchId}-${sug.productSkuId}`;
                  return (
                    <tr key={k} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{sug.destinationBranchName}</div>
                        <div className="text-[10px] font-mono text-cyan-400">{sug.destinationBranchCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{sug.productName}</div>
                        <div className="text-[10px] font-mono text-amber-300">{sug.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <span className="text-rose-400 font-bold">{sug.currentStock}</span> / {sug.minStock} / {sug.maxStock || '--'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                        {sug.hqAvailable}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-cyan-300">
                        {sug.recommendedQty} máy
                      </td>
                      <td className="py-3 px-4 text-right">
                        {sug.canFulfillFromHq ? (
                          <button
                            type="button"
                            disabled={busyKey === k}
                            onClick={() => handleReplenish(sug)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            {busyKey === k ? 'Đang xuất...' : '1-Click Chuyển Từ HQ'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-rose-400 font-semibold">Kho HQ hết hàng</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Dead Stock Balancing */}
      {activeTab === 'DEAD_STOCK' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                <th className="py-3 px-4">Sản phẩm / SKU</th>
                <th className="py-3 px-4">CN thừa (tồn &gt;30d)</th>
                <th className="py-3 px-4">CN thiếu / bán chạy</th>
                <th className="py-3 px-4 text-right">SL tồn lâu</th>
                <th className="py-3 px-4 text-right">Đề xuất điều chuyển</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {deadStocks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    Chưa phát hiện cặp chi nhánh cần luân chuyển hàng tồn chậm &gt; 30 ngày.
                  </td>
                </tr>
              ) : (
                deadStocks.map((pair) => {
                  const k = `reb-${pair.sourceBranchId}-${pair.destinationBranchId}-${pair.productSkuId}`;
                  return (
                    <tr key={k} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{pair.productName}</div>
                        <div className="text-[10px] font-mono text-cyan-400">{pair.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-amber-300">{pair.sourceBranchCode}</div>
                        <div className="text-[10px] text-slate-400">Bán 30d: {pair.salesAtSource30d} máy</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-emerald-400">{pair.destinationBranchCode}</div>
                        <div className="text-[10px] text-slate-400">
                          Tồn: {pair.destQty} • Min: {pair.destMinStock} • Bán 30d: {pair.salesAtTarget30d}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-400 font-bold">
                        {pair.agedCount} máy
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-cyan-300 font-bold">
                        {pair.recommendedQty} máy
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          disabled={busyKey === k}
                          onClick={() => handleRebalance(pair)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          {busyKey === k ? 'Đang chuyển...' : 'Điều chuyển chéo'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Configure Min/Max Thresholds */}
      {activeTab === 'THRESHOLDS' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={branchFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setBranchFilter(val);
                  fetchAll(val, searchTerm);
                }}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs"
              >
                <option value="ALL">Tất cả chi nhánh</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.branchCode} - {b.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchAll(branchFilter, searchTerm);
                }}
                placeholder="Lọc theo SKU hoặc tên sản phẩm..."
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs w-64"
              />
            </div>

            {editedCount > 0 && (
              <button
                type="button"
                disabled={busyKey === 'save-thresholds'}
                onClick={handleSaveThresholds}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu {editedCount} thay đổi Min/Max</span>
              </button>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-4">Chi nhánh</th>
                  <th className="py-2.5 px-4">Sản phẩm / SKU</th>
                  <th className="py-2.5 px-4 text-right">Tồn hiện tại</th>
                  <th className="py-2.5 px-4 text-right w-32">Min Stock</th>
                  <th className="py-2.5 px-4 text-right w-32">Max Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {thresholds.map((row) => {
                  const k = `${row.branchId}-${row.productSkuId}`;
                  const edited = editedMap[k];
                  const minVal = edited ? edited.minStock : row.minStock;
                  const maxVal = edited ? edited.maxStock : row.maxStock;
                  return (
                    <tr key={k} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono text-cyan-400">{row.branchCode}</td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-white">{row.productName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{row.sku}</div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">
                        <span className={minVal > 0 && row.quantity < minVal ? 'text-rose-400' : 'text-emerald-400'}>
                          {row.quantity}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <input
                          type="number"
                          min="0"
                          value={minVal}
                          onChange={(e) => handleThresholdEdit(row, 'minStock', e.target.value)}
                          className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg font-mono text-right"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <input
                          type="number"
                          min="0"
                          value={maxVal}
                          onChange={(e) => handleThresholdEdit(row, 'maxStock', e.target.value)}
                          className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg font-mono text-right"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HqSupplyChainPage;
