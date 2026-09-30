import { Serial, SERIAL_STATUS } from './serial.model.js';
import { BranchInventory } from '../inventory/inventory.model.js';
import { Branch } from '../branches/branch.model.js';
import { Product } from '../products/product.model.js';
import { AppError } from '../../utils/appError.js';
import { USER_ROLES } from '../users/user.model.js';

export class SerialService {
  /**
   * Import a batch of new Serial/IMEI records into inventory
   * Atomically creates Serial documents (IN_STOCK) and increments quantity in branch_inventories
   */
  static async importSerials({ branchId, productId, productSkuId, serials }, currentUser) {
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

    const cleanSerials = serials.map((s) => s.trim().toUpperCase());

    // Check for existing serials in DB
    const existing = await Serial.find({ serialNumber: { $in: cleanSerials } })
      .select('serialNumber')
      .lean();

    if (existing.length > 0) {
      const duplicateCodes = existing.map((s) => s.serialNumber);
      throw new AppError(
        `Mã Serial/IMEI đã tồn tại trong hệ thống: ${duplicateCodes.join(', ')}`,
        400,
        'DUPLICATE_SERIAL'
      );
    }

    // Create Serial documents
    const serialDocs = cleanSerials.map((sn) => ({
      serialNumber: sn,
      productId,
      productSkuId,
      branchId,
      status: SERIAL_STATUS.IN_STOCK
    }));

    const createdSerials = await Serial.insertMany(serialDocs);

    // Atomically increment inventory stock
    const inventory = await BranchInventory.findOneAndUpdate(
      { branchId, productId, productSkuId },
      { $inc: { quantity: cleanSerials.length } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return {
      importedCount: createdSerials.length,
      serials: createdSerials,
      inventory
    };
  }

  /**
   * Barcode/QR scan at POS counter
   * Verifies existence, IN_STOCK state, and branch assignment
   */
  static async scanSerial(serialNumber, currentUser) {
    if (!serialNumber || !serialNumber.trim()) {
      throw new AppError('Mã Serial/IMEI không được để trống.', 400, 'VALIDATION_ERROR');
    }

    const cleanSerial = serialNumber.trim().toUpperCase();

    const serial = await Serial.findOne({ serialNumber: cleanSerial })
      .populate('productId', 'name slug images brand categoryId skus isActive')
      .lean();

    // 1. Does serial exist?
    if (!serial) {
      throw new AppError('Không tìm thấy mã Serial/IMEI trong hệ thống.', 404, 'SERIAL_NOT_FOUND');
    }

    // 2. Is status IN_STOCK?
    if (serial.status !== SERIAL_STATUS.IN_STOCK) {
      let statusText = serial.status;
      if (serial.status === SERIAL_STATUS.SOLD) statusText = 'Đã bán';
      else if (serial.status === SERIAL_STATUS.RESERVED) statusText = 'Đang giữ chỗ';
      else if (serial.status === SERIAL_STATUS.WARRANTY) statusText = 'Đang bảo hành';
      else if (serial.status === SERIAL_STATUS.TRANSIT) statusText = 'Đang trung chuyển';

      throw new AppError(
        `Mã Serial/IMEI không ở trạng thái khả dụng để bán (Trạng thái hiện tại: ${statusText}).`,
        400,
        'INVALID_SERIAL_STATUS'
      );
    }

    // 3. Does serial belong to the POS personnel's branch?
    if (currentUser && currentUser.role !== USER_ROLES.SUPER_ADMIN) {
      if (!currentUser.branchId || serial.branchId.toString() !== currentUser.branchId.toString()) {
        throw new AppError(
          'Thiết bị thuộc chi nhánh khác, không được phép thao tác tại quầy này.',
          403,
          'CROSS_BRANCH_ACCESS_DENIED'
        );
      }
    }

    // Extract matching SKU details
    const sku = serial.productId?.skus?.find(
      (s) => s._id.toString() === serial.productSkuId.toString()
    );

    return {
      serialNumber: serial.serialNumber,
      status: serial.status,
      branchId: serial.branchId,
      product: {
        _id: serial.productId?._id,
        name: serial.productId?.name,
        slug: serial.productId?.slug,
        images: serial.productId?.images,
        brand: serial.productId?.brand
      },
      sku: sku
        ? {
            _id: sku._id,
            sku: sku.sku,
            price: sku.price,
            salePrice: sku.salePrice,
            images: sku.images,
            optionValues: sku.optionValues
          }
        : { _id: serial.productSkuId }
    };
  }

  /**
   * Public e-Warranty verification
   * Returns product, SKU, warranty date, and active/expired status
   */
  static async verifySerial(serialNumber) {
    if (!serialNumber || !serialNumber.trim()) {
      throw new AppError('Mã Serial/IMEI không được để trống.', 400, 'VALIDATION_ERROR');
    }

    const cleanSerial = serialNumber.trim().toUpperCase();

    const serial = await Serial.findOne({ serialNumber: cleanSerial })
      .populate('productId', 'name slug images brand skus')
      .lean();

    if (!serial) {
      throw new AppError('Không tìm thấy mã Serial/IMEI trong hệ thống.', 404, 'SERIAL_NOT_FOUND');
    }

    const sku = serial.productId?.skus?.find(
      (s) => s._id.toString() === serial.productSkuId.toString()
    );

    const now = new Date();
    const isExpired = serial.warrantyEndDate ? new Date(serial.warrantyEndDate) < now : null;

    return {
      serialNumber: serial.serialNumber,
      productName: serial.productId?.name || '',
      sku: sku ? sku.sku : '',
      status: serial.status,
      soldAt: serial.soldAt || null,
      warrantyEndDate: serial.warrantyEndDate || null,
      isExpired
    };
  }
}
