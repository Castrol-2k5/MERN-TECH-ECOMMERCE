import axiosClient from '../../../services/axiosClient.js';

const normalizeWarrantyResult = (raw, serialNumber) => {
  if (!raw) return null;
  const isExpired = raw.isExpired ?? (raw.warrantyEndDate ? new Date(raw.warrantyEndDate) < new Date() : false);
  const daysRemaining = raw.warrantyEndDate
    ? Math.max(0, Math.ceil((new Date(raw.warrantyEndDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    serialNumber: raw.serialNumber || serialNumber,
    productId: raw.productId || null,
    branchId: raw.branchId || null,
    productName: raw.productName || 'Thiết bị công nghệ',
    sku: raw.sku || '',
    skuCode: raw.sku || '',
    image:
      raw.image ||
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
    status: raw.status,
    soldAt: raw.soldAt || null,
    warrantyExpiresAt: raw.warrantyExpiresAt || raw.warrantyEndDate || null,
    saleDate: raw.soldAt ? new Date(raw.soldAt).toLocaleDateString('vi-VN') : 'Đang cập nhật',
    warrantyEndDate: raw.warrantyEndDate
      ? new Date(raw.warrantyEndDate).toLocaleDateString('vi-VN')
      : 'Không áp dụng',
    branchPurchased: raw.branchPurchased || raw.branchName || 'TechOne Retail',
    customer: {
      fullName: raw.customer?.fullName || 'Khách hàng mua tại hệ thống',
      phone: raw.customer?.phone || '',
      address: raw.customer?.address || 'Mua tại quầy / Hệ thống TechOne'
    },
    isEligible: !isExpired && (raw.status === 'SOLD' || raw.status === 'WARRANTY'),
    statusLabel:
      raw.status !== 'SOLD' && raw.status !== 'WARRANTY'
        ? `THIẾT BỊ CHƯA XUẤT BÁN (Trạng thái: ${raw.status})`
        : isExpired
        ? 'HẾT HẠN BẢO HÀNH CHÍNH HÃNG (Hỗ trợ sửa chữa dịch vụ tính phí)'
        : 'ĐỦ ĐIỀU KIỆN TIẾP NHẬN BẢO HÀNH CHÍNH HÃNG',
    daysRemaining,
    history: Array.isArray(raw.history) ? raw.history : []
  };
};

export const warrantyService = {
  verifySerial: async (serialNumber) => {
    const clean = String(serialNumber).trim().toUpperCase();

    try {
      const response = await axiosClient.get(`/serials/verify/${encodeURIComponent(clean)}`);
      const payloadData = response?.data || response;
      if (payloadData && payloadData.serialNumber) {
        return normalizeWarrantyResult(payloadData, clean);
      }
      return null;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn(`[warrantyService] Failed to verify serial '${clean}' against live DB:`, err?.message);
      }
      throw err;
    }
  },

  createWarrantyTicket: async (payload) => {
    const apiPayload = {
      serialNumber: payload.serialNumber,
      issueDescription: payload.issueDescription,
      customerInfo: {
        fullName: payload.customerInfo?.fullName || '',
        phone: payload.customerInfo?.phone || '',
        address: payload.customerInfo?.address || ''
      },
      appearanceCondition: payload.appearanceCondition || '',
      devicePassword: payload.devicePassword || '',
      powerStatus: payload.powerStatus || 'Lên nguồn bình thường',
      accessories: Array.isArray(payload.accessories) ? payload.accessories : [],
      estimatedReturnDate: payload.estimatedReturnDate || '',
      notes: payload.notes || ''
    };

    const res = await axiosClient.post('/warranty', apiPayload);
    const created = res?.data?.ticket || res?.data || res;
    return {
      ...created,
      productName: created?.productId?.name || payload.productName || '',
      staffName: created?.staffId?.fullName || payload.staffName || 'Kỹ thuật viên'
    };
  },

  getWarrantyTickets: async (params = {}) => {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'ALL')
      );
      const query = new URLSearchParams(cleanParams).toString();
      const res = await axiosClient.get(`/warranty${query ? `?${query}` : ''}`);
      return res?.data?.tickets || res?.data || [];
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[warrantyService.getWarrantyTickets] Failed fetching tickets:', err?.message);
      }
      return [];
    }
  },

  updateTicketStatus: async (ticketId, payload) => {
    const res = await axiosClient.patch(`/warranty/${ticketId}/status`, payload);
    return res?.data?.ticket || res?.data || res;
  },

  diagnoseTicket: async (ticketId, payload) => {
    const res = await axiosClient.patch(`/warranty/${ticketId}/diagnose`, payload);
    return res?.data?.ticket || res?.data || res;
  },

  approveQuotation: async (ticketId, payload) => {
    const res = await axiosClient.patch(`/warranty/${ticketId}/approve`, payload);
    return res?.data?.ticket || res?.data || res;
  },

  completeRepair: async (ticketId, payload) => {
    const res = await axiosClient.patch(`/warranty/${ticketId}/complete`, payload);
    return res?.data?.ticket || res?.data || res;
  },

  handoverTicket: async (ticketId, payload) => {
    const res = await axiosClient.patch(`/warranty/${ticketId}/handover`, payload);
    return res?.data?.ticket || res?.data || res;
  },

  trackTicketPublic: async (ticketCode, phone) => {
    const res = await axiosClient.get('/warranty/track', {
      params: { ticketCode, phone }
    });
    return res?.data?.ticket || res?.data || res;
  },

  customerApprovePublic: async (ticketCode, payload) => {
    const res = await axiosClient.patch(`/warranty/track/${ticketCode}/approve`, payload);
    return res?.data?.ticket || res?.data || res;
  }
};

export default warrantyService;
