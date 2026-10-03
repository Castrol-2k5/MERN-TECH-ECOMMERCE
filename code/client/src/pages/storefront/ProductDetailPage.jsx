import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Truck, RotateCcw, ShieldCheck, Gift, Star, CheckCircle2 } from 'lucide-react';
import useProductDetail from '../../features/products/hooks/useProductDetail.js';
import ProductImageGallery from '../../features/products/components/ProductImageGallery.jsx';
import SkuVariantSelector from '../../features/products/components/SkuVariantSelector.jsx';
import SpecsTable from '../../features/products/components/SpecsTable.jsx';
import MultiBranchStockBox from '../../features/inventory/components/MultiBranchStockBox.jsx';
import ProductCard from '../../features/products/components/ProductCard.jsx';
import productService, { fallbackProducts } from '../../features/products/services/productService.js';
import { addToCart } from '../../store/slices/cartSlice.js';
import Spinner from '../../components/common/Spinner.jsx';

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { product, isLoading } = useProductDetail(slug);

  const [selectedOptions, setSelectedOptions] = useState({});
  const [activeTab, setActiveTab] = useState('specs');
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showOrderToast, setShowOrderToast] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const activeSku =
    product?.skus?.find((s) => {
      if (!s.options) return false;
      return Object.entries(selectedOptions).every(([k, v]) => s.options[k] === v);
    }) || product?.skus?.[0];

  const handleSelectOption = (optionName, value) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val || 0);
  };

  const handleBuyNow = () => {
    if (!product) return;
    dispatch(
      addToCart({
        productId: product._id || product.id,
        productSkuId: activeSku?._id || product.skus?.[0]?._id || `sku-${product._id || product.id}`,
        name: product.name,
        price: activeSku?.salePrice || activeSku?.price || product.price,
        image: product.images?.[0] || '',
        quantity: 1,
      })
    );
    navigate('/cart');
  };

  const handleReserveClickCollect = () => {
    if (!product) return;
    dispatch(
      addToCart({
        productId: product._id || product.id,
        productSkuId: product.skus?.[0]?._id || `sku-${product._id || product.id}`,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        quantity: 1,
        fulfillmentType: 'CLICK_AND_COLLECT',
        pickupBranch: selectedBranch?.branchName || 'TechOne Q1 Flagship',
      })
    );
    setShowOrderToast(true);
    setTimeout(() => setShowOrderToast(false), 4000);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold">Không tìm thấy sản phẩm</h2>
        <Link to="/category/laptop" className="text-blue-600 font-bold mt-2 inline-block">
          Quay lại danh mục
        </Link>
      </div>
    );
  }

  useEffect(() => {
    if (!product) return;
    let isMounted = true;
    productService
      .getProducts({ category: product.category, limit: 5 })
      .then((res) => {
        if (isMounted) {
          const list = res.products || fallbackProducts;
          const filtered = list
            .filter((p) => (p._id || p.id) !== (product._id || product.id))
            .slice(0, 4);
          setRelatedProducts(filtered.length > 0 ? filtered : fallbackProducts.slice(0, 4));
        }
      })
      .catch(() => {
        if (isMounted) {
          setRelatedProducts(
            fallbackProducts
              .filter((p) => (p._id || p.id) !== (product._id || product.id))
              .slice(0, 4)
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [product?._id, product?.id, product?.category]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-6">
      {showOrderToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Đã đặt giữ hàng Click & Collect thành công!</p>
            <p className="text-slate-300">
              Nhận máy tại: {selectedBranch?.branchName || 'TechOne Q1 Flagship'} sau 30 phút.
            </p>
          </div>
        </div>
      )}

      <nav className="text-xs text-slate-400 mb-6 flex items-center gap-1.5">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link to="/category/laptop" className="hover:text-blue-600 transition-colors">
          Laptop chính hãng
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-12">
        <div className="lg:col-span-6">
          <ProductImageGallery
            images={product.images}
            productName={product.name}
            discountPercentage={product.discountPercentage}
          />
        </div>

        <div className="lg:col-span-6 flex flex-col gap-4">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-bold text-amber-500">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>4.9 (286 đánh giá)</span>
            </span>
            <span>•</span>
            <span className="font-mono">SKU: {product.skuCode || 'MBA-M4-16-256'}</span>
          </div>

          <div className="flex items-baseline gap-3 pt-2">
            <span className="text-3xl sm:text-4xl font-black text-blue-600">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-base text-slate-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {product.originalPrice > product.price && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                Tiết kiệm {formatPrice(product.originalPrice - product.price)}
              </span>
            )}
          </div>

          <SkuVariantSelector
            options={product.options || []}
            selectedOptions={selectedOptions}
            onSelectOption={handleSelectOption}
          />

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-800 text-sm">
              <Gift className="w-4 h-4 text-blue-600" />
              <span>Ưu đãi hôm nay khi đặt hàng</span>
            </div>
            <ul className="space-y-1.5 text-slate-700">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>Tặng túi chống sốc cao cấp TechOne chính hãng</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>Giảm thêm 1.000.000đ khi thanh toán qua cổng VNPAY-QR</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span>Trả góp 0% lãi suất kỳ hạn 12 tháng qua thẻ tín dụng</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleBuyNow}
              className="py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex flex-col items-center justify-center transition-all cursor-pointer shadow-lg shadow-blue-600/30"
            >
              <span>MUA NGAY</span>
              <span className="text-[11px] font-normal text-blue-100">Giao hàng tận nơi</span>
            </button>

            <button
              onClick={handleReserveClickCollect}
              className="py-3.5 px-6 rounded-2xl bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-600 font-black text-sm flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <span>ĐẶT GIỮ HÀNG</span>
              <span className="text-[11px] font-normal text-slate-500">Nhận tại showroom 30 phút</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
        <div className="lg:col-span-7">
          <MultiBranchStockBox
            skuId={activeSku?._id || product.skus?.[0]?._id}
            onSelectBranch={setSelectedBranch}
          />
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
          <h4 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
            Cam kết chất lượng dịch vụ
          </h4>

          <div className="flex items-center gap-3.5 text-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Giao nhanh 2 giờ</p>
              <p className="text-slate-500">Miễn phí giao hàng nội thành cho đơn từ 500k</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 text-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Đổi trả trong 30 ngày</p>
              <p className="text-slate-500">Miễn phí 1 đổi 1 nếu phát sinh lỗi phần cứng từ NSX</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 text-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Bảo hành 12 tháng chính hãng</p>
              <p className="text-slate-500">Kích hoạt e-Warranty tra cứu trực tiếp theo Serial</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 mb-16 shadow-xs">
        <div className="flex items-center gap-6 border-b border-slate-200 pb-4 mb-6">
          <button
            onClick={() => setActiveTab('specs')}
            className={`text-sm font-bold pb-2 transition-colors cursor-pointer border-b-2 -mb-4.5 ${
              activeTab === 'specs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Thông số kỹ thuật
          </button>
          <button
            onClick={() => setActiveTab('desc')}
            className={`text-sm font-bold pb-2 transition-colors cursor-pointer border-b-2 -mb-4.5 ${
              activeTab === 'desc'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Mô tả sản phẩm
          </button>
        </div>

        {activeTab === 'specs' ? (
          <SpecsTable attributes={product.attributes} />
        ) : (
          <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed">
            <p className="text-base font-semibold text-slate-900 mb-3">
              {product.name} — Trải nghiệm đỉnh cao thế hệ mới
            </p>
            <p>{product.description}</p>
          </div>
        )}
      </div>

      <section className="my-12">
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6">
          Sản phẩm liên quan cùng phân khúc
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {relatedProducts.map((p) => (
            <ProductCard key={p._id || p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ProductDetailPage;
