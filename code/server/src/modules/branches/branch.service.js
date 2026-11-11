import { Branch } from './branch.model.js';
import { User, USER_ROLES } from '../users/user.model.js';
import { BranchInventory } from '../inventory/inventory.model.js';
import { Product } from '../products/product.model.js';
import { AuditLogService } from '../audit/auditLog.service.js';
import { AUDIT_ACTIONS } from '../audit/auditLog.model.js';
import { AppError } from '../../utils/appError.js';

export class BranchService {
  /**
   * Create a new physical branch (with optional inventory catalog bootstrap)
   */
  static async createBranch(rawBranchData, currentUser = null) {
    const {
      bootstrapInventory = false,
      bootstrapFromBranchId = null,
      ...branchData
    } = rawBranchData || {};

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
      isHeadquarter: Boolean(branchData.isHeadquarter || normalizedCode === 'BR-HQ'),
      isWarehouse: Boolean(branchData.isWarehouse || branchData.isHeadquarter || normalizedCode === 'BR-HQ')
    });

    let bootstrappedCount = 0;
    if (bootstrapInventory) {
      bootstrappedCount = await this.bootstrapBranchInventory(branch._id, bootstrapFromBranchId);
    }

    if (currentUser) {
      AuditLogService.record({
        actor: currentUser,
        action: AUDIT_ACTIONS.BRANCH_CREATE,
        target: {
          model: 'Branch',
          entityId: branch._id,
          code: branch.branchCode,
          name: branch.name
        },
        changes: {
          after: {
            region: branch.region,
            monthlyRevenueTarget: branch.monthlyRevenueTarget,
            isHeadquarter: branch.isHeadquarter,
            isWarehouse: branch.isWarehouse,
            bootstrappedCount
          }
        },
        context: {
          notes: `Khởi tạo chi nhánh mới ${branch.branchCode} (${bootstrappedCount} SKU bootstrap)`
        }
      });
    }

    const plain = branch.toObject ? branch.toObject() : branch;
    return { ...plain, bootstrappedCount };
  }

  /**
   * Auto-bootstrap danh mục BranchInventory mặc định (quantity = 0) cho chi nhánh mới mở
   */
  static async bootstrapBranchInventory(targetBranchId, templateBranchId = null) {
    let seedDocs = [];
    if (templateBranchId) {
      const templateRows = await BranchInventory.find({ branchId: templateBranchId })
        .select('productId productSkuId minStock maxStock shelfLocation')
        .lean();
      if (templateRows.length > 0) {
        seedDocs = templateRows.map((row) => ({
          branchId: targetBranchId,
          productId: row.productId,
          productSkuId: row.productSkuId,
          quantity: 0,
          minStock: Number(row.minStock || 0),
          maxStock: Number(row.maxStock || 0),
          shelfLocation: row.shelfLocation || ''
        }));
      }
    }

    if (seedDocs.length === 0) {
      const activeProducts = await Product.find({ isActive: true }).select('_id skus').lean();
      for (const product of activeProducts) {
        for (const sku of product.skus || []) {
          if (sku?.isActive === false) continue;
          seedDocs.push({
            branchId: targetBranchId,
            productId: product._id,
            productSkuId: sku._id,
            quantity: 0,
            minStock: 0,
            maxStock: 0,
            shelfLocation: ''
          });
        }
      }
    }

    if (seedDocs.length === 0) return 0;
    const inserted = await BranchInventory.insertMany(seedDocs, { ordered: false }).catch((err) => {
      return err.insertedDocs || [];
    });
    return Array.isArray(inserted) ? inserted.length : seedDocs.length;
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
  static async updateBranch(branchId, rawUpdateData, currentUser = null) {
    const {
      bootstrapInventory: _bootstrapInventory,
      bootstrapFromBranchId: _bootstrapFromBranchId,
      ...updateData
    } = rawUpdateData || {};

    const beforeBranch = await Branch.findById(branchId).lean();
    if (!beforeBranch) {
      throw new AppError('Không tìm thấy chi nhánh cần cập nhật.', 404, 'BRANCH_NOT_FOUND');
    }

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

    if (currentUser) {
      AuditLogService.record({
        actor: currentUser,
        action: AUDIT_ACTIONS.BRANCH_UPDATE,
        target: {
          model: 'Branch',
          entityId: branch._id,
          code: branch.branchCode,
          name: branch.name
        },
        changes: {
          before: {
            region: beforeBranch.region,
            monthlyRevenueTarget: beforeBranch.monthlyRevenueTarget,
            isActive: beforeBranch.isActive,
            isWarehouse: beforeBranch.isWarehouse
          },
          after: {
            region: branch.region,
            monthlyRevenueTarget: branch.monthlyRevenueTarget,
            isActive: branch.isActive,
            isWarehouse: branch.isWarehouse
          }
        }
      });
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
