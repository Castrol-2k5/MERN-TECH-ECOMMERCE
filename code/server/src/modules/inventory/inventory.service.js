import mongoose from 'mongoose';
import { BranchInventory } from './inventory.model.js';
import { Branch } from '../branches/branch.model.js';
import { Product } from '../products/product.model.js';
import { AppError } from '../../utils/appError.js';
import { USER_ROLES } from '../users/user.model.js';

export class InventoryService {
  /**
   * Get inventory list by branch
   * Applies lean() and populates product details (name, images, skus)
   */
  static async getInventoryByBranch(branchId) {
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      throw new AppError('Mã chi nhánh (branchId) không hợp lệ.', 400, 'INVALID_BRANCH_ID');
    }

    const branch = await Branch.findById(branchId).lean();
    if (!branch) {
      throw new AppError('Không tìm thấy chi nhánh yêu cầu.', 404, 'BRANCH_NOT_FOUND');
    }

    const inventories = await BranchInventory.find({ branchId })
      .populate('productId', 'name slug images brand categoryId skus isActive')
      .lean();

    return inventories;
  }

  /**
   * Get list of branches with available stock for a specific SKU (Public Storefront API)
   */
  static async getInventoryBySku(productSkuId) {
    if (!mongoose.Types.ObjectId.isValid(productSkuId)) {
      throw new AppError('Mã SKU (productSkuId) không hợp lệ.', 400, 'INVALID_SKU_ID');
    }

    const inventories = await BranchInventory.find({
      productSkuId,
      quantity: { $gt: 0 }
    })
      .populate('branchId', 'branchCode name address phone location isActive')
      .lean();

    const availableBranches = inventories
      .filter((inv) => inv.branchId && inv.branchId.isActive)
      .map((inv) => ({
        branch: inv.branchId,
        quantity: inv.quantity
      }));

    return availableBranches;
  }

  /**
   * Manual inventory adjustment (OCC & Atomic $inc operation with Zero Overselling check)
   */
  static async adjustStock({ branchId, productId, productSkuId, quantityDelta, reason }, currentUser) {
    // Cross-branch check for BRANCH_MANAGER
    if (
      currentUser &&
      currentUser.role === USER_ROLES.BRANCH_MANAGER &&
      currentUser.branchId &&
      currentUser.branchId.toString() !== branchId.toString()
    ) {
      throw new AppError('Nhân viên cố tình thao tác chéo chi nhánh.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
    }

    // Verify branch existence
    const branch = await Branch.findById(branchId).lean();
    if (!branch) {
      throw new AppError('Không tìm thấy chi nhánh yêu cầu.', 404, 'BRANCH_NOT_FOUND');
    }

    // Verify product & SKU existence
    const product = await Product.findById(productId).lean();
    if (!product) {
      throw new AppError('Không tìm thấy sản phẩm yêu cầu.', 404, 'PRODUCT_NOT_FOUND');
    }

    const targetSku = product.skus?.find((s) => s._id.toString() === productSkuId.toString());
    if (!targetSku) {
      throw new AppError('Không tìm thấy mã biến thể SKU của sản phẩm.', 400, 'SKU_NOT_FOUND');
    }

    if (quantityDelta < 0) {
      const requiredQty = Math.abs(quantityDelta);
      // Atomic reduction ensuring quantity >= requiredQty to prevent overselling
      const inventory = await BranchInventory.findOneAndUpdate(
        {
          branchId,
          productId,
          productSkuId,
          quantity: { $gte: requiredQty }
        },
        {
          $inc: { quantity: quantityDelta }
        },
        { new: true }
      ).lean();

      if (!inventory) {
        const currentRecord = await BranchInventory.findOne({ branchId, productSkuId }).lean();
        const currentQty = currentRecord ? currentRecord.quantity : 0;
        throw new AppError(
          `Số lượng tồn kho không đủ để giảm trừ. Tồn hiện tại: ${currentQty}, yêu cầu giảm: ${requiredQty}.`,
          400,
          'PRODUCT_OUT_OF_STOCK'
        );
      }

      return { inventory, reason };
    }

    // Positive delta: atomic increment, upserting inventory record if it does not yet exist
    const inventory = await BranchInventory.findOneAndUpdate(
      { branchId, productId, productSkuId },
      { $inc: { quantity: quantityDelta } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return { inventory, reason };
  }
}
