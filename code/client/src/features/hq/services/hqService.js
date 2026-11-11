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
  },

  async getConsolidatedPnl(params = {}) {
    const response = await axiosClient.get('/hq/finance/pnl', { params });
    return response?.data || response;
  },

  async getExpenses(params = {}) {
    const response = await axiosClient.get('/hq/finance/expenses', { params });
    return response?.data || response;
  },

  async createExpense(payload) {
    const response = await axiosClient.post('/hq/finance/expenses', payload);
    return response?.data || response;
  },

  async reviewExpense(expenseId, payload) {
    const response = await axiosClient.patch(`/hq/finance/expenses/${expenseId}/review`, payload);
    return response?.data || response;
  },

  async getCommissionRules() {
    const response = await axiosClient.get('/hq/finance/commissions/rules');
    return response?.data || response;
  },

  async createCommissionRule(payload) {
    const response = await axiosClient.post('/hq/finance/commissions/rules', payload);
    return response?.data || response;
  },

  async toggleCommissionRule(ruleId, isActive) {
    const response = await axiosClient.patch(`/hq/finance/commissions/rules/${ruleId}`, { isActive });
    return response?.data || response;
  },

  async getCommissionReport(params = {}) {
    const response = await axiosClient.get('/hq/finance/commissions/report', { params });
    return response?.data || response;
  },

  async getExecutiveApprovals(params = {}) {
    const response = await axiosClient.get('/hq/finance/executive-approvals', { params });
    return response?.data || response;
  },

  async approveExecutiveRequest(id, reviewNote = '') {
    const response = await axiosClient.patch(`/approvals/${id}/approve`, { reviewNote });
    return response?.data || response;
  },

  async rejectExecutiveRequest(id, reviewNote = '') {
    const response = await axiosClient.patch(`/approvals/${id}/reject`, { reviewNote });
    return response?.data || response;
  }
};

export default hqService;
