/**
 * Product Adapter: Chuẩn hóa dữ liệu sản phẩm và SKU biến thể từ Backend API
 */

export const normalizeProductSkus = (skus, basePrice, baseOriginalPrice, productId) => {
  if (!Array.isArray(skus)) return [];

  return skus.map((s, idx) => {
    // Đồng bộ giữa mảng optionValues [{ optionName, value }] (DB) và dictionary options: { [optionName]: value } (UI)
    const optionsDict = {};
    if (Array.isArray(s.optionValues) && s.optionValues.length > 0) {
      s.optionValues.forEach((opt) => {
        if (opt && opt.optionName && opt.value) {
          optionsDict[opt.optionName] = opt.value;
        }
      });
    } else if (s.options && typeof s.options === 'object') {
      Object.entries(s.options).forEach(([k, v]) => {
        if (k && v) optionsDict[k] = String(v);
      });
    }

    const optionValues = Object.entries(optionsDict).map(([optionName, value]) => ({
      optionName,
      value: String(value),
    }));

    // Xác định Giá niêm yết (listPrice -> DB sku.price) và Giá bán khuyến mãi (sellingPrice -> DB sku.salePrice)
    let listPrice;
    let sellingPrice;

    if (s.originalPrice !== undefined && s.salePrice === undefined) {
      // Dữ liệu từ Mock/UI cũ (price = giá bán, originalPrice = giá gốc)
      listPrice = Number(s.originalPrice || s.price || baseOriginalPrice || 0);
      sellingPrice = Number(s.price || basePrice || listPrice);
    } else {
      // Dữ liệu chuẩn từ Backend DB (price = giá niêm yết, salePrice = giá khuyến mãi)
      listPrice = Number(s.price ?? baseOriginalPrice ?? basePrice ?? 0);
      sellingPrice =
        s.salePrice !== undefined && s.salePrice !== null && Number(s.salePrice) > 0
          ? Number(s.salePrice)
          : listPrice;
    }

    if (sellingPrice > listPrice) {
      listPrice = sellingPrice;
    }

    const skuCode = String(s.sku || s.code || `SKU-${idx + 1}`).toUpperCase();

    return {
      ...s,
      _id: s._id || `sku-${productId || 'prod'}-${idx}`,
      sku: skuCode,
      code: skuCode,
      price: listPrice,
      salePrice: sellingPrice,
      originalPrice: listPrice,
      ...(s.costPrice !== undefined ? { costPrice: Math.max(0, Number(s.costPrice || 0)) } : {}),
      stock: s.stock !== undefined ? s.stock : 0,
      options: optionsDict,
      optionValues,
      images: Array.isArray(s.images) ? s.images : [],
      isActive: s.isActive !== undefined ? Boolean(s.isActive) : true,
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
  // In UI: attributes object { cpu: '...', ram: '...' } + rawAttributes array [{ key, value }]
  const attributesObj = {};
  let attributesArr = [];

  if (Array.isArray(p.attributes)) {
    attributesArr = p.attributes
      .filter((attr) => attr && attr.key)
      .map((attr) => ({
        key: String(attr.key).trim(),
        value: String(attr.value ?? '').trim(),
      }));
    attributesArr.forEach((attr) => {
      attributesObj[attr.key] = attr.value;
    });
  } else if (p.attributes && typeof p.attributes === 'object') {
    Object.assign(attributesObj, p.attributes);
    attributesArr = Object.entries(p.attributes).map(([key, value]) => ({
      key: String(key).trim(),
      value: String(value ?? '').trim(),
    }));
  }

  // 3. Category
  let categorySlug = 'laptop';
  let categoryName = 'Laptop';
  let categoryId = '';
  let categoryObj = null;

  if (p.categoryId) {
    if (typeof p.categoryId === 'object') {
      categoryObj = p.categoryId;
      categoryId = String(p.categoryId._id || p.categoryId.id || '');
      categorySlug = p.categoryId.slug || categorySlug;
      categoryName = p.categoryId.name || categoryName;
    } else {
      categoryId = String(p.categoryId);
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
  const skuCode = p.skuCode || normalizedSkus[0]?.sku || normalizedSkus[0]?.code || '';

  return {
    ...p,
    _id: p._id || p.id,
    id: p._id || p.id,
    name: p.name || 'Sản phẩm công nghệ',
    slug: p.slug || '',
    categoryId,
    categoryObj,
    category: categorySlug,
    categoryName,
    brand: p.brand || '',
    description: p.description || '',
    isSerialManaged: p.isSerialManaged !== undefined ? Boolean(p.isSerialManaged) : true,
    isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
    skuCode,
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
    branchInventories: Array.isArray(p.branchInventories) ? p.branchInventories : [],
    promotions: Array.isArray(p.promotions) ? p.promotions : [],
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
