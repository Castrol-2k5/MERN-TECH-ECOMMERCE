import axiosClient from '../../../services/axiosClient.js';

const normalizeCategory = (cat) => {
  if (!cat) return null;
  const parentId =
    cat.parentId && typeof cat.parentId === 'object'
      ? cat.parentId._id || cat.parentId.id || null
      : cat.parentId || null;
  const parentName =
    cat.parentName ||
    (cat.parentId && typeof cat.parentId === 'object' ? cat.parentId.name : null) ||
    null;

  return {
    _id: cat._id || cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description || '',
    attributeKeys: Array.isArray(cat.attributeKeys) ? cat.attributeKeys : [],
    icon: cat.icon || 'laptop',
    productCount: cat.productCount ?? 0,
    directProductCount: cat.directProductCount ?? cat.productCount ?? 0,
    hasChildren: Boolean(cat.hasChildren),
    parentId,
    parentName,
    isActive: cat.isActive !== undefined ? cat.isActive : true,
  };
};

const buildCleanCategoryPayload = (payload = {}) => {
  const clean = {
    name: String(payload.name || '').trim(),
  };
  if (payload.slug !== undefined && String(payload.slug).trim()) {
    clean.slug = String(payload.slug).trim().toLowerCase();
  }
  clean.parentId = payload.parentId ? String(payload.parentId).trim() : null;
  if (Array.isArray(payload.attributeKeys)) {
    clean.attributeKeys = payload.attributeKeys
      .map((k) => String(k || '').trim().toLowerCase())
      .filter(Boolean);
  }
  if (payload.isActive !== undefined) {
    clean.isActive = Boolean(payload.isActive);
  }
  return clean;
};

export const categoryService = {
  getCategories: async () => {
    try {
      const response = await axiosClient.get('/categories');
      const rawCategories = response?.data?.categories || (Array.isArray(response?.data) ? response.data : []);
      return rawCategories.map(normalizeCategory);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[categoryService.getCategories] Lỗi tải danh mục từ Live Database / API:', err);
        throw err;
      }
      return [];
    }
  },

  getCategoryBySlug: async (slug) => {
    try {
      const response = await axiosClient.get(`/categories/${slug}`);
      const rawCategory = response?.data?.category || response?.data;
      return normalizeCategory(rawCategory);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(`[categoryService.getCategoryBySlug] Lỗi tải chi tiết danh mục ${slug}:`, err);
        throw err;
      }
      return null;
    }
  },

  createCategory: async (payload) => {
    const cleanPayload = buildCleanCategoryPayload(payload);
    const response = await axiosClient.post('/categories', cleanPayload);
    return normalizeCategory(response?.data?.category || response?.data);
  },

  updateCategory: async (id, payload) => {
    const cleanPayload = buildCleanCategoryPayload(payload);
    const response = await axiosClient.put(`/categories/${id}`, cleanPayload);
    return normalizeCategory(response?.data?.category || response?.data);
  },

  deleteCategory: async (id) => {
    const response = await axiosClient.delete(`/categories/${id}`);
    return response?.data || { success: true };
  },
};

export default categoryService;
