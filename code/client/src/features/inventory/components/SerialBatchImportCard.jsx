import { useState, useMemo } from 'react';
import { Store, Package, Layers, Search } from 'lucide-react';

export const SerialBatchImportCard = ({
  branches = [],
  products = [],
  selectedBranchId,
  selectedProduct,
  selectedSku,
  onSelectBranch,
  onSelectProduct,
  onSelectSku,
  isBranchLocked = false,
  showProductSelectors = true,
}) => {
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.skus?.some((s) => (s.sku || s.code || '').toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  const currentSkus = useMemo(() => {
    return Array.isArray(selectedProduct?.skus) ? selectedProduct.skus : [];
  }, [selectedProduct]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-slate-100">
      <div className="flex items-center justify-between gap-2.5 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">
              {showProductSelectors ? 'Bước 1 & 2: Chọn Chi nhánh, Sản phẩm & Biến thể SKU' : 'Chọn Chi nhánh tiếp nhận lô hàng'}
            </h3>
            <p className="text-xs text-slate-400">
              {isBranchLocked
                ? 'Tài khoản Quản lý chi nhánh được cố định nhập vào chi nhánh mình phụ trách.'
                : 'Super Admin có thể chọn bất kỳ chi nhánh nào (mặc định Kho Tổng BR-HQ).'}
            </p>
          </div>
        </div>
      </div>

      {/* Chi nhánh nhập kho */}
      <div>
        <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5 text-blue-400" />
          <span>Chi nhánh tiếp nhận nhập kho:</span>
        </label>
        <select
          value={selectedBranchId}
          disabled={isBranchLocked}
          onChange={(e) => onSelectBranch(e.target.value)}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed font-medium"
        >
          {branches.map((b) => (
            <option key={b._id || b.code} value={b._id || b.code}>
              {b.name} {b.isHeadquarter || b.branchCode === 'BR-HQ' ? '(Kho Tổng HQ)' : ''} — {b.address}
            </option>
          ))}
        </select>
      </div>

      {/* 2-Step Product & SKU Selectors */}
      {showProductSelectors && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Bước 1: Chọn Sản phẩm */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-400" />
                <span>1. Chọn Sản phẩm:</span>
              </label>
              {selectedProduct && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedProduct.isSerialManaged !== false
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                  }`}
                >
                  {selectedProduct.isSerialManaged !== false ? 'Quản lý Serial/IMEI' : 'Quản lý Số lượng'}
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Lọc nhanh theo tên, hãng, SKU..."
                className="w-full pl-8 pr-3 py-1.5 mb-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={selectedProduct?._id || ''}
              onChange={(e) => {
                const prod = products.find((p) => String(p._id) === String(e.target.value));
                onSelectProduct?.(prod || null);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
            >
              {filteredProducts.length === 0 ? (
                <option value="">Không tìm thấy sản phẩm khớp</option>
              ) : (
                filteredProducts.map((p) => (
                  <option key={p._id} value={p._id}>
                    [{p.isSerialManaged !== false ? 'Serial' : 'Số lượng'}] {p.brand} — {p.name} ({p.skus?.length || 0} SKU)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Bước 2: Chọn Biến thể SKU của Sản phẩm đó */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Chọn Biến thể SKU ({currentSkus.length}):</span>
            </label>

            <select
              value={selectedSku?._id || selectedSku?.productSkuId || ''}
              onChange={(e) => {
                const skuObj = currentSkus.find(
                  (s) => String(s._id || s.sku || s.code) === String(e.target.value)
                );
                if (skuObj && selectedProduct) {
                  onSelectSku?.({
                    ...skuObj,
                    code: skuObj.code || skuObj.sku,
                    productName: selectedProduct.name,
                    productId: selectedProduct._id,
                    isSerialManaged: selectedProduct.isSerialManaged !== false,
                    unit: selectedProduct.unit || 'Cái',
                  });
                }
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              {currentSkus.map((s) => {
                const skuKey = s._id || s.code || s.sku;
                const skuCode = s.code || s.sku;
                const optLabel =
                  s.options && Object.keys(s.options).length > 0
                    ? Object.entries(s.options)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' / ')
                    : 'Mặc định';
                return (
                  <option key={skuKey} value={skuKey}>
                    {skuCode} — {optLabel} {s.isDefault ? '(Tiêu chuẩn)' : ''}
                  </option>
                );
              })}
            </select>

            {selectedSku && (
              <p className="text-[11px] text-slate-400">
                Đơn vị tính: <strong className="text-slate-200">{selectedProduct?.unit || 'Cái'}</strong> • Giá bán:{' '}
                <strong className="text-emerald-400">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedSku.price || 0)}
                </strong>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SerialBatchImportCard;
