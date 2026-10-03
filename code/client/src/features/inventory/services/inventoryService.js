import apiClient from '../../../services/api';
import { isMockEnabled, isDevOrTest } from '../../../config/dataMode.js';

export const fallbackSkuInventory = [
  {
    branchId: 'branch-01',
    branchName: 'TechOne Q1 • 128 Nguyễn Thị Minh Khai',
    address: '128 Nguyễn Thị Minh Khai, P. Bến Thành, Q.1, TP.HCM',
    phone: '028 3930 6868',
    quantity: 3,
    status: 'IN_STOCK',
    statusLabel: 'Còn 3 máy',
    badgeVariant: 'success'
  },
  {
    branchId: 'branch-02',
    branchName: 'TechOne Thủ Đức • 45 Võ Văn Ngân',
    address: '45 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức, TP.HCM',
    phone: '028 3896 6868',
    quantity: 1,
    status: 'LOW_STOCK',
    statusLabel: 'Còn 1 máy',
    badgeVariant: 'warning'
  },
  {
    branchId: 'branch-03',
    branchName: 'TechOne Q5 • 382 Trần Hưng Đạo',
    address: '382 Trần Hưng Đạo, Phường 11, Quận 5, TP.HCM',
    phone: '028 3855 6868',
    quantity: 0,
    status: 'OUT_OF_STOCK',
    statusLabel: 'Hết hàng',
    badgeVariant: 'danger'
  }
];

