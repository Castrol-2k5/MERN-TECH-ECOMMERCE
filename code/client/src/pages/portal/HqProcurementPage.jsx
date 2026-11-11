import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Building,
  PackagePlus,
  Plus,
  CreditCard,
  CheckCircle2,
  X,
  RefreshCw,
  Truck,
  Barcode
} from 'lucide-react';
import { procurementService } from '../../features/procurement/services/procurementService.js';
import { productService } from '../../features/products/services/productService.js';
import { branchService } from '../../features/branches/services/branchService.js';

const formatVnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')} ₫`;

const PO_STATUS_BADGES = {
  DRAFT: 'bg-slate-700 text-slate-200',
  ORDERED: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
  RECEIVED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
  CANCELLED: 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
};

const PAYMENT_BADGES = {
  UNPAID: 'bg-rose-500/20 text-rose-300',
  PARTIAL: 'bg-amber-500/20 text-amber-300',
  PAID: 'bg-emerald-500/20 text-emerald-300'
};

export const HqProcurementPage = () => {
  const location = useLocation();
  const initialPrefill = location.state?.prefillItems || null;

  const [activeTab, setActiveTab] = useState(() => (initialPrefill ? 'PO' : 'VENDORS'));
  const [vendors, setVendors] = useState([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Modals
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [vendorForm, setVendorForm] = useState({
    vendorCode: '',
    name: '',
    taxCode: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    paymentTermDays: 30
  });

  const [showPoModal, setShowPoModal] = useState(() => Boolean(initialPrefill?.length));
  const [poForm, setPoForm] = useState(() => ({
    vendorId: '',
    warehouseBranchId: '',
    notes: initialPrefill ? 'Đề xuất nhập hàng từ Dự báo Nhu cầu BI' : '',
    items: initialPrefill?.length
      ? initialPrefill.map((p) => ({
          productId: p.productId || '',
          productSkuId: p.productSkuId || '',
          orderedQty: p.recommendedOrderQty || 5,
          unitCost: p.costPrice || 0
        }))
      : [{ productId: '', productSkuId: '', orderedQty: 5, unitCost: 0 }]
  }));

  const [receivingPo, setReceivingPo] = useState(null);
  const [serialInputs, setSerialInputs] = useState({});

  const [payingVendor, setPayingVendor] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    purchaseOrderId: '',
    note: ''
  });

  const showToast = (type, message) => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [vendorRes, poRes, prodRes, branchList] = await Promise.all([
        procurementService.getVendors(),
        procurementService.getPurchaseOrders({ limit: 50 }),
        productService.getProducts({ limit: 200, includeInactive: false }),
        branchService.getBranches()
      ]);
      setVendors(vendorRes?.vendors || []);
      setTotalDebt(vendorRes?.totalOutstandingDebt || 0);
      setPurchaseOrders(poRes?.purchaseOrders || []);
      setProducts(prodRes?.products || []);
      const hqWh = (branchList || []).filter((b) => b.isHeadquarter || b.isWarehouse || b.branchCode === 'BR-HQ');
      setWarehouses(hqWh.length > 0 ? hqWh : branchList || []);
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Không thể tải dữ liệu nhập hàng HQ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      procurementService.getVendors(),
      procurementService.getPurchaseOrders({ limit: 50 }),
      productService.getProducts({ limit: 200, includeInactive: false }),
      branchService.getBranches()
    ])
      .then(([vendorRes, poRes, prodRes, branchList]) => {
        if (ignore) return;
        setVendors(vendorRes?.vendors || []);
        setTotalDebt(vendorRes?.totalOutstandingDebt || 0);
        setPurchaseOrders(poRes?.purchaseOrders || []);
        setProducts(prodRes?.products || []);
        const hqWh = (branchList || []).filter((b) => b.isHeadquarter || b.isWarehouse || b.branchCode === 'BR-HQ');
        setWarehouses(hqWh.length > 0 ? hqWh : branchList || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const openCreateVendor = () => {
    setEditingVendor(null);
    setVendorForm({
      vendorCode: '',
      name: '',
      taxCode: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      paymentTermDays: 30
    });
    setShowVendorModal(true);
  };

  const openEditVendor = (v) => {
    setEditingVendor(v);
    setVendorForm({
      vendorCode: v.vendorCode || '',
      name: v.name || '',
      taxCode: v.taxCode || '',
      contactName: v.contactName || '',
      phone: v.phone || '',
      email: v.email || '',
      address: v.address || '',
      paymentTermDays: v.paymentTermDays ?? 30
    });
    setShowVendorModal(true);
  };

  const handleSaveVendor = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...vendorForm,
        vendorCode: vendorForm.vendorCode.trim().toUpperCase(),
        paymentTermDays: Math.max(0, Number(vendorForm.paymentTermDays || 0))
      };
      if (editingVendor) {
        await procurementService.updateVendor(editingVendor._id, payload);
        showToast('success', 'Đã cập nhật thông tin Nhà cung cấp.');
      } else {
        await procurementService.createVendor(payload);
        showToast('success', 'Đã thêm Nhà cung cấp mới.');
      }
      setShowVendorModal(false);
      await fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Lỗi lưu nhà cung cấp.');
    }
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        vendorId: poForm.vendorId,
        ...(poForm.warehouseBranchId ? { warehouseBranchId: poForm.warehouseBranchId } : {}),
        notes: poForm.notes,
        items: poForm.items.map((it) => ({
          productId: it.productId,
          productSkuId: it.productSkuId,
          orderedQty: Math.max(1, Number(it.orderedQty || 1)),
          unitCost: Math.max(0, Number(it.unitCost || 0))
        }))
      };
      await procurementService.createPurchaseOrder(payload);
      showToast('success', 'Đã tạo Phiếu Nhập Kho Tổng (PO) thành công.');
      setShowPoModal(false);
      await fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Không thể tạo phiếu PO.');
    }
  };

  const openReceiveModal = (po) => {
    setReceivingPo(po);
    const initInputs = {};
    (po.items || []).forEach((it) => {
      initInputs[it.productSkuId] = {
        receivedQty: it.orderedQty,
        serialsText: ''
      };
    });
    setSerialInputs(initInputs);
  };

  const handleConfirmReceivePo = async (e) => {
    e.preventDefault();
    if (!receivingPo) return;
    try {
      const itemsPayload = (receivingPo.items || []).map((it) => {
        const inp = serialInputs[it.productSkuId] || {};
        const serials = String(inp.serialsText || '')
          .split(/[\r\n,;]+/)
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
        return {
          productSkuId: it.productSkuId,
          receivedQty: Math.max(1, Number(inp.receivedQty || it.orderedQty)),
          serials
        };
      });

      const res = await procurementService.receivePurchaseOrder(receivingPo._id, {
        items: itemsPayload
      });
      const updatesCount = res?.weightedCostUpdates?.length || 0;
      showToast(
        'success',
        `Đã nhập kho ${receivingPo.poCode} và cập nhật giá vốn bình quân cho ${updatesCount} SKU.`
      );
      setReceivingPo(null);
      await fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Lỗi xác nhận nhập kho PO.');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payingVendor) return;
    try {
      await procurementService.recordVendorPayment(payingVendor._id, {
        amount: Number(paymentForm.amount),
        ...(paymentForm.purchaseOrderId ? { purchaseOrderId: paymentForm.purchaseOrderId } : {}),
        note: paymentForm.note
      });
      showToast('success', `Đã ghi nhận thanh toán công nợ cho ${payingVendor.name}.`);
      setPayingVendor(null);
      await fetchAll();
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Lỗi thanh toán công nợ.');
    }
  };

  const pendingPoCount = purchaseOrders.filter((p) => ['DRAFT', 'ORDERED'].includes(p.status)).length;
  const totalPurchasedValue = vendors.reduce((s, v) => s + Number(v.totalPurchased || 0), 0);

  return (
    <div className="space-y-5 font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            <span>Master Supply Chain • Đầu Vào Kho Tổng</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Nhà Cung Cấp &amp; Nhập Hàng Kho Tổng (PO)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý hợp đồng NCC, tạo phiếu nhập mua, quét Serial vào Kho HQ, tự động tính Giá vốn bình quân &amp; đối trừ Công nợ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAll}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openCreateVendor}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-100 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Thêm NCC</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPoModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Tạo Phiếu Nhập PO</span>
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

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Nhà cung cấp đang hợp tác</div>
          <div className="text-2xl font-black text-white mt-1">{vendors.length}</div>
        </div>
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-rose-300 uppercase">Tổng công nợ phải trả NCC</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{formatVnd(totalDebt)}</div>
        </div>
        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-blue-300 uppercase">Phiếu PO chờ nhập kho</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{pendingPoCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-emerald-300 uppercase">Tổng giá trị đã nhập HQ</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{formatVnd(totalPurchasedValue)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('VENDORS')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'VENDORS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Nhà Cung Cấp &amp; Công Nợ ({vendors.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PO')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'PO' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <PackagePlus className="w-3.5 h-3.5" />
          <span>Phiếu Nhập Kho HQ ({purchaseOrders.length})</span>
        </button>
      </div>

      {/* Tab 1: Vendors */}
      {activeTab === 'VENDORS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                <th className="py-3 px-4">Mã &amp; Tên NCC</th>
                <th className="py-3 px-4">Liên hệ</th>
                <th className="py-3 px-4 text-right">Hạn TT</th>
                <th className="py-3 px-4 text-right">Đã nhập</th>
                <th className="py-3 px-4 text-right">Đã trả</th>
                <th className="py-3 px-4 text-right">Còn nợ</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Chưa có Nhà cung cấp nào. Bấm &quot;Thêm NCC&quot; để khởi tạo.
                  </td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{v.name}</div>
                      <div className="text-[10px] font-mono text-cyan-400">
                        {v.vendorCode} {v.taxCode ? `• MST: ${v.taxCode}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{v.contactName || '--'} • <span className="font-mono">{v.phone}</span></div>
                      <div className="text-[10px] text-slate-400">{v.address || v.email || ''}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{v.paymentTermDays ?? 30} ngày</td>
                    <td className="py-3 px-4 text-right font-mono">{formatVnd(v.totalPurchased)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400">{formatVnd(v.totalPaid)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                      {formatVnd(v.outstandingDebt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditVendor(v)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer"
                        >
                          Sửa
                        </button>
                        {Number(v.outstandingDebt || 0) > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPayingVendor(v);
                              setPaymentForm({
                                amount: String(v.outstandingDebt),
                                purchaseOrderId: '',
                                note: `Thanh toán công nợ ${v.vendorCode}`
                              });
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Trả nợ</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Purchase Orders */}
      {activeTab === 'PO' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                <th className="py-3 px-4">Mã PO</th>
                <th className="py-3 px-4">Nhà cung cấp / Kho</th>
                <th className="py-3 px-4">Danh sách hàng</th>
                <th className="py-3 px-4 text-right">Tổng tiền</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Thanh toán</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Chưa có phiếu nhập kho HQ nào.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po._id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      <div>{po.poCode}</div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {new Date(po.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{po.vendorId?.name || '--'}</div>
                      <div className="text-[10px] text-slate-400">
                        Kho nhận: {po.warehouseBranchId?.branchCode || 'BR-HQ'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {(po.items || []).map((it) => (
                        <div key={it.productSkuId} className="text-[11px]">
                          <span className="font-mono text-cyan-300">{it.sku}</span> • SL:{' '}
                          <strong>{it.status === 'RECEIVED' ? it.receivedQty : it.orderedQty}</strong> @{' '}
                          {formatVnd(it.unitCost)}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {formatVnd(po.totalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${PO_STATUS_BADGES[po.status] || ''}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${PAYMENT_BADGES[po.paymentStatus] || ''}`}>
                        {po.paymentStatus} ({formatVnd(po.paidAmount)}/{formatVnd(po.totalAmount)})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {['DRAFT', 'ORDERED'].includes(po.status) && (
                        <button
                          type="button"
                          onClick={() => openReceiveModal(po)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Nhận hàng &amp; Quét Serial</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add/Edit Vendor */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">
                {editingVendor ? 'Cập nhật Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
              </h3>
              <button type="button" onClick={() => setShowVendorModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveVendor} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Mã NCC *</label>
                  <input
                    required
                    value={vendorForm.vendorCode}
                    onChange={(e) => setVendorForm({ ...vendorForm, vendorCode: e.target.value.toUpperCase() })}
                    placeholder="NPP-FPT"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">SĐT liên hệ *</label>
                  <input
                    required
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    placeholder="02873008888"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Tên Nhà Cung Cấp *</label>
                <input
                  required
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  placeholder="Công ty TNHH Synnex FPT"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Người phụ trách</label>
                  <input
                    value={vendorForm.contactName}
                    onChange={(e) => setVendorForm({ ...vendorForm, contactName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Hạn công nợ (ngày)</label>
                  <input
                    type="number"
                    min="0"
                    value={vendorForm.paymentTermDays}
                    onChange={(e) => setVendorForm({ ...vendorForm, paymentTermDays: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="px-4 py-1.5 bg-slate-800 rounded-xl"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer">
                  Lưu Nhà Cung Cấp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Create PO */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">Tạo Phiếu Nhập Mua Kho Tổng (PO)</h3>
              <button type="button" onClick={() => setShowPoModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreatePo} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Nhà cung cấp *</label>
                  <select
                    required
                    value={poForm.vendorId}
                    onChange={(e) => setPoForm({ ...poForm, vendorId: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                  >
                    <option value="">-- Chọn Nhà cung cấp --</option>
                    {vendors.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.vendorCode} - {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Kho nhận hàng (HQ)</label>
                  <select
                    value={poForm.warehouseBranchId}
                    onChange={(e) => setPoForm({ ...poForm, warehouseBranchId: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                  >
                    <option value="">Tự động chọn Kho Tổng HQ</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.branchCode} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Mặt hàng đặt nhập</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPoForm({
                        ...poForm,
                        items: [...poForm.items, { productId: '', productSkuId: '', orderedQty: 5, unitCost: 0 }]
                      })
                    }
                    className="text-cyan-400 font-bold cursor-pointer"
                  >
                    + Thêm dòng SKU
                  </button>
                </div>

                {poForm.items.map((item, idx) => {
                  const selectedProd = products.find((p) => String(p._id) === String(item.productId));
                  const skus = selectedProd?.skus || [];
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="col-span-4">
                        <label className="text-[10px] text-slate-400 block mb-1">Sản phẩm</label>
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => {
                            const prodId = e.target.value;
                            const p = products.find((x) => String(x._id) === String(prodId));
                            const firstSku = p?.skus?.[0];
                            const next = [...poForm.items];
                            next[idx] = {
                              ...next[idx],
                              productId: prodId,
                              productSkuId: firstSku?._id || '',
                              unitCost: firstSku?.costPrice || 0
                            };
                            setPoForm({ ...poForm, items: next });
                          }}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg"
                        >
                          <option value="">-- Chọn SP --</option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] text-slate-400 block mb-1">SKU</label>
                        <select
                          required
                          value={item.productSkuId}
                          onChange={(e) => {
                            const sId = e.target.value;
                            const s = skus.find((x) => String(x._id) === String(sId));
                            const next = [...poForm.items];
                            next[idx] = {
                              ...next[idx],
                              productSkuId: sId,
                              unitCost: s?.costPrice || next[idx].unitCost
                            };
                            setPoForm({ ...poForm, items: next });
                          }}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-mono"
                        >
                          <option value="">-- SKU --</option>
                          {skus.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.sku}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-1">SL</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.orderedQty}
                          onChange={(e) => {
                            const next = [...poForm.items];
                            next[idx] = { ...next[idx], orderedQty: e.target.value };
                            setPoForm({ ...poForm, items: next });
                          }}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-mono"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] text-slate-400 block mb-1">Giá nhập (VND)</label>
                        <input
                          type="number"
                          min="0"
                          step="10000"
                          required
                          value={item.unitCost}
                          onChange={(e) => {
                            const next = [...poForm.items];
                            next[idx] = { ...next[idx], unitCost: e.target.value };
                            setPoForm({ ...poForm, items: next });
                          }}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-mono text-amber-300"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Ghi chú phiếu nhập</label>
                <input
                  value={poForm.notes}
                  onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPoModal(false)} className="px-4 py-1.5 bg-slate-800 rounded-xl">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer">
                  Tạo Phiếu Nhập PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Receive PO & Scan Serials */}
      {receivingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Barcode className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Nhận hàng vào Kho HQ: {receivingPo.poCode}</h3>
              </div>
              <button type="button" onClick={() => setReceivingPo(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleConfirmReceivePo} className="space-y-3 text-xs">
              {(receivingPo.items || []).map((it) => {
                const inp = serialInputs[it.productSkuId] || { receivedQty: it.orderedQty, serialsText: '' };
                return (
                  <div key={it.productSkuId} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white">{it.productName}</span>{' '}
                        <span className="font-mono text-cyan-400">({it.sku})</span>
                      </div>
                      <span className="text-amber-300 font-mono">Đặt: {it.orderedQty} • {formatVnd(it.unitCost)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">SL thực nhận</label>
                        <input
                          type="number"
                          min="1"
                          value={inp.receivedQty}
                          onChange={(e) =>
                            setSerialInputs({
                              ...serialInputs,
                              [it.productSkuId]: { ...inp, receivedQty: e.target.value }
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-1">
                          {it.isSerialManaged ? `Danh sách ${inp.receivedQty} Serial/IMEI (mỗi dòng 1 mã) *` : 'Không yêu cầu Serial'}
                        </label>
                        <textarea
                          rows={3}
                          disabled={!it.isSerialManaged}
                          value={inp.serialsText}
                          onChange={(e) =>
                            setSerialInputs({
                              ...serialInputs,
                              [it.productSkuId]: { ...inp, serialsText: e.target.value }
                            })
                          }
                          placeholder="SN-001&#10;SN-002&#10;SN-003"
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReceivingPo(null)} className="px-4 py-1.5 bg-slate-800 rounded-xl">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer">
                  Xác nhận Nhập Kho HQ &amp; Cập Nhật Giá Vốn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Vendor Payment */}
      {payingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">Thanh toán công nợ: {payingVendor.name}</h3>
              <button type="button" onClick={() => setPayingVendor(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex justify-between">
                <span className="text-slate-400">Công nợ hiện tại:</span>
                <span className="font-mono font-bold text-rose-400">{formatVnd(payingVendor.outstandingDebt)}</span>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Gắn theo phiếu PO (tùy chọn)</label>
                <select
                  value={paymentForm.purchaseOrderId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, purchaseOrderId: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                >
                  <option value="">-- Thanh toán công nợ tổng --</option>
                  {purchaseOrders
                    .filter(
                      (p) =>
                        String(p.vendorId?._id || p.vendorId) === String(payingVendor._id) &&
                        p.status === 'RECEIVED' &&
                        p.paymentStatus !== 'PAID'
                    )
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.poCode} (Còn nợ {formatVnd(Number(p.totalAmount) - Number(p.paidAmount || 0))})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Số tiền thanh toán (VND) *</label>
                <input
                  type="number"
                  min="1000"
                  max={payingVendor.outstandingDebt}
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-emerald-400"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Ghi chú ủy nhiệm chi</label>
                <input
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPayingVendor(null)} className="px-4 py-1.5 bg-slate-800 rounded-xl">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer">
                  Xác nhận Thanh Toán
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HqProcurementPage;
