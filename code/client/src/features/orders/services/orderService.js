import axiosClient from '../../../services/axiosClient.js';

export const orderService = {
  getMyOrders: async (query = {}) => {
    try {
      const queryString = new URLSearchParams(query).toString();
      const endpoint = `/orders/my-orders${queryString ? `?${queryString}` : '?limit=50'}`;
      const response = await axiosClient.get(endpoint);
      return response?.data?.orders || [];
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[orderService.getMyOrders] Failed fetching live orders:', err?.message);
      }
      throw err;
    }
  },

  getMyOrderDetail: async (id) => {
    try {
      const response = await axiosClient.get(`/orders/my-orders/${id}`);
      return response?.data?.order || null;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn(`[orderService.getMyOrderDetail] Failed fetching order ${id}:`, err?.message);
      }
      throw err;
    }
  },

  getBranchOrders: async (params = {}) => {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'ALL')
      );
      const queryString = new URLSearchParams(cleanParams).toString();
      const endpoint = `/orders/branch${queryString ? `?${queryString}` : ''}`;
      const response = await axiosClient.get(endpoint);
      return response?.data?.orders || [];
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[orderService.getBranchOrders] Failed fetching branch orders:', err?.message);
      }
      throw err;
    }
  },

  createB2cOrder: async (payload) => {
    const response = await axiosClient.post('/orders/b2c/checkout', payload);
    return response?.data?.order || response?.data;
  },

  createVnpayUrl: async (orderId) => {
    const response = await axiosClient.post(`/orders/${orderId}/vnpay-url`);
    return response?.data || response;
  },

  allocateOrder: async (orderId, branchId) => {
    const response = await axiosClient.patch(`/orders/${orderId}/allocate`, { branchId });
    return response?.data?.order || response?.data;
  },

  trackOrderPublic: async (orderCode, phone) => {
    const response = await axiosClient.get('/orders/track', {
      params: { orderCode, phone }
    });
    return response?.data?.order || response?.data;
  },

  dispatchOrder: async (orderId, serials = []) => {
    const response = await axiosClient.patch(`/orders/${orderId}/dispatch`, {
      serials,
      orderStatus: 'READY_FOR_SHIPPING'
    });
    return response?.data?.order || response?.data;
  },

  completeOrder: async (orderId, payload = {}) => {
    const response = await axiosClient.patch(`/orders/${orderId}/complete`, payload);
    return response?.data?.order || response?.data;
  },

  cancelOrder: async (orderId, reason) => {
    const response = await axiosClient.patch(`/orders/${orderId}/cancel`, { reason });
    return response?.data?.order || response?.data;
  },

  exchangeSku: async (orderId, payload) => {
    const response = await axiosClient.patch(`/orders/${orderId}/exchange-sku`, payload);
    return response?.data?.data || response?.data;
  },

  returnOrder: async (orderId, payload) => {
    const response = await axiosClient.post(`/orders/${orderId}/return`, payload);
    return response?.data || response;
  },

  getBranchAlerts: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = `/orders/branch/alerts${queryString ? `?${queryString}` : ''}`;
    const response = await axiosClient.get(endpoint);
    return response?.data || { pendingCount: 0, newCount: 0, processingCount: 0, alerts: [] };
  },

  getPickPackSlip: async (orderId) => {
    const response = await axiosClient.get(`/orders/${orderId}/pick-pack`);
    return response?.data?.order || null;
  }
};
