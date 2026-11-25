import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  Trash2,
  X,
  Package,
} from 'lucide-react';
import productService from '../../features/products/services/productService';
import categoryService from '../../features/categories/services/categoryService';
import ProductManagementTable from '../../features/products/components/ProductManagementTable';
import DynamicAttributesForm from '../../features/products/components/DynamicAttributesForm';
import SkuVariantBuilder from '../../features/products/components/SkuVariantBuilder';
import { generateAutoSkuCode } from '../../features/products/services/productAdapter';
import ProductImageUploader from '../../features/products/components/ProductImageUploader';
import CategoryTreeSelector from '../../features/products/components/CategoryTreeSelector';
import BrandCombobox from '../../features/products/components/BrandCombobox';
import CategoryManagementTab from '../../features/categories/components/CategoryManagementTab';

const toSlug = (str = '') =>
  String(str)
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const buildEmptyForm = () => ({
  name: '',
  slug: '',
  brand: '',
  unit: 'Cái',
  categoryId: '',
  category: '',
  description: '',
  isSerialManaged: true,
  isActive: true,
  images: [],
  attributes: [],
  options: [],
  skus: [
    {
      _id: `sku-${Date.now()}`,
      sku: '',
      code: '',
      price: 0,
      salePrice: 0,
      costPrice: 0,
      images: [],
      options: {},
      optionValues: [],
      isDefault: true,
      isActive: true,
    },
  ],
});

