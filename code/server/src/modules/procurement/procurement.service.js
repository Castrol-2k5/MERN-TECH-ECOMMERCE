import crypto from 'crypto';
import mongoose from 'mongoose';
import { Vendor } from './vendor.model.js';
import { PurchaseOrder, PO_STATUS, PO_PAYMENT_STATUS } from './purchaseOrder.model.js';
import { Branch } from '../branches/branch.model.js';
import { Product } from '../products/product.model.js';
import { Serial, SERIAL_STATUS } from '../serials/serial.model.js';
import { BranchInventory } from '../inventory/inventory.model.js';
import { AuditLogService } from '../audit/auditLog.service.js';
import { AUDIT_ACTIONS } from '../audit/auditLog.model.js';
import { AppError } from '../../utils/appError.js';

export class ProcurementService {
  static generatePoCode() {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `PO-${dateStr}-${rand}`;
  }

  static async resolveWarehouseBranch(warehouseBranchId = null) {
    if (warehouseBranchId) {
      const branch = await Branch.findOne({ _id: warehouseBranchId, isActive: true }).lean();
      if (!branch) {
        throw new AppError('Không tìm thấy kho nhận hàng.', 404, 'BRANCH_NOT_FOUND');
      }
      return branch;
    }

    const hqBranch = await Branch.findOne({
      isActive: true,
      $or: [{ isHeadquarter: true }, { isWarehouse: true }, { branchCode: 'BR-HQ' }]
    })
      .sort({ isHeadquarter: -1, createdAt: 1 })
      .lean();

    if (!hqBranch) {
      throw new AppError(
        'Chưa có Kho Tổng HQ đang hoạt động. Vui lòng chọn kho nhận hàng cụ thể.',
        404,
        'WAREHOUSE_NOT_FOUND'
      );
    }
    return hqBranch;
  }

