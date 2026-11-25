import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Building,
  PackagePlus,
  Plus,
  CreditCard,
  CheckCircle2,
  X,
  RefreshCw,
  Truck,
  Barcode,
  Trash2,
  Printer,
  Eye,
  Ban,
  Upload,
  AlertCircle,
  Search
} from 'lucide-react';
import { procurementService } from '../../features/procurement/services/procurementService.js';
import { productService } from '../../features/products/services/productService.js';
import { branchService } from '../../features/branches/services/branchService.js';
import { PoPrintReceiptModal } from '../../features/procurement/components/PoPrintReceiptModal.jsx';

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

const extractApiError = (err, fallback = 'Đã xảy ra lỗi.') => {
  const fieldErrors = Array.isArray(err?.errors)
    ? err.errors.map((e) => e?.message || e).filter(Boolean)
    : Array.isArray(err?.response?.data?.errors)
      ? err.response.data.errors.map((e) => e?.message || e).filter(Boolean)
      : [];
  const baseMsg = err?.response?.data?.message || err?.message || fallback;
  if (fieldErrors.length > 0) {
    return `${baseMsg}: ${fieldErrors.join('; ')}`;
  }
  return baseMsg;
};

const fetchAllActiveProducts = async () => {
  const firstRes = await productService.getProducts({ page: 1, limit: 100 });
  if (firstRes?.error) {
    throw new Error(firstRes.error);
  }
  const allProducts = [...(firstRes?.products || [])];
  const totalPages = Math.min(10, Number(firstRes?.meta?.totalPages || 1));

  if (totalPages > 1) {
    const restCalls = [];
    for (let p = 2; p <= totalPages; p += 1) {
      restCalls.push(productService.getProducts({ page: p, limit: 100 }));
    }
    const restResults = await Promise.all(restCalls);
    restResults.forEach((r) => {
      if (Array.isArray(r?.products)) allProducts.push(...r.products);
    });
  }
  return allProducts;
};

