import axiosClient from '../../../services/axiosClient.js';
import { normalizeProduct } from './productAdapter.js';

export { normalizeProduct } from './productAdapter.js';

/**
 * Chuẩn hóa payload trước khi gửi lên Backend POST/PUT /products
 * để tuân thủ tuyệt đối schema Zod (.strict()) của Backend.
 */
export const buildCleanProductPayload = (payload = {}) => {
  const clean = {
    name: String(payload.name || '').trim(),
    brand: String(payload.brand || '').trim(),
    unit: String(payload.unit || 'Cái').trim() || 'Cái',
    categoryId: String(
      typeof payload.categoryId === 'object' ? payload.categoryId?._id : payload.categoryId || ''
    ).trim(),
    description: String(payload.description ?? payload.specsSummary ?? '').trim(),
    images: Array.isArray(payload.images)
      ? payload.images.map((img) => String(img || '').trim()).filter(Boolean)
      : [],
    isSerialManaged: payload.isSerialManaged !== undefined ? Boolean(payload.isSerialManaged) : true,
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
  };

  if (payload.slug && String(payload.slug).trim()) {
    clean.slug = String(payload.slug).trim().toLowerCase();
  }

  // Chuẩn hóa attributes: [{ key, value }]
  if (Array.isArray(payload.attributes)) {
    clean.attributes = payload.attributes
      .filter((attr) => attr && String(attr.key || '').trim() && String(attr.value || '').trim())
      .map((attr) => ({
        key: String(attr.key).trim(),
        value: String(attr.value).trim(),
      }));
  } else if (payload.attributes && typeof payload.attributes === 'object') {
    clean.attributes = Object.entries(payload.attributes)
      .filter(([k, v]) => String(k || '').trim() && String(v || '').trim())
      .map(([key, value]) => ({
        key: String(key).trim(),
        value: String(value).trim(),
      }));
  } else {
    clean.attributes = [];
  }

  // Chuẩn hóa options: [{ name, displayType, values }]
  if (Array.isArray(payload.options)) {
    clean.options = payload.options
      .filter((opt) => opt && String(opt.name || '').trim())
      .map((opt) => ({
        name: String(opt.name).trim(),
        displayType: String(opt.displayType || 'button').trim(),
        values: Array.isArray(opt.values)
          ? opt.values.map((v) => String(v || '').trim()).filter(Boolean)
          : String(opt.values || '')
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean),
      }));
  } else {
    clean.options = [];
  }

  // Chuẩn hóa skus: [{ _id?, sku, price, salePrice?, images?, optionValues?, isActive? }]
  if (Array.isArray(payload.skus)) {
    clean.skus = payload.skus
      .filter((s) => s && String(s.sku || s.code || '').trim())
      .map((s) => {
        const rawPrice = Number(s.price ?? s.originalPrice ?? 0);
        const rawSalePrice =
          s.salePrice !== undefined && s.salePrice !== '' && s.salePrice !== null
            ? Number(s.salePrice)
            : rawPrice;

        const listPrice = Math.max(0, rawPrice, rawSalePrice);
        const salePrice = Math.max(0, Math.min(listPrice, rawSalePrice));

        let optionValues = [];
        if (Array.isArray(s.optionValues) && s.optionValues.length > 0) {
          optionValues = s.optionValues
            .filter((ov) => ov && String(ov.optionName || '').trim() && String(ov.value || '').trim())
            .map((ov) => ({
              optionName: String(ov.optionName).trim(),
              value: String(ov.value).trim(),
            }));
        } else if (s.options && typeof s.options === 'object') {
          optionValues = Object.entries(s.options)
            .filter(([k, v]) => String(k || '').trim() && String(v || '').trim())
            .map(([optionName, value]) => ({
              optionName: String(optionName).trim(),
              value: String(value).trim(),
            }));
        }

        const skuItem = {
          sku: String(s.sku || s.code).trim().toUpperCase(),
          price: listPrice,
          salePrice,
          costPrice: Math.max(0, Number(s.costPrice || 0)),
          images: Array.isArray(s.images)
            ? s.images.map((img) => String(img || '').trim()).filter(Boolean)
            : [],
          optionValues,
          isDefault: Boolean(s.isDefault),
          isActive: s.isActive !== undefined ? Boolean(s.isActive) : true,
        };

        if (s._id && /^[0-9a-fA-F]{24}$/.test(String(s._id))) {
          skuItem._id = String(s._id);
        }

        return skuItem;
      });
  } else {
    clean.skus = [];
  }

  return clean;
};

