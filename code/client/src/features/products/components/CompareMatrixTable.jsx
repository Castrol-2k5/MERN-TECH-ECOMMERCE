import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { X, Plus, ShoppingCart } from 'lucide-react';
import {
  removeFromCompare,
  toggleHighlightDifferences,
} from '../../../store/slices/compareSlice.js';
import { addToCart } from '../../../store/slices/cartSlice.js';

const ATTRIBUTE_LABELS = {
  cpu: 'Vi xử lý (CPU)',
  ram: 'Bộ nhớ RAM',
  storage: 'Ổ cứng lưu trữ',
  screen_size: 'Màn hình hiển thị',
  screen: 'Màn hình hiển thị',
  display: 'Màn hình hiển thị',
  vga: 'Card đồ họa (VGA)',
  gpu: 'Card đồ họa (VGA)',
  connectivity: 'Cổng kết nối',
  ports: 'Cổng kết nối',
  battery: 'Dung lượng pin',
  weight: 'Trọng lượng',
  os: 'Hệ điều hành',
  warranty: 'Thời gian bảo hành',
  chip: 'Vi xử lý (SoC)',
  camera: 'Camera chính',
  front_camera: 'Camera trước',
  rear_camera: 'Camera sau',
  resolution: 'Độ phân giải',
  refresh_rate: 'Tần số quét',
  connection: 'Chuẩn kết nối',
  power: 'Công suất sạc',
};

const getAttributeLabel = (key) => {
  const normalizedKey = String(key || '').trim().toLowerCase();
  if (ATTRIBUTE_LABELS[normalizedKey]) {
    return ATTRIBUTE_LABELS[normalizedKey];
  }
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
};

