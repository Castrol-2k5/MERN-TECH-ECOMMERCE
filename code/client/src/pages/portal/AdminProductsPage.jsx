import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Save, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  FolderTree
} from 'lucide-react';
import productService, { fallbackProducts } from '../../features/products/services/productService';
import ProductManagementTable from '../../features/products/components/ProductManagementTable';
import DynamicAttributesForm from '../../features/products/components/DynamicAttributesForm';
import SkuVariantBuilder from '../../features/products/components/SkuVariantBuilder';
import CategoryManagementTab from '../../features/categories/components/CategoryManagementTab';
import { isMockEnabled } from '../../config/dataMode';

export const AdminProductsPage = () => {
  const auth = useSelector((state) => state.auth);
  const [products, setProducts] = useState(fallbackProducts);
  const [selectedProduct, setSelectedProduct] = useState(fallbackProducts[0]);
  const [activeTab, setActiveTab] = useState('ATTRIBUTES'); // 'INFO' | 'ATTRIBUTES' | 'SKUS' | 'SEO'
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Editable state of currently selected product
  const [formData, setFormData] = useState({
    name: selectedProduct.name || '',
    brand: selectedProduct.brand || '',
    category: selectedProduct.category || 'laptop',
    price: selectedProduct.price || 0,
    originalPrice: selectedProduct.originalPrice || 0,
    specsSummary: selectedProduct.specsSummary || '',
    slug: selectedProduct.slug || '',
    attributes: [
      { name: 'CPU', key: 'cpu', type: 'Single-select', values: ['Apple M4', 'M4 Pro', 'M4 Max'], isFilter: true },
      { name: 'RAM', key: 'ram', type: 'Multi-select', values: ['16GB', '24GB', '32GB'], isFilter: true },
      { name: 'VGA / GPU', key: 'vga', type: 'Single-select', values: ['GPU 8 lõi', 'GPU 10 lõi'], isFilter: true },
      { name: 'Màn hình', key: 'screen_size', type: 'Text', values: ['13.6” Liquid Retina 500 nits'], isFilter: true },
      { name: 'Ổ cứng', key: 'storage', type: 'Single-select', values: ['256GB', '512GB', '1TB'], isFilter: true }
    ],
    skus: selectedProduct.skus || [],
    options: selectedProduct.options || []
  });

  const handleSelectProduct = (p) => {
    setSelectedProduct(p);
    setFormData({
      name: p.name || '',
      brand: p.brand || '',
      category: p.category || 'laptop',
      price: p.price || 0,
      originalPrice: p.originalPrice || 0,
      specsSummary: p.specsSummary || '',
      slug: p.slug || '',
      attributes: [
        { name: 'CPU', key: 'cpu', type: 'Single-select', values: ['Apple M4', 'M4 Pro', 'M4 Max'], isFilter: true },
        { name: 'RAM', key: 'ram', type: 'Multi-select', values: ['16GB', '24GB', '32GB'], isFilter: true },
        { name: 'VGA / GPU', key: 'vga', type: 'Single-select', values: ['GPU 8 lõi', 'GPU 10 lõi'], isFilter: true },
        { name: 'Màn hình', key: 'screen_size', type: 'Text', values: ['13.6” Liquid Retina 500 nits'], isFilter: true },
        { name: 'Ổ cứng', key: 'storage', type: 'Single-select', values: ['256GB', '512GB', '1TB'], isFilter: true }
      ],
      skus: p.skus || [],
      options: p.options || []
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMockEnabled()) {
        if (isMounted) {
          setProducts(fallbackProducts);
          if (fallbackProducts.length > 0) {
            handleSelectProduct(fallbackProducts[0]);
          }
        }
        return;
      }

      try {
        const res = await productService.getProducts({ limit: 100 });
        if (isMounted) {
          const list = res.products || [];
          setProducts(list);
          if (list.length > 0) {
            handleSelectProduct(list[0]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setToastMsg({
            type: 'error',
            message: `Lỗi kết nối Live Database: ${err.message || 'Không thể tải danh sách sản phẩm'}`,
          });
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleActive = async (id, isActive) => {
    try {
      await productService.toggleProductActive(id, isActive);
      setProducts((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isActive } : item))
      );
      setToastMsg({
        type: 'success',
        message: `Đã ${isActive ? 'kích hoạt hiển thị' : 'tạm ẩn'} sản phẩm trên Storefront!`,
      });
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      setToastMsg({
        type: 'error',
        message: `Lỗi cập nhật trạng thái: ${err.message || 'Yêu cầu quyền SUPER_ADMIN'}`,
      });
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    if (!isMockEnabled() && !auth?.accessToken) {
      setToastMsg({
        type: 'error',
        message: 'Bạn đang ở chế độ Live Database. Vui lòng đăng nhập tài khoản Quản trị viên (SUPER_ADMIN) để lưu thay đổi.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const isNew = String(selectedProduct._id).startsWith('prod-') && isNaN(Number(selectedProduct._id));
      let savedProduct;
      if (isNew) {
        savedProduct = await productService.createProduct(formData);
        setProducts((prev) =>
          prev.map((p) => (p._id === selectedProduct._id ? savedProduct : p))
        );
        setSelectedProduct(savedProduct);
        setToastMsg({
          type: 'success',
          message: 'Đã tạo sản phẩm mới và lưu vào cơ sở dữ liệu thành công!',
        });
      } else {
        savedProduct = await productService.updateProduct(selectedProduct._id, formData);
        setProducts((prev) =>
          prev.map((p) => (p._id === selectedProduct._id ? { ...p, ...formData } : p))
        );
        setToastMsg({
          type: 'success',
          message: 'Đã lưu thay đổi thông tin sản phẩm và schema thuộc tính thành công!',
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
    const newProd = {
      _id: 'prod-' + Date.now(),
      name: 'Thiết bị công nghệ mới 2026',
      skuCode: 'TECH-NEW-2026',
      brand: 'Apple',
      category: 'laptop',
      price: 19990000,
      originalPrice: 22990000,
      isActive: true,
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80'],
      skus: []
    };
    setProducts([newProd, ...products]);
    handleSelectProduct(newProd);
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
          <button onClick={() => setToastMsg(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Main Grid 2 columns: Left 35% Table, Right 65% Product Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Product List */}
        <div className="lg:col-span-4 h-[calc(100vh-140px)]">
          <ProductManagementTable
            products={products}
            selectedProductId={selectedProduct._id}
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
              <h2 className="text-lg font-black text-slate-100 tracking-tight">
                {formData.name || 'Chi tiết sản phẩm'}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {selectedProduct._id} • Cập nhật gần nhất: Vừa xong
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/product/${formData.slug || 'macbook-air-13-m4'}`}
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
                disabled={isSaving}
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
              Thông tin chung
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
              Dynamic Attributes
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
              SKU Manager
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
              SEO &amp; URL
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
              <span>Quản lý Danh mục</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="pt-2">
            {activeTab === 'INFO' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Tên sản phẩm:</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Thương hiệu (Brand):</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Danh mục chính:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="laptop">Laptop</option>
                    <option value="smartphone">Điện thoại</option>
                    <option value="phukien">Phụ kiện</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Giá bán cơ sở (VND):</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-cyan-400 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Giá niêm yết (Gốc):</label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Tóm tắt cấu hình nổi bật:</label>
                  <textarea
                    rows="2"
                    value={formData.specsSummary}
                    onChange={(e) => setFormData({ ...formData, specsSummary: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
            )}

            {activeTab === 'ATTRIBUTES' && (
              <DynamicAttributesForm
                category={formData.category}
                attributes={formData.attributes}
                onChangeAttributes={(attrs) => setFormData({ ...formData, attributes: attrs })}
              />
            )}

            {activeTab === 'SKUS' && (
              <SkuVariantBuilder
                skus={formData.skus}
                options={formData.options}
                onChangeSkus={(skus) => setFormData({ ...formData, skus })}
              />
            )}

            {activeTab === 'SEO' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Đường dẫn thân thiện (Slug):</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">SEO Title:</label>
                  <input
                    type="text"
                    defaultValue={`${formData.name} - Giá tốt chính hãng | TechOne`}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Meta Description:</label>
                  <textarea
                    rows="2"
                    defaultValue={`Mua ${formData.name} chính hãng tại TechOne, bảo hành 12 tháng, đổi mới 30 ngày, giao hàng 2 giờ tận nơi.`}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
            )}

            {activeTab === 'CATEGORIES' && (
              <CategoryManagementTab />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductsPage;