export const AdminProductsPage = () => {
  const auth = useSelector((state) => state.auth);
  const [mainView, setMainView] = useState('PRODUCTS'); // 'PRODUCTS' | 'CATEGORIES'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Slide-over Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('EDIT'); // 'CREATE' | 'EDIT'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('INFO'); // 'INFO' | 'ATTRS' | 'SKUS'
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [formData, setFormData] = useState(buildEmptyForm);

  const showToast = useCallback((type, message) => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 4000);
  }, []);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catList, prodRes] = await Promise.all([
        categoryService.getCategories(),
        productService.getProducts({ limit: 100, includeInactive: true }),
      ]);
      setCategories(catList || []);
      setProducts(prodRes.products || []);
    } catch (err) {
      showToast('error', `Lỗi tải dữ liệu: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      categoryService.getCategories(),
      productService.getProducts({ limit: 100, includeInactive: true }),
    ])
      .then(([catList, prodRes]) => {
        if (!ignore) {
          setCategories(catList || []);
          setProducts(prodRes.products || []);
        }
      })
      .catch((err) => {
        if (!ignore) {
          showToast('error', `Lỗi tải dữ liệu: ${err.response?.data?.message || err.message}`);
        }
      });
    return () => {
      ignore = true;
    };
  }, [showToast]);

  const existingBrands = useMemo(
    () => products.map((p) => p.brand).filter(Boolean),
    [products]
  );

  const buildFormFromProduct = useCallback((prod, catList = categories) => {
    if (!prod) return;
    const matchedCat = catList.find(
      (c) =>
        String(c._id) === String(prod.categoryId) ||
        c.slug === prod.category ||
        c.name?.toLowerCase() === prod.category?.toLowerCase()
    );

    const existingAttrs = Array.isArray(prod.rawAttributes)
      ? prod.rawAttributes
      : Array.isArray(prod.attributes)
      ? prod.attributes
      : Object.entries(prod.attributes || {}).map(([key, value]) => ({
          key,
          value: String(value ?? ''),
        }));

    const catKeys = Array.isArray(matchedCat?.attributeKeys) ? matchedCat.attributeKeys : [];
    const mergedAttrs = [...existingAttrs];
    catKeys.forEach((k) => {
      const cleanK = String(k).trim().toLowerCase();
      if (!mergedAttrs.some((a) => String(a.key).toLowerCase() === cleanK)) {
        mergedAttrs.push({ key: cleanK, value: '' });
      }
    });

    const normalizedSkus = Array.isArray(prod.skus) && prod.skus.length > 0
      ? prod.skus.map((s, idx) => ({
          ...s,
          isDefault: prod.skus.some((item) => item.isDefault) ? Boolean(s.isDefault) : idx === 0,
        }))
      : buildEmptyForm().skus;

    setFormData({
      name: prod.name || '',
      slug: prod.slug || '',
      brand: prod.brand || '',
      unit: prod.unit || 'Cái',
      categoryId: matchedCat?._id || prod.categoryId || '',
      category: matchedCat?.slug || prod.category || '',
      description: prod.description || prod.specsSummary || '',
      isSerialManaged: prod.isSerialManaged !== undefined ? prod.isSerialManaged : true,
      isActive: prod.isActive !== undefined ? prod.isActive : true,
      images: Array.isArray(prod.images) ? prod.images : [],
      attributes: mergedAttrs,
      options: Array.isArray(prod.options) ? prod.options : [],
      skus: normalizedSkus,
    });
  }, [categories]);

  const handleOpenCreateDrawer = () => {
    setDrawerMode('CREATE');
    setSelectedProduct(null);
    setFormData(buildEmptyForm());
    setActiveTab('INFO');
    setIsDrawerOpen(true);
  };

  const handleSelectProduct = (prod) => {
    setDrawerMode('EDIT');
    setSelectedProduct(prod);
    buildFormFromProduct(prod, categories);
    setActiveTab('INFO');
    setIsDrawerOpen(true);
  };

  const currentCategoryObj =
    categories.find((c) => String(c._id) === String(formData.categoryId)) ||
    categories.find((c) => c.slug === formData.category) ||
    selectedProduct?.categoryObj ||
    null;

  const allowedAttributeKeys = Array.isArray(currentCategoryObj?.attributeKeys)
    ? currentCategoryObj.attributeKeys
    : [];

  const handleCategoryChange = (newCategoryId) => {
    const chosenCat = categories.find((c) => String(c._id) === String(newCategoryId));
    const allowedSet = new Set(
      (chosenCat?.attributeKeys || []).map((k) => String(k).toLowerCase())
    );

    const keptAttrs = (formData.attributes || []).filter(
      (a) => allowedSet.size === 0 || allowedSet.has(String(a.key).toLowerCase())
    );
    (chosenCat?.attributeKeys || []).forEach((k) => {
      const cleanK = String(k).toLowerCase();
      if (!keptAttrs.some((a) => String(a.key).toLowerCase() === cleanK)) {
        keptAttrs.push({ key: cleanK, value: '' });
      }
    });

    setFormData((prev) => ({
      ...prev,
      categoryId: newCategoryId,
      category: chosenCat?.slug || prev.category,
      attributes: keptAttrs,
    }));
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await productService.toggleProductActive(id, isActive);
      setProducts((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isActive } : item))
      );
      if (selectedProduct && selectedProduct._id === id) {
        setSelectedProduct((prev) => ({ ...prev, isActive }));
        setFormData((prev) => ({ ...prev, isActive }));
      }
      showToast('success', `Đã ${isActive ? 'kích hoạt hiển thị' : 'tạm ẩn'} sản phẩm trên Storefront!`);
    } catch (err) {
      showToast('error', `Lỗi cập nhật trạng thái: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn ẩn (vô hiệu hóa) sản phẩm "${selectedProduct.name}" khỏi Storefront?`
      )
    ) {
      return;
    }

    try {
      await productService.deleteProduct(selectedProduct._id);
      setProducts((prev) =>
        prev.map((item) =>
          item._id === selectedProduct._id ? { ...item, isActive: false } : item
        )
      );
      setSelectedProduct((prev) => ({ ...prev, isActive: false }));
      setFormData((prev) => ({ ...prev, isActive: false }));
      showToast('success', `Đã ẩn sản phẩm "${selectedProduct.name}" thành công!`);
    } catch (err) {
      showToast('error', `Lỗi khi ẩn sản phẩm: ${err.response?.data?.message || err.message}`);
    }
  };

  const handlePrimaryPriceChange = (field, rawValue) => {
    const val = Math.max(0, parseInt(rawValue, 10) || 0);
    setFormData((prev) => {
      const updatedSkus = (prev.skus || []).map((s, idx) => {
        const isTarget = prev.skus.some((item) => item.isDefault) ? s.isDefault : idx === 0;
        if (!isTarget) return s;
        if (field === 'costPrice') {
          return { ...s, costPrice: val };
        }
        return { ...s, price: val, originalPrice: val, salePrice: val };
      });
      return { ...prev, skus: updatedSkus };
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!auth?.accessToken) {
      showToast('error', 'Vui lòng đăng nhập tài khoản Quản trị viên (SUPER_ADMIN) để lưu thay đổi.');
      return;
    }

    if (!formData.name.trim() || !formData.brand.trim() || !formData.categoryId) {
      showToast('error', 'Vui lòng nhập đầy đủ Tên sản phẩm, Thương hiệu và chọn Danh mục lá!');
      return;
    }

    const preparedSkus = (formData.skus || []).map((s, idx) => {
      const rawCode = String(s.sku || s.code || '').trim().toUpperCase();
      const finalCode = rawCode || generateAutoSkuCode(formData.brand, formData.name, s.options || {}, idx + 1);
      const sellingPrice = Math.max(0, Number(s.price || 0));
      return {
        ...s,
        sku: finalCode,
        code: finalCode,
        price: sellingPrice,
        salePrice: sellingPrice,
        costPrice: Math.max(0, Number(s.costPrice || 0)),
      };
    });

    if (preparedSkus.length === 0) {
      showToast('error', 'Sản phẩm phải có ít nhất 1 biến thể SKU!');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        skus: preparedSkus,
      };

      if (drawerMode === 'CREATE') {
        const created = await productService.createProduct(payload);
        setProducts((prev) => [created, ...prev]);
        setSelectedProduct(created);
        setDrawerMode('EDIT');
        buildFormFromProduct(created, categories);
        showToast('success', `Đã tạo mới sản phẩm "${created.name}" vào MongoDB thành công!`);
      } else {
        const updated = await productService.updateProduct(selectedProduct._id, payload);
        setProducts((prev) =>
          prev.map((item) => (item._id === selectedProduct._id ? updated : item))
        );
        setSelectedProduct(updated);
        buildFormFromProduct(updated, categories);
        showToast('success', `Đã lưu cập nhật sản phẩm "${updated.name}" thành công!`);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message;
      showToast('error', `Lỗi lưu sản phẩm: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const defaultSkuInForm =
    formData.skus?.find((s) => s.isDefault) || formData.skus?.[0] || { price: 0, costPrice: 0 };

  return (
    <div className="space-y-4 select-none font-sans text-slate-100">
      {/* Page Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            <span>Quản Trị Danh Mục &amp; Sản Phẩm Hệ Thống</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Quản lý tập trung SKU biến thể, giá vốn/giá bán, thư viện ảnh và cây phân cấp ngành hàng.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setMainView('PRODUCTS')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mainView === 'PRODUCTS'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Danh sách Sản phẩm ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setMainView('CATEGORIES')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              mainView === 'CATEGORIES'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Cây Danh mục ({categories.length})</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top-2 ${
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

      {/* Main Full-Width Content */}
      {mainView === 'CATEGORIES' ? (
        <CategoryManagementTab onCategoriesChanged={fetchAllData} />
      ) : isLoading && products.length === 0 ? (
        <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm">
          Đang tải danh sách sản phẩm từ cơ sở dữ liệu...
        </div>
      ) : (
        <ProductManagementTable
          products={products}
          categories={categories}
          selectedProductId={selectedProduct?._id}
          onSelectProduct={handleSelectProduct}
          onToggleActive={handleToggleActive}
          onAddNewProduct={handleOpenCreateDrawer}
        />
      )}

      {/* Slide-over Product Editor Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-5xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/80">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      drawerMode === 'CREATE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}
                  >
                    {drawerMode === 'CREATE' ? 'Tạo sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
                  </span>
                  {selectedProduct && !formData.isActive && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
                      Đã ẩn khỏi Storefront
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-slate-100 truncate mt-1">
                  {formData.name || 'Sản phẩm mới (chưa đặt tên)'}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {drawerMode === 'EDIT' && selectedProduct && formData.isActive && (
                  <button
                    type="button"
                    onClick={handleDeleteProduct}
                    className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ẩn sản phẩm</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveProduct}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Đang lưu...' : drawerMode === 'CREATE' ? 'Tạo sản phẩm' : 'Lưu thay đổi'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Editor Sub-tabs */}
            <div className="px-6 pt-3 border-b border-slate-800 flex gap-2 bg-slate-950/40">
              {[
                { id: 'INFO', label: '1. Thông tin chung & Hình ảnh' },
                { id: 'ATTRS', label: `2. Thông số kỹ thuật (${formData.attributes.length})` },
                { id: 'SKUS', label: `3. Biến thể SKU (${formData.skus.length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    activeTab === t.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Drawer Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'INFO' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        Tên sản phẩm *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            name,
                            slug: drawerMode === 'CREATE' ? toSlug(name) : prev.slug,
                          }));
                        }}
                        placeholder="VD: MacBook Air 13 M4 16GB/256GB"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        Đường dẫn SEO (Slug)
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                        placeholder="macbook-air-13-m4"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        Thương hiệu (Brand) *
                      </label>
                      <BrandCombobox
                        brands={existingBrands}
                        value={formData.brand}
                        onChange={(brand) => setFormData((prev) => ({ ...prev, brand }))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        Đơn vị tính (ĐVT)
                      </label>
                      <select
                        value={formData.unit || 'Cái'}
                        onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
                      >
                        <option value="Cái">Cái</option>
                        <option value="Chiếc">Chiếc</option>
                        <option value="Bộ">Bộ (Combo)</option>
                        <option value="Hộp">Hộp</option>
                        <option value="Sợi">Sợi (Cáp/Dây)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        Danh mục sản phẩm (Chỉ chọn danh mục lá) *
                      </label>
                      <CategoryTreeSelector
                        categories={categories}
                        value={formData.categoryId}
                        onChange={handleCategoryChange}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        Giá vốn mặc định (VNĐ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={defaultSkuInForm.costPrice ?? 0}
                        onChange={(e) => handlePrimaryPriceChange('costPrice', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        Giá bán mặc định (VNĐ) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={defaultSkuInForm.price ?? 0}
                        onChange={(e) => handlePrimaryPriceChange('price', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Flags */}
                  <div className="flex flex-wrap gap-6 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isSerialManaged}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, isSerialManaged: e.target.checked }))
                        }
                        className="rounded accent-blue-500 cursor-pointer"
                      />
                      <span className="font-semibold">Quản lý tồn kho theo từng mã Serial / IMEI</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                        }
                        className="rounded accent-emerald-500 cursor-pointer"
                      />
                      <span className="font-semibold">Hiển thị kinh doanh trên Storefront &amp; POS</span>
                    </label>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Mô tả sản phẩm
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Nhập thông tin nổi bật, điểm nhấn cấu hình của sản phẩm..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Product Image Uploader */}
                  <ProductImageUploader
                    images={formData.images}
                    onChange={(images) => setFormData((prev) => ({ ...prev, images }))}
                  />
                </div>
              )}

              {activeTab === 'ATTRS' && (
                <DynamicAttributesForm
                  attributes={formData.attributes}
                  allowedKeys={allowedAttributeKeys}
                  onChange={(attributes) => setFormData((prev) => ({ ...prev, attributes }))}
                />
              )}

              {activeTab === 'SKUS' && (
                <SkuVariantBuilder
                  skus={formData.skus}
                  options={formData.options}
                  productName={formData.name}
                  brand={formData.brand}
                  productImages={formData.images}
                  inUseSkuIds={selectedProduct?.inUseSkuIds || []}
                  onChangeSkus={(skus) => setFormData((prev) => ({ ...prev, skus }))}
                  onChangeOptions={(options) => setFormData((prev) => ({ ...prev, options }))}
                />
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
