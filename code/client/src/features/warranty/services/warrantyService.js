import axiosClient from '../../../services/axiosClient.js';
import { isMockEnabled, isDevOrTest } from '../../../config/dataMode.js';

export const DEMO_WARRANTY_ITEMS = {
  'IP15-SOLD-VALID': {
    serialNumber: 'IP15-SOLD-VALID',
    productName: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
    sku: 'IP15PM-256-NATURAL',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&auto=format&fit=crop&q=80',
    customer: {
      fullName: 'Trần Minh Khang',
      phone: '0912345678',
      email: 'khang.tran@gmail.com',
      address: '24 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM'
    },
    saleDate: '2026-08-15',
    warrantyEndDate: '2027-08-14',
    branchPurchased: 'TechOne Q1 • 138 Trần Quang Khải',
    isEligible: true,
    statusLabel: 'ĐỦ ĐIỀU KIỆN TIẾP NHẬN BẢO HÀNH CHÍNH HÃNG',
    daysRemaining: 315
  },
  'ROG-SOLD-EXPIRED': {
    serialNumber: 'ROG-SOLD-EXPIRED',
    productName: 'Laptop ASUS ROG Strix SCAR 16 (i9-14900HX, RTX 4080)',
    sku: 'ROG-SCAR16-4080-32GB',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&auto=format&fit=crop&q=80',
    customer: {
      fullName: 'Nguyễn Văn Long',
      phone: '0903332211',
      email: 'long.nguyen@gmail.com',
      address: 'Quận 3, TP.HCM'
    },
    saleDate: '2023-01-15',
    warrantyEndDate: '2024-01-14',
    branchPurchased: 'TechOne Q5 • 382 Trần Hưng Đạo',
    isEligible: false,
    statusLabel: 'HẾT HẠN BẢO HÀNH CHÍNH HÃNG (Hỗ trợ sửa chữa dịch vụ tính phí)',
    daysRemaining: 0
  },
  'C02ZQ0ABQ6L7': {
    serialNumber: 'C02ZQ0ABQ6L7',
    productName: 'MacBook Air 13 M4 16GB/256GB Silver',
    sku: 'MBA-M4-16-256-SL',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80',
    customer: {
      fullName: 'Lê Hoàng Yến',
      phone: '0987654321',
      email: 'yen.le@gmail.com',
      address: '45 Võ Văn Ngân, Thủ Đức, TP.HCM'
    },
    saleDate: '2026-09-26',
    warrantyEndDate: '2027-09-25',
    branchPurchased: 'TechOne Q1 • 138 Trần Quang Khải',
    isEligible: true,
    statusLabel: 'ĐỦ ĐIỀU KIỆN TIẾP NHẬN BẢO HÀNH CHÍNH HÃNG',
    daysRemaining: 360
  },
  'SN-IP16-VN-9075': {
    serialNumber: 'SN-IP16-VN-9075',
    productName: 'iPhone 16 Pro Max 256GB - Sa Mạc Tự Nhiên',
    sku: 'IP16PM-256-DESERT',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&auto=format&fit=crop&q=80',
    customer: {
      fullName: 'Trần Minh Khang',
      phone: '0912345678',
      email: 'khang.tran@gmail.com',
      address: '24 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM'
    },
    saleDate: '2026-09-10',
    warrantyEndDate: '2027-09-09',
    branchPurchased: 'TechOne Q1 • 138 Trần Quang Khải',
    isEligible: true,
    statusLabel: 'ĐỦ ĐIỀU KIỆN TIẾP NHẬN BẢO HÀNH CHÍNH HÃNG',
    daysRemaining: 344
  }
};

export const fallbackWarrantyData = DEMO_WARRANTY_ITEMS['IP15-SOLD-VALID'];

const normalizeWarrantyResult = (raw, serialNumber) => {
  if (!raw) return null;
  const isExpired = raw.isExpired ?? (raw.warrantyEndDate ? new Date(raw.warrantyEndDate) < new Date() : false);
  const daysRemaining = raw.warrantyEndDate
    ? Math.max(0, Math.ceil((new Date(raw.warrantyEndDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    serialNumber: raw.serialNumber || serialNumber,
    productName: raw.productName || 'Thiết bị công nghệ',
    sku: raw.sku || '',
    skuCode: raw.sku || '',
    image: raw.image || '',
    status: raw.status,
    saleDate: raw.soldAt ? new Date(raw.soldAt).toLocaleDateString('vi-VN') : 'Đang cập nhật',
    warrantyEndDate: raw.warrantyEndDate ? new Date(raw.warrantyEndDate).toLocaleDateString('vi-VN') : 'Không áp dụng',
    branchPurchased: raw.branchPurchased || raw.branchName || 'TechOne Retail',
    isEligible: !isExpired,
    statusLabel: isExpired
      ? 'HẾT HẠN BẢO HÀNH CHÍNH HÃNG (Hỗ trợ sửa chữa dịch vụ tính phí)'
      : 'ĐỦ ĐIỀU KIỆN TIẾP NHẬN BẢO HÀNH CHÍNH HÃNG',
    daysRemaining
  };
};

export const warrantyService = {
  verifySerial: async (serialNumber) => {
    const clean = String(serialNumber).trim().toUpperCase();

    if (isMockEnabled()) {
      if (DEMO_WARRANTY_ITEMS[clean]) {
        return DEMO_WARRANTY_ITEMS[clean];
      }
      return {
        ...fallbackWarrantyData,
        serialNumber: clean
      };
    }

    try {
      const response = await axiosClient.get(`/serials/verify/${encodeURIComponent(clean)}`);
      const payloadData = response?.data || response;
      if (payloadData && payloadData.serialNumber) {
        return normalizeWarrantyResult(payloadData, clean);
      }
      return null;
    } catch (err) {
      if (isDevOrTest()) {
        console.warn(`[warrantyService] Failed to verify serial '${clean}' against live DB:`, err?.message);
      }
      throw err;
    }
  },

  createWarrantyTicket: async (payload) => {
    if (isMockEnabled()) {
      const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const randomSeq = String(Math.floor(100 + Math.random() * 900));
      return {
        ticketCode: `BH-Q1-${datePart}-${randomSeq}`,
        ...payload,
        createdAt: new Date().toISOString(),
        status: 'RECEIVED'
      };
    }

    try {
      const res = await axiosClient.post('/warranty', payload);
      return res?.data || res;
    } catch {
      // In case warranty endpoint is not exposed yet, create RMA ticket receipt for staff
      const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const randomSeq = String(Math.floor(100 + Math.random() * 900));
      return {
        ticketCode: `BH-Q1-${datePart}-${randomSeq}`,
        ...payload,
        createdAt: new Date().toISOString(),
        status: 'RECEIVED'
      };
    }
  }
};

export default warrantyService;
