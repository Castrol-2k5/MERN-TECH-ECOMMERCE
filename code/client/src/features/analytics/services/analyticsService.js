import axiosClient from '../../../services/axiosClient.js';

export const emptyAnalyticsOverview = {
  kpis: {
    totalRevenue: '0 ₫',
    totalOrders: '0',
    avgOrderValue: '0 ₫',
    growth: '0,0%'
  },
  revenueOverTime: [],
  channelData: [
    { name: 'B2C Web Online', value: 0, revenue: '0 ₫', color: '#2563EB' },
    { name: 'Web POS Quầy', value: 0, revenue: '0 ₫', color: '#06B6D4' }
  ],
  branchSales: [],
  branchPerformance: [],
  topProducts: []
};

export const analyticsService = {
  getMyPerformance: async (range = '7d') => {
    const emptyPerformance = {
      range,
      kpis: {
        totalRevenue: 0,
        completedOrders: 0,
        posOrdersCount: 0,
        avgOrderValue: 0,
        shiftCount: 0,
        warrantyCount: 0
      },
      dailyChart: [],
      categoryBreakdown: [],
      recentOrders: []
    };

    const res = await axiosClient.get(`/analytics/my-performance?range=${encodeURIComponent(range)}`);
    return res?.data || emptyPerformance;
  },

  getBranchStaffKpi: async ({ range = '7d', branchId = '' } = {}) => {
    const emptyReport = {
      range,
      summary: {
        totalTeamRevenue: 0,
        totalTeamOrders: 0,
        activeStaffCount: 0,
        totalStaffCount: 0,
        topPerformer: null
      },
      ranking: []
    };

    const query = new URLSearchParams({ range });
    if (branchId) query.set('branchId', branchId);
    const res = await axiosClient.get(`/analytics/branch-staff-kpi?${query.toString()}`);
    return res?.data || emptyReport;
  },

  getBranchStrategy: async ({ days = 30, branchId = '' } = {}) => {
    const query = new URLSearchParams({ days: String(days) });
    if (branchId) query.set('branchId', branchId);
    const res = await axiosClient.get(`/analytics/branch-strategy?${query.toString()}`);
    return (
      res?.data || {
        days,
        omnichannel: {
          totalRevenue: 0,
          posRevenue: 0,
          onlineRevenue: 0,
          posOrders: 0,
          onlineOrders: 0,
          posSharePercent: 0,
          onlineSharePercent: 0
        },
        peakHourSlot: null,
        peakHours: [],
        salesVelocity: [],
        agingStock: []
      }
    );
  },

  getOverview: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.branchId && params.branchId !== 'ALL') query.append('branchId', params.branchId);
      if (params.startDate) query.append('startDate', params.startDate);
      if (params.endDate) query.append('endDate', params.endDate);

      const endpoint = `/analytics/overview${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await axiosClient.get(endpoint);
      return res?.data?.data || res?.data || emptyAnalyticsOverview;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[analyticsService.getOverview] Failed fetching live analytics overview:', err?.message);
      }
      throw err;
    }
  }
};

export default analyticsService;
