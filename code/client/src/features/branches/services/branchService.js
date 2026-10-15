import axiosClient from '../../../services/axiosClient.js';
import { isMockEnabled, isDevOrTest } from '../../../config/dataMode.js';

export const fallbackBranches = [
  {
    _id: 'branch-01',
    branchCode: 'BR-Q1-FLAGSHIP',
    name: 'TechOne Quận 1 (Flagship)',
    branchName: 'TechOne Q1 Flagship',
    address: '128 Nguyễn Thị Minh Khai, P. Bến Thành, Q.1, TP.HCM',
    phone: '028 3930 6868',
    location: { type: 'Point', coordinates: [106.6983, 10.7719] },
    isActive: true,
  },
  {
    _id: 'branch-02',
    branchCode: 'BR-THUDUC-HUB',
    name: 'TechOne TP. Thủ Đức',
    branchName: 'TechOne Thủ Đức Hub',
    address: '45 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức, TP.HCM',
    phone: '028 3896 6868',
    location: { type: 'Point', coordinates: [106.7645, 10.8515] },
    isActive: true,
  },
  {
    _id: 'branch-03',
    branchCode: 'BR-Q5-TECH',
    name: 'TechOne Quận 5',
    branchName: 'TechOne Quận 5',
    address: '382 Trần Hưng Đạo, Phường 11, Quận 5, TP.HCM',
    phone: '028 3855 6868',
    location: { type: 'Point', coordinates: [106.6632, 10.7538] },
    isActive: true,
  },
];

const normalizeBranch = (b) => {
  if (!b) return null;
  return {
    ...b,
    _id: b._id || b.id,
    branchName: b.branchName || b.name,
    name: b.name || b.branchName,
    branchCode: b.branchCode || b.code || '',
    address: b.address || '',
    phone: b.phone || '',
  };
};

export const branchService = {
  getBranches: async () => {
    if (isMockEnabled()) {
      return fallbackBranches;
    }

    try {
      const response = await axiosClient.get('/branches');
      const rawBranches =
        response?.data?.branches || (Array.isArray(response?.data) ? response.data : []);
      return rawBranches.length > 0 ? rawBranches.map(normalizeBranch) : fallbackBranches;
    } catch (err) {
      if (isDevOrTest()) {
        console.error('[branchService.getBranches] Lỗi kết nối Live Database / API /branches:', err);
      }
      return fallbackBranches;
    }
  },

  getBranchById: async (id) => {
    if (isMockEnabled()) {
      return fallbackBranches.find((b) => b._id === id);
    }

    try {
      const response = await axiosClient.get(`/branches/${id}`);
      const rawBranch = response?.data?.branch || response?.data;
      return normalizeBranch(rawBranch) || fallbackBranches.find((b) => b._id === id);
    } catch {
      return fallbackBranches.find((b) => b._id === id);
    }
  },

  createBranch: async (payload) => {
    if (isMockEnabled()) {
      const newB = { _id: 'branch-' + Date.now(), ...payload };
      return normalizeBranch(newB);
    }
    const response = await axiosClient.post('/branches', payload);
    const rawBranch = response?.data?.branch || response?.data;
    return normalizeBranch(rawBranch);
  },

  updateBranch: async (id, payload) => {
    if (isMockEnabled()) {
      return normalizeBranch({ _id: id, ...payload });
    }
    const response = await axiosClient.put(`/branches/${id}`, payload);
    const rawBranch = response?.data?.branch || response?.data;
    return normalizeBranch(rawBranch);
  },

  deleteBranch: async (id) => {
    if (isMockEnabled()) {
      return { success: true };
    }
    const response = await axiosClient.delete(`/branches/${id}`);
    return response?.data || { success: true };
  },
};

export default branchService;

