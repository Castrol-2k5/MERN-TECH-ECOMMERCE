import axiosClient from '../../../services/axiosClient.js';

export const rosterService = {
  getWeeklyRoster: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await axiosClient.get(`/roster${query ? `?${query}` : ''}`);
    return res?.data?.schedules || [];
  },

  assignShift: async (payload) => {
    const res = await axiosClient.post('/roster', payload);
    return res?.data?.schedule || null;
  },

  removeShift: async (id) => {
    const res = await axiosClient.delete(`/roster/${id}`);
    return res?.data || null;
  },

  checkInShift: async (id) => {
    const res = await axiosClient.post(`/roster/${id}/check-in`);
    return res?.data?.schedule || null;
  },

  checkOutShift: async (id) => {
    const res = await axiosClient.post(`/roster/${id}/check-out`);
    return res?.data?.schedule || null;
  },

  requestSwap: async (id, payload) => {
    const res = await axiosClient.post(`/roster/${id}/swap-request`, payload);
    return res?.data?.schedule || null;
  },

  reviewSwap: async (id, payload) => {
    const res = await axiosClient.patch(`/roster/${id}/swap-review`, payload);
    return res?.data?.schedule || null;
  }
};

export default rosterService;
