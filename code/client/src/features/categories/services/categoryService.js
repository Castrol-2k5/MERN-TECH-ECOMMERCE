import axiosClient from '../../../services/axiosClient.js';

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

export const categoryService = {
  getCategories: async () => {
    try {
      const response = await axiosClient.get('/categories');
      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return fallbackCategories;
    } catch {
      return fallbackCategories;
    }
  },

  getCategoryBySlug: async (slug) => {
    try {
      const response = await axiosClient.get(`/categories/${slug}`);
      if (response?.data) return response.data;
      return fallbackCategories.find((c) => c.slug === slug) || fallbackCategories[0];
    } catch {
      return fallbackCategories.find((c) => c.slug === slug) || fallbackCategories[0];
    }
  },
};

export default categoryService;
