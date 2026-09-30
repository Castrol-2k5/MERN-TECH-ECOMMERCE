import axiosClient from '../../../services/axiosClient.js';

export const fallbackBranches = [
  {
    _id: 'branch-01',
    branchCode: 'BR-Q1-FLAGSHIP',
    name: 'TechOne Quận 1 (Flagship)',
    address: '128 Nguyễn Thị Minh Khai, P. Bến Thành, Q.1, TP.HCM',
    phone: '028 3930 6868',
    location: { type: 'Point', coordinates: [106.6983, 10.7719] },
    isActive: true,
  },
  {
    _id: 'branch-02',
    branchCode: 'BR-THUDUC-HUB',
    name: 'TechOne TP. Thủ Đức',
    address: '45 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức, TP.HCM',
    phone: '028 3896 6868',
    location: { type: 'Point', coordinates: [106.7645, 10.8515] },
    isActive: true,
  },
  {
    _id: 'branch-03',
    branchCode: 'BR-Q5-TECH',
    name: 'TechOne Quận 5',
    address: '382 Trần Hưng Đạo, Phường 11, Quận 5, TP.HCM',
    phone: '028 3855 6868',
    location: { type: 'Point', coordinates: [106.6632, 10.7538] },
    isActive: true,
  },
];

export const branchService = {
  getBranches: async () => {
    try {
      const response = await axiosClient.get('/branches');
      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return fallbackBranches;
    } catch {
      return fallbackBranches;
    }
  },

  getBranchById: async (id) => {
    try {
      const response = await axiosClient.get(`/branches/${id}`);
      return response?.data || fallbackBranches.find((b) => b._id === id);
    } catch {
      return fallbackBranches.find((b) => b._id === id);
    }
  },
};

export default branchService;
