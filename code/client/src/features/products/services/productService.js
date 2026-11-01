import axiosClient from '../../../services/axiosClient.js';
import { isMockEnabled, isDevOrTest } from '../../../config/dataMode.js';
import { normalizeProduct } from './productAdapter.js';

export const fallbackProducts = [
  {
    _id: 'prod-macbook-air-m4',
    name: 'MacBook Air 13 M4 16GB/256GB',
    slug: 'macbook-air-13-m4',
    category: 'laptop',
    brand: 'Apple',
    rating: 4.9,
    reviewsCount: 286,
    skuCode: 'MBA-M4-16-256-SL',
    originalPrice: 30490000,
    price: 26490000,
    discountPercentage: 13,
    stockStatus: 'IN_STOCK',
    stockLabel: 'Còn hàng',
    specsSummary: 'Apple M4 • 16GB • SSD 256GB • 13.6” Liquid Retina',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80',
    ],
    attributes: {
      cpu: 'Apple M4, CPU 10 lõi, Neural Engine 16 lõi',
      ram: '16GB Unified Memory',
      storage: 'SSD 256GB PCIe NVMe',
      screen_size: 'Liquid Retina 13.6”, 2560 × 1664, 500 nits',
      vga: 'GPU 10 lõi tích hợp',
      connectivity: 'Wi-Fi 6E, Bluetooth 5.3, 2× Thunderbolt 4',
      battery: 'Lên đến 18 giờ xem video',
      weight: '1,24 kg',
      os: 'macOS Sequoia',
      warranty: '12 tháng chính hãng Apple',
    },
    options: [
      {
        name: 'RAM',
        values: ['16GB', '32GB'],
      },
      {
        name: 'Màu sắc',
        values: ['Bạc', 'Xanh đêm', 'Ánh sao'],
      },
    ],
    skus: [
      {
        _id: 'sku-mba-16-256-silver',
        code: 'MBA-M4-16-256-SL',
        price: 26490000,
        originalPrice: 30490000,
        options: { RAM: '16GB', 'Màu sắc': 'Bạc' },
        stock: 4,
      },
      {
        _id: 'sku-mba-32-512-midnight',
        code: 'MBA-M4-32-512-MD',
        price: 33490000,
        originalPrice: 37490000,
        options: { RAM: '32GB', 'Màu sắc': 'Xanh đêm' },
        stock: 2,
      },
    ],
    branchInventories: [
      { branchName: 'TechOne Q1 • 128 Nguyễn Thị Minh Khai', quantity: 3, status: 'IN_STOCK', color: 'green' },
      { branchName: 'TechOne Thủ Đức • 45 Võ Văn Ngân', quantity: 1, status: 'LOW_STOCK', color: 'orange' },
      { branchName: 'TechOne Q5 • 382 Trần Hưng Đạo', quantity: 0, status: 'OUT_OF_STOCK', color: 'red' },
    ],
    promotions: [
      'Tặng túi chống sốc TechOne trị giá 590.000đ',
      'Giảm thêm 1.000.000đ khi thanh toán qua cổng VNPAY-QR',
      'Trả góp 0% lãi suất trong 12 tháng qua thẻ tín dụng',
    ],
    description:
      'MacBook Air M4 mang hiệu năng vượt trội trong thiết kế chỉ 1,24 kg. Chip M4 xử lý siêu tốc mọi tác vụ công việc, sáng tạo nội dung và giải trí số với thời lượng pin lên đến 18 giờ.',
  },
  {
    _id: 'prod-asus-rog-g14',
    name: 'ASUS ROG Zephyrus G14 2026',
    slug: 'asus-rog-zephyrus-g14',
    category: 'laptop',
    brand: 'ASUS',
    rating: 4.8,
    reviewsCount: 142,
    skuCode: 'ROG-G14-R9-32-1TB',
    originalPrice: 42990000,
    price: 38990000,
    discountPercentage: 9,
    stockStatus: 'IN_STOCK',
    stockLabel: 'Còn hàng',
    specsSummary: 'AMD Ryzen 9 8945HS • 32GB • RTX 5060 8GB • 14” OLED 120Hz',
    images: [
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
    ],
    attributes: {
      cpu: 'AMD Ryzen 9 8945HS (8 nhân 16 luồng)',
      ram: '32GB LPDDR5X 6400MHz',
      storage: 'SSD 1TB PCIe Gen 4',
      screen_size: '14” 3K (2880 × 1800) OLED 120Hz 0.2ms',
      vga: 'NVIDIA GeForce RTX 5060 8GB GDDR7',
      connectivity: 'Wi-Fi 7, Bluetooth 5.4, USB4 Type-C',
      battery: '73Wh, sạc nhanh 100W PD',
      weight: '1,50 kg',
      os: 'Windows 11 Home bản quyền',
      warranty: '24 tháng chính hãng ASUS',
    },
    options: [
      { name: 'RAM', values: ['32GB'] },
      { name: 'Màu sắc', values: ['Xám Platinum', 'Trắng Eclipse'] },
    ],
    skus: [
      {
        _id: 'sku-asus-g14-32-1tb',
        code: 'ROG-G14-R9-32-1TB',
        price: 38990000,
        originalPrice: 42990000,
        options: { RAM: '32GB', 'Màu sắc': 'Xám Platinum' },
        stock: 3,
      },
    ],
    branchInventories: [
      { branchName: 'TechOne Q1 • 128 Nguyễn Thị Minh Khai', quantity: 2, status: 'IN_STOCK', color: 'green' },
      { branchName: 'TechOne Thủ Đức • 45 Võ Văn Ngân', quantity: 0, status: 'OUT_OF_STOCK', color: 'red' },
      { branchName: 'TechOne Q5 • 382 Trần Hưng Đạo', quantity: 1, status: 'LOW_STOCK', color: 'orange' },
    ],
    promotions: [
      'Tặng balo ROG Ranger thời trang trị giá 1.200.000đ',
      'Tặng chuột ROG Keris Wireless trị giá 1.690.000đ',
    ],
    description:
      'Tuyệt tác laptop gaming mỏng nhẹ bậc nhất thế giới với khung nhôm CNC, màn hình ROG Nebula OLED và sức mạnh AI Ryzen 9 đỉnh cao.',
  },
  {
    _id: 'prod-lenovo-yoga-pro-7',
    name: 'Lenovo Yoga Pro 7 AI 2026',
    slug: 'lenovo-yoga-pro-7-ai',
    category: 'laptop',
    brand: 'Lenovo',
    rating: 4.7,
    reviewsCount: 98,
    skuCode: 'YOGA-PRO7-U7-32-1TB',
    originalPrice: 34990000,
    price: 31490000,
    discountPercentage: 10,
    stockStatus: 'IN_STOCK',
    stockLabel: 'Còn hàng',
    specsSummary: 'Intel Core Ultra 7 155H • 32GB • RTX 4050 • 14.5” PureSight Pro 120Hz',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    ],
    attributes: {
      cpu: 'Intel Core Ultra 7 155H (16 nhân 22 luồng, NPU Intel AI Boost)',
      ram: '32GB LPDDR5X 7467MHz',
      storage: 'SSD 1TB M.2 NVMe',
      screen_size: '14.5” 3K (3072 × 1920) 120Hz 100% DCI-P3',
      vga: 'NVIDIA GeForce RTX 4050 6GB GDDR6',
      connectivity: 'Wi-Fi 6E, Thunderbolt 4, HDMI 2.1',
      battery: '73Wh, sạc nhanh Rapid Charge',
      weight: '1,49 kg',
      os: 'Windows 11 Pro',
      warranty: '24 tháng Lenovo Premium Care',
    },
    options: [
      { name: 'RAM', values: ['32GB'] },
      { name: 'Màu sắc', values: ['Tidal Teal'] },
    ],
    skus: [
      {
        _id: 'sku-lenovo-yoga-u7',
        code: 'YOGA-PRO7-U7-32-1TB',
        price: 31490000,
        originalPrice: 34990000,
        options: { RAM: '32GB', 'Màu sắc': 'Tidal Teal' },
        stock: 5,
      },
    ],
    branchInventories: [
      { branchName: 'TechOne Q1 • 128 Nguyễn Thị Minh Khai', quantity: 4, status: 'IN_STOCK', color: 'green' },
      { branchName: 'TechOne Thủ Đức • 45 Võ Văn Ngân', quantity: 2, status: 'IN_STOCK', color: 'green' },
      { branchName: 'TechOne Q5 • 382 Trần Hưng Đạo', quantity: 1, status: 'LOW_STOCK', color: 'orange' },
    ],
    promotions: [
      'Tặng gói phần mềm bản quyền Adobe Creative Cloud 3 tháng',
      'Túi xách cao cấp Lenovo Yoga Lifestyle',
    ],
    description:
      'Thiết kế chuẩn doanh nhân và nhà sáng tạo số với vi xử lý Intel Core Ultra thế hệ mới kết hợp NPU chuyên biệt tối ưu trí tuệ nhân tạo.',
  },
  {
    _id: 'prod-dell-xps-14',
    name: 'Dell XPS 14 9440 (2026)',
    slug: 'dell-xps-14-9440',
    category: 'laptop',
    brand: 'Dell',
    rating: 4.9,
    reviewsCount: 64,
    skuCode: 'XPS-14-U7-32-1TB',
    originalPrice: 48990000,
    price: 45990000,
    discountPercentage: 6,
    stockStatus: 'IN_STOCK',
    stockLabel: 'Còn hàng',
    specsSummary: 'Core Ultra 7 • 32GB • RTX 4050 • 14.5” OLED Touch 3.2K',
    images: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
    ],
    attributes: {
      cpu: 'Intel Core Ultra 7 155H',
      ram: '32GB LPDDR5X 7467MHz',
      storage: 'SSD 1TB PCIe NVMe',
      screen_size: '14.5” InfinityEdge OLED 3.2K Cảm ứng',
      vga: 'NVIDIA GeForce RTX 4050 6GB',
      connectivity: '3× Thunderbolt 4, Wi-Fi 7',
      battery: '69.5Wh ExpressCharge',
      weight: '1,68 kg',
      os: 'Windows 11 Home',
      warranty: '12 tháng ProSupport tận nơi',
    },
    options: [{ name: 'RAM', values: ['32GB'] }],
    skus: [{ _id: 'sku-dell-xps-14', code: 'XPS-14-U7-32-1TB', price: 45990000, originalPrice: 48990000, stock: 2 }],
    branchInventories: [
      { branchName: 'TechOne Q1 • 128 Nguyễn Thị Minh Khai', quantity: 2, status: 'IN_STOCK', color: 'green' },
      { branchName: 'TechOne Thủ Đức • 45 Võ Văn Ngân', quantity: 0, status: 'OUT_OF_STOCK', color: 'red' },
      { branchName: 'TechOne Q5 • 382 Trần Hưng Đạo', quantity: 1, status: 'LOW_STOCK', color: 'orange' },
    ],
    promotions: ['Tặng chuột Dell Premier không dây cao cấp', 'Bảo hành tận nhà ProSupport 24/7'],
    description: 'Kiệt tác cơ khí nhôm CNC với bàn phím liền mạch và thanh touch bar ẩn tinh tế bậc nhất của dòng Dell XPS.',
  },
  {
    _id: 'prod-hp-omen-16',
    name: 'HP Omen 16 (2026 Edition)',
    slug: 'hp-omen-16-2026',
    category: 'laptop',
    brand: 'HP',
    rating: 4.6,
    reviewsCount: 88,
    skuCode: 'OMEN-16-I7-16-512',
    originalPrice: 40990000,
    price: 36990000,
    discountPercentage: 10,
    stockStatus: 'OUT_OF_STOCK_ONLINE',
    stockLabel: 'Hết hàng online',
    specsSummary: 'Core i7 14700HX • 16GB • RTX 5060 • 16.1” QHD 240Hz',
    images: [
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80',
    ],
    attributes: {
      cpu: 'Intel Core i7 14700HX (20 nhân 28 luồng)',
      ram: '16GB DDR5 5600MHz',
      storage: 'SSD 512GB PCIe Gen 4',
      screen_size: '16.1” QHD (2560 × 1440) IPS 240Hz 3ms',
      vga: 'NVIDIA GeForce RTX 5060 8GB GDDR7',
      connectivity: 'Wi-Fi 6E, Gigabit LAN, 2× Thunderbolt 4',
      battery: '83Wh, sạc nhanh 280W',
      weight: '2,37 kg',
      os: 'Windows 11 Home',
      warranty: '12 tháng chính hãng HP Onsite',
    },
    options: [{ name: 'RAM', values: ['16GB', '32GB'] }],
    skus: [{ _id: 'sku-hp-omen-16', code: 'OMEN-16-I7-16-512', price: 36990000, originalPrice: 40990000, stock: 0 }],
    branchInventories: [
      { branchName: 'TechOne Q1 • 128 Nguyễn Thị Minh Khai', quantity: 0, status: 'OUT_OF_STOCK', color: 'red' },
      { branchName: 'TechOne Thủ Đức • 45 Võ Văn Ngân', quantity: 1, status: 'LOW_STOCK', color: 'orange' },
      { branchName: 'TechOne Q5 • 382 Trần Hưng Đạo', quantity: 0, status: 'OUT_OF_STOCK', color: 'red' },
    ],
    promotions: ['Tặng tai nghe gaming HyperX Cloud II', 'Tặng lót chuột kích thước lớn'],
    description: 'Cỗ máy chiến game hạng nặng với hệ thống tản nhiệt OMEN Tempest Cooling và màn hình 240Hz siêu mượt mà.',
  },
];

