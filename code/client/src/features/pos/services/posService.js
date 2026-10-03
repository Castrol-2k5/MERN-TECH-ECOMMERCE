import apiClient from '../../../services/api';
import { isMockEnabled, isDevOrTest } from '../../../config/dataMode.js';

// Demo product catalog cho Web POS khi dev offline hoặc barcode test
export const DEMO_POS_PRODUCTS = [
  {
    _id: '65f0a0000000000000000001',
    skuId: '65f0b0000000000000000001',
    sku: 'IP16PM-256-DESERT',
    barcode: '8938500123456',
    name: 'iPhone 16 Pro Max 256GB - Sa Mạc Tự Nhiên',
    price: 34990000,
    costPrice: 31000000,
    stock: 12,
    hasSerial: true,
    category: 'Điện thoại',
    brand: 'Apple',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&auto=format&fit=crop&q=80',
    availableSerials: ['SN-IP16-VN-9081', 'SN-IP16-VN-9082', 'SN-IP16-VN-9083', 'SN-IP16-VN-9084']
  },
  {
    _id: '65f0a0000000000000000002',
    skuId: '65f0b0000000000000000002',
    sku: 'MBP-M3PRO-18-512',
    barcode: '8938500654321',
    name: 'MacBook Pro 14" M3 Pro 18GB/512GB Space Black',
    price: 49990000,
    costPrice: 45000000,
    stock: 5,
    hasSerial: true,
    category: 'Laptop',
    brand: 'Apple',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80',
    availableSerials: ['MBP-M3P-VN-001', 'MBP-M3P-VN-002']
  },
  {
    _id: '65f0a0000000000000000003',
    skuId: '65f0b0000000000000000003',
    sku: 'SS-S24U-512-GRAY',
    barcode: '8938500987123',
    name: 'Samsung Galaxy S24 Ultra 12GB/512GB Titan Xám',
    price: 31990000,
    costPrice: 28500000,
    stock: 8,
    hasSerial: true,
    category: 'Điện thoại',
    brand: 'Samsung',
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=300&auto=format&fit=crop&q=80',
    availableSerials: ['SS-S24-VN-771', 'SS-S24-VN-772']
  },
  {
    _id: '65f0a0000000000000000004',
    skuId: '65f0b0000000000000000004',
    sku: 'AP-PRO2-USBC',
    barcode: '8938500445566',
    name: 'AirPods Pro 2 MagSafe (USB-C)',
    price: 5490000,
    costPrice: 4800000,
    stock: 24,
    hasSerial: true,
    category: 'Phụ kiện',
    brand: 'Apple',
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=300&auto=format&fit=crop&q=80',
    availableSerials: ['APP2-VN-3301', 'APP2-VN-3302', 'APP2-VN-3303']
  },
  {
    _id: '65f0a0000000000000000005',
    skuId: '65f0b0000000000000000005',
    sku: 'CHG-ANKER-65W',
    barcode: '8938500998877',
    name: 'Củ sạc nhanh Anker GaNPrime 65W 3 cổng',
    price: 1090000,
    costPrice: 750000,
    stock: 50,
    hasSerial: false,
    category: 'Phụ kiện',
    brand: 'Anker',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80',
    availableSerials: []
  },
  {
    _id: '65f0a0000000000000000006',
    skuId: '65f0b0000000000000000006',
    sku: 'IPAD-AIR6-M2-128',
    barcode: '8938500778899',
    name: 'iPad Air 6 11" M2 WiFi 128GB Starlight',
    price: 16990000,
    costPrice: 15200000,
    stock: 9,
    hasSerial: true,
    category: 'Máy tính bảng',
    brand: 'Apple',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&auto=format&fit=crop&q=80',
    availableSerials: ['IPADAIR-VN-1101', 'IPADAIR-VN-1102']
  }
];

