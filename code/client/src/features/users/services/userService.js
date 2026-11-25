import axiosClient from '../../../services/axiosClient.js';

export const userService = {
  getUsers: async (params = {}) => {
    try {
      const response = await axiosClient.get('/users', { params });
      return response?.data?.users || response?.users || [];
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[userService.getUsers] Lỗi tải danh sách người dùng:', err);
      }
      return [];
    }
  },

  getUserById: async (id) => {
    const response = await axiosClient.get(`/users/${id}`);
    return response?.data?.user || response?.data;
  },

  createUser: async (payload) => {
    const response = await axiosClient.post('/users', payload);
    return response?.data?.user || response?.data;
  },

  updateUser: async (id, payload) => {
    const response = await axiosClient.put(`/users/${id}`, payload);
    return response?.data?.user || response?.data;
  },

  toggleUserStatus: async (id, isActive) => {
    const response = await axiosClient.patch(`/users/${id}/status`, { isActive });
    return response?.data?.user || response?.data;
  },

  getMyProfile: async () => {
    const response = await axiosClient.get('/users/profile/me');
    return response?.data?.user || response?.data;
  },

  updateMyProfile: async (payload) => {
    const response = await axiosClient.put('/users/profile/me', payload);
    return response?.data?.user || response?.data;
  },

  changePassword: async (payload) => {
    const response = await axiosClient.put('/users/profile/change-password', payload);
    return response?.data || { success: true };
  },

  deleteUser: async (id) => {
    const response = await axiosClient.delete(`/users/${id}`);
    return response?.data || { success: true };
  },
};

export default userService;
