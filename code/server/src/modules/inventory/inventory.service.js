import crypto from 'crypto';
import mongoose from 'mongoose';
import { BranchInventory } from './inventory.model.js';
import { StockTransfer, TRANSFER_STATUS } from './stockTransfer.model.js';
import { Serial, SERIAL_STATUS } from '../serials/serial.model.js';
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

  /**
   * Tạo phiếu điều chuyển kho liên chi nhánh (Stock Transfer)
   */
  static async createTransfer(payload, currentUser) {
    const {
      sourceBranchId,
      destinationBranchId,
      productId,
      productSkuId,
      quantity,
      serialNumbers = [],
      notes = ''
    } = payload;

    if (
      currentUser &&
      currentUser.role === USER_ROLES.BRANCH_MANAGER &&
      currentUser.branchId &&
      currentUser.branchId.toString() !== sourceBranchId.toString()
    ) {
      throw new AppError(
        'Quản lý chi nhánh chỉ được tạo phiếu chuyển xuất phát từ chi nhánh của mình.',
        403,
        'CROSS_BRANCH_ACCESS_DENIED'
      );
    }

    const [sourceBranch, destinationBranch, product] = await Promise.all([
      Branch.findById(sourceBranchId).lean(),
      Branch.findById(destinationBranchId).lean(),
      Product.findById(productId).lean()
    ]);

    if (!sourceBranch || !sourceBranch.isActive) {
      throw new AppError('Chi nhánh xuất không tồn tại hoặc đã tạm ngưng hoạt động.', 404, 'SOURCE_BRANCH_NOT_FOUND');
    }
    if (!destinationBranch || !destinationBranch.isActive) {
      throw new AppError('Chi nhánh nhận không tồn tại hoặc đã tạm ngưng hoạt động.', 404, 'DESTINATION_BRANCH_NOT_FOUND');
    }
    if (!product || !product.isActive) {
      throw new AppError('Sản phẩm không tồn tại hoặc đã ngưng kinh doanh.', 404, 'PRODUCT_NOT_FOUND');
    }

    const skuObj = product.skus?.find((s) => s._id.toString() === productSkuId.toString());
    if (!skuObj || !skuObj.isActive) {
      throw new AppError('Mã biến thể SKU không hợp lệ.', 400, 'SKU_NOT_FOUND');
    }

    if (product.isSerialManaged) {
      if (!Array.isArray(serialNumbers) || serialNumbers.length !== quantity) {
        throw new AppError(
          `Sản phẩm quản lý Serial yêu cầu chọn đúng ${quantity} mã Serial tương ứng.`,
          400,
          'SERIAL_COUNT_MISMATCH'
        );
      }

      const foundSerials = await Serial.find({
        serialNumber: { $in: serialNumbers },
        branchId: sourceBranchId,
        productSkuId,
        status: SERIAL_STATUS.IN_STOCK
      });

      if (foundSerials.length !== serialNumbers.length) {
        throw new AppError(
          'Một số mã Serial không tồn tại hoặc không ở trạng thái sẵn sàng (IN_STOCK) tại chi nhánh xuất.',
          400,
          'INVALID_SERIALS'
        );
      }
    }

    const sourceInv = await BranchInventory.findOneAndUpdate(
      {
        branchId: sourceBranchId,
        productSkuId,
        quantity: { $gte: quantity }
      },
      {
        $inc: { quantity: -quantity }
      },
      { new: true }
    );

    if (!sourceInv) {
      throw new AppError('Số lượng tồn kho tại chi nhánh xuất không đủ để điều chuyển.', 400, 'INSUFFICIENT_STOCK');
    }

    if (product.isSerialManaged && serialNumbers.length > 0) {
      await Serial.updateMany(
        { serialNumber: { $in: serialNumbers } },
        { $set: { status: SERIAL_STATUS.TRANSIT } }
      );
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const transferCode = `TRF-${dateStr}-${randomSuffix}`;

    const transfer = await StockTransfer.create({
      transferCode,
      sourceBranchId,
      destinationBranchId,
      productId,
      productSkuId,
      sku: skuObj.sku,
      productName: product.name,
      quantity,
      serialNumbers,
      status: TRANSFER_STATUS.IN_TRANSIT,
      createdById: currentUser.id,
      notes
    });

    return transfer;
  }

  /**
   * Lấy danh sách phiếu điều chuyển kho theo chi nhánh (Inbound / Outbound)
   */
  static async getTransfers(query = {}, currentUser) {
    const filter = {};

    if (currentUser?.role === USER_ROLES.BRANCH_MANAGER || currentUser?.role === USER_ROLES.STAFF) {
      const userBranchId = currentUser.branchId;
      if (query.type === 'inbound') {
        filter.destinationBranchId = userBranchId;
      } else if (query.type === 'outbound') {
        filter.sourceBranchId = userBranchId;
      } else {
        filter.$or = [{ sourceBranchId: userBranchId }, { destinationBranchId: userBranchId }];
      }
    } else if (query.branchId) {
      if (query.type === 'inbound') {
        filter.destinationBranchId = query.branchId;
      } else if (query.type === 'outbound') {
        filter.sourceBranchId = query.branchId;
      } else {
        filter.$or = [{ sourceBranchId: query.branchId }, { destinationBranchId: query.branchId }];
      }
    }

    if (query.status) {
      filter.status = query.status;
    }

    const transfers = await StockTransfer.find(filter)
      .populate('sourceBranchId', 'name branchCode address')
      .populate('destinationBranchId', 'name branchCode address')
      .populate('createdById', 'fullName email')
      .populate('receivedById', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    return transfers;
  }

  /**
   * Tiếp nhận điều chuyển kho tại chi nhánh đích
   */
  static async receiveTransfer(transferId, payload, currentUser) {
    if (!mongoose.Types.ObjectId.isValid(transferId)) {
      throw new AppError('Mã phiếu điều chuyển không hợp lệ.', 400, 'INVALID_TRANSFER_ID');
    }

    const transfer = await StockTransfer.findById(transferId);
    if (!transfer) {
      throw new AppError('Không tìm thấy phiếu điều chuyển kho.', 404, 'TRANSFER_NOT_FOUND');
    }

    if (transfer.status !== TRANSFER_STATUS.IN_TRANSIT) {
      throw new AppError(
        `Phiếu điều chuyển đã ở trạng thái ${transfer.status}, không thể nhận hàng.`,
        400,
        'INVALID_TRANSFER_STATUS'
      );
    }

    if (
      currentUser &&
      currentUser.role !== USER_ROLES.SUPER_ADMIN &&
      currentUser.branchId &&
      currentUser.branchId.toString() !== transfer.destinationBranchId.toString()
    ) {
      throw new AppError(
        'Chỉ nhân sự tại chi nhánh đích mới có quyền xác nhận nhập kho.',
        403,
        'CROSS_BRANCH_ACCESS_DENIED'
      );
    }

    if (transfer.serialNumbers && transfer.serialNumbers.length > 0) {
      const scannedSerials = payload.scannedSerials || [];
      if (scannedSerials.length > 0) {
        const isMatched = transfer.serialNumbers.every((s) => scannedSerials.includes(s));
        if (!isMatched) {
          throw new AppError(
            'Danh sách Serial quét đối chiếu không khớp với phiếu điều chuyển.',
            400,
            'SERIAL_VERIFICATION_FAILED'
          );
        }
      }

      await Serial.updateMany(
        { serialNumber: { $in: transfer.serialNumbers } },
        {
          $set: {
            status: SERIAL_STATUS.IN_STOCK,
            branchId: transfer.destinationBranchId
          }
        }
      );
    }

    await BranchInventory.findOneAndUpdate(
      {
        branchId: transfer.destinationBranchId,
        productId: transfer.productId,
        productSkuId: transfer.productSkuId
      },
      {
        $inc: { quantity: transfer.quantity }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    transfer.status = TRANSFER_STATUS.COMPLETED;
    transfer.receivedById = currentUser.id;
    transfer.receivedAt = new Date();
    await transfer.save();

    return transfer;
  }
}
