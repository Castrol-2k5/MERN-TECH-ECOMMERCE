import axiosClient from '../../../services/axiosClient.js';
import { isMockEnabled } from '../../../config/dataMode.js';

export const HIGH_VALUE_RETURN_THRESHOLD = 5000000;
export const LARGE_CASH_OUT_THRESHOLD = 1000000;

export const approvalService = {
  createRequest: async (payload) => {
    if (isMockEnabled()) {
      return {
        _id: `apr-mock-${Date.now()}`,
        requestCode: `APR-MOCK-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'PENDING',
        ...payload
      };
    }
    const res = await axiosClient.post('/approvals', payload);
    return res?.data?.request || null;
  },

  getRequests: async (params = {}) => {
    if (isMockEnabled()) {
      return { requests: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } };
    }
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'ALL')
    );
    const query = new URLSearchParams(cleanParams).toString();
    const res = await axiosClient.get(`/approvals${query ? `?${query}` : ''}`);
    return res?.data || { requests: [], pagination: {} };
  },

  getAlerts: async (params = {}) => {
    if (isMockEnabled()) {
      return { pendingCount: 0, alerts: [] };
    }
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const query = new URLSearchParams(cleanParams).toString();
    const res = await axiosClient.get(`/approvals/alerts${query ? `?${query}` : ''}`);
    return res?.data || { pendingCount: 0, alerts: [] };
  },

  approveRequest: async (id, reviewNote = '') => {
    const res = await axiosClient.patch(`/approvals/${id}/approve`, { reviewNote });
    return res?.data?.request || null;
  },

  rejectRequest: async (id, reviewNote = '') => {
    const res = await axiosClient.patch(`/approvals/${id}/reject`, { reviewNote });
    return res?.data?.request || null;
  }
};

export default approvalService;
