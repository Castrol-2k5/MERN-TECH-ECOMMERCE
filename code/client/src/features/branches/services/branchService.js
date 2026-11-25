import axiosClient from '../../../services/axiosClient.js';

const normalizeBranch = (b) => {
  if (!b) return null;
  const code = b.branchCode || b.code || '';
  const isHq = Boolean(b.isHeadquarter || code === 'BR-HQ');
  return {
    ...b,
    _id: b._id || b.id,
    branchName: b.branchName || b.name,
    name: b.name || b.branchName,
    branchCode: code,
    code,
    address: b.address || '',
    phone: b.phone || '',
    location:
      b.location ||
      (b.longitude !== undefined && b.latitude !== undefined
        ? { type: 'Point', coordinates: [Number(b.longitude), Number(b.latitude)] }
        : null),
    isHeadquarter: isHq,
    bankInfo: b.bankInfo || { bankBin: '', bankName: '', accountNumber: '', accountName: '' },
    managerName: b.managerName || (isHq ? 'Ban Quản Trị Trụ Sở (HQ)' : 'Chưa bổ nhiệm'),
    stockCount: b.stockCount ?? 0,
  };
};

const buildCleanBranchPayload = (payload = {}) => {
  const clean = {
    branchCode: String(payload.branchCode || payload.code || '').trim().toUpperCase(),
    name: String(payload.name || '').trim(),
    address: String(payload.address || '').trim(),
    phone: String(payload.phone || '').trim(),
    location: payload.location || {
      type: 'Point',
      coordinates: [106.6917, 10.7725],
    },
  };
  if (payload.isHeadquarter !== undefined) {
    clean.isHeadquarter = Boolean(payload.isHeadquarter);
  }
  if (payload.isActive !== undefined) {
    clean.isActive = Boolean(payload.isActive);
  }
  if (payload.bankInfo && typeof payload.bankInfo === 'object') {
    clean.bankInfo = {
      bankBin: String(payload.bankInfo.bankBin || '').trim(),
      bankName: String(payload.bankInfo.bankName || '').trim(),
      accountNumber: String(payload.bankInfo.accountNumber || '').trim(),
      accountName: String(payload.bankInfo.accountName || '').trim().toUpperCase(),
    };
  }
  return clean;
};

export const branchService = {
  getBranches: async (params = {}) => {
    try {
      const response = await axiosClient.get('/branches', { params });
      const rawBranches =
        response?.data?.branches || (Array.isArray(response?.data) ? response.data : []);
      return rawBranches.map(normalizeBranch);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[branchService.getBranches] Lỗi kết nối Live Database / API /branches:', err);
      }
      return [];
    }
  },

  getAllBranches: async (params = {}) => {
    return branchService.getBranches(params);
  },

  getBranchById: async (id) => {
    const response = await axiosClient.get(`/branches/${id}`);
    const rawBranch = response?.data?.branch || response?.data;
    return normalizeBranch(rawBranch);
  },

  createBranch: async (payload) => {
    const cleanPayload = buildCleanBranchPayload(payload);
    const response = await axiosClient.post('/branches', cleanPayload);
    const rawBranch = response?.data?.branch || response?.data;
    return normalizeBranch(rawBranch);
  },

  updateBranch: async (id, payload) => {
    const cleanPayload = buildCleanBranchPayload(payload);
    const response = await axiosClient.put(`/branches/${id}`, cleanPayload);
    const rawBranch = response?.data?.branch || response?.data;
    return normalizeBranch(rawBranch);
  },

  deleteBranch: async (id) => {
    const response = await axiosClient.delete(`/branches/${id}`);
    return response?.data || { success: true };
  },
};

export default branchService;
