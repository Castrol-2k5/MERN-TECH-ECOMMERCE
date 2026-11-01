import { Branch } from './branch.model.js';
import { User, USER_ROLES } from '../users/user.model.js';
import { BranchInventory } from '../inventory/inventory.model.js';
import { AppError } from '../../utils/appError.js';

export class BranchService {
  /**
   * Create a new physical branch
   */
  static async createBranch(branchData) {
    const normalizedCode = branchData.branchCode.toUpperCase();
    const existingBranch = await Branch.findOne({
      branchCode: normalizedCode
    });

    if (existingBranch) {
      throw new AppError(
        `Mã chi nhánh '${branchData.branchCode}' đã tồn tại trong hệ thống.`,
        400,
        'BRANCH_EXISTS'
      );
    }

    const branch = await Branch.create({
      ...branchData,
      branchCode: normalizedCode,
      isHeadquarter: Boolean(branchData.isHeadquarter || normalizedCode === 'BR-HQ')
    });

    return branch;
  }

  /**
   * Get branches (supports includeInactive=true for Admin management)
   */
  static async getAllBranches(filter = {}) {
    const query = {};
    if (filter.includeInactive !== 'true' && filter.includeInactive !== true) {
      query.isActive = true;
    }

    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { branchCode: { $regex: filter.search, $options: 'i' } },
        { address: { $regex: filter.search, $options: 'i' } }
      ];
    }

    const branches = await Branch.find(query)
      .sort({ isHeadquarter: -1, createdAt: 1 })
      .lean();

    if (branches.length === 0) {
      return [];
    }

    const branchIds = branches.map((b) => b._id);

    const [managers, stockAgg] = await Promise.all([
      User.find({
        branchId: { $in: branchIds },
        role: USER_ROLES.BRANCH_MANAGER,
        isActive: true
      })
        .select('fullName branchId')
        .lean(),
      BranchInventory.aggregate([
        { $match: { branchId: { $in: branchIds } } },
        { $group: { _id: '$branchId', totalStock: { $sum: '$quantity' } } }
      ])
    ]);

    const managerMap = new Map();
    for (const m of managers) {
      if (m.branchId) {
        managerMap.set(m.branchId.toString(), m.fullName);
      }
    }

    const stockMap = new Map();
    for (const s of stockAgg) {
      if (s._id) {
        stockMap.set(s._id.toString(), s.totalStock || 0);
      }
    }

    return branches.map((b) => {
      const idStr = b._id.toString();
      const isHq = Boolean(b.isHeadquarter || b.branchCode === 'BR-HQ');
      return {
        ...b,
        isHeadquarter: isHq,
        managerName:
          managerMap.get(idStr) || (isHq ? 'Ban Quản Trị Trụ Sở (HQ)' : 'Chưa bổ nhiệm'),
        stockCount: stockMap.get(idStr) ?? 0
      };
    });
  }

  /**
   * Get a single active branch by ID
   */
  static async getBranchById(branchId) {
    const branch = await Branch.findOne({ _id: branchId, isActive: true }).lean();

    if (!branch) {
      throw new AppError('Không tìm thấy chi nhánh yêu cầu.', 404, 'BRANCH_NOT_FOUND');
    }

    return branch;
  }

  /**
   * Update an existing branch (allows re-activating an inactive branch)
   */
  static async updateBranch(branchId, updateData) {
    if (updateData.branchCode) {
      const existingBranch = await Branch.findOne({
        branchCode: updateData.branchCode.toUpperCase(),
        _id: { $ne: branchId }
      });

      if (existingBranch) {
        throw new AppError(
          `Mã chi nhánh '${updateData.branchCode}' đã được sử dụng bởi chi nhánh khác.`,
          400,
          'BRANCH_EXISTS'
        );
      }
      updateData.branchCode = updateData.branchCode.toUpperCase();
    }

    const branch = await Branch.findOneAndUpdate(
      { _id: branchId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!branch) {
      throw new AppError('Không tìm thấy chi nhánh cần cập nhật.', 404, 'BRANCH_NOT_FOUND');
    }

    return branch;
  }

  /**
   * Soft delete a branch (isActive = false)
   */
  static async deleteBranch(branchId) {
    const branch = await Branch.findOneAndUpdate(
      { _id: branchId, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!branch) {
      throw new AppError('Không tìm thấy chi nhánh cần xóa.', 404, 'BRANCH_NOT_FOUND');
    }

    return branch;
  }

  /**
   * Find nearest branches using MongoDB 2dsphere $near geospatial operator
   */
  static async getNearbyBranches({ lng, lat, distance = 10000 }) {
    const branches = await Branch.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: distance
        }
      }
    }).lean();

    return branches;
  }
}
