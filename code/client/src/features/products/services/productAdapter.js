/**
 * Product Adapter: Chuẩn hóa dữ liệu sản phẩm và SKU biến thể từ Backend API
 */

export const normalizeProductSkus = (skus, basePrice, baseOriginalPrice, productId) => {
  if (!Array.isArray(skus)) return [];

  return skus.map((s, idx) => {
    // Chuyển mảng optionValues [{ optionName, value }] thành dictionary options: { [optionName]: value }
    const optionsDict = {};
    if (Array.isArray(s.optionValues)) {
      s.optionValues.forEach((opt) => {
        if (opt && opt.optionName && opt.value) {
          optionsDict[opt.optionName] = opt.value;
        }
      });
    }

    const price = Number(s.price || basePrice || 0);
    const salePrice = Number(s.salePrice && s.salePrice > 0 ? s.salePrice : price);
    const originalPrice = Number(s.originalPrice || s.price || baseOriginalPrice || price);

    return {
      ...s,
      _id: s._id || `sku-${productId || 'prod'}-${idx}`,
      sku: s.sku || s.code || `SKU-${idx}`,
      code: s.sku || s.code || `SKU-${idx}`,
      price,
      salePrice,
      originalPrice,
      stock: s.stock !== undefined ? s.stock : 10,
      options: Object.keys(optionsDict).length > 0 ? optionsDict : (s.options || {}),
    };
  });
};

export const normalizeProduct = (p) => {
  if (!p) return null;

  // 1. Skus & Prices
  const rawSkus = Array.isArray(p.skus) && p.skus.length > 0 ? p.skus : [];
  const primarySku = rawSkus[0] || {};

  const price =
    p.price !== undefined && p.price !== null
      ? Number(p.price)
      : primarySku.salePrice !== undefined && primarySku.salePrice !== null && primarySku.salePrice > 0
        ? Number(primarySku.salePrice)
        : Number(primarySku.price || 0);

  const originalPrice =
    p.originalPrice !== undefined && p.originalPrice !== null
      ? Number(p.originalPrice)
      : Number(primarySku.price || price || 0);

  const discountPercentage =
    p.discountPercentage !== undefined
      ? Number(p.discountPercentage)
      : originalPrice > price && originalPrice > 0
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

  // 2. Attributes normalization:
  // In DB: attributes is [{ key: 'cpu', value: '...' }]
  // In UI: expects object { cpu: '...', ram: '...' }
  const attributesObj = {};
  let attributesArr = [];

  if (Array.isArray(p.attributes)) {
    attributesArr = p.attributes;
    p.attributes.forEach((attr) => {
      if (attr && attr.key) {
        attributesObj[attr.key] = attr.value;
      }
    });
  } else if (p.attributes && typeof p.attributes === 'object') {
    Object.assign(attributesObj, p.attributes);
    attributesArr = Object.entries(p.attributes).map(([key, value]) => ({ key, value }));
  }

  // 3. Category
  let categorySlug = 'laptop';
  let categoryName = 'Laptop';
  if (p.categoryId) {
    if (typeof p.categoryId === 'object') {
      categorySlug = p.categoryId.slug || categorySlug;
      categoryName = p.categoryId.name || categoryName;
    } else {
      categorySlug = p.category || categorySlug;
    }
  } else if (p.category) {
    categorySlug = typeof p.category === 'object' ? p.category.slug || 'laptop' : p.category;
  }

  // 4. Images
  const fallbackImg =
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
  const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : [fallbackImg];

  // 5. SpecsSummary
  const specsSummary =
    p.specsSummary ||
    [attributesObj.cpu, attributesObj.ram, attributesObj.storage, attributesObj.screen_size || attributesObj.screen]
      .filter(Boolean)
      .join(' • ') ||
    p.name;

  const normalizedSkus = normalizeProductSkus(rawSkus, price, originalPrice, p._id || p.id);

  return {
    ...p,
    _id: p._id || p.id,
    id: p._id || p.id,
    name: p.name || 'Sản phẩm công nghệ',
    slug: p.slug || '',
    category: categorySlug,
    categoryName,
    brand: p.brand || '',
    price,
    originalPrice,
    discountPercentage,
    specsSummary,
    images,
    rating: p.rating ?? null,
    reviewsCount: p.reviewsCount ?? 0,
    stockStatus: p.stockStatus || 'IN_STOCK',
    stockLabel: p.stockLabel || 'Còn hàng',
    attributes: attributesObj,
    rawAttributes: attributesArr,
    options: Array.isArray(p.options) ? p.options : [],
    skus: normalizedSkus,
    branchInventories:
      Array.isArray(p.branchInventories) ? p.branchInventories : [],
    promotions:
      Array.isArray(p.promotions) ? p.promotions : [],
  };
};

/**
 * Tạo cart item chuẩn từ product và activeSku
 */
export const createCartItem = ({ product, activeSku, quantity = 1, fulfillmentType, pickupBranch }) => {
  const chosenSku = activeSku || product?.skus?.[0];
  const itemPrice =
    chosenSku?.salePrice && chosenSku.salePrice > 0
      ? Number(chosenSku.salePrice)
      : Number(chosenSku?.price || product?.price || 0);

  const cartItem = {
    productId: product?._id || product?.id,
    productSkuId: chosenSku?._id || product?.skus?.[0]?._id,
    productName: product?.name || '',
    name: product?.name || '', // tương thích ngược
    sku: chosenSku?.sku || chosenSku?.code || 'SKU-DEFAULT',
    price: itemPrice,
    image: chosenSku?.images?.[0] || product?.images?.[0] || '',
    quantity: Math.max(1, Number(quantity) || 1),
  };

  if (fulfillmentType) {
    cartItem.fulfillmentType = fulfillmentType;
  }
  if (pickupBranch) {
    cartItem.pickupBranch = pickupBranch;
  }

  return cartItem;
};

export default {
  normalizeProduct,
  normalizeProductSkus,
  createCartItem,
};
