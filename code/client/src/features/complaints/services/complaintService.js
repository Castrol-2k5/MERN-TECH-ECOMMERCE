import axiosClient from '../../../services/axiosClient.js';

export const complaintService = {
  getComplaints: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'ALL')
    );
    const query = new URLSearchParams(cleanParams).toString();
    const res = await axiosClient.get(`/complaints${query ? `?${query}` : ''}`);
    return res?.data?.complaints || [];
  },

  createComplaint: async (payload) => {
    const res = await axiosClient.post('/complaints', payload);
    return res?.data?.complaint || null;
  },

  updateComplaint: async (id, payload) => {
    const res = await axiosClient.patch(`/complaints/${id}`, payload);
    return res?.data?.complaint || null;
  },

  getWarrantyWatchlist: async () => {
    const res = await axiosClient.get('/complaints/warranty-watchlist');
    return res?.data?.tickets || [];
  }
};

export default complaintService;
