import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import SerialBatchImportCard from '../../features/inventory/components/SerialBatchImportCard';
import SerialParserTextarea from '../../features/inventory/components/SerialParserTextarea';
import ImportSummaryModal from '../../features/inventory/components/ImportSummaryModal';
import apiClient from '../../services/api';
import branchService from '../../features/branches/services/branchService';
import productService from '../../features/products/services/productService';
import { isMockEnabled, isDevOrTest } from '../../config/dataMode';

const DEMO_BRANCHES = [
  { _id: '65f0a1000000000000000001', code: 'BR-Q1', name: 'TechOne Q1 • 138 Trần Quang Khải', address: 'Quận 1, TP.HCM' },
  { _id: '65f0a1000000000000000002', code: 'BR-TD', name: 'TechOne Thủ Đức • 214 Võ Văn Ngân', address: 'TP. Thủ Đức' },
  { _id: '65f0a1000000000000000003', code: 'BR-Q5', name: 'TechOne Q5 • 382 Trần Hưng Đạo', address: 'Quận 5, TP.HCM' }
];

const DEMO_PRODUCTS = [
  {
    _id: '65f0a0000000000000000001',
    name: 'MacBook Air 13 M4 16GB/256GB',
    skus: [
      { _id: 'sku-mba-1', code: 'MBA-M4-16-256-SL', sku: 'MBA-M4-16-256-SL', options: { RAM: '16GB', Color: 'Silver' }, price: 26490000 },
      { _id: 'sku-mba-2', code: 'MBA-M4-32-512-MD', sku: 'MBA-M4-32-512-MD', options: { RAM: '32GB', Color: 'Midnight' }, price: 33490000 }
    ]
  },
  {
    _id: '65f0a0000000000000000002',
    name: 'iPhone 16 Pro Max 256GB',
    skus: [
      { _id: 'sku-ip16-1', code: 'IP16PM-256-DESERT', sku: 'IP16PM-256-DESERT', options: { Color: 'Desert Titanium' }, price: 34990000 },
      { _id: 'sku-ip16-2', code: 'IP16PM-512-NATURAL', sku: 'IP16PM-512-NATURAL', options: { Color: 'Natural Titanium' }, price: 39990000 }
    ]
  }
];

export const SerialImportPage = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const [branches, setBranches] = useState(DEMO_BRANCHES);
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [selectedBranchId, setSelectedBranchId] = useState(DEMO_BRANCHES[0]._id);
  const [selectedSku, setSelectedSku] = useState(DEMO_PRODUCTS[0].skus[0]);
  const [rawText, setRawText] = useState(
    'C02ZQ0ABQ6L7\nC02ZQ0ABQ8T4\nC02ZQ0ABQ9P2\nC02ZQ0ABR1K8\nC02ZQ0ABR3V6\nC02ZQ0ABR4N1\nC02ZQ0ABR5X9'
  );
  const [validationReport, setValidationReport] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Load branches & products on mount
  useEffect(() => {
    let ignore = false;
    Promise.all([
      branchService.getBranches(),
      productService.getProducts({ limit: 100 })
    ]).then(([branchList, productRes]) => {
      if (!ignore) {
        if (branchList && branchList.length > 0) {
          setBranches(branchList);
          const initialBranchId =
            authUser?.branchId && branchList.some((b) => b._id === authUser.branchId)
              ? authUser.branchId
              : branchList[0]._id;
          setSelectedBranchId(initialBranchId);
        }

        const prodList = productRes?.products || [];
        if (prodList.length > 0) {
          setProducts(prodList);
          if (prodList[0].skus && prodList[0].skus.length > 0) {
            setSelectedSku(prodList[0].skus[0]);
          }
        }
      }
    }).catch(() => {});

    return () => {
      ignore = true;
    };
  }, [authUser?.branchId]);

  const selectedBranch =
    branches.find((b) => b._id === selectedBranchId) || branches[0] || DEMO_BRANCHES[0];

  const handleParsedResult = useCallback((report) => {
    setValidationReport(report);
  }, []);

  const handleConfirmImport = async () => {
    if (!validationReport || validationReport.valid === 0) return;

    // Check if in live mode and user is not admin
    if (!isMockEnabled() && !authUser) {
      setToastMsg({
        type: 'error',
        message: 'Bạn cần đăng nhập tài khoản có quyền SUPER_ADMIN hoặc BRANCH_MANAGER để nhập serials vào database.'
      });
      return;
    }

    setIsImporting(true);
    try {
      const validSerials = validationReport.items
        .filter((i) => i.status === 'VALID')
        .map((i) => i.serialNumber);

      // Find owning product of selectedSku
      const owningProduct = products.find((p) =>
        p.skus?.some((s) => (s._id || s.code) === (selectedSku._id || selectedSku.code))
      );

      const payload = {
        branchId: selectedBranchId,
        productId: owningProduct?._id || products[0]?._id,
        productSkuId: selectedSku?._id || selectedSku?.productSkuId,
        serials: validSerials
      };

      if (!isMockEnabled()) {
        await apiClient.post('/serials/import', payload);
      }

      setShowSummaryModal(false);
      setToastMsg({
        type: 'success',
        message: `Đã nhập thành công ${validSerials.length} mã Serial cho SKU ${selectedSku.code || selectedSku.sku} vào chi nhánh ${selectedBranch.name || selectedBranch.branchName}!`
      });
      setRawText('');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err) {
      setToastMsg({
        type: 'error',
        message: `Lỗi khi nhập danh sách Serial: ${err.response?.data?.message || err.message}`
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-5 select-none font-sans text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <QrCode className="w-4 h-4" />
            <span>Kho Vận &amp; Nhập Lô Hàng</span>
          </div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight">
            Nhập Lô Serial / IMEI &amp; Cập Nhật Tồn Kho
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Quét mã hàng loạt, paste danh sách hoặc tải file Excel kiểm kê và đồng bộ tồn kho tự động
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSummaryModal(true)}
            disabled={!validationReport || validationReport.valid === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 cursor-pointer disabled:cursor-not-allowed"
          >
            Kiểm tra &amp; Nhập kho ({validationReport?.valid || 0} mã)
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
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
          <button onClick={() => setToastMsg(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Step 1: Branch & SKU Setup Card */}
      <SerialBatchImportCard
        branches={branches}
        products={products}
        selectedBranchId={selectedBranchId}
        selectedSku={selectedSku}
        onSelectBranch={setSelectedBranchId}
        onSelectSku={setSelectedSku}
        onFileUploaded={(content) => setRawText(content)}
      />

      {/* Step 2: Live Parser Textarea */}
      <SerialParserTextarea
        rawText={rawText}
        onChangeText={setRawText}
        existingSerials={['C02ZQ0ABQ9P2']}
        onParsedResult={handleParsedResult}
      />

      {/* Step 3: Summary & Confirmation Modal */}
      <ImportSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        skuCode={selectedSku?.code || selectedSku?.sku}
        branchName={selectedBranch.name || selectedBranch.branchName}
        validationReport={validationReport}
        onConfirmImport={handleConfirmImport}
        isImporting={isImporting}
      />
    </div>
  );
};

export default SerialImportPage;
