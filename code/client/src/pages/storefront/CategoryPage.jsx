import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import DynamicFilterSidebar from '../../features/products/components/DynamicFilterSidebar.jsx';
import SortBar from '../../features/products/components/SortBar.jsx';
import ProductCard from '../../features/products/components/ProductCard.jsx';
import Pagination from '../../features/products/components/Pagination.jsx';
import useProducts from '../../features/products/hooks/useProducts.js';
import Spinner from '../../components/common/Spinner.jsx';
import { isDevOrTest } from '../../config/dataMode.js';
import { X, Sparkles } from 'lucide-react';

export const CategoryPage = () => {
  const { slug = 'laptop' } = useParams();
  const isDev = isDevOrTest();

  const [selectedFilters, setSelectedFilters] = useState({});
  const [currentSort, setCurrentSort] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const queryParams = useMemo(() => {
    const params = {
      category: slug,
      page: currentPage,
      limit: 12,
      sortBy: currentSort,
    };
    if (selectedFilters.brand?.length > 0) {
      params.brand = selectedFilters.brand[0];
    }
    Object.entries(selectedFilters).forEach(([key, vals]) => {
      if (key !== 'brand' && Array.isArray(vals) && vals.length > 0) {
        params[key] = vals[0];
      }
    });
    return params;
  }, [slug, currentPage, currentSort, selectedFilters]);

  const { products, meta, isLoading, error, refetch } = useProducts(queryParams);

  const handleFilterChange = (newFilters) => {
    setSelectedFilters(newFilters);
    setCurrentPage(1);
  };

  const handleRemoveFilter = (groupKey, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [groupKey]: prev[groupKey].filter((v) => v !== value),
    }));
    setCurrentPage(1);
  };

  const activeFilterList = useMemo(() => {
    const list = [];
    Object.entries(selectedFilters).forEach(([key, values]) => {
      if (Array.isArray(values)) {
        values.forEach((val) => list.push({ key, val }));
      }
    });
    return list;
  }, [selectedFilters]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-6">
      <nav className="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-bold capitalize">
          {slug === 'laptop' ? 'Laptop chính hãng' : slug}
        </span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Laptop chính hãng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            248 sản phẩm • Laptop AI, gaming, đồ họa và văn phòng hiệu năng cao
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 w-fit">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Freeship toàn quốc • Trả góp 0%</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <DynamicFilterSidebar
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onResetFilters={() => {
            setSelectedFilters({});
            setCurrentPage(1);
          }}
        />

        <div className="flex-1 w-full">
          {activeFilterList.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-slate-400">Đang lọc:</span>
              {activeFilterList.map(({ key, val }) => (
                <span
                  key={`${key}-${val}`}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200"
                >
                  <span>{val}</span>
                  <button
                    onClick={() => handleRemoveFilter(key, val)}
                    className="hover:text-blue-900 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => {
                  setSelectedFilters({});
                  setCurrentPage(1);
                }}
                className="text-xs text-blue-600 hover:underline font-semibold ml-2 cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
          )}

          <SortBar
            currentSort={currentSort}
            onSortChange={(newSort) => {
              setCurrentSort(newSort);
              setCurrentPage(1);
            }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalResults={meta?.total ?? products.length}
          />

          {error ? (
            <div className="my-8 p-6 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-sm">
              <h4 className="font-bold text-base mb-1 text-rose-900">
                {isDev ? `⚠️ Lỗi tải sản phẩm danh mục "${slug}" từ API` : 'Không thể tải danh sách sản phẩm'}
              </h4>
              <p className="text-rose-700 mb-3">
                {isDev
                  ? `Chi tiết lỗi: ${error.message || 'Lỗi kết nối Backend'}. Vui lòng kiểm tra server hoặc chuyển sang chế độ Mock Data.`
                  : 'Đã có lỗi xảy ra trong quá trình tải dữ liệu. Vui lòng thử lại sau.'}
              </p>
              <button
                onClick={() => refetch(queryParams)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                Thử tải lại
              </button>
            </div>
          ) : isLoading ? (
            <div className="py-20 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8">
              <p className="text-base font-bold text-slate-700">Không tìm thấy sản phẩm phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">
                {isDev
                  ? 'Chưa có sản phẩm nào thuộc danh mục này trong Database. Chạy `npm run seed` ở backend để tạo dữ liệu.'
                  : 'Hãy thử nới lỏng các tiêu chí bộ lọc để xem thêm kết quả.'}
              </p>
              <button
                onClick={() => {
                  setSelectedFilters({});
                  setCurrentPage(1);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div
              className={`grid gap-5 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {products.map((product) => (
                <ProductCard key={product._id || product.id} product={product} />
              ))}
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={meta?.totalPages || 1}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