export const productService = {
  getProducts: async (params = {}) => {
    try {
      const response = await axiosClient.get('/products', { params });
      const rawProducts = response?.data?.products || (Array.isArray(response?.data) ? response.data : []);
      const normalizedProducts = rawProducts.map(normalizeProduct);
      const availableBrands = response?.meta?.availableBrands || response?.data?.availableBrands || [];
      const availableAttributes = response?.meta?.availableAttributes || response?.data?.availableAttributes || [];
      const categoryInfo = response?.meta?.categoryInfo || response?.data?.categoryInfo || null;

      return {
        products: normalizedProducts,
        meta: {
          ...(response?.meta || { total: normalizedProducts.length, page: 1, limit: 12 }),
          availableBrands,
          availableAttributes,
          categoryInfo,
        },
        availableBrands,
        availableAttributes,
        categoryInfo,
      };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[productService.getProducts] Lỗi kết nối Live Database / API /products:', err);
        throw err;
      }
      return {
        products: [],
        meta: { total: 0, page: 1, limit: 12, availableBrands: [] },
        availableBrands: [],
        error: err.message,
      };
    }
  },

  getProductBySlug: async (slug) => {
    try {
      const response = await axiosClient.get(`/products/${slug}`);
      const rawProduct = response?.data?.product || response?.data;
      if (!rawProduct) {
        throw new Error(`Không tìm thấy sản phẩm có slug: "${slug}"`);
      }
      return normalizeProduct(rawProduct);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(`[productService.getProductBySlug] Lỗi tải sản phẩm "${slug}":`, err);
        throw err;
      }
      return null;
    }
  },

  uploadImages: async (files = []) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('images', file);
    });
    const response = await axiosClient.post('/products/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response?.data?.urls || [];
  },

  createProduct: async (payload) => {
    const cleanPayload = buildCleanProductPayload(payload);
    const response = await axiosClient.post('/products', cleanPayload);
    return normalizeProduct(response?.data?.product || response?.data || cleanPayload);
  },

  updateProduct: async (id, payload) => {
    const cleanPayload = buildCleanProductPayload(payload);
    const response = await axiosClient.put(`/products/${id}`, cleanPayload);
    return normalizeProduct(response?.data?.product || response?.data || cleanPayload);
  },

  deleteProduct: async (id) => {
    const response = await axiosClient.delete(`/products/${id}`);
    return response?.data || { success: true };
  },

  toggleProductActive: async (id, isActive) => {
    const response = await axiosClient.put(`/products/${id}`, { isActive });
    return response?.data || { success: true, isActive };
  },

  getCompareProducts: async () => {
    try {
      const res = await productService.getProducts({ limit: 4 });
      return res.products?.slice(0, 2) || [];
    } catch {
      return [];
    }
  },

  getRecommendations: async ({ productIds = [], limit = 4, branchId = null } = {}) => {
    const idStr = Array.isArray(productIds)
      ? productIds.map(String).filter(Boolean).join(',')
      : String(productIds || '');

    try {
      const response = await axiosClient.get('/products/recommendations', {
        params: {
          ...(idStr ? { productIds: idStr } : {}),
          limit,
          ...(branchId ? { branchId } : {}),
        },
      });
      const rawProducts = response?.data?.products || [];
      return rawProducts.map((raw) => ({
        ...normalizeProduct(raw),
        availableStock: raw.availableStock ?? 0,
      }));
    } catch {
      return [];
    }
  },
};

export default productService;
