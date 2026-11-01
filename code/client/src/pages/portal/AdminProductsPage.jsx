import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Save,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  Trash2,
} from 'lucide-react';
import productService, { fallbackProducts } from '../../features/products/services/productService';
import categoryService, { fallbackCategories } from '../../features/categories/services/categoryService';
import ProductManagementTable from '../../features/products/components/ProductManagementTable';
import DynamicAttributesForm from '../../features/products/components/DynamicAttributesForm';
import SkuVariantBuilder from '../../features/products/components/SkuVariantBuilder';
import CategoryManagementTab from '../../features/categories/components/CategoryManagementTab';
import { isMockEnabled } from '../../config/dataMode';

const toSlug = (str = '') =>
  String(str)
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

export const AdminProductsPage = () => {
  const auth = useSelector((state) => state.auth);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('INFO'); // 'INFO' | 'ATTRIBUTES' | 'SKUS' | 'SEO' | 'CATEGORIES'
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    categoryId: '',
    category: 'laptop',
    price: 0,
    originalPrice: 0,
    description: '',
    imagesText: '',
    isSerialManaged: true,
    isActive: true,
    slug: '',
    attributes: [],
    skus: [],
    options: [],
  });

  const buildFormFromProduct = useCallback(
    (p, catList = categories) => {
      if (!p) return;
      const matchedCat =
        catList.find((c) => String(c._id) === String(p.categoryId)) ||
        catList.find((c) => c.slug === p.category) ||
        catList[0] ||
        null;

      const resolvedCategoryId = p.categoryId || matchedCat?._id || '';
      const resolvedCategorySlug = matchedCat?.slug || p.category || 'laptop';

      const rawAttrs = Array.isArray(p.rawAttributes)
        ? p.rawAttributes
        : Array.isArray(p.attributes)
          ? p.attributes
          : p.attributes && typeof p.attributes === 'object'
            ? Object.entries(p.attributes).map(([key, value]) => ({ key, value: String(value ?? '') }))
            : [];

      const skus = Array.isArray(p.skus) ? p.skus : [];
      const primarySku = skus[0] || {};
      const listPrice = Number(primarySku.price ?? p.originalPrice ?? p.price ?? 0);
      const salePrice = Number(primarySku.salePrice ?? p.price ?? listPrice);

      setFormData({
        name: p.name || '',
        brand: p.brand || '',
        categoryId: String(resolvedCategoryId),
        category: resolvedCategorySlug,
        price: salePrice,
        originalPrice: listPrice,
        description: p.description || p.specsSummary || '',
        imagesText: Array.isArray(p.images) ? p.images.join('\n') : '',
        isSerialManaged: p.isSerialManaged !== false,
        isActive: p.isActive !== false,
        slug: p.slug || toSlug(p.name || ''),
        attributes: rawAttrs,
        skus,
        options: Array.isArray(p.options) ? p.options : [],
      });
    },
    [categories]
  );

  const handleSelectProduct = (p) => {
    setSelectedProduct(p);
    buildFormFromProduct(p, categories);
  };

  const loadCategories = useCallback(async () => {
    try {
      const catList = await categoryService.getCategories();
      setCategories(catList || []);
      return catList || [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMockEnabled()) {
        if (isMounted) {
          setCategories(fallbackCategories);
          setProducts(fallbackProducts);
          if (fallbackProducts.length > 0) {
            setSelectedProduct(fallbackProducts[0]);
            buildFormFromProduct(fallbackProducts[0], fallbackCategories);
          }
        }
        return;
      }

      try {
        const [catList, prodRes] = await Promise.all([
          categoryService.getCategories(),
          productService.getProducts({ limit: 100, includeInactive: true }),
        ]);
        if (isMounted) {
          const validCats = catList || [];
          const list = prodRes.products || [];
          setCategories(validCats);
          setProducts(list);
          if (list.length > 0) {
            setSelectedProduct(list[0]);
            buildFormFromProduct(list[0], validCats);
          }
        }
      } catch (err) {
        if (isMounted) {
          setToastMsg({
            type: 'error',
            message: `Lỗi kết nối Live Database: ${err.response?.data?.message || err.message || 'Không thể tải danh sách sản phẩm'}`,
          });
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentCategoryObj =
    categories.find((c) => String(c._id) === String(formData.categoryId)) ||
    categories.find((c) => c.slug === formData.category) ||
    selectedProduct?.categoryObj ||
    null;

  const allowedAttributeKeys = Array.isArray(currentCategoryObj?.attributeKeys)
    ? currentCategoryObj.attributeKeys
    : [];

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
      setToastMsg({
        type: 'success',
        message: `Đã ${isActive ? 'kích hoạt hiển thị' : 'tạm ẩn'} sản phẩm trên Storefront!`,
      });
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      setToastMsg({
        type: 'error',
        message: `Lỗi cập nhật trạng thái: ${err.response?.data?.message || err.message}`,
      });
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    const isNew = String(selectedProduct._id).startsWith('prod-');
    if (isNew) {
      const remaining = products.filter((p) => p._id !== selectedProduct._id);
      setProducts(remaining);
      if (remaining.length > 0) handleSelectProduct(remaining[0]);
      return;
    }

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
      setToastMsg({
        type: 'success',
        message: `Đã ẩn sản phẩm "${selectedProduct.name}" thành công!`,
      });
    } catch (err) {
      setToastMsg({
        type: 'error',
        message: `Lỗi khi ẩn sản phẩm: ${err.response?.data?.message || err.message}`,
      });
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!isMockEnabled() && !auth?.accessToken) {
      setToastMsg({
        type: 'error',
        message:
          'Bạn đang ở chế độ Live Database. Vui lòng đăng nhập tài khoản Quản trị viên (SUPER_ADMIN) để lưu thay đổi.',
      });
      return;
    }

    if (!formData.name.trim() || !formData.brand.trim() || !formData.categoryId) {
      setToastMsg({
        type: 'error',
        message: 'Vui lòng nhập đầy đủ Tên sản phẩm, Thương hiệu và chọn Danh mục!',
      });
      return;
    }

    // Đảm bảo có ít nhất 1 SKU
    let skusToSave = Array.isArray(formData.skus) && formData.skus.length > 0 ? [...formData.skus] : [];
    if (skusToSave.length === 0) {
      const defaultSkuCode = `SKU-${toSlug(formData.name).toUpperCase().slice(0, 12)}-${Date.now().toString().slice(-4)}`;
      const listP = Math.max(0, Number(formData.originalPrice || formData.price || 0));
      const saleP = Math.max(0, Math.min(listP, Number(formData.price || listP)));
      skusToSave = [
        {
          sku: defaultSkuCode,
          code: defaultSkuCode,
          price: listP,
          salePrice: saleP,
          optionValues: [],
          isActive: true,
        },
      ];
    }

    const images = formData.imagesText
      ? formData.imagesText
          .split(/\r?\n|,/)
          .map((s) => s.trim())
          .filter(Boolean)
      : selectedProduct.images || [];

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || toSlug(formData.name),
      categoryId: formData.categoryId,
      brand: formData.brand.trim(),
      description: formData.description.trim(),
      images,
      isSerialManaged: Boolean(formData.isSerialManaged),
      isActive: Boolean(formData.isActive),
      attributes: formData.attributes,
      options: formData.options,
      skus: skusToSave,
    };

    setIsSaving(true);
    try {
      const isNew = String(selectedProduct._id).startsWith('prod-');
      let savedProduct;
      if (isNew) {
        savedProduct = await productService.createProduct(payload);
        setProducts((prev) =>
          prev.map((p) => (p._id === selectedProduct._id ? savedProduct : p))
        );
        setSelectedProduct(savedProduct);
        buildFormFromProduct(savedProduct, categories);
        setToastMsg({
          type: 'success',
          message: 'Đã tạo sản phẩm mới và lưu vào cơ sở dữ liệu thành công!',
        });
      } else {
        savedProduct = await productService.updateProduct(selectedProduct._id, payload);
        setProducts((prev) =>
          prev.map((p) => (p._id === selectedProduct._id ? savedProduct : p))
        );
        setSelectedProduct(savedProduct);
        buildFormFromProduct(savedProduct, categories);
        setToastMsg({
          type: 'success',
          message: 'Đã lưu thay đổi thông tin sản phẩm, thuộc tính động và biến thể SKU thành công!',
        });
      }
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err) {
      setToastMsg({
        type: 'error',
        message: `Lỗi khi lưu sản phẩm: ${err.response?.data?.message || err.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewProduct = () => {
    const defaultCat = categories[0] || null;
    const defaultSkuCode = `TECH-${Date.now().toString().slice(-5)}`;
    const defaultAttrs = Array.isArray(defaultCat?.attributeKeys)
      ? defaultCat.attributeKeys.map((k) => ({ key: k, value: '' }))
      : [];

    const newProd = {
      _id: 'prod-' + Date.now(),
      name: 'Thiết bị công nghệ mới',
      slug: `thiet-bi-cong-nghe-moi-${Date.now().toString().slice(-4)}`,
      skuCode: defaultSkuCode,
      brand: 'ASUS',
      categoryId: defaultCat?._id || '',
      categoryObj: defaultCat,
      category: defaultCat?.slug || 'laptop',
      categoryName: defaultCat?.name || 'Laptop',
      price: 19990000,
      originalPrice: 22990000,
      description: 'Mô tả chi tiết sản phẩm công nghệ chính hãng.',
      isSerialManaged: true,
      isActive: true,
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      ],
      rawAttributes: defaultAttrs,
      options: [],
      skus: [
        {
          _id: 'sku-' + Date.now(),
          sku: defaultSkuCode,
          code: defaultSkuCode,
          price: 22990000,
          originalPrice: 22990000,
          salePrice: 19990000,
          options: {},
          optionValues: [],
          isActive: true,
        },
      ],
    };
    setProducts([newProd, ...products]);
    handleSelectProduct(newProd);
    setActiveTab('INFO');
  };

  const handleCategoryChange = (newCategoryId) => {
    const chosenCat = categories.find((c) => String(c._id) === String(newCategoryId));
    const allowedSet = new Set(
      (chosenCat?.attributeKeys || []).map((k) => String(k).toLowerCase())
    );

    // Giữ lại các thuộc tính hợp lệ với danh mục mới và điền sẵn khung các thuộc tính của danh mục mới
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

  const handlePrimaryPriceChange = (field, rawValue) => {
    const val = Math.max(0, parseInt(rawValue, 10) || 0);
    setFormData((prev) => {
      const nextSalePrice = field === 'price' ? val : prev.price;
      const nextListPrice =
        field === 'originalPrice' ? Math.max(val, nextSalePrice) : Math.max(prev.originalPrice, val);

      const updatedSkus =
        Array.isArray(prev.skus) && prev.skus.length > 0
          ? prev.skus.map((s, idx) =>
              idx === 0
                ? {
                    ...s,
                    price: nextListPrice,
                    originalPrice: nextListPrice,
                    salePrice: Math.min(nextListPrice, nextSalePrice),
                  }
                : s
            )
          : prev.skus;

      return {
        ...prev,
        price: Math.min(nextListPrice, nextSalePrice),
        originalPrice: nextListPrice,
        skus: updatedSkus,
      };
    });
  };

  return (
    <div className="space-y-4 select-none font-sans text-slate-100">
      {/* Toast */}
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
          <button onClick={() => setToastMsg(null)} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid 2 columns: Left 35% Table, Right 65% Product Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Product List */}
        <div className="lg:col-span-4 h-[calc(100vh-140px)]">
          <ProductManagementTable
            products={products}
            categories={categories}
            selectedProductId={selectedProduct?._id}
            onSelectProduct={handleSelectProduct}
            onToggleActive={handleToggleActive}
            onAddNewProduct={handleAddNewProduct}
          />
        </div>

        {/* Right Column: Product Editor */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          {/* Editor Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-100 tracking-tight">
                  {formData.name || 'Chi tiết sản phẩm'}
                </h2>
                {selectedProduct && String(selectedProduct._id).startsWith('prod-') && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Bản nháp mới (Chưa lưu DB)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {selectedProduct?._id || '—'} • Danh mục: {currentCategoryObj?.name || 'Chưa chọn'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedProduct && (
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Ẩn / vô hiệu hóa sản phẩm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{String(selectedProduct._id).startsWith('prod-') ? 'Hủy nháp' : 'Ẩn SP'}</span>
                </button>
              )}

              <a
                href={`/product/${formData.slug || 'laptop'}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Xem Storefront</span>
              </a>

              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={isSaving || !selectedProduct}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
              >
                {isSaving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-800 pb-px text-xs font-semibold overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('INFO')}
              className={`px-3.5 py-2 rounded-t-lg transition-all border-b-2 cursor-pointer ${
                activeTab === 'INFO'
                  ? 'border-blue-500 text-blue-400 font-bold bg-slate-850/50'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Thông tin chung (UC-AD02)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ATTRIBUTES')}
              className={`px-3.5 py-2 rounded-t-lg transition-all border-b-2 cursor-pointer ${
                activeTab === 'ATTRIBUTES'
                  ? 'border-blue-500 text-blue-400 font-bold bg-slate-850/50'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Thuộc tính động ({formData.attributes?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SKUS')}
              className={`px-3.5 py-2 rounded-t-lg transition-all border-b-2 cursor-pointer ${
                activeTab === 'SKUS'
                  ? 'border-blue-500 text-blue-400 font-bold bg-slate-850/50'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Biến thể SKU ({formData.skus?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SEO')}
              className={`px-3.5 py-2 rounded-t-lg transition-all border-b-2 cursor-pointer ${
                activeTab === 'SEO'
                  ? 'border-blue-500 text-blue-400 font-bold bg-slate-850/50'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Hình ảnh &amp; SEO
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('CATEGORIES')}
              className={`px-3.5 py-2 rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'CATEGORIES'
                  ? 'border-blue-500 text-blue-400 font-bold bg-slate-850/50'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-blue-400" />
              <span>Quản lý Danh mục (UC-AD04)</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="pt-2">
            {activeTab === 'INFO' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Tên sản phẩm *:
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name,
                        slug:
                          selectedProduct && String(selectedProduct._id).startsWith('prod-')
                            ? toSlug(name)
                            : prev.slug,
                      }));
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Thương hiệu (Brand) *:
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Ví dụ: Apple, ASUS, Samsung, Logitech..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Danh mục sản phẩm *:
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.parentName ? `${cat.parentName} › ${cat.name}` : cat.name} ({cat.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Giá bán khuyến mãi SKU chính (salePrice - VND):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formData.price}
                    onChange={(e) => handlePrimaryPriceChange('price', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Giá niêm yết / Giá gốc SKU chính (price - VND):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formData.originalPrice}
                    onChange={(e) => handlePrimaryPriceChange('originalPrice', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-wrap items-center gap-6 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isSerialManaged}
                      onChange={(e) =>
                        setFormData({ ...formData, isSerialManaged: e.target.checked })
                      }
                      className="rounded border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>
                      <strong>Quản lý tồn kho theo Serial/IMEI</strong> (Bật cho Laptop, Điện thoại; Tắt cho Phụ kiện xuất theo số lượng)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span>Hiển thị trên Storefront B2C (isActive)</span>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Mô tả chi tiết sản phẩm (Description):
                  </label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Nhập mô tả đặc điểm nổi bật, chính sách bảo hành của sản phẩm..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
            )}

            {activeTab === 'ATTRIBUTES' && (
              <DynamicAttributesForm
                categoryName={currentCategoryObj?.name || formData.category}
                allowedKeys={allowedAttributeKeys}
                attributes={formData.attributes}
                onChangeAttributes={(attrs) => setFormData({ ...formData, attributes: attrs })}
              />
            )}

            {activeTab === 'SKUS' && (
              <SkuVariantBuilder
                skus={formData.skus}
                options={formData.options}
                onChangeSkus={(skus) => {
                  const primary = skus[0] || {};
                  setFormData((prev) => ({
                    ...prev,
                    skus,
                    price: primary.salePrice ?? primary.price ?? prev.price,
                    originalPrice: primary.price ?? prev.originalPrice,
                  }));
                }}
                onChangeOptions={(options) => setFormData((prev) => ({ ...prev, options }))}
              />
            )}

            {activeTab === 'SEO' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Đường dẫn thân thiện (Slug URL) *:
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-blue-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Danh sách URL hình ảnh (Mỗi dòng 1 URL hình ảnh):
                  </label>
                  <textarea
                    rows="4"
                    value={formData.imagesText}
                    onChange={(e) => setFormData({ ...formData, imagesText: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
            )}

            {activeTab === 'CATEGORIES' && (
              <CategoryManagementTab onCategoriesChanged={loadCategories} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductsPage;
