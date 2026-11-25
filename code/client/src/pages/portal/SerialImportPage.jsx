import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  PackagePlus,
  Loader2,
} from 'lucide-react';
import SerialBatchImportCard from '../../features/inventory/components/SerialBatchImportCard';
import SerialParserTextarea from '../../features/inventory/components/SerialParserTextarea';
import ImportSummaryModal from '../../features/inventory/components/ImportSummaryModal';
import ExcelBulkImportPanel from '../../features/inventory/components/ExcelBulkImportPanel';
import apiClient from '../../services/api';
import branchService from '../../features/branches/services/branchService';
import productService from '../../features/products/services/productService';
import inventoryService from '../../features/inventory/services/inventoryService';

export const SerialImportPage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const [importMode, setImportMode] = useState('SINGLE'); // 'SINGLE' | 'BULK_EXCEL'
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSku, setSelectedSku] = useState(null);

  // State cho chế độ Nhập Serial/IMEI
  const [rawText, setRawText] = useState('');
  const [validationReport, setValidationReport] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [existingSerials, setExistingSerials] = useState([]);

  // State cho chế độ Nhập Số lượng (non-serial)
  const [qtyInput, setQtyInput] = useState('10');
  const [qtyReason, setQtyReason] = useState('Nhập kho bổ sung hàng theo số lượng');

  const [isImporting, setIsImporting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = useCallback((type, message) => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 4500);
  }, []);

  const pickDefaultSkuForProduct = useCallback((prod) => {
    if (!prod || !Array.isArray(prod.skus) || prod.skus.length === 0) return null;
    const def = prod.skus.find((s) => s.isDefault) || prod.skus[0];
    return {
      ...def,
      code: def.code || def.sku,
      productName: prod.name,
      productId: prod._id,
      isSerialManaged: prod.isSerialManaged !== false,
      unit: prod.unit || 'Cái',
    };
  }, []);

  // Load branches & products on mount
  useEffect(() => {
    let ignore = false;
    Promise.all([
      branchService.getBranches(),
      productService.getProducts({ limit: 100 }),
    ])
      .then(([branchList, productRes]) => {
        if (ignore) return;
        if (branchList && branchList.length > 0) {
          const sortedBranches = [...branchList].sort((a, b) => {
            const aHq = Boolean(a.isHeadquarter || a.branchCode === 'BR-HQ');
            const bHq = Boolean(b.isHeadquarter || b.branchCode === 'BR-HQ');
            return Number(bHq) - Number(aHq);
          });
          setBranches(sortedBranches);

          const hqBranch = sortedBranches.find((b) => b.isHeadquarter || b.branchCode === 'BR-HQ');
          const initialBranchId =
            authUser?.branchId && sortedBranches.some((b) => b._id === authUser.branchId)
              ? authUser.branchId
              : hqBranch?._id || sortedBranches[0]._id;
          setSelectedBranchId(initialBranchId);
        }

        const prodList = productRes?.products || [];
        if (prodList.length > 0) {
          setProducts(prodList);
          const firstProd = prodList.find((p) => p.skus?.length > 0) || prodList[0];
          setSelectedProduct(firstProd);
          setSelectedSku(pickDefaultSkuForProduct(firstProd));
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [authUser?.branchId, pickDefaultSkuForProduct]);

  // Load existing serials in DB when selecting a Serial-managed SKU
  useEffect(() => {
    if (!selectedProduct || selectedProduct.isSerialManaged === false) {
      return;
    }
    const skuId = selectedSku?._id || selectedSku?.productSkuId;
    if (!skuId) return;

    let ignore = false;
    apiClient
      .get(`/serials?productSkuId=${skuId}`)
      .then((res) => {
        if (!ignore) {
          const list = Array.isArray(res?.data) ? res.data : res?.data?.serials || [];
          setExistingSerials(
            list.map((s) => String(s.serialNumber || '').toUpperCase()).filter(Boolean)
          );
        }
      })
      .catch(() => {
        if (!ignore) setExistingSerials([]);
      });

    return () => {
      ignore = true;
    };
  }, [selectedProduct, selectedSku?._id, selectedSku?.productSkuId]);

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setSelectedSku(pickDefaultSkuForProduct(prod));
    setRawText('');
    setValidationReport(null);
  };

  const selectedBranch =
    branches.find((b) => b._id === selectedBranchId) || branches[0] || null;
  const isSerialManaged = selectedProduct?.isSerialManaged !== false;

  const handleParsedResult = useCallback((report) => {
    setValidationReport(report);
  }, []);

  const handleConfirmSerialImport = async () => {
    if (!validationReport || validationReport.valid === 0) return;
    if (!authUser) {
      showToast('error', 'Vui lòng đăng nhập tài khoản SUPER_ADMIN hoặc BRANCH_MANAGER để nhập kho.');
      return;
    }

    setIsImporting(true);
    try {
      const validSerials = validationReport.items
        .filter((i) => i.status === 'VALID')
        .map((i) => i.serialNumber);

      await apiClient.post('/serials/import', {
        branchId: selectedBranchId,
        productId: selectedProduct?._id,
        productSkuId: selectedSku?._id || selectedSku?.productSkuId,
        serials: validSerials,
      });

      setExistingSerials((prev) => Array.from(new Set([...prev, ...validSerials])));
      setShowSummaryModal(false);
      setRawText('');
      showToast(
        'success',
        `Đã nhập ${validSerials.length} mã Serial/IMEI cho SKU ${selectedSku.code || selectedSku.sku} vào ${selectedBranch?.name || 'chi nhánh'}!`
      );
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Lỗi khi nhập lô Serial.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmQuantityImport = async (e) => {
    e.preventDefault();
    const qty = parseInt(qtyInput, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      showToast('error', 'Số lượng nhập kho phải là số nguyên dương lớn hơn 0.');
      return;
    }
    if (!selectedBranchId || !selectedProduct || !selectedSku) return;

    setIsImporting(true);
    try {
      await inventoryService.adjustStock({
        branchId: selectedBranchId,
        productId: selectedProduct._id,
        productSkuId: selectedSku._id || selectedSku.productSkuId,
        quantityDelta: qty,
        reason: qtyReason.trim() || 'Nhập kho bổ sung hàng theo số lượng',
      });

      showToast(
        'success',
        `Đã nhập thêm +${qty} ${selectedProduct.unit || 'Cái'} (${selectedSku.code || selectedSku.sku}) vào ${selectedBranch?.name || 'chi nhánh'}!`
      );
      setQtyInput('10');
    } catch (err) {
      showToast('error', err.response?.data?.message || err.message || 'Lỗi khi nhập số lượng tồn kho.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-5 select-none font-sans text-slate-100">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <QrCode className="w-4 h-4" />
            <span>Nạp Tồn Đầu Kỳ (Day-0) • Dành riêng cho Super Admin</span>
          </div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight">
            Nạp Tồn Đầu Kỳ &amp; Nhập Lô Ngoại Lệ (Excel)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Chỉ dùng khi khởi tạo tồn kho ban đầu hoặc xử lý ngoại lệ. Hàng nhập từ Nhà cung cấp vui lòng thực hiện qua mục <strong>Kho Tổng &amp; NCC (PO)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setImportMode('SINGLE')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              importMode === 'SINGLE' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Nhập từng sản phẩm</span>
          </button>
          <button
            type="button"
            onClick={() => setImportMode('BULK_EXCEL')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              importMode === 'BULK_EXCEL'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import Excel Đa Sản Phẩm</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top-2 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toastMsg.message}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="opacity-70 hover:opacity-100 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Step 1 & 2 Card */}
      <SerialBatchImportCard
        branches={branches}
        products={products}
        selectedBranchId={selectedBranchId}
        selectedProduct={selectedProduct}
        selectedSku={selectedSku}
        isBranchLocked={authUser?.role === 'BRANCH_MANAGER'}
        showProductSelectors={importMode === 'SINGLE'}
        onSelectBranch={setSelectedBranchId}
        onSelectProduct={handleSelectProduct}
        onSelectSku={setSelectedSku}
      />

      {importMode === 'BULK_EXCEL' ? (
        <ExcelBulkImportPanel
          products={products}
          selectedBranchId={selectedBranchId}
          selectedBranchName={selectedBranch?.name || ''}
          onImportSuccess={(res) => {
            showToast(
              'success',
              `Import lô thành công: ${res.importedSkusCount} SKU (${res.totalUnitsImported} đơn vị, gồm ${res.importedSerialsCount} Serial/IMEI) vào ${selectedBranch?.name || 'chi nhánh'}!`
            );
          }}
          onError={(msg) => showToast('error', msg)}
        />
      ) : isSerialManaged ? (
        <>
          <SerialParserTextarea
            rawText={rawText}
            onChangeText={setRawText}
            existingSerials={existingSerials}
            onParsed={handleParsedResult}
          />

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!validationReport || validationReport.valid === 0}
              onClick={() => setShowSummaryModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>Kiểm tra &amp; Xác nhận Nhập Kho ({validationReport?.valid || 0} mã Serial/IMEI)</span>
            </button>
          </div>

          <ImportSummaryModal
            isOpen={showSummaryModal}
            onClose={() => setShowSummaryModal(false)}
            report={validationReport}
            selectedBranch={selectedBranch}
            selectedSku={selectedSku}
            isImporting={isImporting}
            onConfirm={handleConfirmSerialImport}
          />
        </>
      ) : (
        <form
          onSubmit={handleConfirmQuantityImport}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
        >
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100">
              Nhập Kho Sản Phẩm Quản Lý Theo Số Lượng ({selectedProduct?.name})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sản phẩm này không quản lý theo mã Serial/IMEI. Vui lòng nhập số lượng cần cộng thêm vào tồn kho chi nhánh.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Số lượng nhập thêm ({selectedProduct?.unit || 'Cái'}) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Ghi chú / Chứng từ nhập kho *
              </label>
              <input
                type="text"
                required
                value={qtyReason}
                onChange={(e) => setQtyReason(e.target.value)}
                placeholder="VD: Nhập kho phụ kiện đầu kỳ..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isImporting}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackagePlus className="w-4 h-4" />}
              <span>
                {isImporting
                  ? 'Đang nhập kho...'
                  : `Xác nhận nhập +${qtyInput || 0} ${selectedProduct?.unit || 'Cái'} vào kho`}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SerialImportPage;
