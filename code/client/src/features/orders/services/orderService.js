import axiosClient from '../../../services/axiosClient.js';
import { isMockEnabled, isDevOrTest } from '../../../config/dataMode.js';

export const fallbackOrders = [
  {
    _id: 'order-mock-01',
    orderCode: 'ORD-20261001-0001',
    orderType: 'B2C_ONLINE',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    orderStatus: 'COMPLETED',
    paymentStatus: 'PAID',
    paymentMethod: 'VNPAY',
    totalAmount: 34990000,
    shippingAddress: {
      fullName: 'Hoàng Khách Hàng',
      phone: '0909000005',
      address: '45 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM'
    },
    branchId: {
      _id: 'branch-01',
      name: 'TechOne Quận 1 (Flagship)',
      branchName: 'TechOne Q1 Flagship',
      address: '128 Nguyễn Thị Minh Khai, P. Bến Thành, Q.1, TP.HCM'
    },
    items: [
      {
        productId: 'prod-01',
        productSkuId: 'sku-01',
        productName: 'iPhone 16 Pro Max 256GB Desert Titanium',
        sku: 'IP16PM-256-DESERT',
        quantity: 1,
        unitPrice: 34990000,
        serialsAssigned: ['IP16PM-DESERT-VN-001']
      }
    ]
  },
  {
    _id: 'order-mock-02',
    orderCode: 'ORD-20261002-0002',
    orderType: 'B2C_ONLINE',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    orderStatus: 'PROCESSING',
    paymentStatus: 'PAID',
    paymentMethod: 'VNPAY',
    totalAmount: 49490000,
    shippingAddress: {
      fullName: 'Hoàng Khách Hàng',
      phone: '0909000005',
      address: '45 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM'
    },
    branchId: {
      _id: 'branch-02',
      name: 'TechOne TP. Thủ Đức',
      branchName: 'TechOne Thủ Đức Hub',
      address: '45 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức, TP.HCM'
    },
    items: [
      {
        productId: 'prod-02',
        productSkuId: 'sku-02',
        productName: 'MacBook Pro 14 M3 Pro 18GB/512GB Space Black',
        sku: 'MBP-M3PRO-18-512',
        quantity: 1,
        unitPrice: 49490000,
        serialsAssigned: []
      }
    ]
  },
  {
    _id: 'order-mock-03',
    orderCode: 'ORD-20261003-0003',
    orderType: 'B2C_ONLINE',
    createdAt: new Date().toISOString(),
    orderStatus: 'PENDING',
    paymentStatus: 'PENDING',
    paymentMethod: 'STRIPE',
    totalAmount: 31990000,
    shippingAddress: {
      fullName: 'Hoàng Khách Hàng',
      phone: '0909000005',
      address: '45 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM'
    },
    branchId: {
      _id: 'branch-01',
      name: 'TechOne Quận 1 (Flagship)',
      branchName: 'TechOne Q1 Flagship',
      address: '128 Nguyễn Thị Minh Khai, P. Bến Thành, Q.1, TP.HCM'
    },
    items: [
      {
        productId: 'prod-03',
        productSkuId: 'sku-03',
        productName: 'Samsung Galaxy S24 Ultra 512GB Titanium Gray',
        sku: 'SS-S24U-512-GRAY',
        quantity: 1,
        unitPrice: 31990000,
        serialsAssigned: []
      }
    ]
  }
];

export const orderService = {
  getMyOrders: async (query = {}) => {
    if (isMockEnabled()) {
      return fallbackOrders;
    }

    try {
      const queryString = new URLSearchParams(query).toString();
      const endpoint = `/orders/my-orders${queryString ? `?${queryString}` : '?limit=50'}`;
      const response = await axiosClient.get(endpoint);
      return response?.data?.orders || [];
    } catch (err) {
      if (isDevOrTest()) {
        console.warn('[orderService.getMyOrders] Failed fetching live orders:', err?.message);
      }
      throw err;
    }
  },

  getMyOrderDetail: async (id) => {
    if (isMockEnabled()) {
      const match = fallbackOrders.find((o) => o._id === id || o.orderCode === id);
      return match || fallbackOrders[0];
    }

    try {
      const response = await axiosClient.get(`/orders/my-orders/${id}`);
      return response?.data?.order || null;
    } catch (err) {
      if (isDevOrTest()) {
        console.warn(`[orderService.getMyOrderDetail] Failed fetching order ${id}:`, err?.message);
      }
      throw err;
    }
  },

  getBranchOrders: async (params = {}) => {
    if (isMockEnabled()) {
      return fallbackOrders;
    }

    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/orders/branch${queryString ? `?${queryString}` : ''}`;
      const response = await axiosClient.get(endpoint);
      return response?.data?.orders || [];
    } catch (err) {
      if (isDevOrTest()) {
        console.warn('[orderService.getBranchOrders] Failed fetching branch orders:', err?.message);
      }
      throw err;
    }
  },

  createB2cOrder: async (payload) => {
    if (isMockEnabled()) {
      const mockOrder = {
        _id: `mock-order-${Date.now()}`,
        orderCode: `ORD-B2C-${Math.floor(100000 + Math.random() * 900000)}`,
        orderType: 'B2C_ONLINE',
        createdAt: new Date().toISOString(),
        orderStatus: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: payload.paymentMethod || 'VNPAY',
        totalAmount: payload.items?.reduce((s, it) => s + (it.unitPrice || 0) * (it.quantity || 1), 0) || 0,
        shippingAddress: payload.shippingAddress,
        items: payload.items || []
      };
      return mockOrder;
    }

    const response = await axiosClient.post('/orders/b2c/checkout', payload);
    return response?.data?.order || response?.data;
  }
};
