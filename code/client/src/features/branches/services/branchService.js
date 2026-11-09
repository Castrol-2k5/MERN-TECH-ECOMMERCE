import axiosClient from '../../../services/axiosClient.js';
import { isMockEnabled, isDevOrTest } from '../../../config/dataMode.js';

export const fallbackBranches = [
  {
    _id: 'branch-hq',
    branchCode: 'BR-HQ',
    name: 'Kho Trung Tâm Trụ Sở Chính (HQ)',
    branchName: 'Kho Trung Tâm HQ',
    address: 'Tòa nhà TechOne Tower, 01 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    phone: '028 3822 6868',
    location: { type: 'Point', coordinates: [106.7009, 10.7829] },
    isHeadquarter: true,
    isActive: true
  },
  {
    _id: 'branch-01',
    branchCode: 'BR-Q1',
    name: 'Chi nhánh Quận 1 - Flagship Store',
    branchName: 'Chi nhánh Quận 1',
    address: '128 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    phone: '028 3925 0001',
    location: { type: 'Point', coordinates: [106.6917, 10.7725] },
    isHeadquarter: false,
    isActive: true
  },
  {
    _id: 'branch-02',
    branchCode: 'BR-TDUC',
    name: 'Chi nhánh Thủ Đức - Tech Hub',
    branchName: 'Chi nhánh Thủ Đức',
    address: '45 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh',
    phone: '028 3896 0002',
    location: { type: 'Point', coordinates: [106.7645, 10.8512] },
    isHeadquarter: false,
    isActive: true
  },
  {
    _id: 'branch-03',
    branchCode: 'BR-Q5',
    name: 'Chi nhánh Quận 5 - Chợ Lớn Center',
    branchName: 'Chi nhánh Quận 5',
    address: '382 Trần Hưng Đạo, Phường 11, Quận 5, TP. Hồ Chí Minh',
    phone: '028 3855 6868',
    location: { type: 'Point', coordinates: [106.6662, 10.7538] },
    isHeadquarter: false,
    isActive: true
  }
];

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
    location: b.location || (b.longitude !== undefined && b.latitude !== undefined ? { type: 'Point', coordinates: [Number(b.longitude), Number(b.latitude)] } : null),
    isHeadquarter: isHq,
    managerName: b.managerName || (isHq ? 'Ban Quản Trị Trụ Sở (HQ)' : 'Chưa bổ nhiệm'),
    stockCount: b.stockCount ?? 0
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
      coordinates: [106.6917, 10.7725]
    }
  };
  if (payload.isHeadquarter !== undefined) {
    clean.isHeadquarter = Boolean(payload.isHeadquarter);
  }
  if (payload.isActive !== undefined) {
    clean.isActive = Boolean(payload.isActive);
  }
  return clean;
};

export const branchService = {
  getBranches: async (params = {}) => {
    if (isMockEnabled()) {
      return fallbackBranches.map(normalizeBranch);
    }

    try {
      const response = await axiosClient.get('/branches', { params });
      const rawBranches =
        response?.data?.branches || (Array.isArray(response?.data) ? response.data : []);
      return rawBranches.map(normalizeBranch);
    } catch (err) {
      if (isDevOrTest()) {
        console.error('[branchService.getBranches] Lỗi kết nối Live Database / API /branches:', err);
      }
      return [];
    }
  },

  getAllBranches: async (params = {}) => {
    return branchService.getBranches(params);
  },

  getBranchById: async (id) => {
    if (isMockEnabled()) {
      return normalizeBranch(fallbackBranches.find((b) => b._id === id));
    }

    const response = await axiosClient.get(`/branches/${id}`);
    const rawBranch = response?.data?.branch || response?.data;
    return normalizeBranch(rawBranch);
  },

  createBranch: async (payload) => {
    const cleanPayload = buildCleanBranchPayload(payload);
    if (isMockEnabled()) {
      const newB = { _id: 'branch-' + Date.now(), ...cleanPayload };
      return normalizeBranch(newB);
    }
    const response = await axiosClient.post('/branches', cleanPayload);
    const rawBranch = response?.data?.branch || response?.data;
    return normalizeBranch(rawBranch);
  },

  updateBranch: async (id, payload) => {
    const cleanPayload = buildCleanBranchPayload(payload);
    if (isMockEnabled()) {
      return normalizeBranch({ _id: id, ...cleanPayload });
    }
    const response = await axiosClient.put(`/branches/${id}`, cleanPayload);
    const rawBranch = response?.data?.branch || response?.data;
    return normalizeBranch(rawBranch);
  },

  deleteBranch: async (id) => {
    if (isMockEnabled()) {
      return { success: true };
    }
    const response = await axiosClient.delete(`/branches/${id}`);
    return response?.data || { success: true };
  }
};

export default branchService;