export const CompareMatrixTable = ({ onAddProductClick }) => {
  const dispatch = useDispatch();
  const { products, highlightDifferences } = useSelector((state) => state.compare);

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val || 0);
  };

  // Trích xuất danh sách thuộc tính động từ Sản phẩm 1 (Anchor Product) & Category attributeKeys
  const attributesList = useMemo(() => {
    if (!products || products.length === 0) return [];

    const keysSet = new Set();
    const orderedKeys = [];

    // 1. Thêm từ attributeKeys của danh mục (nếu có)
    const categoryKeys =
      products[0]?.categoryId?.attributeKeys ||
      products[0]?.category?.attributeKeys ||
      [];

    if (Array.isArray(categoryKeys)) {
      categoryKeys.forEach((k) => {
        const keyLower = String(k).trim().toLowerCase();
        if (keyLower && !keysSet.has(keyLower)) {
          keysSet.add(keyLower);
          orderedKeys.push(keyLower);
        }
      });
    }

    // 2. Thêm các thuộc tính thực tế có trong sản phẩm 1
    const collectFromProduct = (prod) => {
      if (!prod) return;
      if (Array.isArray(prod.rawAttributes)) {
        prod.rawAttributes.forEach((attr) => {
          if (attr && attr.key) {
            const keyLower = String(attr.key).trim().toLowerCase();
            if (keyLower && !keysSet.has(keyLower)) {
              keysSet.add(keyLower);
              orderedKeys.push(keyLower);
            }
          }
        });
      }
      if (prod.attributes && typeof prod.attributes === 'object') {
        Object.keys(prod.attributes).forEach((key) => {
          const keyLower = String(key).trim().toLowerCase();
          if (keyLower && !keysSet.has(keyLower)) {
            keysSet.add(keyLower);
            orderedKeys.push(keyLower);
          }
        });
      }
    };

    // Thu thập thuộc tính từ sản phẩm neo đầu tiên và các sản phẩm tiếp theo
    products.forEach(collectFromProduct);

    return orderedKeys.map((key) => ({
      key,
      label: getAttributeLabel(key),
    }));
  }, [products]);

  const handleAddToCart = (product) => {
    dispatch(
      addToCart({
        productId: product._id || product.id,
        productSkuId: product.skus?.[0]?._id || `sku-${product._id || product.id}`,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        quantity: 1,
      })
    );
  };

  const checkRowHasDifferences = (key) => {
    if (products.length <= 1) return false;
    const firstVal = (products[0]?.attributes?.[key] || '').toString().trim();
    return products.some(
      (p) => (p.attributes?.[key] || '').toString().trim() !== firstVal
    );
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={highlightDifferences}
              onChange={() => dispatch(toggleHighlightDifferences())}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-xs sm:text-sm font-bold text-slate-700">
              Chỉ làm nổi bật các điểm khác biệt
            </span>
          </label>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Đang so sánh <strong className="text-blue-600">{products.length}</strong> / 4 thiết bị
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full border-collapse text-left text-xs min-w-[750px]">
          <thead>
            <tr className="border-b border-slate-200 divide-x divide-slate-100 bg-slate-50/50">
              <th className="p-4 w-48 font-black text-slate-400 uppercase tracking-wider text-[11px] align-top">
                Thông số so sánh
              </th>

              {products.map((product) => (
                <th key={product._id || product.id} className="p-4 w-64 align-top">
                  <div className="flex flex-col gap-3 relative group">
                    <button
                      onClick={() => dispatch(removeFromCompare(product._id || product.id))}
                      className="absolute -top-1 -right-1 p-1 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Bỏ so sánh"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <Link to={`/product/${product.slug}`} className="block">
                      <div className="w-full h-32 rounded-xl bg-white p-2 flex items-center justify-center border border-slate-100 mb-2">
                        <img
                          src={product.images?.[0]}
                          alt={product.name}
                          className="max-h-full object-contain"
                        />
                      </div>
                      <h4 className="font-bold text-slate-900 line-clamp-2 hover:text-blue-600 transition-colors">
                        {product.name}
                      </h4>
                    </Link>

                    <div className="text-base font-extrabold text-blue-600">
                      {formatPrice(product.price)}
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Chọn mua</span>
                    </button>
                  </div>
                </th>
              ))}

              {products.length < 4 && (
                <th className="p-4 w-56 align-middle text-center bg-slate-50/30">
                  <button
                    onClick={onAddProductClick}
                    className="w-full py-8 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50/40 transition-all cursor-pointer text-slate-500 hover:text-blue-600"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold">+ Thêm sản phẩm so sánh</span>
                  </button>
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {attributesList.length === 0 ? (
              <tr>
                <td colSpan={products.length + (products.length < 4 ? 2 : 1)} className="p-6 text-center text-slate-400 italic">
                  Chưa có thông số kỹ thuật chi tiết để so sánh cho sản phẩm này.
                </td>
              </tr>
            ) : (
              attributesList.map((attr) => {
                const hasDiff = checkRowHasDifferences(attr.key);
                const rowHighlight = highlightDifferences && hasDiff;

                return (
                  <tr
                    key={attr.key}
                    className={`divide-x divide-slate-100 transition-colors ${
                      rowHighlight ? 'bg-amber-50/50' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <td className="p-4 font-bold text-slate-700 bg-slate-50/30">
                      <div className="flex items-center justify-between">
                        <span>{attr.label}</span>
                        {rowHighlight && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                            Khác biệt
                          </span>
                        )}
                      </div>
                    </td>

                    {products.map((product) => {
                      const value = product.attributes?.[attr.key] || '—';
                      return (
                        <td
                          key={product._id || product.id}
                          className={`p-4 font-medium leading-relaxed ${
                            rowHighlight
                              ? 'text-slate-900 font-bold bg-amber-50/70 border-l-2 border-amber-400'
                              : 'text-slate-700'
                          }`}
                        >
                          {value}
                        </td>
                      );
                    })}

                    {products.length < 4 && <td className="p-4 bg-slate-50/20 text-center text-slate-300">—</td>}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompareMatrixTable;
