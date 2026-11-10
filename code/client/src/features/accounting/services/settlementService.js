import axiosClient from '../../../services/axiosClient.js';

export const settlementService = {
  // Lấy danh sách bù trừ đối soát liên chi nhánh
  getSettlements: async (params = {}) => {
    const res = await axiosClient.get('/settlements', { params });
    return res?.data || { settlements: [], pagination: {} };
  },

  // Super Admin xác nhận thanh toán bù trừ cho chi nhánh
  settlePayment: async (settlementId, data = {}) => {
    const res = await axiosClient.post(`/settlements/${settlementId}/settle`, data);
    return res?.data?.settlement || res?.settlement || null;
  }
};

export default settlementService;