export const DEMO_BRANCH_INVENTORY = [
  {
    _id: 'inv-01',
    productId: '65f0a0000000000000000001',
    productSkuId: '65f0b0000000000000000001',
    sku: 'IP16PM-256-DESERT',
    barcode: '8938500123456',
    productName: 'iPhone 16 Pro Max 256GB - Sa Mạc Tự Nhiên',
    category: 'Điện thoại',
    shelfLocation: 'A-01-03',
    quantityPhysical: 14,
    quantityReserved: 2,
    quantityAvailable: 12,
    lowStockThreshold: 5,
    unitPrice: 34990000,
    hasSerial: true,
    serials: [
      { serialNumber: 'SN-IP16-VN-9081', status: 'IN_STOCK', importDate: '2026-09-15', warrantyMonths: 12 },
      { serialNumber: 'SN-IP16-VN-9082', status: 'IN_STOCK', importDate: '2026-09-15', warrantyMonths: 12 },
      { serialNumber: 'SN-IP16-VN-9083', status: 'IN_STOCK', importDate: '2026-09-15', warrantyMonths: 12 },
      { serialNumber: 'SN-IP16-VN-9084', status: 'IN_STOCK', importDate: '2026-09-15', warrantyMonths: 12 },
      { serialNumber: 'SN-IP16-VN-9075', status: 'SOLD', importDate: '2026-09-10', warrantyMonths: 12 },
      { serialNumber: 'SN-IP16-VN-9060', status: 'WARRANTY', importDate: '2026-08-20', warrantyMonths: 12 }
    ]
  },
  {
    _id: 'inv-02',
    productId: '65f0a0000000000000000002',
    productSkuId: '65f0b0000000000000000002',
    sku: 'MBP-M3PRO-18-512',
    barcode: '8938500654321',
    productName: 'MacBook Pro 14" M3 Pro 18GB/512GB Space Black',
    category: 'Laptop',
    shelfLocation: 'B-02-01',
    quantityPhysical: 6,
    quantityReserved: 1,
    quantityAvailable: 5,
    lowStockThreshold: 3,
    unitPrice: 49990000,
    hasSerial: true,
    serials: [
      { serialNumber: 'MBP-M3P-VN-001', status: 'IN_STOCK', importDate: '2026-09-18', warrantyMonths: 12 },
      { serialNumber: 'MBP-M3P-VN-002', status: 'IN_STOCK', importDate: '2026-09-18', warrantyMonths: 12 }
    ]
  },
  {
    _id: 'inv-03',
    productId: '65f0a0000000000000000003',
    productSkuId: '65f0b0000000000000000003',
    sku: 'SS-S24U-512-GRAY',
    barcode: '8938500987123',
    productName: 'Samsung Galaxy S24 Ultra 12GB/512GB Titan Xám',
    category: 'Điện thoại',
    shelfLocation: 'A-02-04',
    quantityPhysical: 9,
    quantityReserved: 1,
    quantityAvailable: 8,
    lowStockThreshold: 4,
    unitPrice: 31990000,
    hasSerial: true,
    serials: [
      { serialNumber: 'SS-S24-VN-771', status: 'IN_STOCK', importDate: '2026-09-20', warrantyMonths: 12 },
      { serialNumber: 'SS-S24-VN-772', status: 'IN_STOCK', importDate: '2026-09-20', warrantyMonths: 12 }
    ]
  },
  {
    _id: 'inv-04',
    productId: '65f0a0000000000000000004',
    productSkuId: '65f0b0000000000000000004',
    sku: 'AP-PRO2-USBC',
    barcode: '8938500445566',
    productName: 'AirPods Pro 2 MagSafe (USB-C)',
    category: 'Phụ kiện',
    shelfLocation: 'C-01-02',
    quantityPhysical: 25,
    quantityReserved: 1,
    quantityAvailable: 24,
    lowStockThreshold: 10,
    unitPrice: 5490000,
    hasSerial: true,
    serials: [
      { serialNumber: 'APP2-VN-3301', status: 'IN_STOCK', importDate: '2026-09-22', warrantyMonths: 12 },
      { serialNumber: 'APP2-VN-3302', status: 'IN_STOCK', importDate: '2026-09-22', warrantyMonths: 12 }
    ]
  },
  {
    _id: 'inv-05',
    productId: '65f0a0000000000000000005',
    productSkuId: '65f0b0000000000000000005',
    sku: 'CHG-ANKER-65W',
    barcode: '8938500998877',
    productName: 'Củ sạc nhanh Anker GaNPrime 65W 3 cổng',
    category: 'Phụ kiện',
    shelfLocation: 'C-03-05',
    quantityPhysical: 52,
    quantityReserved: 2,
    quantityAvailable: 50,
    lowStockThreshold: 15,
    unitPrice: 1090000,
    hasSerial: false,
    serials: []
  },
  {
    _id: 'inv-06',
    productId: '65f0a0000000000000000006',
    productSkuId: '65f0b0000000000000000006',
    sku: 'IPAD-AIR6-M2-128',
    barcode: '8938500778899',
    productName: 'iPad Air 6 11" M2 WiFi 128GB Starlight',
    category: 'Máy tính bảng',
    shelfLocation: 'A-03-01',
    quantityPhysical: 10,
    quantityReserved: 1,
    quantityAvailable: 9,
    lowStockThreshold: 4,
    unitPrice: 16990000,
    hasSerial: true,
    serials: [
      { serialNumber: 'IPADAIR-VN-1101', status: 'IN_STOCK', importDate: '2026-09-21', warrantyMonths: 12 }
    ]
  },
  {
    _id: 'inv-07',
    productId: '65f0a0000000000000000007',
    productSkuId: '65f0b0000000000000000007',
    sku: 'LOGI-MX-MASTER-3S',
    barcode: '8938500332211',
    productName: 'Chuột không dây Logitech MX Master 3S',
    category: 'Phụ kiện',
    shelfLocation: 'C-02-01',
    quantityPhysical: 3,
    quantityReserved: 1,
    quantityAvailable: 2,
    lowStockThreshold: 5,
    unitPrice: 2490000,
    hasSerial: false,
    serials: []
  },
  {
    _id: 'inv-08',
    productId: '65f0a0000000000000000008',
    productSkuId: '65f0b0000000000000000008',
    sku: 'AP-WATCH-S9-45',
    barcode: '8938500119988',
    productName: 'Apple Watch Series 9 GPS 45mm Nhôm Midnight',
    category: 'Phụ kiện',
    shelfLocation: 'D-01-02',
    quantityPhysical: 0,
    quantityReserved: 0,
    quantityAvailable: 0,
    lowStockThreshold: 3,
    unitPrice: 10290000,
    hasSerial: true,
    serials: []
  }
];

const normalizeBranchStock = (item) => {
  if (!item) return null;
  const b = item.branch || {};
  const qty = Number(item.quantity !== undefined ? item.quantity : 0);

  let badgeVariant = 'success';
  let statusLabel = `Còn ${qty} máy`;

  if (qty <= 0) {
    badgeVariant = 'danger';
    statusLabel = 'Hết hàng';
  } else if (qty <= 2) {
    badgeVariant = 'warning';
    statusLabel = `Còn ${qty} máy`;
  }

  return {
    branchId: b._id || b.id || item.branchId,
    branchName: b.name || b.branchName || 'TechOne Chi nhánh',
    address: b.address || '',
    phone: b.phone || '',
    quantity: qty,
    status: qty > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
    statusLabel,
    badgeVariant,
  };
};

const normalizeBranchInventoryItem = (inv) => {
  if (!inv) return null;
  const prod = inv.productId || {};
  const skus = Array.isArray(prod.skus) ? prod.skus : [];
  const sku = skus.find((s) => String(s._id) === String(inv.productSkuId)) || skus[0] || {};
  const qty = Number(inv.quantity || 0);

  return {
    _id: inv._id,
    productId: prod._id || inv.productId,
    productSkuId: inv.productSkuId,
    sku: sku.sku || sku.code || 'SKU-GEN',
    barcode: sku.sku || sku.code || '8938500000000',
    productName: prod.name || 'Sản phẩm công nghệ',
    category:
      typeof prod.categoryId === 'object'
        ? prod.categoryId?.name || 'Thiết bị'
        : prod.category || 'Thiết bị',
    shelfLocation: 'Kệ A-01',
    quantityPhysical: qty,
    quantityReserved: 0,
    quantityAvailable: qty,
    lowStockThreshold: 3,
    unitPrice: sku.salePrice || sku.price || 0,
    hasSerial: prod.isSerialManaged !== undefined ? prod.isSerialManaged : true,
    serials: [],
  };
};

