import axiosClient from '../../../services/axiosClient.js';
import { isMockEnabled, isDevOrTest } from '../../../config/dataMode.js';

export const fallbackAnalyticsOverview = {
  kpis: {
    totalRevenue: '18,42 tỷ',
    totalOrders: '4.862',
    avgOrderValue: '3,79 triệu',
    growth: '+18,6%'
  },
  revenueOverTime: [
    { day: '01/09', online: 320, pos: 180, total: 500 },
    { day: '02/09', online: 450, pos: 280, total: 730 },
    { day: '03/09', online: 380, pos: 220, total: 600 },
    { day: '04/09', online: 580, pos: 350, total: 930 },
    { day: '05/09', online: 510, pos: 310, total: 820 },
    { day: '06/09', online: 680, pos: 420, total: 1100 },
    { day: '07/09', online: 620, pos: 390, total: 1010 },
    { day: '08/09', online: 780, pos: 490, total: 1270 },
    { day: '09/09', online: 660, pos: 410, total: 1070 },
    { day: '10/09', online: 880, pos: 550, total: 1430 },
    { day: '11/09', online: 830, pos: 520, total: 1350 },
    { day: '12/09', online: 980, pos: 610, total: 1590 }
  ],
  channelData: [
    { name: 'B2C Web Online', value: 62, revenue: '11,42 tỷ', color: '#2563EB' },
    { name: 'Web POS Quầy', value: 38, revenue: '7,00 tỷ', color: '#06B6D4' }
  ],
  branchSales: [
    { name: 'TechOne Q1 • Trần Quang Khải', revenue: '4,28 tỷ', percentage: 100, color: 'bg-blue-600' },
    { name: 'TechOne Thủ Đức • Võ Văn Ngân', revenue: '3,62 tỷ', percentage: 84, color: 'bg-cyan-400' },
    { name: 'TechOne Q5 • Trần Hưng Đạo', revenue: '2,94 tỷ', percentage: 68, color: 'bg-purple-500' },
    { name: 'TechOne Q3 • CMT8', revenue: '2,36 tỷ', percentage: 55, color: 'bg-emerald-500' }
  ],
  branchPerformance: [
    { rank: '01', branch: 'TechOne Q1 • Nguyễn Thị Minh Khai', revenue: '4,28 tỷ', orders: '1.042', aov: '4,11 triệu', returnRate: '1,8%', growth: '+22,4%' },
    { rank: '02', branch: 'TechOne Thủ Đức • Võ Văn Ngân', revenue: '3,62 tỷ', orders: '968', aov: '3,74 triệu', returnRate: '2,1%', growth: '+18,2%' },
    { rank: '03', branch: 'TechOne Q5 • Trần Hưng Đạo', revenue: '2,94 tỷ', orders: '842', aov: '3,49 triệu', returnRate: '2,4%', growth: '+15,7%' },
    { rank: '04', branch: 'TechOne Q3 • CMT8', revenue: '2,36 tỷ', orders: '710', aov: '3,32 triệu', returnRate: '2,6%', growth: '+12,0%' }
  ],
  topProducts: [
    { rank: 1, name: 'MacBook Air 13 M4 16GB/256GB', sku: 'MBA-M4-16-256-SL', quantity: '286 máy', revenue: '7,58 tỷ', color: 'text-amber-400' },
    { rank: 2, name: 'Galaxy S26 Ultra 12GB/512GB', sku: 'SS-S26U-12-512', quantity: '174 máy', revenue: '5,56 tỷ', color: 'text-slate-300' },
    { rank: 3, name: 'ASUS ROG Zephyrus G14 R9', sku: 'ASG14-R9-32-1T', quantity: '82 máy', revenue: '4,06 tỷ', color: 'text-amber-600' },
    { rank: 4, name: 'Tai nghe Sony WH-1000XM6', sku: 'SNY-XM6-BLK', quantity: '318 chiếc', revenue: '2,54 tỷ', color: 'text-blue-400' },
    { rank: 5, name: 'Chuột Logitech MX Master 4', sku: 'LOG-MXM4-GR', quantity: '412 chiếc', revenue: '1,19 tỷ', color: 'text-cyan-400' }
  ]
};

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

    if (isMockEnabled()) {
      return {
        range,
        kpis: {
          totalRevenue: 96470000,
          completedOrders: 4,
          posOrdersCount: 3,
          avgOrderValue: 24117500,
          shiftCount: 3,
          warrantyCount: 2
        },
        dailyChart: [
          { day: '06/11', revenue: 34990000, ordersCount: 1 },
          { day: '08/11', revenue: 28990000, ordersCount: 2 },
          { day: '10/11', revenue: 32490000, ordersCount: 1 }
        ],
        categoryBreakdown: [
          { name: 'Điện thoại', revenue: 60480000, units: 2, percentage: 63 },
          { name: 'Laptop Gaming', revenue: 34990000, units: 1, percentage: 36 },
          { name: 'Phụ kiện', revenue: 1000000, units: 2, percentage: 1 }
        ],
        recentOrders: [
          {
            _id: 'mock-perf-1',
            orderCode: 'ORD-POS-261110-001',
            orderType: 'POS_STORE',
            orderStatus: 'COMPLETED',
            paymentMethod: 'CASH',
            totalAmount: 32490000,
            refundedAmount: 0,
            customerInfo: { fullName: 'Hoàng Khách Hàng', phone: '0909000005' },
            items: [{ productName: 'iPhone 16 Pro Max', quantity: 1 }],
            createdAt: new Date().toISOString()
          }
        ]
      };
    }

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

    if (isMockEnabled()) {
      return {
        range,
        summary: {
          totalTeamRevenue: 185420000,
          totalTeamOrders: 9,
          activeStaffCount: 3,
          totalStaffCount: 3,
          topPerformer: { fullName: 'Lê Thu Ngân Q1', netRevenue: 98450000 }
        },
        ranking: [
          {
            rank: 1,
            staffId: 'staff-1',
            fullName: 'Lê Thu Ngân Q1',
            email: 'staff.q1@techstore.com',
            phone: '0909000003',
            role: 'STAFF',
            isActive: true,
            netRevenue: 98450000,
            completedOrders: 5,
            posOrdersCount: 4,
            avgOrderValue: 19690000,
            shiftCount: 4,
            warrantyCount: 2,
            returnRate: 0
          },
          {
            rank: 2,
            staffId: 'staff-2',
            fullName: 'Nguyễn Minh Tư Vấn',
            email: 'tuvan.q1@techstore.com',
            phone: '0909000013',
            role: 'STAFF',
            isActive: true,
            netRevenue: 86970000,
            completedOrders: 4,
            posOrdersCount: 4,
            avgOrderValue: 21742500,
            shiftCount: 3,
            warrantyCount: 1,
            returnRate: 0
          }
        ]
      };
    }

    const query = new URLSearchParams({ range });
    if (branchId) query.set('branchId', branchId);
    const res = await axiosClient.get(`/analytics/branch-staff-kpi?${query.toString()}`);
    return res?.data || emptyReport;
  },
  getOverview: async (params = {}) => {
    if (isMockEnabled()) {
      return fallbackAnalyticsOverview;
    }

    try {
      const query = new URLSearchParams();
      if (params.branchId && params.branchId !== 'ALL') query.append('branchId', params.branchId);
      if (params.startDate) query.append('startDate', params.startDate);
      if (params.endDate) query.append('endDate', params.endDate);

      const endpoint = `/analytics/overview${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await axiosClient.get(endpoint);
      return res?.data?.data || res?.data || emptyAnalyticsOverview;
    } catch (err) {
      if (isDevOrTest()) {
        console.warn('[analyticsService.getOverview] Failed fetching live analytics overview:', err?.message);
      }
      throw err;
    }
  }
};

export default analyticsService;
