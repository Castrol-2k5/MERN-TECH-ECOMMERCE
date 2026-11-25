import apiClient from '../../../services/api';

export const auditLogService = {
  getLogs: async (params = {}) => {
    try {
      const res = await apiClient.get('/audit-logs', { params });
      return res?.data || { logs: [], pagination: {} };
    } catch {
      return { logs: [], pagination: {} };
    }
  },

  getStats: async () => {
    try {
      const res = await apiClient.get('/audit-logs/stats');
      return res?.data || {};
    } catch {
      return {};
    }
  },

  getLogById: async (id) => {
    try {
      const res = await apiClient.get(`/audit-logs/${id}`);
      return res?.data || null;
    } catch {
      return null;
    }
  },

  getEntityTimeline: async (model, entityId) => {
    try {
      const res = await apiClient.get(`/audit-logs/entity/${model}/${entityId}`);
      return res?.data?.timeline || [];
    } catch {
      return [];
    }
  }
};

export default auditLogService;
