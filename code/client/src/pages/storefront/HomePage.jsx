import HeroBannerCarousel from '../../features/products/components/HeroBannerCarousel.jsx';
import FlashSaleSection from '../../features/products/components/FlashSaleSection.jsx';
import CategoryHighlights from '../../features/products/components/CategoryHighlights.jsx';
import ClickAndCollectBanner from '../../features/products/components/ClickAndCollectBanner.jsx';
import ProductCard from '../../features/products/components/ProductCard.jsx';
import useProducts from '../../features/products/hooks/useProducts.js';
import Spinner from '../../components/common/Spinner.jsx';

export const HomePage = () => {
  const { products, isLoading } = useProducts();

  const partnerBrands = [
    'Apple',
    'SAMSUNG',
    'ASUS',
    'Lenovo',
    'DELL',
    'SONY',
    'HP',
    'Acer',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-4">
      <HeroBannerCarousel />
      <FlashSaleSection products={products} />
      <CategoryHighlights />

      <section className="my-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">
              Được khách hàng tin chọn
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Sản phẩm bán chạy nhất
            </h2>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-500">
            Cập nhật theo doanh số tuần
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <ClickAndCollectBanner />

      <section className="my-16 py-10 px-6 rounded-3xl bg-white border border-slate-200/80 text-center shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
          Đối tác công nghệ hàng đầu
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
          {partnerBrands.map((brand) => (
            <span
              key={brand}
              className="text-lg sm:text-xl font-black text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-wider"
            >
              {brand}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
