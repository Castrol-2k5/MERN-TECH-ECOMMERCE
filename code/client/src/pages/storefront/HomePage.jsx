import HeroBannerCarousel from '../../features/products/components/HeroBannerCarousel.jsx';
// import FlashSaleSection from '../../features/products/components/FlashSaleSection.jsx';
import CategoryHighlights from '../../features/products/components/CategoryHighlights.jsx';
import ClickAndCollectBanner from '../../features/products/components/ClickAndCollectBanner.jsx';
import ProductCard from '../../features/products/components/ProductCard.jsx';
import useProducts from '../../features/products/hooks/useProducts.js';
import Spinner from '../../components/common/Spinner.jsx';
import { isDevOrTest } from '../../config/dataMode.js';

export const HomePage = () => {
  const { products, isLoading, error, refetch } = useProducts();
  const isDev = isDevOrTest();

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
      {/* Tạm ẩn Flash Sale chờ bổ sung API khuyến mãi giờ vàng ở phân hệ tiếp theo */}
      {/* <FlashSaleSection products={products} /> */}
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

        {error ? (
          <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-sm">
            <h4 className="font-bold text-base mb-1 text-rose-900">
              {isDev ? '⚠️ Lỗi kết nối Live Database / Backend API' : 'Không thể tải danh sách sản phẩm'}
            </h4>
            <p className="text-rose-700 mb-3">
              {isDev
                ? `Chi tiết lỗi: ${error.message || 'Network Error / Không thể kết nối tới server 5000'}. Hãy đảm bảo server đang chạy (npm run dev trong code/server) hoặc dùng nút gạt bên góc phải để chuyển về Mock Data.`
                : 'Đã có lỗi xảy ra trong quá trình tải dữ liệu. Vui lòng thử lại sau.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              Thử tải lại
            </button>
          </div>
        ) : isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-slate-300 text-center bg-slate-50">
            <p className="text-slate-600 font-medium">Chưa có sản phẩm nào trong cơ sở dữ liệu.</p>
            {isDev && (
              <p className="text-xs text-slate-400 mt-1">
                Gợi ý: Chạy lệnh <code>npm run seed</code> trong thư mục server để tạo dữ liệu mẫu, hoặc bật chế độ Mock Data ở góc màn hình.
              </p>
            )}
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
