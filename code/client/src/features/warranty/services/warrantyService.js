import apiClient from '../../../services/api';

export const DEMO_WARRANTY_ITEMS = {
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
  'SN-EXPIRED-2023': {
    serialNumber: 'SN-EXPIRED-2023',
    productName: 'iPad Pro 11 M2 128GB WiFi Space Gray',
    sku: 'IPAD-PRO11-M2',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&auto=format&fit=crop&q=80',
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
  }
};

export const fallbackWarrantyData = DEMO_WARRANTY_ITEMS['C02ZQ0ABQ6L7'];

export const warrantyService = {
  verifySerial: async (serialNumber) => {
    const clean = String(serialNumber).trim().toUpperCase();
    try {
      const response = await apiClient.get(`/serials/verify/${encodeURIComponent(clean)}`);
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch {
      // fallback
    }

    if (DEMO_WARRANTY_ITEMS[clean]) {
      return DEMO_WARRANTY_ITEMS[clean];
    }

    // Default mock nếu nhập serial bất kỳ khác
    return {
      serialNumber: clean,
      productName: 'Thiết bị công nghệ TechOne (Tra cứu e-Warranty)',
      sku: 'TECH-DEVICE-GEN',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80',
      customer: {
        fullName: 'Khách hàng TechOne',
        phone: '0909000111',
        email: 'customer@techone.vn',
        address: 'TP.HCM'
      },
      saleDate: '2026-08-01',
      warrantyEndDate: '2027-07-31',
      branchPurchased: 'TechOne Q1 • 138 Trần Quang Khải',
      isEligible: true,
      statusLabel: 'ĐỦ ĐIỀU KIỆN TIẾP NHẬN BẢO HÀNH CHÍNH HÃNG',
      daysRemaining: 304
    };
  },

  createWarrantyTicket: async (payload) => {
    try {
      const res = await apiClient.post('/warranty', payload);
      return res.data?.data;
    } catch {
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
