import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Scale, Plus, X, Search, RotateCcw, Layers, Filter } from 'lucide-react';
import CompareMatrixTable from '../../features/products/components/CompareMatrixTable.jsx';
import {
  addToCompare,
  clearCompare,
} from '../../store/slices/compareSlice.js';
import productService, { fallbackProducts } from '../../features/products/services/productService.js';
import categoryService from '../../features/categories/services/categoryService.js';
import { isMockEnabled } from '../../config/dataMode.js';

export const CompareSpecsPage = () => {
  const dispatch = useDispatch();
  const compareProducts = useSelector((state) => state.compare.products);

  const [allCategories, setAllCategories] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalSubcategorySlug, setModalSubcategorySlug] = useState('');
  const [modalBrandFilter, setModalBrandFilter] = useState('');
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Tải danh mục hệ thống để dựng cây phân cấp (Root Category -> Subcategories)
  useEffect(() => {
    let isMounted = true;
    categoryService
      .getCategories()
      .then((cats) => {
        if (isMounted && Array.isArray(cats)) {
          setAllCategories(cats);
        }
      })
      .catch(() => {
        // ignore
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Sản phẩm neo đầu tiên (Anchor Product)
  const anchorProduct = compareProducts.length > 0 ? compareProducts[0] : null;

  // 2. Xác định Danh mục cha cao nhất (Root/Ancestor Category) của Anchor Product
  const rootCategory = useMemo(() => {
    if (!anchorProduct || allCategories.length === 0) return null;

    const anchorCatId =
      anchorProduct.categoryId?._id ||
      (typeof anchorProduct.categoryId === 'string' ? anchorProduct.categoryId : null);
    const anchorCatSlug =
      anchorProduct.category ||
      anchorProduct.categoryId?.slug;

    // Tìm category hiện tại của anchor product
    const currentCat = allCategories.find(
      (c) =>
        (anchorCatId && String(c._id) === String(anchorCatId)) ||
        (anchorCatSlug && c.slug === anchorCatSlug)
    );

    if (!currentCat) {
      return {
        _id: 'root-default',
        name: anchorProduct.categoryName || 'Sản phẩm',
        slug: anchorProduct.category || 'laptop',
        parentId: null,
      };
    }

    // Lần ngược lên parentId đến khi gặp danh mục cha cao nhất (parentId === null)
    let current = currentCat;
    while (current && current.parentId) {
      const pId = typeof current.parentId === 'object' ? current.parentId._id : current.parentId;
      const parent = allCategories.find((c) => String(c._id) === String(pId));
      if (parent) {
        current = parent;
      } else {
        break;
      }
    }

    return current;
  }, [anchorProduct, allCategories]);

  // Danh sách các danh mục con thuộc Root Category (để cho người dùng lọc trong modal)
  const availableSubcategories = useMemo(() => {
    if (allCategories.length === 0) return [];

    if (rootCategory) {
      // Khi đã có Anchor Product: Lấy tất cả danh mục con thuộc rootCategory
      return allCategories.filter((c) => {
        const pId = typeof c.parentId === 'object' ? c.parentId?._id : c.parentId;
        return pId && String(pId) === String(rootCategory._id);
      });
    }

    // Khi CHƯA có Anchor Product: Lấy các danh mục cha cao nhất (parentId === null)
    return allCategories.filter((c) => !c.parentId);
  }, [allCategories, rootCategory]);

  const rootCategoryName = rootCategory?.name || anchorProduct?.categoryName || 'sản phẩm';
  const rootCategorySlug = rootCategory?.slug || anchorProduct?.category || '';

  // 3. Tải danh sách sản phẩm khi mở Modal
  useEffect(() => {
    if (!isAddModalOpen) return;

    let isMounted = true;

    const fetchModalProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const params = {
          limit: 50,
          isActive: true,
        };

        // Phạm vi danh mục:
        if (modalSubcategorySlug) {
          // Người dùng chủ động chọn 1 danh mục con cụ thể
          params.category = modalSubcategorySlug;
        } else if (rootCategorySlug) {
          // Giới hạn trong toàn bộ danh mục cha cao nhất
          params.category = rootCategorySlug;
        }

        // Lọc theo Brand nếu được chọn
        if (modalBrandFilter) {
          params.brand = modalBrandFilter;
        }

        // Lọc theo Search Query
        if (modalSearchQuery.trim()) {
          params.search = modalSearchQuery.trim();
        }

        const res = await productService.getProducts(params);
        if (!isMounted) return;

        if (isMockEnabled()) {
          setFetchedProducts(fallbackProducts);
        } else {
          // CHẾ ĐỘ LIVE DATABASE: Tuyệt đối không fallback sang mock data!
          setFetchedProducts(res?.products || []);
        }
      } catch {
        if (!isMounted) return;
        if (isMockEnabled()) {
          setFetchedProducts(fallbackProducts);
        } else {
          setFetchedProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    };

    fetchModalProducts();

    return () => {
      isMounted = false;
    };
  }, [isAddModalOpen, rootCategorySlug, modalSubcategorySlug, modalBrandFilter, modalSearchQuery]);

  // Lọc bỏ các sản phẩm đã có trong bảng so sánh
  const availableToAdd = useMemo(() => {
    return fetchedProducts.filter(
      (item) => !compareProducts.some((p) => (p._id || p.id) === (item._id || item.id))
    );
  }, [fetchedProducts, compareProducts]);

  // Trích xuất danh sách Brand thực tế có trong tập sản phẩm đã fetch để làm filter chips
  const dynamicBrandOptions = useMemo(() => {
    const brands = new Set();
    fetchedProducts.forEach((p) => {
      if (p.brand && typeof p.brand === 'string') {
        brands.add(p.brand.trim());
      }
    });
    return Array.from(brands).sort();
  }, [fetchedProducts]);

  const handleOpenAddModal = () => {
    setModalSearchQuery('');
    setModalSubcategorySlug('');
    setModalBrandFilter('');
    setIsAddModalOpen(true);
  };

  const handleSelectProduct = (prod) => {
    dispatch(addToCompare(prod));
    setIsAddModalOpen(false);
  };

  const handleResetComparison = () => {
    dispatch(clearCompare());
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val || 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-bold">So sánh cấu hình</span>
        {anchorProduct && (
          <>
            <span>/</span>
            <span className="text-blue-600 font-bold capitalize">{rootCategoryName}</span>
          </>
        )}
      </nav>

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <Scale className="w-3.5 h-3.5" />
            <span>Ma trận so sánh thông số</span>
            {rootCategory && (
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide">
                Ngành hàng: {rootCategoryName}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {anchorProduct
              ? `So sánh cấu hình: ${rootCategoryName}`
              : 'So sánh chi tiết cấu hình máy'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            {anchorProduct
              ? `Đang neo theo danh mục cha "${rootCategoryName}". Bạn có thể thêm các dòng máy cùng ngành hàng để đối chiếu chi tiết.`
              : 'Đặt cạnh nhau các thông số kỹ thuật then chốt để dễ dàng lựa chọn sản phẩm phù hợp nhất với nhu cầu sử dụng của bạn.'}
          </p>
        </div>

        {compareProducts.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetComparison}
              className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              title="Xóa toàn bộ sản phẩm và chọn lại từ đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa so sánh / Chọn danh mục khác</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. Trạng thái khởi tạo (Empty State) */}
      {compareProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-16 text-center shadow-xs">
          <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 ring-8 ring-blue-50/50">
              <Layers className="w-8 h-8" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">
              Chưa có sản phẩm nào trong bảng so sánh
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
              Chọn sản phẩm đầu tiên để neo ngành hàng cấu hình (Laptop, Điện thoại & Tablet, Bàn phím & Chuột...), hệ thống sẽ tự động tạo ma trận thông số và chỉ gợi ý các dòng máy cùng ngành hàng cha.
            </p>

            <button
              onClick={handleOpenAddModal}
              className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Chọn sản phẩm cần so sánh</span>
            </button>

            <div className="mt-8 pt-6 border-t border-slate-100 w-full flex items-center justify-center gap-4 text-xs text-slate-400">
              <span>💡 Mẹo: Bạn cũng có thể bấm nút "So sánh" trực tiếp từ trang chi tiết sản phẩm hoặc card sản phẩm.</span>
            </div>
          </div>
        </div>
      ) : (
        /* 2 & 3. Ma trận so sánh cấu hình động */
        <CompareMatrixTable onAddProductClick={handleOpenAddModal} />
      )}

      {/* Modal tìm kiếm và thêm sản phẩm kèm bộ lọc danh mục & thương hiệu */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {anchorProduct
                    ? `Chọn ${rootCategoryName} khác để so sánh với ${anchorProduct.name}`
                    : 'Chọn sản phẩm đầu tiên vào bảng so sánh'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {anchorProduct
                    ? `Giới hạn phạm vi theo ngành hàng cha: "${rootCategoryName}" (bao gồm các danh mục con)`
                    : 'Tìm kiếm tự do trên toàn bộ hệ thống hoặc lọc theo danh mục bên dưới'}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Section: Search bar & Filters */}
            <div className="py-3 space-y-2.5 border-b border-slate-100">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    anchorProduct
                      ? `Tìm kiếm trong ngành hàng ${rootCategoryName} theo tên hoặc hãng...`
                      : 'Tìm kiếm sản phẩm theo tên hoặc hãng...'
                  }
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Category Pills Filter */}
              {availableSubcategories.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-blue-600" />
                    <span>Danh mục:</span>
                  </span>

                  <button
                    onClick={() => setModalSubcategorySlug('')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                      modalSubcategorySlug === ''
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {anchorProduct ? `Tất cả (${rootCategoryName})` : 'Tất cả'}
                  </button>

                  {availableSubcategories.map((cat) => {
                    const isSelected = modalSubcategorySlug === cat.slug;
                    return (
                      <button
                        key={`cat-pill-${cat._id || cat.slug}`}
                        onClick={() => setModalSubcategorySlug(isSelected ? '' : cat.slug)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Brand Pills Filter */}
              {dynamicBrandOptions.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  <span className="text-[11px] font-bold text-slate-400 shrink-0">Hãng:</span>

                  <button
                    onClick={() => setModalBrandFilter('')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                      modalBrandFilter === ''
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    Tất cả hãng
                  </button>

                  {dynamicBrandOptions.map((brandName) => {
                    const isSelected = modalBrandFilter === brandName;
                    return (
                      <button
                        key={`brand-pill-${brandName}`}
                        onClick={() => setModalBrandFilter(isSelected ? '' : brandName)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {brandName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* List Products */}
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-[240px] pt-2">
              {isLoadingProducts ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <p>Đang tải dữ liệu từ cơ sở dữ liệu...</p>
                </div>
              ) : availableToAdd.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-xs font-bold text-slate-700">Không tìm thấy sản phẩm phù hợp</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {anchorProduct
                      ? `Không có thiết bị nào thuộc ngành hàng "${rootCategoryName}" phù hợp với tiêu chí lọc hoặc tất cả đã được thêm vào bảng so sánh.`
                      : 'Không có sản phẩm nào trong cơ sở dữ liệu khớp với điều kiện tìm kiếm.'}
                  </p>
                </div>
              ) : (
                availableToAdd.map((prod) => (
                  <div
                    key={`modal-prod-${prod._id || prod.id}`}
                    className="p-3 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 flex items-center justify-between gap-3 transition-colors"
                  >
                    <img
                      src={prod.images?.[0]}
                      alt={prod.name}
                      className="w-14 h-14 object-contain rounded-xl bg-slate-50 p-1.5 shrink-0 border border-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {prod.brand}
                        </span>
                        {prod.categoryName && (
                          <span className="text-[10px] text-slate-400">
                            • {prod.categoryName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                      <p className="text-xs text-blue-600 font-extrabold mt-0.5">
                        {formatPrice(prod.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectProduct(prod)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Chọn so sánh</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Tối đa so sánh 4 sản phẩm cùng ngành hàng</span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareSpecsPage;
