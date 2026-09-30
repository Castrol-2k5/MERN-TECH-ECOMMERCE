import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import DynamicFilterSidebar from '../../features/products/components/DynamicFilterSidebar.jsx';
import SortBar from '../../features/products/components/SortBar.jsx';
import ProductCard from '../../features/products/components/ProductCard.jsx';
import Pagination from '../../features/products/components/Pagination.jsx';
import useProducts from '../../features/products/hooks/useProducts.js';
import Spinner from '../../components/common/Spinner.jsx';
import { X, Sparkles } from 'lucide-react';

export const CategoryPage = () => {
  const { slug = 'laptop' } = useParams();
  const { products, isLoading } = useProducts({ category: slug });

  const [selectedFilters, setSelectedFilters] = useState({});
  const [currentSort, setCurrentSort] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedFilters.brand?.length > 0) {
      result = result.filter((p) => selectedFilters.brand.includes(p.brand));
    }

    if (selectedFilters.cpu?.length > 0) {
      result = result.filter((p) =>
        selectedFilters.cpu.some((c) =>
          p.attributes?.cpu?.toLowerCase().includes(c.toLowerCase().replace(' series', ''))
        )
      );
    }

    if (selectedFilters.ram?.length > 0) {
      result = result.filter((p) =>
        selectedFilters.ram.some((r) => p.attributes?.ram?.includes(r))
      );
    }

    if (currentSort === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'newest') {
      result.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
    }

    return result;
  }, [products, selectedFilters, currentSort]);

  const handleRemoveFilter = (groupKey, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [groupKey]: prev[groupKey].filter((v) => v !== value),
    }));
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
          onFilterChange={setSelectedFilters}
          onResetFilters={() => setSelectedFilters({})}
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
                onClick={() => setSelectedFilters({})}
                className="text-xs text-blue-600 hover:underline font-semibold ml-2 cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
          )}

          <SortBar
            currentSort={currentSort}
            onSortChange={setCurrentSort}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalResults={filteredProducts.length}
          />

          {isLoading ? (
            <div className="py-20 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8">
              <p className="text-base font-bold text-slate-700">Không tìm thấy sản phẩm phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">
                Hãy thử nới lỏng các tiêu chí bộ lọc để xem thêm kết quả.
              </p>
              <button
                onClick={() => setSelectedFilters({})}
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
              {filteredProducts.map((product) => (
                <ProductCard key={product._id || product.id} product={product} />
              ))}
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={12}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
