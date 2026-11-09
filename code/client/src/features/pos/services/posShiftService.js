import axiosClient from '../../../services/axiosClient.js';

export const posShiftService = {
  // Mở ca thu ngân mới
  openShift: async (data) => {
    const res = await axiosClient.post('/shifts/open', data);
    return res.data?.data?.shift;
  },

  // Lấy ca đang mở hiện tại
  getCurrentShift: async (params = {}) => {
    const res = await axiosClient.get('/shifts/current', { params });
    return res.data?.data?.shift;
  },

  // Rút tiền nộp két an toàn giữa ca
  recordCashDrop: async (shiftId, data) => {
    const res = await axiosClient.post(`/shifts/${shiftId}/drop`, data);
    return res.data?.data?.shift;
  },

  // Chốt ca thu ngân
  closeShift: async (shiftId, data) => {
    const res = await axiosClient.post(`/shifts/${shiftId}/close`, data);
    return res.data?.data?.shift;
  },

  // Lấy lịch sử các ca làm việc
  getShiftHistory: async (params = {}) => {
    const res = await axiosClient.get('/shifts/history', { params });
    return res.data?.data;
  }
};

export default posShiftService;