const parseSerialsFromText = (text) =>
  String(text || '')
    .split(/[\r\n,;]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

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
  const [modalError, setModalError] = useState('');

  // PO Filters
  const [poStatusFilter, setPoStatusFilter] = useState('ALL');
  const [poVendorFilter, setPoVendorFilter] = useState('ALL');

  // Vendor Modal
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
    paymentTermDays: 30,
    notes: '',
    isActive: true
  });

  // Create PO Modal
  const [showPoModal, setShowPoModal] = useState(() => Boolean(initialPrefill?.length));
  const [productSearch, setProductSearch] = useState('');
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

  // Receive PO Modal
  const [receivingPo, setReceivingPo] = useState(null);
  const [serialInputs, setSerialInputs] = useState({});

  // Detail / Payment History / Print Modals
  const [detailPo, setDetailPo] = useState(null);
  const [printingPo, setPrintingPo] = useState(null);

  // Payment Modal
  const [payingVendor, setPayingVendor] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    purchaseOrderId: '',
    note: ''
  });

  const showToast = useCallback((type, message) => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 5000);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [vendorRes, poRes, prodRes, branchRes] = await Promise.allSettled([
        procurementService.getVendors(),
        procurementService.getPurchaseOrders({ limit: 100 }),
        fetchAllActiveProducts(),
        branchService.getBranches()
      ]);

      const errors = [];
      if (vendorRes.status === 'fulfilled') {
        setVendors(vendorRes.value?.vendors || []);
        setTotalDebt(vendorRes.value?.totalOutstandingDebt || 0);
      } else {
        errors.push(extractApiError(vendorRes.reason, 'Lỗi tải NCC'));
      }

      if (poRes.status === 'fulfilled') {
        setPurchaseOrders(poRes.value?.purchaseOrders || []);
      } else {
        errors.push(extractApiError(poRes.reason, 'Lỗi tải PO'));
      }

      if (prodRes.status === 'fulfilled') {
        setProducts(prodRes.value || []);
      } else {
        errors.push(extractApiError(prodRes.reason, 'Lỗi tải sản phẩm'));
      }

      if (branchRes.status === 'fulfilled') {
        const branchList = branchRes.value || [];
        const hqWh = branchList.filter((b) => b.isHeadquarter || b.isWarehouse || b.branchCode === 'BR-HQ');
        setWarehouses(hqWh.length > 0 ? hqWh : branchList);
      }

      if (errors.length > 0) {
        showToast('error', errors.join(' | '));
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let ignore = false;
    Promise.allSettled([
      procurementService.getVendors(),
      procurementService.getPurchaseOrders({ limit: 100 }),
      fetchAllActiveProducts(),
      branchService.getBranches()
    ])
      .then(([vendorRes, poRes, prodRes, branchRes]) => {
        if (ignore) return;
        const errors = [];
        if (vendorRes.status === 'fulfilled') {
          setVendors(vendorRes.value?.vendors || []);
          setTotalDebt(vendorRes.value?.totalOutstandingDebt || 0);
        } else {
          errors.push(extractApiError(vendorRes.reason, 'Lỗi tải NCC'));
        }

        if (poRes.status === 'fulfilled') {
          setPurchaseOrders(poRes.value?.purchaseOrders || []);
        } else {
          errors.push(extractApiError(poRes.reason, 'Lỗi tải PO'));
        }

        if (prodRes.status === 'fulfilled') {
          setProducts(prodRes.value || []);
        } else {
          errors.push(extractApiError(prodRes.reason, 'Lỗi tải sản phẩm'));
        }

        if (branchRes.status === 'fulfilled') {
          const branchList = branchRes.value || [];
          const hqWh = branchList.filter((b) => b.isHeadquarter || b.isWarehouse || b.branchCode === 'BR-HQ');
          setWarehouses(hqWh.length > 0 ? hqWh : branchList);
        }

        if (errors.length > 0) {
          showToast('error', errors.join(' | '));
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [showToast]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        (p.skus || []).some((s) => (s.sku || s.code || '').toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      if (poStatusFilter !== 'ALL' && po.status !== poStatusFilter) return false;
      if (poVendorFilter !== 'ALL' && String(po.vendorId?._id || po.vendorId) !== poVendorFilter) return false;
      return true;
    });
  }, [purchaseOrders, poStatusFilter, poVendorFilter]);

  const poEstimatedTotal = useMemo(
    () =>
      poForm.items.reduce(
        (sum, it) => sum + Math.max(0, Number(it.orderedQty || 0)) * Math.max(0, Number(it.unitCost || 0)),
        0
      ),
    [poForm.items]
  );

  const openCreateVendor = () => {
    setModalError('');
    setEditingVendor(null);
    setVendorForm({
      vendorCode: '',
      name: '',
      taxCode: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      paymentTermDays: 30,
      notes: '',
      isActive: true
    });
    setShowVendorModal(true);
  };

  const openEditVendor = (v) => {
    setModalError('');
    setEditingVendor(v);
    setVendorForm({
      vendorCode: v.vendorCode || '',
      name: v.name || '',
      taxCode: v.taxCode || '',
      contactName: v.contactName || '',
      phone: v.phone || '',
      email: v.email || '',
      address: v.address || '',
      paymentTermDays: v.paymentTermDays ?? 30,
      notes: v.notes || '',
      isActive: v.isActive !== false
    });
    setShowVendorModal(true);
  };

  const handleSaveVendor = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const payload = {
        vendorCode: vendorForm.vendorCode.trim().toUpperCase(),
        name: vendorForm.name.trim(),
        taxCode: vendorForm.taxCode.trim(),
        contactName: vendorForm.contactName.trim(),
        phone: vendorForm.phone.trim(),
        email: vendorForm.email.trim(),
        address: vendorForm.address.trim(),
        paymentTermDays: Math.max(0, Number(vendorForm.paymentTermDays || 0)),
        notes: vendorForm.notes.trim(),
        isActive: Boolean(vendorForm.isActive)
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
      setModalError(extractApiError(err, 'Lỗi lưu nhà cung cấp.'));
    }
  };

  const openCreatePoModal = () => {
    setModalError('');
    setProductSearch('');
    setPoForm({
      vendorId: vendors[0]?._id || '',
      warehouseBranchId: warehouses[0]?._id || '',
      notes: '',
      items: [{ productId: '', productSkuId: '', orderedQty: 5, unitCost: 0 }]
    });
    setShowPoModal(true);
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const payload = {
        vendorId: poForm.vendorId,
        ...(poForm.warehouseBranchId ? { warehouseBranchId: poForm.warehouseBranchId } : {}),
        notes: poForm.notes.trim(),
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
      setActiveTab('PO');
      await fetchAll();
    } catch (err) {
      setModalError(extractApiError(err, 'Không thể tạo phiếu PO.'));
    }
  };

  const handleCancelPo = async (po) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy phiếu nhập ${po.poCode} không?`)) return;
    try {
      await procurementService.updatePurchaseOrderStatus(po._id, 'CANCELLED');
      showToast('success', `Đã hủy phiếu nhập ${po.poCode}.`);
      await fetchAll();
    } catch (err) {
      showToast('error', extractApiError(err, 'Không thể hủy phiếu nhập.'));
    }
  };

  const openReceiveModal = (po) => {
    setModalError('');
    setReceivingPo(po);
    const initInputs = {};
    (po.items || []).forEach((it) => {
      initInputs[String(it.productSkuId)] = {
        receivedQty: it.orderedQty,
        serialsText: ''
      };
    });
    setSerialInputs(initInputs);
  };

  const handleUploadSerialFileForSku = async (skuId, file) => {
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      const headerBlacklist = new Set(['SERIAL', 'SERIALNUMBER', 'SERIAL_NUMBER', 'IMEI', 'MA_SERIAL', 'CODE']);

      const extracted = [];
      rows.forEach((row, idx) => {
        const rawCell = Array.isArray(row) ? row[0] : '';
        const cleaned = String(rawCell || '').trim().toUpperCase();
        if (!cleaned) return;
        if (idx === 0 && headerBlacklist.has(cleaned.replace(/\s+/g, ''))) return;
        extracted.push(cleaned);
      });

      const uniqueSerials = Array.from(new Set(extracted));
      if (uniqueSerials.length === 0) {
        setModalError('File không có mã Serial/IMEI hợp lệ ở cột đầu tiên.');
        return;
      }

      setModalError('');
      setSerialInputs((prev) => {
        const key = String(skuId);
        const cur = prev[key] || { receivedQty: uniqueSerials.length, serialsText: '' };
        const merged = Array.from(new Set([...parseSerialsFromText(cur.serialsText), ...uniqueSerials]));
        return {
          ...prev,
          [key]: {
            ...cur,
            serialsText: merged.join('\n')
          }
        };
      });
    } catch (err) {
      setModalError(`Không thể đọc file Excel/CSV: ${err.message}`);
    }
  };

  const handleConfirmReceivePo = async (e) => {
    e.preventDefault();
    if (!receivingPo) return;
    setModalError('');
    try {
      const itemsPayload = (receivingPo.items || []).map((it) => {
        const inp = serialInputs[String(it.productSkuId)] || {};
        const serials = parseSerialsFromText(inp.serialsText);
        return {
          productSkuId: String(it.productSkuId),
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
      setModalError(extractApiError(err, 'Lỗi xác nhận nhập kho PO.'));
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payingVendor) return;
    setModalError('');
    try {
      const res = await procurementService.recordVendorPayment(payingVendor._id, {
        amount: Number(paymentForm.amount),
        ...(paymentForm.purchaseOrderId ? { purchaseOrderId: paymentForm.purchaseOrderId } : {}),
        note: paymentForm.note.trim()
      });
      const allocatedCount = res?.allocatedPurchaseOrders?.length || 0;
      showToast(
        'success',
        allocatedCount > 0
          ? `Đã thanh toán cho ${payingVendor.name} và tự động gạch nợ ${allocatedCount} phiếu PO.`
          : `Đã ghi nhận thanh toán công nợ cho ${payingVendor.name}.`
      );
      setPayingVendor(null);
      await fetchAll();
    } catch (err) {
      setModalError(extractApiError(err, 'Lỗi thanh toán công nợ.'));
    }
  };

  const pendingPoCount = purchaseOrders.filter((p) => ['DRAFT', 'ORDERED'].includes(p.status)).length;
  const totalPurchasedValue = vendors.reduce((s, v) => s + Number(v.totalPurchased || 0), 0);

  return (
    <div className="space-y-5 font-sans text-slate-100">
      {/* Floating Toast (luôn nổi trên mọi Modal) */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-[100] max-w-md p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-3 shadow-2xl ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/95 border-rose-500/60 text-rose-200'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{toastMsg.message}</span>
          <button type="button" onClick={() => setToastMsg(null)} className="opacity-70 hover:opacity-100 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            <span>Master Supply Chain • Đầu Vào Kho Tổng</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Nhà Cung Cấp &amp; Nhập Hàng Kho Tổng (PO)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý hợp đồng NCC, tạo phiếu nhập mua, quét Serial vào Kho HQ, tự động tính Giá vốn bình quân &amp; đối trừ Công nợ FIFO.
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
            onClick={openCreatePoModal}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Tạo Phiếu Nhập PO</span>
          </button>
        </div>
      </div>

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

      {/* Tabs + PO Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        {activeTab === 'PO' && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={poVendorFilter}
              onChange={(e) => setPoVendorFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
            >
              <option value="ALL">Tất cả Nhà cung cấp</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.vendorCode} - {v.name}
                </option>
              ))}
            </select>
            <select
              value={poStatusFilter}
              onChange={(e) => setPoStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
            >
              <option value="ALL">Mọi trạng thái PO</option>
              <option value="ORDERED">ORDERED (Chờ nhận)</option>
              <option value="RECEIVED">RECEIVED (Đã nhập kho)</option>
              <option value="CANCELLED">CANCELLED (Đã hủy)</option>
            </select>
          </div>
        )}
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
                      <div>
                        {v.contactName || '--'} • <span className="font-mono">{v.phone}</span>
                      </div>
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
                              setModalError('');
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
              {filteredPurchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Không có phiếu nhập kho HQ nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredPurchaseOrders.map((po) => (
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
                          <strong>{it.status === 'RECEIVED' || po.status === 'RECEIVED' ? it.receivedQty : it.orderedQty}</strong> @{' '}
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
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {['DRAFT', 'ORDERED'].includes(po.status) && (
                          <>
                            <button
                              type="button"
                              onClick={() => openReceiveModal(po)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Nhận hàng</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelPo(po)}
                              className="px-2 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              title="Hủy phiếu nhập"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Hủy</span>
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setDetailPo(po)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer"
                          title="Chi tiết & Lịch sử thanh toán"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintingPo(po)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg cursor-pointer"
                          title="In Phiếu Nhập Kho"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">
                {editingVendor ? 'Cập nhật Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
              </h3>
              <button type="button" onClick={() => setShowVendorModal(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveVendor} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Mã NCC *</label>
                  <input
                    required
                    minLength={2}
                    value={vendorForm.vendorCode}
                    onChange={(e) => setVendorForm({ ...vendorForm, vendorCode: e.target.value.toUpperCase() })}
                    placeholder="NPP-FPT"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">SĐT liên hệ * (tối thiểu 8 số)</label>
                  <input
                    required
                    minLength={8}
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
                  minLength={2}
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  placeholder="Công ty TNHH Synnex FPT"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Mã số thuế (MST)</label>
                  <input
                    value={vendorForm.taxCode}
                    onChange={(e) => setVendorForm({ ...vendorForm, taxCode: e.target.value })}
                    placeholder="0301234567"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Email</label>
                  <input
                    type="email"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    placeholder="contact@vendor.vn"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                  />
                </div>
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
                    max="365"
                    value={vendorForm.paymentTermDays}
                    onChange={(e) => setVendorForm({ ...vendorForm, paymentTermDays: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Địa chỉ</label>
                <input
                  value={vendorForm.address}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                  placeholder="Số 123, Quận 1, TP.HCM"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Ghi chú hợp đồng</label>
                <input
                  value={vendorForm.notes}
                  onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="px-4 py-1.5 bg-slate-800 rounded-xl cursor-pointer"
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">Tạo Phiếu Nhập Mua Kho Tổng (PO)</h3>
              <button type="button" onClick={() => setShowPoModal(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-200">
                    Mặt hàng đặt nhập ({products.length} sản phẩm khả dụng)
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Lọc nhanh SP / SKU..."
                        className="pl-8 pr-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-[11px] w-44"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPoForm({
                          ...poForm,
                          items: [...poForm.items, { productId: '', productSkuId: '', orderedQty: 5, unitCost: 0 }]
                        })
                      }
                      className="px-2.5 py-1 bg-cyan-500/15 border border-cyan-500/30 rounded-lg text-cyan-300 font-bold cursor-pointer"
                    >
                      + Thêm dòng SKU
                    </button>
                  </div>
                </div>

                {poForm.items.map((item, idx) => {
                  const selectedProd = products.find((p) => String(p._id) === String(item.productId));
                  const skus = selectedProd?.skus || [];
                  const dropdownProds = selectedProd && !filteredProducts.some((p) => p._id === selectedProd._id)
                    ? [selectedProd, ...filteredProducts]
                    : filteredProducts;

                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="col-span-4">
                        <label className="text-[10px] text-slate-400 block mb-1">
                          Sản phẩm{' '}
                          {selectedProd && (
                            <span className={selectedProd.isSerialManaged !== false ? 'text-cyan-400' : 'text-amber-300'}>
                              ({selectedProd.isSerialManaged !== false ? 'Serial/IMEI' : 'Số lượng'})
                            </span>
                          )}
                        </label>
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
                          className="w-full px-2 py-1.5 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg"
                        >
                          <option value="" className="bg-slate-900 text-slate-300">-- Chọn SP --</option>
                          {dropdownProds.map((p) => (
                            <option key={p._id} value={p._id} className="bg-slate-900 text-slate-100">
                              {p.brand ? `[${p.brand}] ` : ''}{p.name}
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
                          className="w-full px-2 py-1.5 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg font-mono"
                        >
                          <option value="" className="bg-slate-900 text-slate-300">-- SKU --</option>
                          {skus.map((s) => (
                            <option key={s._id} value={s._id} className="bg-slate-900 text-slate-100">
                              {s.sku || s.code}
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
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-1">Giá nhập (VND)</label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
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
                      <div className="col-span-1 flex justify-end">
                        {poForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPoForm({
                                ...poForm,
                                items: poForm.items.filter((_, i) => i !== idx)
                              })
                            }
                            className="p-1.5 bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 rounded-lg cursor-pointer"
                            title="Xóa dòng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5">
                <span className="text-slate-400 font-semibold">Tổng giá trị phiếu nhập dự kiến:</span>
                <span className="font-mono font-black text-sm text-cyan-300">{formatVnd(poEstimatedTotal)}</span>
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
                <button type="button" onClick={() => setShowPoModal(false)} className="px-4 py-1.5 bg-slate-800 rounded-xl cursor-pointer">
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Barcode className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Nhận hàng vào Kho HQ: {receivingPo.poCode}</h3>
              </div>
              <button type="button" onClick={() => setReceivingPo(null)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReceivePo} className="space-y-3 text-xs">
              {(receivingPo.items || []).map((it) => {
                const key = String(it.productSkuId);
                const inp = serialInputs[key] || { receivedQty: it.orderedQty, serialsText: '' };
                const enteredSerials = parseSerialsFromText(inp.serialsText);
                const targetQty = Math.max(1, Number(inp.receivedQty || 0));
                const isExactCount = enteredSerials.length === targetQty;

                return (
                  <div key={key} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
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
                              [key]: { ...inp, receivedQty: e.target.value }
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-mono"
                        />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[10px] text-slate-400">
                            {it.isSerialManaged ? (
                              <>
                                Serial/IMEI:{' '}
                                <span className={`font-bold ${isExactCount ? 'text-emerald-400' : 'text-amber-300'}`}>
                                  Đã nhập {enteredSerials.length} / {targetQty} mã
                                </span>
                              </>
                            ) : (
                              'Quản lý theo số lượng (không cần Serial)'
                            )}
                          </label>
                          {it.isSerialManaged && (
                            <label className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md text-[10px] text-cyan-300 font-semibold inline-flex items-center gap-1 cursor-pointer">
                              <Upload className="w-3 h-3" />
                              <span>Nạp Excel/CSV</span>
                              <input
                                type="file"
                                accept=".xlsx,.xls,.csv,.txt"
                                className="hidden"
                                onChange={(e) => {
                                  handleUploadSerialFileForSku(key, e.target.files?.[0]);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          )}
                        </div>
                        <textarea
                          rows={3}
                          disabled={!it.isSerialManaged}
                          value={inp.serialsText}
                          onChange={(e) =>
                            setSerialInputs({
                              ...serialInputs,
                              [key]: { ...inp, serialsText: e.target.value }
                            })
                          }
                          placeholder={it.isSerialManaged ? 'SN-001\nSN-002\nSN-003' : 'Không yêu cầu Serial'}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReceivingPo(null)} className="px-4 py-1.5 bg-slate-800 rounded-xl cursor-pointer">
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

      {/* Modal Detail & Payment History */}
      {detailPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">Chi tiết Phiếu Nhập {detailPo.poCode}</h3>
                <p className="text-[11px] text-slate-400">
                  NCC: {detailPo.vendorId?.name || '--'} • Kho: {detailPo.warehouseBranchId?.branchCode || 'BR-HQ'}
                </p>
              </div>
              <button type="button" onClick={() => setDetailPo(null)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-200">Danh sách mặt hàng</div>
              {(detailPo.items || []).map((it, idx) => (
                <div key={it.productSkuId || idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-white">
                      {it.productName} <span className="font-mono text-cyan-400">({it.sku})</span>
                    </span>
                    <span className="font-mono font-bold">{formatVnd(it.subtotal)}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Đặt: {it.orderedQty} • Thực nhận: {detailPo.status === 'RECEIVED' ? it.receivedQty : '--'} • Đơn giá: {formatVnd(it.unitCost)}
                  </div>
                  {Array.isArray(it.serials) && it.serials.length > 0 && (
                    <div className="text-[10px] font-mono text-emerald-300 break-all">
                      Serial ({it.serials.length}): {it.serials.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Lịch sử thanh toán công nợ</span>
                <span className="font-mono text-amber-300">
                  Đã trả: {formatVnd(detailPo.paidAmount)} / {formatVnd(detailPo.totalAmount)}
                </span>
              </div>
              {(!detailPo.payments || detailPo.payments.length === 0) ? (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 text-center">
                  Chưa có giao dịch thanh toán nào cho phiếu này.
                </div>
              ) : (
                <div className="divide-y divide-slate-800 bg-slate-950 border border-slate-800 rounded-xl">
                  {detailPo.payments.map((pm, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{pm.note || 'Thanh toán công nợ'}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(pm.paidAt).toLocaleString('vi-VN')} • {pm.paidByName || 'Quản trị viên HQ'}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">+{formatVnd(pm.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const target = detailPo;
                  setDetailPo(null);
                  setPrintingPo(target);
                }}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Phiếu Nhập</span>
              </button>
              <button type="button" onClick={() => setDetailPo(null)} className="px-4 py-1.5 bg-slate-800 rounded-xl cursor-pointer">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Print PO */}
      {printingPo && <PoPrintReceiptModal po={printingPo} onClose={() => setPrintingPo(null)} />}

      {/* Modal Vendor Payment */}
      {payingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">Thanh toán công nợ: {payingVendor.name}</h3>
              <button type="button" onClick={() => setPayingVendor(null)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

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
                  <option value="">-- Thanh toán công nợ tổng (Tự động gạch nợ FIFO) --</option>
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
                <button type="button" onClick={() => setPayingVendor(null)} className="px-4 py-1.5 bg-slate-800 rounded-xl cursor-pointer">
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