  // ==========================================
  // 1. NHÀ CUNG CẤP (VENDOR MANAGEMENT)
  // ==========================================
  static async getVendors(query = {}) {
    const filter = {};
    if (query.includeInactive !== 'true' && query.includeInactive !== true) {
      filter.isActive = true;
    }
    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { vendorCode: regex }, { phone: regex }, { taxCode: regex }];
    }

    const vendors = await Vendor.find(filter).sort({ createdAt: -1 }).lean();
    const totalDebt = vendors.reduce((sum, v) => sum + Number(v.outstandingDebt || 0), 0);
    return { vendors, total: vendors.length, totalOutstandingDebt: totalDebt };
  }

  static async createVendor(dto, currentUser) {
    const existing = await Vendor.findOne({ vendorCode: dto.vendorCode.toUpperCase() }).lean();
    if (existing) {
      throw new AppError(
        `Mã nhà cung cấp '${dto.vendorCode}' đã tồn tại.`,
        400,
        'VENDOR_EXISTS'
      );
    }

    const vendor = await Vendor.create(dto);

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.VENDOR_UPSERT,
      target: {
        model: 'Vendor',
        entityId: vendor._id,
        code: vendor.vendorCode,
        name: vendor.name
      },
      changes: { after: { vendorCode: vendor.vendorCode, name: vendor.name, phone: vendor.phone } },
      context: { notes: `Tạo mới nhà cung cấp ${vendor.vendorCode}` }
    });

    return vendor;
  }

  static async updateVendor(vendorId, dto, currentUser) {
    const before = await Vendor.findById(vendorId).lean();
    if (!before) {
      throw new AppError('Không tìm thấy nhà cung cấp.', 404, 'VENDOR_NOT_FOUND');
    }

    if (dto.vendorCode && dto.vendorCode.toUpperCase() !== before.vendorCode) {
      const dup = await Vendor.findOne({
        vendorCode: dto.vendorCode.toUpperCase(),
        _id: { $ne: vendorId }
      }).lean();
      if (dup) {
        throw new AppError(`Mã nhà cung cấp '${dto.vendorCode}' đã được sử dụng.`, 400, 'VENDOR_EXISTS');
      }
    }

    const updated = await Vendor.findByIdAndUpdate(
      vendorId,
      { $set: dto },
      { new: true, runValidators: true }
    ).lean();

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.VENDOR_UPSERT,
      target: {
        model: 'Vendor',
        entityId: updated._id,
        code: updated.vendorCode,
        name: updated.name
      },
      changes: {
        before: { name: before.name, phone: before.phone, isActive: before.isActive },
        after: { name: updated.name, phone: updated.phone, isActive: updated.isActive }
      }
    });

    return updated;
  }

  // ==========================================
  // 2. PHIẾU NHẬP KHO HQ (PURCHASE ORDER)
  // ==========================================
  static async getPurchaseOrders(query = {}) {
    const filter = {};
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.vendorId && mongoose.Types.ObjectId.isValid(query.vendorId)) {
      filter.vendorId = query.vendorId;
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      PurchaseOrder.find(filter)
        .populate('vendorId', 'vendorCode name phone')
        .populate('warehouseBranchId', 'branchCode name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PurchaseOrder.countDocuments(filter)
    ]);

    return {
      purchaseOrders: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  static async createPurchaseOrder(dto, currentUser) {
    const vendor = await Vendor.findOne({ _id: dto.vendorId, isActive: true }).lean();
    if (!vendor) {
      throw new AppError('Nhà cung cấp không tồn tại hoặc đã ngừng hợp tác.', 404, 'VENDOR_NOT_FOUND');
    }

    const warehouse = await this.resolveWarehouseBranch(dto.warehouseBranchId);

    const seenSkuIds = new Set();
    const enrichedItems = [];
    let totalAmount = 0;

    for (const rawItem of dto.items) {
      if (seenSkuIds.has(rawItem.productSkuId)) {
        throw new AppError('Không được trùng lặp cùng một SKU trong một phiếu nhập.', 400, 'DUPLICATE_SKU_IN_PO');
      }
      seenSkuIds.add(rawItem.productSkuId);

      const product = await Product.findById(rawItem.productId).lean();
      if (!product) {
        throw new AppError('Không tìm thấy sản phẩm trong danh mục.', 404, 'PRODUCT_NOT_FOUND');
      }
      const skuObj = (product.skus || []).find(
        (s) => s._id.toString() === rawItem.productSkuId.toString()
      );
      if (!skuObj) {
        throw new AppError(`Không tìm thấy biến thể SKU của sản phẩm '${product.name}'.`, 400, 'SKU_NOT_FOUND');
      }

      const orderedQty = Number(rawItem.orderedQty);
      const unitCost = Math.max(0, Number(rawItem.unitCost));
      const subtotal = orderedQty * unitCost;
      totalAmount += subtotal;

      enrichedItems.push({
        productId: product._id,
        productSkuId: skuObj._id,
        sku: skuObj.sku,
        productName: product.name,
        isSerialManaged: product.isSerialManaged !== false,
        orderedQty,
        receivedQty: 0,
        unitCost,
        subtotal,
        serials: []
      });
    }

    const po = await PurchaseOrder.create({
      poCode: this.generatePoCode(),
      vendorId: vendor._id,
      warehouseBranchId: warehouse._id,
      items: enrichedItems,
      totalAmount,
      paidAmount: 0,
      status: dto.status || PO_STATUS.ORDERED,
      paymentStatus: PO_PAYMENT_STATUS.UNPAID,
      notes: dto.notes || '',
      createdBy: {
        userId: currentUser.id,
        fullName: currentUser.fullName || 'Quản trị viên HQ'
      }
    });

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.PO_CREATE,
      target: {
        model: 'PurchaseOrder',
        entityId: po._id,
        code: po.poCode,
        name: `PO ${vendor.name}`
      },
      changes: {
        after: {
          status: po.status,
          totalAmount: po.totalAmount,
          warehouseBranchCode: warehouse.branchCode
        }
      },
      context: {
        notes: `Tạo phiếu nhập mua ${po.poCode} từ ${vendor.vendorCode} về ${warehouse.branchCode}`
      }
    });

    return po;
  }

  static async updatePurchaseOrderStatus(poId, status) {
    const po = await PurchaseOrder.findById(poId);
    if (!po) {
      throw new AppError('Không tìm thấy phiếu nhập kho.', 404, 'PO_NOT_FOUND');
    }
    if (po.status === PO_STATUS.RECEIVED || po.status === PO_STATUS.CANCELLED) {
      throw new AppError('Phiếu nhập đã hoàn tất hoặc đã hủy, không thể đổi trạng thái.', 400, 'INVALID_PO_STATUS');
    }

    po.status = status;
    await po.save();
    return po;
  }

  /**
   * Nhận hàng PO vào Kho Tổng HQ: tạo Serial (nếu cần), tăng BranchInventory,
   * tính lại Giá vốn bình quân gia quyền trên SKU và cộng Công nợ NCC.
   */
  static async receivePurchaseOrder(poId, dto, currentUser) {
    const po = await PurchaseOrder.findById(poId);
    if (!po) {
      throw new AppError('Không tìm thấy phiếu nhập kho.', 404, 'PO_NOT_FOUND');
    }
    if (![PO_STATUS.DRAFT, PO_STATUS.ORDERED].includes(po.status)) {
      throw new AppError(
        `Không thể nhận hàng cho phiếu đang ở trạng thái '${po.status}'.`,
        400,
        'INVALID_PO_STATUS'
      );
    }

    const warehouse = await Branch.findById(po.warehouseBranchId).lean();
    if (!warehouse) {
      throw new AppError('Kho nhận hàng không tồn tại.', 404, 'BRANCH_NOT_FOUND');
    }

    const inputMap = new Map(
      (dto.items || []).map((it) => [String(it.productSkuId), it])
    );

    const allNewSerials = [];
    const preparedReceives = [];

    for (const poItem of po.items) {
      const override = inputMap.get(String(poItem.productSkuId));
      const receivedQty = Number(override?.receivedQty ?? poItem.orderedQty);
      if (!Number.isInteger(receivedQty) || receivedQty < 1) {
        throw new AppError(`Số lượng thực nhận cho SKU ${poItem.sku} phải >= 1.`, 400, 'VALIDATION_ERROR');
      }

      const cleanSerials = Array.isArray(override?.serials)
        ? override.serials.map((s) => String(s).trim().toUpperCase()).filter(Boolean)
        : [];

      if (poItem.isSerialManaged) {
        if (cleanSerials.length !== receivedQty) {
          throw new AppError(
            `SKU ${poItem.sku} quản lý Serial/IMEI: yêu cầu đúng ${receivedQty} mã Serial (hiện nhận ${cleanSerials.length}).`,
            400,
            'SERIAL_COUNT_MISMATCH'
          );
        }
      }

      if (cleanSerials.length > 0) {
        if (new Set(cleanSerials).size !== cleanSerials.length) {
          throw new AppError(`Danh sách Serial của SKU ${poItem.sku} bị trùng lặp nội bộ.`, 400, 'VALIDATION_ERROR');
        }
        allNewSerials.push(...cleanSerials);
      }

      preparedReceives.push({
        poItem,
        receivedQty,
        cleanSerials
      });
    }

    if (allNewSerials.length > 0) {
      if (new Set(allNewSerials).size !== allNewSerials.length) {
        throw new AppError('Danh sách Serial trong cùng phiếu nhập có mã trùng lặp giữa các SKU.', 400, 'DUPLICATE_SERIAL');
      }
      const existingSerials = await Serial.find({ serialNumber: { $in: allNewSerials } })
        .select('serialNumber')
        .lean();
      if (existingSerials.length > 0) {
        const dupList = existingSerials.map((s) => s.serialNumber).join(', ');
        throw new AppError(`Mã Serial/IMEI đã tồn tại trên hệ thống: ${dupList}`, 400, 'DUPLICATE_SERIAL');
      }
    }

    // Thực thi cập nhật tồn kho, Serial, Giá vốn bình quân gia quyền
    let receivedTotalAmount = 0;
    const weightedCostUpdates = [];

    for (const entry of preparedReceives) {
      const { poItem, receivedQty, cleanSerials } = entry;

      // 1. Lấy tổng tồn hiện tại toàn chuỗi và costPrice cũ để tính bình quân gia quyền
      const [stockAgg, productDoc] = await Promise.all([
        BranchInventory.aggregate([
          { $match: { productSkuId: poItem.productSkuId } },
          { $group: { _id: null, totalQty: { $sum: '$quantity' } } }
        ]),
        Product.findById(poItem.productId).lean()
      ]);

      const existingTotalQty = Math.max(0, Number(stockAgg[0]?.totalQty || 0));
      const existingSku = productDoc?.skus?.find(
        (s) => s._id.toString() === poItem.productSkuId.toString()
      );
      const oldCostPrice = Math.max(0, Number(existingSku?.costPrice || 0));

      const newCostPrice =
        existingTotalQty > 0 && oldCostPrice > 0
          ? Math.round(
              (existingTotalQty * oldCostPrice + receivedQty * poItem.unitCost) /
                (existingTotalQty + receivedQty)
            )
          : Math.round(poItem.unitCost);

      // 2. Tạo Serial vào Kho HQ nếu có
      if (cleanSerials.length > 0) {
        await Serial.insertMany(
          cleanSerials.map((sn) => ({
            serialNumber: sn,
            productId: poItem.productId,
            productSkuId: poItem.productSkuId,
            branchId: po.warehouseBranchId,
            status: SERIAL_STATUS.IN_STOCK
          }))
        );
      }

      // 3. Cộng tồn kho tại kho nhận
      await BranchInventory.findOneAndUpdate(
        {
          branchId: po.warehouseBranchId,
          productId: poItem.productId,
          productSkuId: poItem.productSkuId
        },
        { $inc: { quantity: receivedQty } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // 4. Cập nhật giá vốn bình quân gia quyền trên Product SKU
      await Product.updateOne(
        { _id: poItem.productId, 'skus._id': poItem.productSkuId },
        { $set: { 'skus.$.costPrice': newCostPrice } }
      );

      poItem.receivedQty = receivedQty;
      poItem.subtotal = receivedQty * poItem.unitCost;
      poItem.serials = cleanSerials;
      receivedTotalAmount += poItem.subtotal;

      weightedCostUpdates.push({
        sku: poItem.sku,
        oldCostPrice,
        newCostPrice,
        receivedQty
      });
    }

    po.totalAmount = receivedTotalAmount;
    po.status = PO_STATUS.RECEIVED;
    po.receivedBy = {
      userId: currentUser.id,
      fullName: currentUser.fullName || 'Quản trị viên HQ'
    };
    po.receivedAt = new Date();
    if (dto.notes) {
      po.notes = po.notes ? `${po.notes} | Nhận hàng: ${dto.notes}` : dto.notes;
    }
    await po.save();

    const updatedVendor = await Vendor.findByIdAndUpdate(
      po.vendorId,
      {
        $inc: {
          totalPurchased: receivedTotalAmount,
          outstandingDebt: receivedTotalAmount
        }
      },
      { new: true }
    ).lean();

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.PO_RECEIVE,
      target: {
        model: 'PurchaseOrder',
        entityId: po._id,
        code: po.poCode,
        name: `Nhận kho ${po.poCode}`
      },
      changes: {
        after: {
          status: PO_STATUS.RECEIVED,
          totalAmount: receivedTotalAmount,
          weightedCostUpdates,
          vendorOutstandingDebt: updatedVendor?.outstandingDebt ?? null
        }
      },
      context: {
        notes: `Nhập kho ${warehouse.branchCode} (${allNewSerials.length} Serial) từ NCC, cập nhật giá vốn bình quân`
      }
    });

    return {
      purchaseOrder: po,
      weightedCostUpdates,
      vendor: updatedVendor
    };
  }

  // ==========================================
  // 3. THANH TOÁN CÔNG NỢ NHÀ CUNG CẤP
  // ==========================================
  static async recordVendorPayment(vendorId, dto, currentUser) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new AppError('Không tìm thấy nhà cung cấp.', 404, 'VENDOR_NOT_FOUND');
    }

    const amount = Number(dto.amount);
    if (amount > Number(vendor.outstandingDebt || 0)) {
      throw new AppError(
        `Số tiền thanh toán (${amount.toLocaleString('vi-VN')} ₫) vượt quá công nợ hiện tại (${Number(vendor.outstandingDebt || 0).toLocaleString('vi-VN')} ₫).`,
        400,
        'PAYMENT_EXCEEDS_DEBT'
      );
    }

    let updatedPo = null;
    if (dto.purchaseOrderId) {
      const po = await PurchaseOrder.findById(dto.purchaseOrderId);
      if (!po || po.vendorId.toString() !== vendorId.toString()) {
        throw new AppError('Phiếu nhập không thuộc nhà cung cấp này.', 404, 'PO_NOT_FOUND');
      }
      if (po.status !== PO_STATUS.RECEIVED) {
        throw new AppError('Chỉ thanh toán công nợ cho phiếu nhập đã xác nhận RECEIVED.', 400, 'INVALID_PO_STATUS');
      }
      const remainingOnPo = Math.max(0, Number(po.totalAmount) - Number(po.paidAmount || 0));
      if (amount > remainingOnPo) {
        throw new AppError(
          `Số tiền thanh toán vượt quá số còn nợ trên phiếu ${po.poCode} (${remainingOnPo.toLocaleString('vi-VN')} ₫).`,
          400,
          'PAYMENT_EXCEEDS_PO_BALANCE'
        );
      }

      po.paidAmount = Number(po.paidAmount || 0) + amount;
      po.paymentStatus =
        po.paidAmount >= po.totalAmount ? PO_PAYMENT_STATUS.PAID : PO_PAYMENT_STATUS.PARTIAL;
      po.payments.push({
        amount,
        note: dto.note || 'Thanh toán công nợ NCC',
        paidAt: new Date(),
        paidById: currentUser.id,
        paidByName: currentUser.fullName || 'Quản trị viên HQ'
      });
      await po.save();
      updatedPo = po;
    }

    const beforeDebt = vendor.outstandingDebt;
    vendor.totalPaid = Number(vendor.totalPaid || 0) + amount;
    vendor.outstandingDebt = Math.max(0, Number(vendor.outstandingDebt || 0) - amount);
    await vendor.save();

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.VENDOR_PAYMENT,
      target: {
        model: 'Vendor',
        entityId: vendor._id,
        code: vendor.vendorCode,
        name: vendor.name
      },
      changes: {
        before: { outstandingDebt: beforeDebt },
        after: { outstandingDebt: vendor.outstandingDebt, paidAmount: amount }
      },
      context: {
        notes: dto.note || `Thanh toán ${amount.toLocaleString('vi-VN')} ₫ cho NCC ${vendor.vendorCode}`
      }
    });

    return { vendor, purchaseOrder: updatedPo };
  }
}
