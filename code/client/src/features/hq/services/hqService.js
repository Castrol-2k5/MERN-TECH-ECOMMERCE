import axiosClient from '../../../services/axiosClient.js';

export const hqService = {
  async getCommandCenter() {
    const response = await axiosClient.get('/hq/command-center');
    return response?.data || response;
  },

  async getThresholds(params = {}) {
    const response = await axiosClient.get('/hq/supply-chain/thresholds', { params });
    return response?.data || response;
  },

  async updateThresholds(items) {
    const response = await axiosClient.patch('/hq/supply-chain/thresholds', { items });
    return response?.data || response;
  },

  async getReplenishmentSuggestions() {
    const response = await axiosClient.get('/hq/supply-chain/replenishment-suggestions');
    return response?.data || response;
  },

  async executeAutoReplenishment(payload) {
    const response = await axiosClient.post('/hq/supply-chain/replenish', payload);
    return response?.data || response;
  },

  async getDeadStockSuggestions(agedDays = 30) {
    const response = await axiosClient.get('/hq/supply-chain/dead-stock-suggestions', {
      params: { agedDays }
    });
    return response?.data || response;
  },

  async executeDeadStockRebalance(payload) {
    const response = await axiosClient.post('/hq/supply-chain/rebalance', payload);
    return response?.data || response;
  }
};

export default hqService;
