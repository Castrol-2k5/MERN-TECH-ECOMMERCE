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
   * Applies lean() and populates product details (name, images, skus, categoryId, isSerialManaged)
   * and attaches serials belonging to that branch + SKU.
   */
  static async getInventoryByBranch(branchId) {
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      throw new AppError('Mã chi nhánh (branchId) không hợp lệ.', 400, 'INVALID_BRANCH_ID');
    }

    const branch = await Branch.findById(branchId).lean();
    if (!branch) {
      throw new AppError('Không tìm thấy chi nhánh yêu cầu.', 404, 'BRANCH_NOT_FOUND');
    }

    const [inventories, branchSerials] = await Promise.all([
      BranchInventory.find({ branchId })
        .populate({
          path: 'productId',
          select: 'name slug images brand categoryId skus isActive isSerialManaged',
          populate: { path: 'categoryId', select: 'name slug' }
        })
        .lean(),
      Serial.find({ branchId })
        .select('serialNumber productSkuId status soldAt warrantyEndDate createdAt')
        .sort({ createdAt: -1 })
        .lean()
    ]);

    const serialsBySkuMap = new Map();
    for (const s of branchSerials) {
      const key = s.productSkuId?.toString();
      if (!key) continue;
      if (!serialsBySkuMap.has(key)) {
        serialsBySkuMap.set(key, []);
      }
      serialsBySkuMap.get(key).push(s);
    }

    return inventories.map((inv) => ({
      ...inv,
      serials: serialsBySkuMap.get(inv.productSkuId?.toString()) || []
    }));
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
      .populate('branchId', 'branchCode name address phone location isActive isHeadquarter')
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
  /**
   * Tạo phiếu điều chuyển kho liên chi nhánh (Stock Transfer)
   * Hỗ trợ cả Multi-SKU Manifest (nhiều sản phẩm một chuyến xe) lẫn Single-SKU
   */
  static async createTransfer(payload, currentUser) {
    const {
      sourceBranchId,
      destinationBranchId,
      productId,
      productSkuId,
      quantity,
      serialNumbers = [],
      items = [],
      carrierInfo = {},
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

    const [sourceBranch, destinationBranch] = await Promise.all([
      Branch.findById(sourceBranchId).lean(),
      Branch.findById(destinationBranchId).lean()
    ]);

    if (!sourceBranch || !sourceBranch.isActive) {
      throw new AppError('Chi nhánh xuất không tồn tại hoặc đã tạm ngưng hoạt động.', 404, 'SOURCE_BRANCH_NOT_FOUND');
    }
    if (!destinationBranch || !destinationBranch.isActive) {
      throw new AppError('Chi nhánh nhận không tồn tại hoặc đã tạm ngưng hoạt động.', 404, 'DESTINATION_BRANCH_NOT_FOUND');
    }

    // Chuẩn hóa danh sách mặt hàng (Multi-SKU items)
    let rawItems = [];
    if (Array.isArray(items) && items.length > 0) {
      rawItems = items;
    } else if (productId && productSkuId) {
      rawItems = [{
        productId,
        productSkuId,
        quantity: Number(quantity) || 1,
        serialNumbers: Array.isArray(serialNumbers) ? serialNumbers : []
      }];
    } else {
      throw new AppError('Vui lòng chọn ít nhất một mặt hàng để điều chuyển kho.', 400, 'NO_ITEMS_TO_TRANSFER');
    }

    const enrichedItems = [];
    const allSerialsToTransit = [];
    const deductedRecords = [];

    try {
      for (const item of rawItems) {
        const product = await Product.findById(item.productId).lean();
        if (!product || !product.isActive) {
          throw new AppError(`Sản phẩm không tồn tại hoặc đã ngưng kinh doanh.`, 404, 'PRODUCT_NOT_FOUND');
        }

        const skuObj = product.skus?.find((s) => s._id.toString() === item.productSkuId.toString());
        if (!skuObj || !skuObj.isActive) {
          throw new AppError(`Mã biến thể SKU của '${product.name}' không hợp lệ.`, 400, 'SKU_NOT_FOUND');
        }

        const itemQty = Number(item.quantity) || 1;
        const itemSerials = Array.isArray(item.serialNumbers) ? item.serialNumbers : [];

        if (product.isSerialManaged) {
          if (itemSerials.length !== itemQty) {
            throw new AppError(
              `Sản phẩm '${product.name}' quản lý Serial yêu cầu chọn đúng ${itemQty} mã Serial.`,
              400,
              'SERIAL_COUNT_MISMATCH'
            );
          }

          const foundSerials = await Serial.find({
            serialNumber: { $in: itemSerials },
            branchId: sourceBranchId,
            productSkuId: item.productSkuId,
            status: SERIAL_STATUS.IN_STOCK
          });

          if (foundSerials.length !== itemSerials.length) {
            throw new AppError(
              `Một số mã Serial của '${product.name}' không tồn tại hoặc không ở trạng thái sẵn sàng (IN_STOCK) tại kho xuất.`,
              400,
              'INVALID_SERIALS'
            );
          }

          allSerialsToTransit.push(...itemSerials);
        }

        // Trừ tồn kho tại kho xuất
        const sourceInv = await BranchInventory.findOneAndUpdate(
          {
            branchId: sourceBranchId,
            productSkuId: item.productSkuId,
            quantity: { $gte: itemQty }
          },
          {
            $inc: { quantity: -itemQty }
          },
          { new: true }
        );

        if (!sourceInv) {
          throw new AppError(
            `Số lượng tồn kho của '${product.name}' tại kho xuất không đủ để điều chuyển.`,
            400,
            'INSUFFICIENT_STOCK'
          );
        }

        deductedRecords.push({
          branchId: sourceBranchId,
          productSkuId: item.productSkuId,
          quantity: itemQty
        });

        enrichedItems.push({
          productId: product._id,
          productSkuId: skuObj._id,
          sku: skuObj.sku,
          productName: product.name,
          quantity: itemQty,
          serialNumbers: itemSerials,
          receivedQuantity: 0,
          receivedSerials: []
        });
      }

      // Khóa toàn bộ Serial sang TRANSIT
      if (allSerialsToTransit.length > 0) {
        await Serial.updateMany(
          { serialNumber: { $in: allSerialsToTransit } },
          { $set: { status: SERIAL_STATUS.TRANSIT } }
        );
      }
    } catch (err) {
      // Rollback nếu có lỗi ở bất kỳ mặt hàng nào
      for (const d of deductedRecords) {
        await BranchInventory.updateOne(
          { branchId: d.branchId, productSkuId: d.productSkuId },
          { $inc: { quantity: d.quantity } }
        );
      }
      throw err;
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const transferCode = `TRF-${dateStr}-${randomSuffix}`;

    const totalQty = enrichedItems.reduce((s, it) => s + it.quantity, 0);
    const firstItem = enrichedItems[0];

    const transfer = await StockTransfer.create({
      transferCode,
      sourceBranchId,
      destinationBranchId,
      items: enrichedItems,
      carrierInfo: {
        carrierName: carrierInfo.carrierName || 'Vận chuyển nội bộ TechOne',
        driverName: carrierInfo.driverName || '',
        driverPhone: carrierInfo.driverPhone || '',
        trackingNumber: carrierInfo.trackingNumber || ''
      },
      // Trường tương thích ngược
      productId: firstItem.productId,
      productSkuId: firstItem.productSkuId,
      sku: firstItem.sku,
      productName: firstItem.productName,
      quantity: totalQty,
      serialNumbers: allSerialsToTransit,
      status: TRANSFER_STATUS.IN_TRANSIT,
      createdById: currentUser.id,
      notes
    });

    return transfer;
  }

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
    } else if (query.branchId && query.branchId !== 'ALL') {
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
      .populate('sourceBranchId', 'name branchCode address isHeadquarter')
      .populate('destinationBranchId', 'name branchCode address isHeadquarter')
      .populate('createdById', 'fullName email')
      .populate('receivedById', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    return transfers;
  }

  /**
   * Tiếp nhận điều chuyển kho tại chi nhánh đích
   */
  /**
   * Xác nhận nhập kho tại chi nhánh đích (Hỗ trợ quét kiểm đếm Barcode và biên bản sai lệch)
   */
  static async receiveTransfer(transferId, payload = {}, currentUser) {
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

    const scannedSerials = Array.isArray(payload.scannedSerials)
      ? payload.scannedSerials.map((s) => String(s).trim().toUpperCase()).filter(Boolean)
      : [];
    const discrepancyReport = payload.discrepancyReport || '';

    // Xử lý các items trong phiếu
    const itemsList = Array.isArray(transfer.items) && transfer.items.length > 0
      ? transfer.items
      : [{
          productId: transfer.productId,
          productSkuId: transfer.productSkuId,
          sku: transfer.sku,
          productName: transfer.productName,
          quantity: transfer.quantity,
          serialNumbers: transfer.serialNumbers || []
        }];

    let hasAnyDiscrepancy = Boolean(discrepancyReport);
    const validSerialsToImport = [];

    for (const item of itemsList) {
      if (item.serialNumbers && item.serialNumbers.length > 0) {
        // Lấy danh sách serials thực tế được quét khớp
        const matched = item.serialNumbers.filter((s) => scannedSerials.includes(s));
        // Nếu không gửi scannedSerials (nhận nhanh toàn bộ) thì mặc định nhận đủ
        const effectiveReceived = scannedSerials.length > 0 ? matched : item.serialNumbers;

        item.receivedQuantity = effectiveReceived.length;
        item.receivedSerials = effectiveReceived;

        if (effectiveReceived.length < item.quantity) {
          hasAnyDiscrepancy = true;
          item.discrepancyCount = item.quantity - effectiveReceived.length;
          item.discrepancyReason = discrepancyReport || 'Thiếu serial khi quét kiểm đếm';
        }

        validSerialsToImport.push(...effectiveReceived);

        // Tăng tồn kho thực nhận vào chi nhánh đích
        if (effectiveReceived.length > 0) {
          await BranchInventory.findOneAndUpdate(
            {
              branchId: transfer.destinationBranchId,
              productId: item.productId,
              productSkuId: item.productSkuId
            },
            {
              $inc: { quantity: effectiveReceived.length }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      } else {
        // Hàng không quản lý serial: Nhận theo số lượng
        item.receivedQuantity = item.quantity;
        await BranchInventory.findOneAndUpdate(
          {
            branchId: transfer.destinationBranchId,
            productId: item.productId,
            productSkuId: item.productSkuId
          },
          {
            $inc: { quantity: item.quantity }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }

    // Cập nhật trạng thái Serial đã nhận thành IN_STOCK tại chi nhánh đích
    if (validSerialsToImport.length > 0) {
      await Serial.updateMany(
        { serialNumber: { $in: validSerialsToImport } },
        {
          $set: {
            status: SERIAL_STATUS.IN_STOCK,
            branchId: transfer.destinationBranchId
          }
        }
      );
    }

    transfer.items = itemsList;
    transfer.hasDiscrepancy = hasAnyDiscrepancy;
    transfer.discrepancyReport = discrepancyReport;
    transfer.status = TRANSFER_STATUS.COMPLETED;
    transfer.receivedById = currentUser.id;
    transfer.receivedAt = new Date();
    await transfer.save();

    return transfer;
  }
}