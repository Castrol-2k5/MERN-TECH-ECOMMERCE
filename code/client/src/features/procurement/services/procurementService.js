import axiosClient from '../../../services/axiosClient.js';

export const procurementService = {
  async getVendors(params = {}) {
    const response = await axiosClient.get('/procurement/vendors', { params });
    return response?.data || response;
  },

  async createVendor(payload) {
    const response = await axiosClient.post('/procurement/vendors', payload);
    return response?.data?.vendor || response?.data || response;
  },

  async updateVendor(id, payload) {
    const response = await axiosClient.put(`/procurement/vendors/${id}`, payload);
    return response?.data?.vendor || response?.data || response;
  },

  async recordVendorPayment(vendorId, payload) {
    const response = await axiosClient.post(`/procurement/vendors/${vendorId}/payments`, payload);
    return response?.data || response;
  },

  async getPurchaseOrders(params = {}) {
    const response = await axiosClient.get('/procurement/purchase-orders', { params });
    return response?.data || response;
  },

  async createPurchaseOrder(payload) {
    const response = await axiosClient.post('/procurement/purchase-orders', payload);
    return response?.data?.purchaseOrder || response?.data || response;
  },

  async updatePurchaseOrderStatus(poId, status) {
    const response = await axiosClient.patch(`/procurement/purchase-orders/${poId}/status`, { status });
    return response?.data?.purchaseOrder || response?.data || response;
  },

  async receivePurchaseOrder(poId, payload) {
    const response = await axiosClient.post(`/procurement/purchase-orders/${poId}/receive`, payload);
    return response?.data || response;
  }
};

export default procurementService;