export const inventoryService = {
  getBranchesWithSkuStock: async (skuId) => {
    if (isMockEnabled()) {
      return fallbackSkuInventory;
    }

    // Nếu skuId rỗng hoặc chưa phải là ObjectId hợp lệ của Mongo (24 hex chars)
    if (!skuId || !/^[0-9a-fA-F]{24}$/.test(String(skuId))) {
      return fallbackSkuInventory;
    }

    try {
      const response = await apiClient.get(`/inventory/sku/${skuId}`);
      // Backend sendSuccess returns { data: { availableBranches: [...] } }
      // apiClient unwrap returns response.data
      const rawList =
        response?.data?.availableBranches ||
        response?.availableBranches ||
        (Array.isArray(response?.data) ? response.data : []);

      if (Array.isArray(rawList) && rawList.length > 0) {
        return rawList.map(normalizeBranchStock).filter(Boolean);
      }
      return fallbackSkuInventory;
    } catch (err) {
      if (isDevOrTest()) {
        console.error(`[inventoryService.getBranchesWithSkuStock] Lỗi tải tồn kho SKU ${skuId}:`, err);
      }
      return fallbackSkuInventory;
    }
  },

  getBranchInventory: async (
    branchId = '65f0a1000000000000000001',
    { search = '', category = '', status = '' } = {}
  ) => {
    if (isMockEnabled()) {
      let items = [...DEMO_BRANCH_INVENTORY];
      if (search) {
        const q = search.toLowerCase();
        items = items.filter(
          (i) =>
            i.productName.toLowerCase().includes(q) ||
            i.sku.toLowerCase().includes(q) ||
            i.shelfLocation.toLowerCase().includes(q)
        );
      }
      if (category && category !== 'TẤT CẢ') {
        items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
      }
      if (status) {
        if (status === 'OUT_OF_STOCK') items = items.filter((i) => i.quantityAvailable <= 0);
        else if (status === 'LOW_STOCK')
          items = items.filter(
            (i) => i.quantityAvailable > 0 && i.quantityAvailable <= i.lowStockThreshold
          );
        else if (status === 'IN_STOCK')
          items = items.filter((i) => i.quantityAvailable > i.lowStockThreshold);
      }
      return items;
    }

    try {
      const res = await apiClient.get(`/inventory/branch/${branchId}`);
      const rawInventories = res?.data?.inventories || res?.inventories || [];
      let items = rawInventories.map(normalizeBranchInventoryItem).filter(Boolean);

      if (items.length === 0) {
        items = [...DEMO_BRANCH_INVENTORY];
      }

      if (search) {
        const q = search.toLowerCase();
        items = items.filter(
          (i) =>
            i.productName.toLowerCase().includes(q) ||
            i.sku.toLowerCase().includes(q) ||
            i.shelfLocation.toLowerCase().includes(q)
        );
      }
      if (category && category !== 'TẤT CẢ') {
        items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
      }
      if (status) {
        if (status === 'OUT_OF_STOCK') items = items.filter((i) => i.quantityAvailable <= 0);
        else if (status === 'LOW_STOCK')
          items = items.filter(
            (i) => i.quantityAvailable > 0 && i.quantityAvailable <= i.lowStockThreshold
          );
        else if (status === 'IN_STOCK')
          items = items.filter((i) => i.quantityAvailable > i.lowStockThreshold);
      }
      return items;
    } catch (err) {
      if (isDevOrTest()) {
        console.error(`[inventoryService.getBranchInventory] Lỗi tải tồn kho chi nhánh ${branchId}:`, err);
      }
      return DEMO_BRANCH_INVENTORY;
    }
  },

  adjustStock: async (payload) => {
    if (isMockEnabled()) {
      return {
        success: true,
        message: 'Điều chỉnh số lượng tồn kho thành công (mock)',
        adjustedAt: new Date().toISOString(),
      };
    }

    try {
      const res = await apiClient.post('/inventory/adjust', payload);
      return res?.data || res;
    } catch (err) {
      if (isDevOrTest()) {
        console.error('[inventoryService.adjustStock] Lỗi điều chỉnh tồn kho:', err);
        throw err;
      }
      return {
        success: false,
        message: err.message,
      };
    }
  },
};

export default inventoryService;