export { normalizeProduct } from './productAdapter.js';

/**
 * Chuẩn hóa payload trước khi gửi lên Backend POST/PUT /products
 * để tuân thủ tuyệt đối schema Zod (.strict()) của Backend.
 */
export const buildCleanProductPayload = (payload = {}) => {
  const clean = {
    name: String(payload.name || '').trim(),
    brand: String(payload.brand || '').trim(),
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
          images: Array.isArray(s.images)
            ? s.images.map((img) => String(img || '').trim()).filter(Boolean)
            : [],
          optionValues,
          isActive: s.isActive !== undefined ? Boolean(s.isActive) : true,
        };

        // Chỉ giữ _id nếu là ObjectId 24 ký tự hex hợp lệ (không gửi id tạm 'sku-...')
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
    if (isMockEnabled()) {
      return {
        products: fallbackProducts,
        meta: { total: fallbackProducts.length, page: 1, limit: 12, availableBrands: [] },
        availableBrands: [
          { brand: 'Apple', count: 1 },
          { brand: 'ASUS', count: 1 },
          { brand: 'Lenovo', count: 1 },
          { brand: 'Dell', count: 1 },
          { brand: 'HP', count: 1 },
        ],
      };
    }

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
      if (isDevOrTest()) {
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
    if (isMockEnabled()) {
      return fallbackProducts.find((p) => p.slug === slug) || fallbackProducts[0];
    }

    try {
      const response = await axiosClient.get(`/products/${slug}`);
      const rawProduct = response?.data?.product || response?.data;
      if (!rawProduct) {
        throw new Error(`Không tìm thấy sản phẩm có slug: "${slug}"`);
      }
      return normalizeProduct(rawProduct);
    } catch (err) {
      if (isDevOrTest()) {
        console.error(`[productService.getProductBySlug] Lỗi tải sản phẩm "${slug}":`, err);
        throw err;
      }
      return null;
    }
  },

  createProduct: async (payload) => {
    const cleanPayload = buildCleanProductPayload(payload);
    if (isMockEnabled()) {
      return normalizeProduct({ _id: 'prod-' + Date.now(), ...cleanPayload });
    }
    const response = await axiosClient.post('/products', cleanPayload);
    return normalizeProduct(response?.data?.product || response?.data || cleanPayload);
  },

  updateProduct: async (id, payload) => {
    const cleanPayload = buildCleanProductPayload(payload);
    if (isMockEnabled()) {
      return normalizeProduct({ _id: id, ...cleanPayload });
    }
    const response = await axiosClient.put(`/products/${id}`, cleanPayload);
    return normalizeProduct(response?.data?.product || response?.data || cleanPayload);
  },

  deleteProduct: async (id) => {
    if (isMockEnabled()) {
      return { success: true };
    }
    const response = await axiosClient.delete(`/products/${id}`);
    return response?.data || { success: true };
  },

  toggleProductActive: async (id, isActive) => {
    if (isMockEnabled()) {
      return { success: true, isActive };
    }
    const response = await axiosClient.put(`/products/${id}`, { isActive });
    return response?.data || { success: true, isActive };
  },

  getCompareProducts: async () => {
    if (isMockEnabled()) {
      return fallbackProducts.slice(0, 2);
    }
    try {
      const res = await productService.getProducts({ limit: 4 });
      return res.products?.slice(0, 2) || [];
    } catch {
      return [];
    }
  },
};

export default productService;
