import { Branch } from './branch.model.js';
import { AppError } from '../../utils/appError.js';

export class BranchService {
  /**
   * Create a new physical branch
   */
  static async createBranch(branchData) {
    const existingBranch = await Branch.findOne({
      branchCode: branchData.branchCode.toUpperCase()
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
      branchCode: branchData.branchCode.toUpperCase()
    });

    return branch;
  }

  /**
   * Get all active branches (read-only, lean)
   */
  static async getAllBranches(filter = {}) {
    const query = { isActive: true };

    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { branchCode: { $regex: filter.search, $options: 'i' } },
        { address: { $regex: filter.search, $options: 'i' } }
      ];
    }

    const branches = await Branch.find(query).sort({ createdAt: -1 }).lean();
    return branches;
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
   * Update an existing branch
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
      { _id: branchId, isActive: true },
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
