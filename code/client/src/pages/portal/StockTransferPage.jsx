import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  ArrowLeftRight,
  Plus,
  Truck,
  CheckCircle2,
  Store,
  Barcode,
  X,
  AlertCircle,
  Loader2,
  Layers
} from 'lucide-react';
import axiosClient from '../../services/axiosClient.js';

export const StockTransferPage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const [activeTab, setActiveTab] = useState('outbound'); // 'outbound' | 'inbound'
  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Create Transfer Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    sourceBranchId: authUser?.branchId || '',
    destinationBranchId: '',
    productId: '',
    productSkuId: '',
    quantity: 1,
    serialNumbers: [],
    notes: ''
  });
  const [availableSerials, setAvailableSerials] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Receive Verification Modal State
  const [selectedTransferForReceive, setSelectedTransferForReceive] = useState(null);
  const [scannedSerials, setScannedSerials] = useState([]);
  const [scanInput, setScanInput] = useState('');
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receiveError, setReceiveError] = useState('');

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;
    const fetchInitialData = async () => {
      try {
        setError('');
        const [transfersRes, branchesRes, productsRes] = await Promise.all([
          axiosClient.get(`/inventory/transfers?type=${activeTab}`),
          axiosClient.get('/branches'),
          axiosClient.get('/products')
        ]);

        if (!ignore) {
          setTransfers(transfersRes.data?.transfers || []);
          const branchList = branchesRes.data?.branches || [];
          setBranches(branchList);
          setProducts(productsRes.data?.products || []);

          setCreateForm((prev) => {
            if (!prev.sourceBranchId && branchList.length > 0) {
              return {
                ...prev,
                sourceBranchId: authUser?.branchId || branchList[0]._id,
                destinationBranchId: branchList.length > 1 ? branchList[1]._id : branchList[0]._id
              };
            }
            return prev;
          });
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Không thể tải dữ liệu điều chuyển kho.'
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchInitialData();
    return () => {
      ignore = true;
    };
  }, [activeTab, refreshTrigger, authUser?.branchId]);

  // Load available IN_STOCK serials when product/sku and source branch change
  const handleProductChange = async (productId) => {
    const selectedProd = products.find((p) => p._id === productId);
    const firstSkuId = selectedProd?.skus?.[0]?._id || '';

    setCreateForm((prev) => ({
      ...prev,
      productId,
      productSkuId: firstSkuId,
      serialNumbers: []
    }));

    if (selectedProd && firstSkuId) {
      fetchAvailableSerials(createForm.sourceBranchId, firstSkuId);
    }
  };

  const handleSkuChange = (skuId) => {
    setCreateForm((prev) => ({
      ...prev,
      productSkuId: skuId,
      serialNumbers: []
    }));
    fetchAvailableSerials(createForm.sourceBranchId, skuId);
  };

  const fetchAvailableSerials = async (branchId, skuId) => {
    if (!branchId || !skuId) return;
    try {
      const res = await axiosClient.get(`/serials?branchId=${branchId}&status=IN_STOCK&productSkuId=${skuId}`);
      setAvailableSerials(res.data?.serials || []);
    } catch {
      setAvailableSerials([]);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.sourceBranchId || !createForm.destinationBranchId) {
      setCreateError('Vui lòng chọn cả chi nhánh xuất và chi nhánh tiếp nhận.');
      return;
    }
    if (createForm.sourceBranchId === createForm.destinationBranchId) {
      setCreateError('Chi nhánh tiếp nhận phải khác chi nhánh xuất chuyển.');
      return;
    }
    if (!createForm.productId || !createForm.productSkuId) {
      setCreateError('Vui lòng chọn sản phẩm và biến thể SKU cần chuyển.');
      return;
    }

    const currentProd = products.find((p) => p._id === createForm.productId);
    if (currentProd?.isSerialManaged && createForm.serialNumbers.length !== Number(createForm.quantity)) {
      setCreateError(
        `Sản phẩm có quản lý Serial yêu cầu chọn đúng ${createForm.quantity} mã Serial tương ứng.`
      );
      return;
    }

    try {
      setCreateLoading(true);
      await axiosClient.post('/inventory/transfers', {
        sourceBranchId: createForm.sourceBranchId,
        destinationBranchId: createForm.destinationBranchId,
        productId: createForm.productId,
        productSkuId: createForm.productSkuId,
        quantity: Number(createForm.quantity),
        serialNumbers: createForm.serialNumbers,
        notes: createForm.notes
      });

      setSuccessMsg('Tạo phiếu điều chuyển kho thành công!');
      setIsCreateModalOpen(false);
      setLoading(true);
      setRefreshTrigger((prev) => prev + 1);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setCreateError(
        err.response?.data?.message ||
          err.message ||
          'Không thể tạo phiếu điều chuyển kho.'
      );
    } finally {
      setCreateLoading(false);
    }
  };

  // Receive Verification Flow
  const handleOpenReceiveModal = (transfer) => {
    setSelectedTransferForReceive(transfer);
    setScannedSerials([]);
    setScanInput('');
    setReceiveError('');
  };

  const handleAddScannedSerial = (serial) => {
    const clean = serial.trim().toUpperCase();
    if (!clean) return;
    if (!selectedTransferForReceive?.serialNumbers?.includes(clean)) {
      setReceiveError(`Mã Serial '${clean}' không thuộc danh mục phiếu điều chuyển này.`);
      return;
    }
    if (scannedSerials.includes(clean)) {
      setReceiveError(`Mã Serial '${clean}' đã được quét trước đó.`);
      return;
    }
    setScannedSerials((prev) => [...prev, clean]);
    setScanInput('');
    setReceiveError('');
  };

  const handleConfirmReceive = async () => {
    if (!selectedTransferForReceive) return;
    setReceiveError('');

    const expectedCount = selectedTransferForReceive.serialNumbers?.length || 0;
    if (expectedCount > 0 && scannedSerials.length < expectedCount) {
      setReceiveError(
        `Bạn mới chỉ quét đối chiếu ${scannedSerials.length}/${expectedCount} máy. Vui lòng quét đủ tất cả mã Serial!`
      );
      return;
    }

    try {
      setReceiveLoading(true);
      await axiosClient.patch(`/inventory/transfers/${selectedTransferForReceive._id}/receive`, {
        scannedSerials
      });

      setSuccessMsg(`Nhập kho thành công phiếu ${selectedTransferForReceive.transferCode}!`);
      setSelectedTransferForReceive(null);
      setLoading(true);
      setRefreshTrigger((prev) => prev + 1);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setReceiveError(
        err.response?.data?.message ||
          err.message ||
          'Tiếp nhận điều chuyển kho thất bại.'
      );
    } finally {
      setReceiveLoading(false);
    }
  };

  // KPIs
  const totalCount = transfers.length;
  const inTransitCount = transfers.filter((t) => t.status === 'IN_TRANSIT').length;
  const completedCount = transfers.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <ArrowLeftRight className="w-6 h-6 text-blue-500" />
            <span>Điều chuyển Tồn kho Liên Chi nhánh</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản trị luân chuyển thiết bị giữa các chi nhánh, cập nhật trạng thái TRANSIT và nhập kho
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreateModalOpen(true);
            setCreateError('');
            if (products.length > 0 && !createForm.productId) {
              handleProductChange(products[0]._id);
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>TẠO PHIẾU ĐIỀU CHUYỂN</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Tổng phiếu</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{totalCount}</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-400">Đang trên đường (TRANSIT)</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-2">{inTransitCount}</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-400">Đã nhập kho (COMPLETED)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 mt-2">{completedCount}</p>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('outbound')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'outbound'
              ? 'bg-slate-800 text-white border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Yêu cầu chuyển đi (Outbound)</span>
        </button>

        <button
          onClick={() => setActiveTab('inbound')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'inbound'
              ? 'bg-slate-800 text-white border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Tiếp nhận chuyển đến (Inbound)</span>
        </button>
      </div>

      {/* Transfer Queue Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Đang tải danh sách điều chuyển...</p>
          </div>
        ) : transfers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Không có phiếu điều chuyển nào trong mục này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Mã phiếu</th>
                  <th className="py-3.5 px-4">Chi nhánh xuất</th>
                  <th className="py-3.5 px-4">Chi nhánh nhận</th>
                  <th className="py-3.5 px-4">Sản phẩm & SKU</th>
                  <th className="py-3.5 px-4 text-center">Số lượng</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4">Ngày tạo</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {transfers.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                      {item.transferCode}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {item.sourceBranchId?.name || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {item.destinationBranchId?.name || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white truncate max-w-[200px]">
                        {item.productName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-white">
                      {item.quantity} máy
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" />
                          ĐÃ NHẬP KHO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-500/40">
                          <Truck className="w-3 h-3" />
                          ĐANG TRANSIT
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {activeTab === 'inbound' && item.status === 'IN_TRANSIT' ? (
                        <button
                          onClick={() => handleOpenReceiveModal(item)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Xác nhận nhập kho
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          {item.status === 'COMPLETED' ? 'Đã hoàn tất' : 'Đang xử lý'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Create Transfer */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                <span>Tạo phiếu điều chuyển tồn kho</span>
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Branch Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Chi nhánh xuất</label>
                  <select
                    value={createForm.sourceBranchId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCreateForm((prev) => ({ ...prev, sourceBranchId: val }));
                      if (createForm.productSkuId) {
                        fetchAvailableSerials(val, createForm.productSkuId);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    required
                  >
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Chi nhánh nhận</label>
                  <select
                    value={createForm.destinationBranchId}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, destinationBranchId: e.target.value }))
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    required
                  >
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product & SKU */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Chọn sản phẩm</label>
                <select
                  value={createForm.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.brand})
                    </option>
                  ))}
                </select>
              </div>

              {createForm.productId && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Chọn biến thể SKU</label>
                  <select
                    value={createForm.productSkuId}
                    onChange={(e) => handleSkuChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    required
                  >
                    {products
                      .find((p) => p._id === createForm.productId)
                      ?.skus?.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.sku} - {new Intl.NumberFormat('vi-VN').format(s.price)}đ
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Số lượng xuất chuyển</label>
                <input
                  type="number"
                  min="1"
                  value={createForm.quantity}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, quantity: Math.max(1, Number(e.target.value)) }))
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  required
                />
              </div>

              {/* Serial Selector for Serial-managed items */}
              {products.find((p) => p._id === createForm.productId)?.isSerialManaged && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 font-bold">
                    <span>Chọn Serial xuất kho ({createForm.serialNumbers.length}/{createForm.quantity}):</span>
                    <span className="text-[10px] text-blue-400">
                      {availableSerials.length} Serial IN_STOCK
                    </span>
                  </div>

                  {availableSerials.length === 0 ? (
                    <p className="text-[11px] text-amber-400">
                      Không tìm thấy Serial nào ở trạng thái IN_STOCK tại chi nhánh xuất này.
                    </p>
                  ) : (
                    <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/40">
                      {availableSerials.map((s) => {
                        const isChecked = createForm.serialNumbers.includes(s.serialNumber);
                        return (
                          <label
                            key={s._id}
                            className="flex items-center justify-between py-1 px-1 cursor-pointer hover:bg-slate-900 rounded-lg text-slate-300 font-mono text-[11px]"
                          >
                            <span>{s.serialNumber}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (createForm.serialNumbers.length < createForm.quantity) {
                                    setCreateForm((prev) => ({
                                      ...prev,
                                      serialNumbers: [...prev.serialNumbers, s.serialNumber]
                                    }));
                                  }
                                } else {
                                  setCreateForm((prev) => ({
                                    ...prev,
                                    serialNumbers: prev.serialNumbers.filter((x) => x !== s.serialNumber)
                                  }));
                                }
                              }}
                              className="rounded-md text-blue-600 bg-slate-900 border-slate-700"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Ghi chú điều chuyển</label>
                <input
                  type="text"
                  value={createForm.notes}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Lý do cân bằng tồn kho hoặc yêu cầu chi nhánh..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-md shadow-blue-600/30 disabled:opacity-60"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tạo phiếu...</span>
                    </>
                  ) : (
                    <span>Xác nhận xuất chuyển</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Inbound Receiving Verification Drawer/Modal */}
      {selectedTransferForReceive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Barcode className="w-4 h-4 text-emerald-400" />
                <span>Kiểm đếm & Xác nhận nhập kho</span>
              </h2>
              <button
                onClick={() => setSelectedTransferForReceive(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {receiveError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs">
                {receiveError}
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <p className="text-slate-400">
                Phiếu điều chuyển: <strong className="text-blue-400">{selectedTransferForReceive.transferCode}</strong>
              </p>
              <p className="text-white font-bold">{selectedTransferForReceive.productName}</p>
              <p className="text-[11px] text-slate-400">
                Số lượng: <strong className="text-white">{selectedTransferForReceive.quantity} máy</strong>
              </p>
            </div>

            {/* Serial Scanning / Verification */}
            {selectedTransferForReceive.serialNumbers?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-300">Đối chiếu Serial trên kiện hàng:</span>
                  <span className="text-emerald-400">
                    Đã quét: {scannedSerials.length} / {selectedTransferForReceive.serialNumbers.length}
                  </span>
                </div>

                {/* Scan Barcode Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddScannedSerial(scanInput);
                      }
                    }}
                    placeholder="Quét mã vạch hoặc gõ Serial..."
                    className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddScannedSerial(scanInput)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    Quét
                  </button>
                </div>

                {/* Serial Checklist */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {selectedTransferForReceive.serialNumbers.map((sn) => {
                    const isScanned = scannedSerials.includes(sn);
                    return (
                      <div
                        key={sn}
                        onClick={() => handleAddScannedSerial(sn)}
                        className={`p-2 rounded-xl border flex items-center justify-between font-mono text-[11px] cursor-pointer transition-colors ${
                          isScanned
                            ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span>{sn}</span>
                        {isScanned ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <span className="text-[10px] text-slate-500">Bấm để xác nhận</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTransferForReceive(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmReceive}
                disabled={receiveLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-md shadow-emerald-600/30 disabled:opacity-60"
              >
                {receiveLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang cập nhật tồn kho...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Xác nhận nhập kho chi nhánh</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransferPage;
