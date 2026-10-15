import axiosClient from '../../../services/axiosClient.js';
import { isMockEnabled, isDevOrTest } from '../../../config/dataMode.js';

export const fallbackCategories = [
  {
    _id: 'cat-laptop',
    name: 'Laptop chính hãng',
    slug: 'laptop',
    description: 'Laptop AI, gaming, đồ họa và văn phòng',
    attributeKeys: ['brand', 'price_range', 'cpu', 'ram', 'vga', 'screen_size', 'stock_status'],
    icon: 'laptop',
    productCount: 248,
  },
  {
    _id: 'cat-phone',
    name: 'Điện thoại & Tablet',
    slug: 'smartphone',
    description: 'iPhone, Samsung, Xiaomi flagship',
    attributeKeys: ['brand', 'storage', 'ram', 'color', 'camera'],
    icon: 'smartphone',
    productCount: 182,
  },
  {
    _id: 'cat-components',
    name: 'Linh kiện máy tính',
    slug: 'linh-kien',
    description: 'CPU, GPU, RAM, SSD, Nguồn, Tản nhiệt',
    attributeKeys: ['brand', 'component_type', 'socket', 'capacity'],
    icon: 'cpu',
    productCount: 315,
  },
  {
    _id: 'cat-accessories',
    name: 'Phụ kiện cao cấp',
    slug: 'phu-kien',
    description: 'Tai nghe, Chuột, Bàn phím cơ, Cáp sạc',
    attributeKeys: ['brand', 'accessory_type', 'connection'],
    icon: 'headphones',
    productCount: 420,
  },
  {
    _id: 'cat-monitors',
    name: 'Màn hình hiển thị',
    slug: 'man-hinh',
    description: 'Màn hình OLED, 2K/4K 144Hz-240Hz',
    attributeKeys: ['brand', 'screen_size', 'resolution', 'refresh_rate'],
    icon: 'monitor',
    productCount: 95,
  },
];

const normalizeCategory = (cat) => {
  if (!cat) return null;
  return {
    _id: cat._id || cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description || '',
    attributeKeys: Array.isArray(cat.attributeKeys) ? cat.attributeKeys : [],
    icon: cat.icon || 'laptop',
    productCount: cat.productCount || 0,
    parentId: cat.parentId || null,
    isActive: cat.isActive !== undefined ? cat.isActive : true,
  };
};

export const categoryService = {
  getCategories: async () => {
    if (isMockEnabled()) {
      return fallbackCategories;
    }

    try {
      const response = await axiosClient.get('/categories');
      const rawCategories = response?.data?.categories || (Array.isArray(response?.data) ? response.data : []);
      return rawCategories.map(normalizeCategory);
    } catch (err) {
      if (isDevOrTest()) {
        console.error('[categoryService.getCategories] Lỗi tải danh mục từ Live Database / API:', err);
        throw err;
      }
      return [];
    }
  },

  getCategoryBySlug: async (slug) => {
    if (isMockEnabled()) {
      return fallbackCategories.find((c) => c.slug === slug) || fallbackCategories[0];
    }

    try {
      const response = await axiosClient.get(`/categories/${slug}`);
      const rawCategory = response?.data?.category || response?.data;
      return normalizeCategory(rawCategory);
    } catch (err) {
      if (isDevOrTest()) {
        console.error(`[categoryService.getCategoryBySlug] Lỗi tải chi tiết danh mục ${slug}:`, err);
        throw err;
      }
      return null;
    }
  },

  createCategory: async (payload) => {
    if (isMockEnabled()) {
      return { _id: 'cat-' + Date.now(), ...payload };
    }
    const response = await axiosClient.post('/categories', payload);
    return normalizeCategory(response?.data?.category || response?.data);
  },

  updateCategory: async (id, payload) => {
    if (isMockEnabled()) {
      return { _id: id, ...payload };
    }
    const response = await axiosClient.put(`/categories/${id}`, payload);
    return normalizeCategory(response?.data?.category || response?.data);
  },

  deleteCategory: async (id) => {
    if (isMockEnabled()) {
      return { success: true };
    }
    const response = await axiosClient.delete(`/categories/${id}`);
    return response?.data || { success: true };
  },
};

export default categoryService;

