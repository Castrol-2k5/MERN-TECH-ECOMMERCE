import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  ClipboardCheck,
  Barcode,
  Plus,
  CheckCircle2,
  AlertTriangle,
  PackagePlus,
  Wrench,
  RefreshCw,
  Send,
  XCircle
} from 'lucide-react';
import inventoryService from '../../features/inventory/services/inventoryService.js';
import axiosClient from '../../services/axiosClient.js';
import usePosAudio from '../../features/pos/hooks/usePosAudio.js';

export const BranchStocktakePage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const isManagerOrAdmin = ['BRANCH_MANAGER', 'SUPER_ADMIN'].includes(authUser?.role);
  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';
  const myBranchId =
    typeof authUser?.branchId === 'object' ? authUser?.branchId?._id || '' : authUser?.branchId || '';

  const { playSuccessBeep, playErrorBeep } = usePosAudio();

  const [activeTab, setActiveTab] = useState('STOCKTAKE'); // 'STOCKTAKE' | 'REQUESTS' | 'RMA'
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [toast, setToast] = useState(null);

  // Reference data
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);

  // Tab 1: Stocktake state
  const [stocktakes, setStocktakes] = useState([]);
  const [selectedStocktake, setSelectedStocktake] = useState(null);
  const [scanInput, setScanInput] = useState('');
  const [completeNote, setCompleteNote] = useState('');
  const [newStocktakeNote, setNewStocktakeNote] = useState('');

  // Tab 2: Pull Transfer Request state
  const [transferRequests, setTransferRequests] = useState([]);
  const [reqSourceBranchId, setReqSourceBranchId] = useState('');
  const [reqProductId, setReqProductId] = useState('');
  const [reqSkuId, setReqSkuId] = useState('');
  const [reqQty, setReqQty] = useState(1);
  const [reqReason, setReqReason] = useState('');

  // Tab 3: RMA Outbound state
  const [defectiveSerials, setDefectiveSerials] = useState([]);
  const [rmaHistory, setRmaHistory] = useState([]);
  const [selectedDefective, setSelectedDefective] = useState([]);
  const [rmaDestType, setRmaDestType] = useState('HQ_CENTER');
  const [rmaDestName, setRmaDestName] = useState('Kho Trung Tâm Bảo Hành HQ');
  const [rmaTracking, setRmaTracking] = useState('');
  const [rmaReason, setRmaReason] = useState('');

  const [busy, setBusy] = useState(false);

  const requestKey = `${activeTab}:${refreshTick}`;
  const isLoading = loadedKey !== requestKey;

  const notify = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let active = true;
    Promise.all([axiosClient.get('/branches'), axiosClient.get('/products?limit=100')])
      .then(([bRes, pRes]) => {
        if (!active) return;
        const bList = bRes.data?.branches || [];
        setBranches(bList);
        const hq = bList.find((b) => b.isHeadquarter || b.branchCode === 'BR-HQ') || bList[0];
        if (hq) setReqSourceBranchId((prev) => prev || hq._id);

        const pList = pRes.data?.products || [];
        setProducts(pList);
        if (pList[0]) {
          setReqProductId((prev) => prev || pList[0]._id);
          if (pList[0].skus?.[0]) {
            setReqSkuId((prev) => prev || pList[0].skus[0]._id);
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      inventoryService.getStocktakes(),
      inventoryService.getTransferRequests(),
      inventoryService.getDefectiveSerials(),
      inventoryService.getRmaOutbounds()
    ])
      .then(([stkList, reqList, defList, rmaList]) => {
        if (!cancelled) {
          setStocktakes(stkList);
          setTransferRequests(reqList);
          setDefectiveSerials(defList);
          setRmaHistory(rmaList);
          setLoadedKey(requestKey);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setToast({
            type: 'error',
            message: err?.response?.data?.message || err?.message || 'Lỗi tải dữ liệu kiểm kho.'
          });
          setLoadedKey(requestKey);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const selectedProductObj = useMemo(
    () => products.find((p) => p._id === reqProductId) || null,
    [products, reqProductId]
  );

  // Handlers Tab 1
  const handleCreateStocktake = async () => {
    setBusy(true);
    try {
      const created = await inventoryService.createStocktake({ note: newStocktakeNote.trim() });
      if (created) {
        setSelectedStocktake(created);
        setNewStocktakeNote('');
        notify('success', `Đã khởi tạo phiên kiểm kho ${created.stocktakeCode}`);
        setRefreshTick((t) => t + 1);
      }
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Không thể tạo phiên kiểm kho.');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenStocktake = async (id) => {
    try {
      const detail = await inventoryService.getStocktakeDetail(id);
      setSelectedStocktake(detail);
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Không thể tải chi tiết kiểm kho.');
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStocktake || !scanInput.trim()) return;
    const serialNumbers = scanInput
      .split(/[\s,;]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (serialNumbers.length === 0) return;

    setBusy(true);
    try {
      const res = await inventoryService.scanStocktakeSerials(selectedStocktake._id, { serialNumbers });
      if (res?.stocktake) {
        setSelectedStocktake(res.stocktake);
      }
      setScanInput('');
      playSuccessBeep();
      notify('success', `Đã ghi nhận ${res?.newlyAddedCount || 0} mã Serial mới.`);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      playErrorBeep();
      notify('error', err?.response?.data?.message || err?.message || 'Lỗi quét mã Serial.');
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteStocktake = async () => {
    if (!selectedStocktake) return;
    setBusy(true);
    try {
      const done = await inventoryService.completeStocktake(selectedStocktake._id, {
        note: completeNote.trim()
      });
      setSelectedStocktake(done);
      setCompleteNote('');
      notify('success', `Đã chốt biên bản kiểm kho ${done?.stocktakeCode}!`);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Không thể chốt biên bản.');
    } finally {
      setBusy(false);
    }
  };

  // Handlers Tab 2
  const handleCreateTransferRequest = async (e) => {
    e.preventDefault();
    if (!reqSourceBranchId || !reqProductId || !reqSkuId) return;
    setBusy(true);
    try {
      const created = await inventoryService.createTransferRequest({
        sourceBranchId: reqSourceBranchId,
        items: [{ productId: reqProductId, productSkuId: reqSkuId, quantity: Number(reqQty) || 1 }],
        reason: reqReason.trim()
      });
      setReqReason('');
      notify('success', `Đã gửi yêu cầu xin cấp hàng ${created?.requestCode}!`);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Không thể gửi yêu cầu cấp hàng.');
    } finally {
      setBusy(false);
    }
  };

  const handleApproveTransferRequest = async (reqId) => {
    setBusy(true);
    try {
      await inventoryService.approveTransferRequest(reqId, {
        reviewNote: 'Đã duyệt cấp hàng bổ sung'
      });
      notify('success', 'Đã duyệt yêu cầu xin cấp hàng!');
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Không thể duyệt yêu cầu.');
    } finally {
      setBusy(false);
    }
  };

  const handleRejectTransferRequest = async (reqId) => {
    setBusy(true);
    try {
      await inventoryService.rejectTransferRequest(reqId, {
        reviewNote: 'Kho nguồn hiện chưa đủ tồn'
      });
      notify('success', 'Đã từ chối yêu cầu cấp hàng.');
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Không thể từ chối.');
    } finally {
      setBusy(false);
    }
  };

  // Handlers Tab 3
  const handleToggleDefective = (sn) => {
    setSelectedDefective((prev) =>
      prev.includes(sn) ? prev.filter((x) => x !== sn) : [...prev, sn]
    );
  };

  const handleCreateRma = async (e) => {
    e.preventDefault();
    if (selectedDefective.length === 0) return;
    setBusy(true);
    try {
      const created = await inventoryService.createRmaOutbound({
        destinationType: rmaDestType,
        destinationName: rmaDestName.trim(),
        trackingNumber: rmaTracking.trim(),
        reason: rmaReason.trim(),
        serialNumbers: selectedDefective
      });
      setSelectedDefective([]);
      setRmaTracking('');
      setRmaReason('');
      notify('success', `Đã lập phiếu xuất lô RMA ${created?.rmaCode} (${created?.items?.length || 0} máy).`);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      notify('error', err?.response?.data?.message || err?.message || 'Không thể lập phiếu RMA.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>Kiểm Soát Kho Chuỗi • UC-BM-05 &amp; UC-BM-06</span>
          </div>
          <h1 className="text-xl font-black text-white">
            Kiểm Kho Serial, Xin Cấp Hàng &amp; Xuất Hàng Lỗi RMA
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Đối chiếu tồn kho thực tế bằng mã IMEI/Serial, đề xuất điều chuyển từ HQ và gom xuất trả hàng lỗi RMA
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshTick((t) => t + 1)}
          disabled={isLoading}
          className="self-start sm:self-auto px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {toast && (
        <div
          className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-slate-900 border border-slate-800 rounded-2xl p-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('STOCKTAKE')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === 'STOCKTAKE' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Barcode className="w-4 h-4" />
          <span>Kiểm Kho Serial ({stocktakes.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('REQUESTS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === 'REQUESTS' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <PackagePlus className="w-4 h-4" />
          <span>Xin Cấp Hàng HQ ({transferRequests.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('RMA')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
            activeTab === 'RMA' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Hàng Lỗi RMA ({defectiveSerials.length})</span>
        </button>
      </div>

      {/* TAB 1: KIỂM KHO SERIAL */}
      {activeTab === 'STOCKTAKE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Sessions List & Create */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            {isManagerOrAdmin && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <p className="text-xs font-bold text-white">Tạo phiên kiểm kho mới</p>
                <input
                  type="text"
                  value={newStocktakeNote}
                  onChange={(e) => setNewStocktakeNote(e.target.value)}
                  placeholder="Ghi chú đợt kiểm kho (VD: Tuần 2/11)..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCreateStocktake}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Snapshot &amp; Bắt đầu kiểm kho</span>
                </button>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              <p className="text-[11px] font-bold uppercase text-slate-400">Danh sách phiên kiểm kê</p>
              {stocktakes.map((s) => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => handleOpenStocktake(s._id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                    selectedStocktake?._id === s._id
                      ? 'bg-blue-950/40 border-blue-500/60'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">{s.stocktakeCode}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {s.status === 'COMPLETED' ? 'Đã chốt' : 'Đang quét'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Kỳ vọng: {s.summary?.expectedCount || 0} • Khớp: {s.summary?.matchedCount || 0} • Thiếu:{' '}
                    <span className="text-rose-400 font-bold">{s.summary?.missingCount || 0}</span>
                  </p>
                </button>
              ))}
              {stocktakes.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">Chưa có phiên kiểm kho nào.</p>
              )}
            </div>
          </div>

          {/* Right: Active Stocktake Scan Workspace */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            {!selectedStocktake ? (
              <div className="py-16 text-center text-xs text-slate-500">
                Chọn một phiên kiểm kho ở cột trái hoặc bấm <strong>Snapshot &amp; Bắt đầu kiểm kho</strong> để quét IMEI/Serial.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-mono text-sm font-black text-white">
                      {selectedStocktake.stocktakeCode}
                    </h3>
                    <p className="text-xs text-slate-400">{selectedStocktake.note || 'Kiểm kê tồn kho Serial'}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                      Hệ thống: <strong>{selectedStocktake.summary?.expectedCount || 0}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                      Khớp: <strong>{selectedStocktake.summary?.matchedCount || 0}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300">
                      Thiếu: <strong>{selectedStocktake.summary?.missingCount || 0}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300">
                      Thừa: <strong>{selectedStocktake.summary?.surplusCount || 0}</strong>
                    </span>
                  </div>
                </div>

                {selectedStocktake.status === 'IN_PROGRESS' && (
                  <form onSubmit={handleScanSubmit} className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      placeholder="Quét barcode hoặc nhập danh sách IMEI/Serial (cách nhau bởi dấu phẩy hoặc Enter)..."
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      disabled={busy || !scanInput.trim()}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      Ghi nhận quét
                    </button>
                  </form>
                )}

                {/* Missing & Surplus detail lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5">
                    <p className="font-bold text-rose-300">
                      Serial thiếu chưa quét thấy ({selectedStocktake.missingSerials?.length || 0})
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-[11px] text-rose-200">
                      {(selectedStocktake.missingSerials || []).map((sn) => (
                        <div key={sn} className="px-2 py-1 rounded bg-slate-950/70">
                          {sn}
                        </div>
                      ))}
                      {(selectedStocktake.missingSerials || []).length === 0 && (
                        <p className="text-slate-500 font-sans">Không có Serial nào bị thiếu.</p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                    <p className="font-bold text-amber-300">
                      Serial thừa / ngoài danh sách ({selectedStocktake.surplusSerials?.length || 0})
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-[11px] text-amber-200">
                      {(selectedStocktake.surplusSerials || []).map((sn) => (
                        <div key={sn} className="px-2 py-1 rounded bg-slate-950/70">
                          {sn}
                        </div>
                      ))}
                      {(selectedStocktake.surplusSerials || []).length === 0 && (
                        <p className="text-slate-500 font-sans">Không có Serial lạ nào.</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedStocktake.status === 'IN_PROGRESS' && isManagerOrAdmin && (
                  <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={completeNote}
                      onChange={(e) => setCompleteNote(e.target.value)}
                      placeholder="Kết luận kiểm kho trước khi chốt biên bản..."
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleCompleteStocktake}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      Chốt Biên Bản Kiểm Kho
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: XIN CẤP HÀNG HQ (PULL TRANSFER) */}
      {activeTab === 'REQUESTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {isManagerOrAdmin && (
            <form
              onSubmit={handleCreateTransferRequest}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
            >
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Send className="w-4 h-4 text-blue-400" />
                Gửi Yêu Cầu Xin Cấp Hàng
              </h3>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Kho nguồn cung cấp:</label>
                <select
                  value={reqSourceBranchId}
                  onChange={(e) => setReqSourceBranchId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                >
                  {branches
                    .filter((b) => isSuperAdmin || b._id !== myBranchId)
                    .map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.branchCode})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Sản phẩm:</label>
                <select
                  value={reqProductId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setReqProductId(pid);
                    const p = products.find((x) => x._id === pid);
                    if (p?.skus?.[0]) setReqSkuId(p.skus[0]._id);
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-1">Biến thể SKU:</label>
                  <select
                    value={reqSkuId}
                    onChange={(e) => setReqSkuId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100"
                  >
                    {(selectedProductObj?.skus || []).map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.sku}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Số lượng:</label>
                  <input
                    type="number"
                    min={1}
                    value={reqQty}
                    onChange={(e) => setReqQty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Lý do xin hàng:</label>
                <input
                  type="text"
                  required
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="VD: Máy bán chạy, chi nhánh còn dưới 2 máy..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50"
              >
                Gửi Yêu Cầu Cấp Hàng
              </button>
            </form>
          )}

          <div className={`${isManagerOrAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden`}>
            <div className="p-4 border-b border-slate-800 text-sm font-bold text-white">
              Danh sách Yêu cầu Xin Cấp Hàng (Pull Requests)
            </div>
            <div className="divide-y divide-slate-800/70">
              {transferRequests.map((rq) => {
                const canReviewThis =
                  rq.status === 'PENDING' &&
                  (isSuperAdmin || (isManagerOrAdmin && rq.sourceBranchId?._id === myBranchId));
                return (
                  <div key={rq._id} className="p-4 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono font-bold text-cyan-400">{rq.requestCode}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rq.status === 'APPROVED'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : rq.status === 'REJECTED'
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {rq.status}
                      </span>
                    </div>
                    <p className="text-slate-300">
                      Kho nguồn: <strong>{rq.sourceBranchId?.name}</strong> → Kho nhận:{' '}
                      <strong>{rq.requestingBranchId?.name}</strong>
                    </p>
                    <div className="text-slate-200 font-semibold">
                      {rq.items?.map((it) => `${it.productName} (${it.sku}) x${it.quantity}`).join(', ')}
                    </div>
                    <p className="text-slate-400 italic">Lý do: {rq.reason}</p>
                    {canReviewThis && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleApproveTransferRequest(rq._id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Duyệt cấp hàng</span>
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleRejectTransferRequest(rq._id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Từ chối</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {transferRequests.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-500">Chưa có yêu cầu xin cấp hàng nào.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: XUẤT LÔ HÀNG LỖI RMA */}
      {activeTab === 'RMA' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white">
              Máy lỗi (DEFECTIVE) đang tồn tại chi nhánh ({defectiveSerials.length})
            </h3>
            <div className="divide-y divide-slate-800/70 max-h-96 overflow-y-auto">
              {defectiveSerials.map((sn) => {
                const checked = selectedDefective.includes(sn.serialNumber);
                return (
                  <label
                    key={sn._id}
                    className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-800/40 rounded-lg cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleDefective(sn.serialNumber)}
                        className="rounded border-slate-600"
                      />
                      <div>
                        <span className="font-mono font-bold text-rose-300">{sn.serialNumber}</span>
                        <p className="text-slate-200 font-semibold">{sn.productName}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">{sn.sku}</span>
                  </label>
                );
              })}
              {defectiveSerials.length === 0 && (
                <p className="py-10 text-center text-xs text-slate-500">
                  Hiện không có Serial lỗi (DEFECTIVE) nào cần gom xuất RMA.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {isManagerOrAdmin && (
              <form
                onSubmit={handleCreateRma}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
              >
                <h3 className="text-sm font-bold text-white">Lập Phiếu Xuất Trả RMA ({selectedDefective.length} máy)</h3>
                <select
                  value={rmaDestType}
                  onChange={(e) => setRmaDestType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                >
                  <option value="HQ_CENTER">Gửi về Kho Tổng HQ</option>
                  <option value="BRAND_SERVICE">Gửi Trung tâm Bảo hành Hãng</option>
                </select>
                <input
                  type="text"
                  required
                  value={rmaDestName}
                  onChange={(e) => setRmaDestName(e.target.value)}
                  placeholder="Tên trung tâm / kho nhận RMA"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                />
                <input
                  type="text"
                  value={rmaTracking}
                  onChange={(e) => setRmaTracking(e.target.value)}
                  placeholder="Mã vận đơn chuyển phát (tùy chọn)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100"
                />
                <input
                  type="text"
                  required
                  value={rmaReason}
                  onChange={(e) => setRmaReason(e.target.value)}
                  placeholder="Ghi chú lô hàng lỗi..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                />
                <button
                  type="submit"
                  disabled={busy || selectedDefective.length === 0}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50"
                >
                  Xuất Lô Hàng Lỗi RMA
                </button>
              </form>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-slate-300">Lịch sử phiếu xuất RMA ({rmaHistory.length})</p>
              <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
                {rmaHistory.map((r) => (
                  <div key={r._id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="font-mono font-bold text-cyan-400">{r.rmaCode}</span>
                      <span className="text-slate-400">{r.items?.length || 0} máy</span>
                    </div>
                    <p className="text-slate-200 truncate">{r.destinationName}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchStocktakePage;
