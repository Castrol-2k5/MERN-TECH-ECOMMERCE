import axiosClient from '../../../services/axiosClient.js';
import { isMockEnabled, isDevOrTest } from '../../../config/dataMode.js';

export const fallbackUsers = [
  {
    _id: 'user-001',
    fullName: 'Nguyễn Minh Anh',
    email: 'admin@techone.vn',
    phone: '0909998888',
    role: 'SUPER_ADMIN',
    branchId: null,
    isActive: true
  },
  {
    _id: 'user-002',
    fullName: 'Phạm Quốc Huy',
    email: 'huy.pham@techone.vn',
    phone: '0912345678',
    role: 'BRANCH_MANAGER',
    branchId: '65f0a1000000000000000001',
    isActive: true
  },
  {
    _id: 'user-003',
    fullName: 'Nguyễn Văn Thu Ngân',
    email: 'thungan.q1@techone.vn',
    phone: '0987654321',
    role: 'STAFF',
    branchId: '65f0a1000000000000000001',
    isActive: true
  },
  {
    _id: 'user-004',
    fullName: 'Trần Kỹ Thuật',
    email: 'kythuat.q1@techone.vn',
    phone: '0971123344',
    role: 'STAFF',
    branchId: '65f0a1000000000000000001',
    isActive: true
  }
];

export const userService = {
  getUsers: async (params = {}) => {
    if (isMockEnabled()) {
      return fallbackUsers;
    }

    try {
      const response = await axiosClient.get('/users', { params });
      return response?.data?.users || response?.users || [];
    } catch (err) {
      if (isDevOrTest()) {
        console.error('[userService.getUsers] Lỗi tải danh sách người dùng:', err);
      }
      return fallbackUsers;
    }
  },

  getUserById: async (id) => {
    if (isMockEnabled()) {
      return fallbackUsers.find((u) => u._id === id);
    }
    const response = await axiosClient.get(`/users/${id}`);
    return response?.data?.user || response?.data;
  },

  createUser: async (payload) => {
    if (isMockEnabled()) {
      const newUser = { _id: 'user-' + Date.now(), ...payload };
      return newUser;
    }
    const response = await axiosClient.post('/users', payload);
    return response?.data?.user || response?.data;
  },

  updateUser: async (id, payload) => {
    if (isMockEnabled()) {
      return { _id: id, ...payload };
    }
    const response = await axiosClient.put(`/users/${id}`, payload);
    return response?.data?.user || response?.data;
  },

  toggleUserStatus: async (id, isActive) => {
    if (isMockEnabled()) {
      return { _id: id, isActive };
    }
    const response = await axiosClient.patch(`/users/${id}/status`, { isActive });
    return response?.data?.user || response?.data;
  },

  deleteUser: async (id) => {
    if (isMockEnabled()) {
      return { success: true };
    }
    const response = await axiosClient.delete(`/users/${id}`);
    return response?.data || { success: true };
  }
};

export default userService;
