import apiClient from '../../../services/api';
import { isMockEnabled } from '../../../config/dataMode.js';

export const DEMO_AUDIT_LOGS = [
  {
    _id: 'audit-01',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    actor: {
      userId: 'user-01',
      fullName: 'Trần Văn Hoàng (Super Admin)',
      email: 'admin@techone.vn',
      role: 'SUPER_ADMIN',
      branchCode: 'BR-HQ'
    },
    action: 'STOCK_ADJUST',
    severity: 'WARNING',
    target: {
      model: 'BranchInventory',
      entityId: 'inv-01',
      code: 'IP16PM-256-DESERT',
      name: 'iPhone 16 Pro Max 256GB Sa Mạc'
    },
    changes: {
      before: { quantityPhysical: 14, quantityAvailable: 14 },
      after: { quantityPhysical: 12, quantityAvailable: 12 },
      diff: { quantityPhysical: -2, quantityAvailable: -2 }
    },
    context: {
      ipAddress: '14.161.20.105',
      userAgent: 'Chrome 130.0 / Windows 10',
      reason: 'Hư hỏng vỏ hộp khi trưng bày quầy trải nghiệm',
      notes: 'Đã lập biên bản cùng quản lý showroom'
    },
    status: 'SUCCESS'
  },
  {
    _id: 'audit-02',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    actor: {
      userId: 'user-02',
      fullName: 'Nguyễn Thị Thu Ngân',
      email: 'cashier.q1@techone.vn',
      role: 'STAFF',
      branchCode: 'BR-Q1'
    },
    action: 'POS_SHIFT_CLOSE',
    severity: 'CRITICAL',
    target: {
      model: 'PosShift',
      entityId: 'shift-102',
      code: 'SHF-20261109-8A1C',
      name: 'Ca thu ngân SHF-20261109-8A1C'
    },
    changes: {
      before: { status: 'OPEN' },
      after: {
        status: 'CLOSED',
        expectedEndingBalance: 15420000,
        actualEndingBalance: 15320000,
        discrepancy: -100000
      },
      diff: { discrepancy: -100000 }
    },
    context: {
      ipAddress: '118.69.182.90',
      userAgent: 'Chrome 130.0 / POS Terminal 01',
      reason: 'Chốt ca cuối ngày',
      notes: 'Thối nhầm tiền thừa cho khách đơn lẻ'
    },
    status: 'SUCCESS'
  },
  {
    _id: 'audit-03',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    actor: {
      userId: 'user-02',
      fullName: 'Nguyễn Thị Thu Ngân',
      email: 'cashier.q1@techone.vn',
      role: 'STAFF',
      branchCode: 'BR-Q1'
    },
    action: 'POS_SHIFT_CASH_DROP',
    severity: 'WARNING',
    target: {
      model: 'PosShift',
      entityId: 'shift-102',
      code: 'SHF-20261109-8A1C',
      name: 'Ca thu ngân SHF-20261109-8A1C'
    },
    changes: {
      before: { expectedEndingBalance: 20420000 },
      after: { expectedEndingBalance: 15420000, dropAmount: 5000000 },
      diff: { dropAmount: -5000000 }
    },
    context: {
      ipAddress: '118.69.182.90',
      userAgent: 'Chrome 130.0 / POS Terminal 01',
      reason: 'Nộp két sắt an toàn đạt định mức tiền mặt 20 triệu'
    },
    status: 'SUCCESS'
  },
  {
    _id: 'audit-04',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    actor: {
      userId: 'user-03',
      fullName: 'Lê Quản Lý (Thủ Đức)',
      email: 'manager.td@techone.vn',
      role: 'BRANCH_MANAGER',
      branchCode: 'BR-TDUC'
    },
    action: 'TRANSFER_RECEIVE',
    severity: 'INFO',
    target: {
      model: 'StockTransfer',
      entityId: 'trf-991',
      code: 'TRF-20261109-F4A1',
      name: 'Phiếu chuyển kho TRF-20261109-F4A1'
    },
    changes: {
      before: { status: 'IN_TRANSIT' },
      after: { status: 'COMPLETED', hasDiscrepancy: false },
      diff: { status: { before: 'IN_TRANSIT', after: 'COMPLETED' } }
    },
    context: {
      ipAddress: '171.244.11.23',
      notes: 'Đã nhận đủ 5 máy và quét Serial kiểm đếm trùng khớp'
    },
    status: 'SUCCESS'
  }
];

export const auditLogService = {
  getLogs: async (params = {}) => {
    if (isMockEnabled()) {
      let filtered = [...DEMO_AUDIT_LOGS];
      if (params.action) {
        filtered = filtered.filter((l) => l.action === params.action);
      }
      if (params.severity) {
        filtered = filtered.filter((l) => l.severity === params.severity);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.actor?.fullName?.toLowerCase().includes(q) ||
            l.target?.code?.toLowerCase().includes(q) ||
            l.target?.name?.toLowerCase().includes(q) ||
            l.context?.ipAddress?.includes(q)
        );
      }
      return {
        logs: filtered,
        pagination: {
          page: 1,
          limit: 20,
          total: filtered.length,
          totalPages: 1
        }
      };
    }

    try {
      const res = await apiClient.get('/audit-logs', { params });
      return res?.data || { logs: [], pagination: {} };
    } catch {
      return { logs: [], pagination: {} };
    }
  },

  getStats: async () => {
    if (isMockEnabled()) {
      return {
        totalToday: DEMO_AUDIT_LOGS.length,
        criticalToday: DEMO_AUDIT_LOGS.filter((l) => l.severity === 'CRITICAL').length,
        stockAdjustmentsToday: DEMO_AUDIT_LOGS.filter((l) => l.action === 'STOCK_ADJUST').length,
        shiftDiscrepanciesToday: DEMO_AUDIT_LOGS.filter((l) => l.action === 'POS_SHIFT_CLOSE').length
      };
    }

    try {
      const res = await apiClient.get('/audit-logs/stats');
      return res?.data || {};
    } catch {
      return {};
    }
  },

  getLogById: async (id) => {
    if (isMockEnabled()) {
      return DEMO_AUDIT_LOGS.find((l) => l._id === id) || null;
    }

    try {
      const res = await apiClient.get(`/audit-logs/${id}`);
      return res?.data || null;
    } catch {
      return null;
    }
  },

  getEntityTimeline: async (model, entityId) => {
    if (isMockEnabled()) {
      return DEMO_AUDIT_LOGS.filter((l) => l.target?.model === model);
    }

    try {
      const res = await apiClient.get(`/audit-logs/entity/${model}/${entityId}`);
      return res?.data?.timeline || [];
    } catch {
      return [];
    }
  }
};

export default auditLogService;
