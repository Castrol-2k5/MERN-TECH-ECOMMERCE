import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Gift,
  Star,
  CheckCircle2,
  Scale,
  ShoppingCart,
  AlertCircle
} from 'lucide-react';
import useProductDetail from '../../features/products/hooks/useProductDetail.js';
import ProductImageGallery from '../../features/products/components/ProductImageGallery.jsx';
import SkuVariantSelector from '../../features/products/components/SkuVariantSelector.jsx';
import SpecsTable from '../../features/products/components/SpecsTable.jsx';
import MultiBranchStockBox from '../../features/inventory/components/MultiBranchStockBox.jsx';
import ProductCard from '../../features/products/components/ProductCard.jsx';
import productService, { fallbackProducts } from '../../features/products/services/productService.js';
import { createCartItem } from '../../features/products/services/productAdapter.js';
import { addToCart } from '../../store/slices/cartSlice.js';
import { addToCompare } from '../../store/slices/compareSlice.js';
import Spinner from '../../components/common/Spinner.jsx';

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { product, isLoading } = useProductDetail(slug);

  const [userSelectedOptions, setUserSelectedOptions] = useState({});
  const [activeTab, setActiveTab] = useState('specs');
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [toastInfo, setToastInfo] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [stockSummary, setStockSummary] = useState({ totalStock: null, branches: [] });

  const defaultOptions = useMemo(() => {
    if (product?.skus?.[0]?.options && Object.keys(product.skus[0].options).length > 0) {
      return product.skus[0].options;
    }
    if (product?.options?.length > 0) {
      const init = {};
      product.options.forEach((opt) => {
        if (opt.name && opt.values?.[0]) init[opt.name] = opt.values[0];
      });
      return init;
    }
    return {};
  }, [product]);

  const selectedOptions = useMemo(() => {
    return { ...defaultOptions, ...userSelectedOptions };
  }, [defaultOptions, userSelectedOptions]);

  const matchedSku = useMemo(() => {
    if (!product?.skus || product.skus.length === 0) return null;
    if (!product?.options || product.options.length === 0) return product.skus[0];
    return (
      product.skus.find((s) => {
        if (!s.options || Object.keys(s.options).length === 0) return false;
        return Object.entries(selectedOptions).every(([k, v]) => s.options[k] === v);
      }) || null
    );
  }, [product, selectedOptions]);

  const isVariantAvailable = Boolean(matchedSku);
  const activeSku = matchedSku || product?.skus?.[0];

  const currentPrice =
    activeSku?.salePrice && activeSku.salePrice > 0
      ? Number(activeSku.salePrice)
      : Number(activeSku?.price ?? product?.price ?? 0);

  const currentOriginalPrice = Number(
    activeSku?.originalPrice ?? activeSku?.price ?? product?.originalPrice ?? currentPrice
  );

  const currentSkuCode = activeSku?.sku || activeSku?.code || product?.skuCode || 'MBA-M4-16-256';
  const currentImages =
    Array.isArray(activeSku?.images) && activeSku.images.length > 0
      ? activeSku.images
      : product?.images;

  const isOutOfStockAllBranches =
    product?.stockStatus === 'OUT_OF_STOCK_ONLINE' ||
    (stockSummary.totalStock !== null &&
      stockSummary.branches.length > 0 &&
      stockSummary.totalStock <= 0);

  const handleSelectOption = (optionName, value) => {
    setUserSelectedOptions((prev) => ({
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

  const showToast = (title, subtitle) => {
    setToastInfo({ title, subtitle });
    setTimeout(() => setToastInfo(null), 3500);
  };

  const handleAddToCartOnly = () => {
    if (!product || !isVariantAvailable || isOutOfStockAllBranches) return;
    const item = createCartItem({
      product,
      activeSku,
      quantity: 1,
      options: selectedOptions,
    });
    dispatch(addToCart(item));
    showToast(
      'Đã thêm sản phẩm vào giỏ hàng!',
      `${product.name} (${currentSkuCode})`
    );
  };

  const handleBuyNow = () => {
    if (!product || !isVariantAvailable || isOutOfStockAllBranches) return;
    const item = createCartItem({
      product,
      activeSku,
      quantity: 1,
      options: selectedOptions,
      fulfillmentType: 'DELIVERY',
    });
    dispatch(addToCart(item));
    navigate('/checkout?mode=DELIVERY');
  };

  const handleReserveClickCollect = () => {
    if (!product || !isVariantAvailable || isOutOfStockAllBranches) return;
    const branchId = selectedBranch?.branchId || selectedBranch?._id || '';
    const branchName = selectedBranch?.branchName || selectedBranch?.name || 'TechOne Q1 Flagship';
    const item = createCartItem({
      product,
      activeSku,
      quantity: 1,
      options: selectedOptions,
      fulfillmentType: 'CLICK_AND_COLLECT',
      pickupBranch: branchName,
      pickupBranchId: branchId,
    });
    dispatch(addToCart(item));
    if (selectedBranch) {
      try {
        localStorage.setItem(
          'techone_selected_branch',
          JSON.stringify({
            _id: branchId,
            name: branchName,
            address: selectedBranch.address || '',
          })
        );
      } catch {
        // ignore
      }
    }
    navigate(`/checkout?mode=CLICK_COLLECT${branchId ? `&branchId=${branchId}` : ''}`);
  };

  const handleCompare = () => {
    if (!product) return;
    dispatch(addToCompare(product));
    navigate('/compare');
  };

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
  }, [product]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-6">
      {toastInfo && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">{toastInfo.title}</p>
            <p className="text-slate-300">{toastInfo.subtitle}</p>
          </div>
        </div>
      )}

      <nav className="text-xs text-slate-400 mb-6 flex items-center gap-1.5">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link to={`/category/${product.category || 'laptop'}`} className="hover:text-blue-600 transition-colors capitalize">
          {product.categoryName || 'Laptop chính hãng'}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-12">
        <div className="lg:col-span-6">
          <ProductImageGallery
            images={currentImages}
            productName={product.name}
            discountPercentage={
              currentOriginalPrice > currentPrice && currentOriginalPrice > 0
                ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
                : product.discountPercentage
            }
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
            <span className="font-mono font-semibold text-slate-700">SKU: {currentSkuCode}</span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 pt-2">
            <span className="text-3xl sm:text-4xl font-black text-blue-600">
              {formatPrice(currentPrice)}
            </span>
            {currentOriginalPrice > currentPrice && (
              <span className="text-base text-slate-400 line-through">
                {formatPrice(currentOriginalPrice)}
              </span>
            )}
            {currentOriginalPrice > currentPrice && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                Tiết kiệm {formatPrice(currentOriginalPrice - currentPrice)}
              </span>
            )}
          </div>

          <SkuVariantSelector
            options={product.options || []}
            selectedOptions={selectedOptions}
            skus={product.skus || []}
            onSelectOption={handleSelectOption}
          />

          {!isVariantAvailable && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Tổ hợp tùy chọn này ({Object.entries(selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}) hiện <strong>không khả dụng</strong> hoặc cửa hàng không kinh doanh. Vui lòng chọn phiên bản khác.
              </span>
            </div>
          )}

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
              disabled={!isVariantAvailable || isOutOfStockAllBranches}
              className="py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex flex-col items-center justify-center transition-all cursor-pointer shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {!isVariantAvailable
                  ? 'PHIÊN BẢN KHÔNG KHẢ DỤNG'
                  : isOutOfStockAllBranches
                  ? 'TẠM HẾT HÀNG'
                  : 'MUA NGAY'}
              </span>
              <span className="text-[11px] font-normal text-blue-100">
                {!isVariantAvailable
                  ? 'Vui lòng chọn kết hợp tùy chọn khác'
                  : isOutOfStockAllBranches
                  ? 'Đang chờ nhập thêm kho'
                  : 'Giao hàng tận nơi'}
              </span>
            </button>

            <button
              onClick={handleReserveClickCollect}
              disabled={!isVariantAvailable || isOutOfStockAllBranches}
              className="py-3.5 px-6 rounded-2xl bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-600 font-black text-sm flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>ĐẶT GIỮ HÀNG (CLICK & COLLECT)</span>
              <span className="text-[11px] font-normal text-slate-500">
                {!isVariantAvailable
                  ? 'Không khả dụng cho phiên bản này'
                  : selectedBranch?.branchName
                  ? `Nhận tại: ${selectedBranch.branchName}`
                  : 'Nhận tại showroom sau 30 phút'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <button
              onClick={handleAddToCartOnly}
              disabled={!isVariantAvailable || isOutOfStockAllBranches}
              className="py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Thêm vào giỏ hàng</span>
            </button>

            <button
              onClick={handleCompare}
              className="py-2.5 px-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>So sánh cấu hình</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
        <div className="lg:col-span-7">
          <MultiBranchStockBox
            skuId={activeSku?._id || product.skus?.[0]?._id}
            selectedBranchId={selectedBranch?.branchId}
            onSelectBranch={setSelectedBranch}
            onStockSummaryChange={setStockSummary}
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