export const posService = {
  // Quét barcode (có thể là SKU Barcode hoặc Serial cụ thể)
  scanBarcode: async (barcode) => {
    const clean = String(barcode).trim();

    if (!isMockEnabled()) {
      try {
        const res = await apiClient.get(`/serials/scan/${encodeURIComponent(clean)}`);
        const data = res?.data || res;

        if (data && data.serialNumber) {
          const sku = data.sku || {};
          const prod = data.product || {};
          return {
            type: 'SERIAL',
            serialNumber: data.serialNumber,
            product: {
              _id: prod._id,
              name: prod.name,
              sku: sku.sku || 'SKU-GEN',
              productSkuId: sku._id,
              price: sku.salePrice || sku.price || 0,
              hasSerial: true,
              image: prod.images?.[0] || '',
            },
          };
        }
      } catch (err) {
        if (isDevOrTest()) {
          console.error(`[posService.scanBarcode] Không tìm thấy serial/barcode "${clean}":`, err);
        }
        throw new Error(err.response?.data?.message || `Không tìm thấy sản phẩm hay serial khớp với mã [${clean}]`);
      }
    }

    // Fallback tìm trong demo catalog
    const lowerClean = clean.toLowerCase();
    // 1. Tìm theo serial chính xác
    for (const p of DEMO_POS_PRODUCTS) {
      if (p.availableSerials?.some((s) => s.toLowerCase() === lowerClean)) {
        return {
          type: 'SERIAL',
          serialNumber: clean,
          product: {
            _id: p._id,
            name: p.name,
            sku: p.sku,
            productSkuId: p.skuId,
            price: p.price,
            hasSerial: true,
            image: p.image,
          },
        };
      }
    }
    // 2. Tìm theo SKU hoặc Barcode
    const found = DEMO_POS_PRODUCTS.find(
      (p) => p.barcode.toLowerCase() === lowerClean || p.sku.toLowerCase() === lowerClean
    );
    if (found) {
      return {
        type: 'SKU',
        barcode: found.barcode,
        product: {
          _id: found._id,
          name: found.name,
          sku: found.sku,
          productSkuId: found.skuId,
          price: found.price,
          hasSerial: found.hasSerial,
          image: found.image,
          availableSerials: found.availableSerials,
        },
      };
    }
    throw new Error(`Không tìm thấy sản phẩm hay serial khớp với mã [${clean}]`);
  },

  // Tìm kiếm sản phẩm POS theo từ khóa / danh mục
  searchProducts: async ({ keyword = '', category = '' } = {}) => {
    if (!isMockEnabled()) {
      try {
        const params = {};
        if (keyword) params.search = keyword;
        if (category && category !== 'TẤT CẢ') params.category = category;
        const res = await apiClient.get('/products', { params });
        const rawProducts = res?.data?.products || (Array.isArray(res?.data) ? res.data : []);

        if (Array.isArray(rawProducts) && rawProducts.length > 0) {
          return rawProducts.map((p) => {
            const skus = Array.isArray(p.skus) ? p.skus : [];
            const primarySku = skus[0] || {};
            return {
              _id: p._id,
              skuId: primarySku._id || p._id,
              sku: primarySku.sku || primarySku.code || 'SKU-GEN',
              barcode: primarySku.sku || primarySku.code || '8938500000000',
              name: p.name,
              price: primarySku.salePrice || primarySku.price || p.price || 0,
              costPrice: Math.round((primarySku.price || 0) * 0.85),
              stock: 10,
              hasSerial: p.isSerialManaged !== undefined ? p.isSerialManaged : true,
              category: typeof p.categoryId === 'object' ? p.categoryId?.name : p.category || 'Thiết bị',
              brand: p.brand || '',
              image: p.images?.[0] || '',
              availableSerials: [],
            };
          });
        }
      } catch (err) {
        if (isDevOrTest()) {
          console.error('[posService.searchProducts] Lỗi tải sản phẩm POS từ API:', err);
        }
      }
    }

    let results = [...DEMO_POS_PRODUCTS];
    if (category && category !== 'TẤT CẢ') {
      results = results.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    if (keyword) {
      const q = keyword.toLowerCase();
      results = results.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q)
      );
    }
    return results;
  },

  // Thanh toán POS checkout
  checkoutPos: async (payload) => {
    if (!isMockEnabled()) {
      try {
        const res = await apiClient.post('/orders/pos/checkout', payload);
        const order = res?.data?.order || res?.data || res;
        return order;
      } catch (err) {
        if (isDevOrTest()) {
          console.error('[posService.checkoutPos] Lỗi thanh toán POS:', err);
        }
        throw new Error(err.response?.data?.message || err.message || 'Thanh toán POS thất bại!');
      }
    }

    // Giả lập checkout thành công nếu đang ở chế độ mock
    const orderCode = `POS-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    return {
      _id: 'pos_' + Date.now(),
      orderCode,
      branchId: payload.branchId || 'BR-HCM-Q1',
      items: payload.items,
      totalAmount: payload.totalAmount || 0,
      finalAmount: payload.finalAmount || 0,
      paymentMethod: payload.paymentMethod,
      customerInfo: payload.customerInfo,
      createdAt: new Date().toISOString(),
    };
  },
};

export default posService;
