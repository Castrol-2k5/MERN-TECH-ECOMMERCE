import crypto from 'crypto';
import mongoose from 'mongoose';
import { Stocktake, STOCKTAKE_STATUS } from './stocktake.model.js';
import { TransferRequest, TRANSFER_REQUEST_STATUS } from './transferRequest.model.js';
import { RmaOutbound } from './rmaOutbound.model.js';
import { InventoryService } from './inventory.service.js';
import { Serial, SERIAL_STATUS } from '../serials/serial.model.js';
import { Product } from '../products/product.model.js';
import { Branch } from '../branches/branch.model.js';
import { AppError } from '../../utils/appError.js';
import { USER_ROLES } from '../users/user.model.js';
import { AuditLogService } from '../audit/auditLog.service.js';
import { AUDIT_ACTIONS } from '../audit/auditLog.model.js';

export class InventoryControlService {
  static generateCode(prefix) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `${prefix}-${dateStr}-${rand}`;
  }

  static resolveTargetBranch(requestedBranchId, currentUser) {
    if (currentUser.role === USER_ROLES.SUPER_ADMIN) {
      return requestedBranchId || currentUser.branchId;
    }
    return currentUser.branchId;
  }

  static assertSameBranchAccess(entityBranchId, currentUser) {
    if (
      currentUser.role !== USER_ROLES.SUPER_ADMIN &&
      currentUser.branchId &&
      entityBranchId.toString() !== currentUser.branchId.toString()
    ) {
      throw new AppError(
        'Bạn không có quyền truy cập chứng từ kho của chi nhánh khác.',
        403,
        'CROSS_BRANCH_ACCESS_DENIED'
      );
    }
  }

  // ==========================================
  // 1. KIỂM KHO ĐỊNH KỲ THEO IMEI/SERIAL (UC-BM-05)
  // ==========================================
  static computeStocktakeMetrics(expectedSerials = [], scannedSerials = []) {
    const expectedSet = new Set(expectedSerials.map((s) => s.serialNumber.toUpperCase()));
    const scannedSet = new Set(scannedSerials.map((s) => s.toUpperCase()));

    const matchedCount = [...scannedSet].filter((sn) => expectedSet.has(sn)).length;
    const surplusSerials = [...scannedSet].filter((sn) => !expectedSet.has(sn));
    const missingSerials = [...expectedSet].filter((sn) => !scannedSet.has(sn));

    return {
      missingSerials,
      surplusSerials,
      summary: {
        expectedCount: expectedSet.size,
        scannedCount: scannedSet.size,
        matchedCount,
        missingCount: missingSerials.length,
        surplusCount: surplusSerials.length
      }
    };
  }

  static async createStocktake(payload, currentUser) {
    const branchId = this.resolveTargetBranch(payload.branchId, currentUser);
    if (!branchId) {
      throw new AppError('Vui lòng chỉ định chi nhánh cần kiểm kho.', 400, 'BRANCH_REQUIRED');
    }

    const branch = await Branch.findById(branchId).lean();
    if (!branch) {
      throw new AppError('Chi nhánh không tồn tại.', 404, 'BRANCH_NOT_FOUND');
    }

    const activeSerials = await Serial.find({
      branchId,
      status: SERIAL_STATUS.IN_STOCK
    })
      .populate('productId', 'name skus')
      .lean();

    const expectedSerials = activeSerials.map((sn) => {
      const prod = sn.productId;
      const skuObj = prod?.skus?.find((s) => s._id.toString() === sn.productSkuId.toString());
      return {
        serialNumber: sn.serialNumber,
        productId: prod?._id || sn.productId,
        productSkuId: sn.productSkuId,
        sku: skuObj?.sku || '',
        productName: prod?.name || 'Sản phẩm công nghệ'
      };
    });

    const doc = await Stocktake.create({
      stocktakeCode: this.generateCode('STK'),
      branchId,
      createdBy: {
        userId: currentUser.id,
        fullName: currentUser.fullName || 'Quản lý chi nhánh'
      },
      note: payload.note || '',
      expectedSerials,
      scannedSerials: [],
      missingSerials: [],
      surplusSerials: [],
      summary: {
        expectedCount: expectedSerials.length,
        scannedCount: 0,
        matchedCount: 0,
        missingCount: expectedSerials.length,
        surplusCount: 0
      }
    });

    return doc;
  }

  static async getStocktakes(query = {}, currentUser) {
    const filter = {};
    if (currentUser.role === USER_ROLES.SUPER_ADMIN) {
      if (query.branchId && query.branchId !== 'ALL') filter.branchId = query.branchId;
    } else {
      filter.branchId = currentUser.branchId;
    }
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    const stocktakes = await Stocktake.find(filter)
      .select('-expectedSerials')
      .populate('branchId', 'name branchCode')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return stocktakes;
  }

  static async getStocktakeDetail(stocktakeId, currentUser) {
    if (!mongoose.Types.ObjectId.isValid(stocktakeId)) {
      throw new AppError('Mã phiếu kiểm kho không hợp lệ.', 400, 'INVALID_ID');
    }

    const doc = await Stocktake.findById(stocktakeId)
      .populate('branchId', 'name branchCode address')
      .lean();

    if (!doc) {
      throw new AppError('Không tìm thấy phiếu kiểm kho.', 404, 'STOCKTAKE_NOT_FOUND');
    }

    this.assertSameBranchAccess(doc.branchId?._id || doc.branchId, currentUser);
    return doc;
  }

  static async scanStocktakeSerials(stocktakeId, payload, currentUser) {
    const doc = await Stocktake.findById(stocktakeId);
    if (!doc) {
      throw new AppError('Không tìm thấy phiếu kiểm kho.', 404, 'STOCKTAKE_NOT_FOUND');
    }

    this.assertSameBranchAccess(doc.branchId, currentUser);

    if (doc.status !== STOCKTAKE_STATUS.IN_PROGRESS) {
      throw new AppError('Phiếu kiểm kho này đã hoàn tất chốt sổ.', 400, 'STOCKTAKE_ALREADY_COMPLETED');
    }

    const inputs = [];
    if (payload.serialNumber) inputs.push(payload.serialNumber);
    if (Array.isArray(payload.serialNumbers)) inputs.push(...payload.serialNumbers);

    const normalized = [...new Set(inputs.map((s) => String(s).trim().toUpperCase()).filter(Boolean))];
    if (normalized.length === 0) {
      throw new AppError('Vui lòng nhập hoặc quét ít nhất 1 mã Serial.', 400, 'EMPTY_SERIAL');
    }

    const scannedSet = new Set(doc.scannedSerials);
    const newlyAdded = [];
    for (const sn of normalized) {
      if (!scannedSet.has(sn)) {
        scannedSet.add(sn);
        newlyAdded.push(sn);
      }
    }

    doc.scannedSerials = [...scannedSet];
    const metrics = this.computeStocktakeMetrics(doc.expectedSerials, doc.scannedSerials);
    doc.surplusSerials = metrics.surplusSerials;
    doc.missingSerials = metrics.missingSerials;
    doc.summary = metrics.summary;
    await doc.save();

    return {
      stocktake: doc,
      newlyAddedCount: newlyAdded.length
    };
  }

  static async completeStocktake(stocktakeId, payload, currentUser) {
    const doc = await Stocktake.findById(stocktakeId);
    if (!doc) {
      throw new AppError('Không tìm thấy phiếu kiểm kho.', 404, 'STOCKTAKE_NOT_FOUND');
    }

    this.assertSameBranchAccess(doc.branchId, currentUser);

    if (doc.status === STOCKTAKE_STATUS.COMPLETED) {
      throw new AppError('Phiếu kiểm kho này đã được chốt trước đó.', 400, 'STOCKTAKE_ALREADY_COMPLETED');
    }

    const metrics = this.computeStocktakeMetrics(doc.expectedSerials, doc.scannedSerials);
    doc.missingSerials = metrics.missingSerials;
    doc.surplusSerials = metrics.surplusSerials;
    doc.summary = metrics.summary;
    doc.status = STOCKTAKE_STATUS.COMPLETED;
    doc.completedBy = {
      userId: currentUser.id,
      fullName: currentUser.fullName || 'Quản lý chi nhánh'
    };
    doc.completedAt = new Date();
    if (payload.note) doc.note = payload.note;
    await doc.save();

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.STOCKTAKE_COMPLETE,
      target: {
        model: 'Stocktake',
        entityId: doc._id,
        code: doc.stocktakeCode,
        name: `Kiểm kho ${doc.stocktakeCode}`
      },
      changes: {
        after: doc.summary
      },
      context: {
        reason: doc.note || 'Chốt biên bản kiểm kho Serial định kỳ',
        notes: `Kỳ vọng: ${doc.summary.expectedCount} | Khớp: ${doc.summary.matchedCount} | Thiếu: ${doc.summary.missingCount} | Thừa: ${doc.summary.surplusCount}`
      }
    });

    return doc;
  }

  // ==========================================
  // 2. XIN CẤP HÀNG TỪ KHO TỔNG / CN KHÁC (PULL TRANSFER - UC-BM-06)
  // ==========================================
  static async createTransferRequest(payload, currentUser) {
    const requestingBranchId = this.resolveTargetBranch(payload.requestingBranchId, currentUser);
    if (!requestingBranchId) {
      throw new AppError('Không xác định được chi nhánh yêu cầu nhập hàng.', 400, 'BRANCH_REQUIRED');
    }

    if (requestingBranchId.toString() === payload.sourceBranchId.toString()) {
      throw new AppError('Chi nhánh nguồn và chi nhánh nhận không thể giống nhau.', 400, 'SAME_BRANCH_ERROR');
    }

    const [reqBranch, srcBranch] = await Promise.all([
      Branch.findById(requestingBranchId).lean(),
      Branch.findById(payload.sourceBranchId).lean()
    ]);
    if (!reqBranch || !srcBranch) {
      throw new AppError('Chi nhánh yêu cầu hoặc chi nhánh nguồn không tồn tại.', 404, 'BRANCH_NOT_FOUND');
    }

    const enrichedItems = [];
    for (const item of payload.items) {
      const prod = await Product.findById(item.productId).lean();
      if (!prod) {
        throw new AppError('Sản phẩm yêu cầu không tồn tại.', 404, 'PRODUCT_NOT_FOUND');
      }
      const skuObj = prod.skus?.find((s) => s._id.toString() === item.productSkuId.toString());
      if (!skuObj) {
        throw new AppError(`Biến thể SKU của '${prod.name}' không tồn tại.`, 400, 'SKU_NOT_FOUND');
      }
      enrichedItems.push({
        productId: prod._id,
        productSkuId: skuObj._id,
        sku: skuObj.sku,
        productName: prod.name,
        quantity: Number(item.quantity)
      });
    }

    const doc = await TransferRequest.create({
      requestCode: this.generateCode('REQ'),
      requestingBranchId,
      sourceBranchId: payload.sourceBranchId,
      requestedBy: {
        userId: currentUser.id,
        fullName: currentUser.fullName || 'Quản lý chi nhánh'
      },
      items: enrichedItems,
      reason: payload.reason
    });

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.TRANSFER_REQUEST_CREATE,
      target: {
        model: 'TransferRequest',
        entityId: doc._id,
        code: doc.requestCode,
        name: `Xin cấp hàng ${doc.requestCode}`
      },
      changes: {
        after: { sourceBranchId: doc.sourceBranchId, itemsCount: enrichedItems.length }
      },
      context: {
        reason: doc.reason,
        notes: `Từ ${srcBranch.name} -> ${reqBranch.name}`
      }
    });

    return doc;
  }

  static async getTransferRequests(query = {}, currentUser) {
    const filter = {};
    if (currentUser.role !== USER_ROLES.SUPER_ADMIN && currentUser.branchId) {
      filter.$or = [
        { requestingBranchId: currentUser.branchId },
        { sourceBranchId: currentUser.branchId }
      ];
    } else if (query.branchId && query.branchId !== 'ALL') {
      filter.$or = [
        { requestingBranchId: query.branchId },
        { sourceBranchId: query.branchId }
      ];
    }

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    return TransferRequest.find(filter)
      .populate('requestingBranchId', 'name branchCode')
      .populate('sourceBranchId', 'name branchCode isHeadquarter')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  static async approveTransferRequest(requestId, payload, currentUser) {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new AppError('Mã yêu cầu điều chuyển không hợp lệ.', 400, 'INVALID_ID');
    }

    const reqDoc = await TransferRequest.findById(requestId);
    if (!reqDoc) {
      throw new AppError('Không tìm thấy yêu cầu xin cấp hàng.', 404, 'TRANSFER_REQUEST_NOT_FOUND');
    }

    if (
      currentUser.role !== USER_ROLES.SUPER_ADMIN &&
      reqDoc.sourceBranchId.toString() !== currentUser.branchId?.toString()
    ) {
      throw new AppError('Chỉ chi nhánh nguồn hoặc HQ Admin mới có quyền duyệt xuất cấp hàng.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
    }

    if (reqDoc.status !== TRANSFER_REQUEST_STATUS.PENDING) {
      throw new AppError(`Yêu cầu này đã được xử lý (${reqDoc.status}).`, 400, 'ALREADY_REVIEWED');
    }

    let linkedTransfer = null;
    if (payload.dispatchTransfer) {
      const transferItems = reqDoc.items.map((it) => ({
        productId: it.productId.toString(),
        productSkuId: it.productSkuId.toString(),
        quantity: it.quantity,
        serialNumbers: payload.serialsMap?.[it.productSkuId.toString()] || []
      }));

      linkedTransfer = await InventoryService.createTransfer(
        {
          sourceBranchId: reqDoc.sourceBranchId.toString(),
          destinationBranchId: reqDoc.requestingBranchId.toString(),
          items: transferItems,
          notes: `Xuất theo yêu cầu ${reqDoc.requestCode}: ${reqDoc.reason}`
        },
        currentUser
      );
      reqDoc.linkedTransferId = linkedTransfer._id;
    }

    reqDoc.status = TRANSFER_REQUEST_STATUS.APPROVED;
    reqDoc.reviewedBy = {
      userId: currentUser.id,
      fullName: currentUser.fullName || 'Quản lý kho nguồn'
    };
    reqDoc.reviewedAt = new Date();
    reqDoc.reviewNote = payload.reviewNote || '';
    await reqDoc.save();

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.TRANSFER_REQUEST_APPROVE,
      target: {
        model: 'TransferRequest',
        entityId: reqDoc._id,
        code: reqDoc.requestCode,
        name: `Duyệt xin cấp hàng ${reqDoc.requestCode}`
      },
      changes: {
        after: {
          status: TRANSFER_REQUEST_STATUS.APPROVED,
          linkedTransferId: reqDoc.linkedTransferId
        }
      },
      context: {
        reason: reqDoc.reviewNote || reqDoc.reason
      }
    });

    return { request: reqDoc, transfer: linkedTransfer };
  }

  static async rejectTransferRequest(requestId, payload, currentUser) {
    const reqDoc = await TransferRequest.findById(requestId);
    if (!reqDoc) {
      throw new AppError('Không tìm thấy yêu cầu xin cấp hàng.', 404, 'TRANSFER_REQUEST_NOT_FOUND');
    }

    if (
      currentUser.role !== USER_ROLES.SUPER_ADMIN &&
      reqDoc.sourceBranchId.toString() !== currentUser.branchId?.toString()
    ) {
      throw new AppError('Chỉ chi nhánh nguồn hoặc HQ Admin mới có quyền từ chối.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
    }

    if (reqDoc.status !== TRANSFER_REQUEST_STATUS.PENDING) {
      throw new AppError(`Yêu cầu này đã được xử lý (${reqDoc.status}).`, 400, 'ALREADY_REVIEWED');
    }

    reqDoc.status = TRANSFER_REQUEST_STATUS.REJECTED;
    reqDoc.reviewedBy = {
      userId: currentUser.id,
      fullName: currentUser.fullName || 'Quản lý kho nguồn'
    };
    reqDoc.reviewedAt = new Date();
    reqDoc.reviewNote = payload.reviewNote || 'Kho nguồn hiện chưa đủ tồn để cấp';
    await reqDoc.save();

    return reqDoc;
  }

  // ==========================================
  // 3. QUẢN LÝ & XUẤT GOM LÔ HÀNG LỖI RMA (UC-BM-06)
  // ==========================================
  static async getDefectiveSerials(branchId) {
    if (!branchId) return [];
    const serials = await Serial.find({
      branchId,
      status: SERIAL_STATUS.DEFECTIVE
    })
      .populate('productId', 'name skus')
      .sort({ updatedAt: -1 })
      .lean();

    return serials.map((sn) => {
      const prod = sn.productId;
      const skuObj = prod?.skus?.find((s) => s._id.toString() === sn.productSkuId.toString());
      return {
        _id: sn._id,
        serialNumber: sn.serialNumber,
        productId: prod?._id || sn.productId,
        productSkuId: sn.productSkuId,
        sku: skuObj?.sku || '',
        productName: prod?.name || 'Thiết bị lỗi',
        updatedAt: sn.updatedAt
      };
    });
  }

  static async getRmaOutbounds(query = {}, currentUser) {
    const filter = {};
    if (currentUser.role === USER_ROLES.SUPER_ADMIN) {
      if (query.branchId && query.branchId !== 'ALL') filter.branchId = query.branchId;
    } else {
      filter.branchId = currentUser.branchId;
    }

    return RmaOutbound.find(filter)
      .populate('branchId', 'name branchCode')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
  }

  static async createRmaOutbound(payload, currentUser) {
    const branchId = this.resolveTargetBranch(payload.branchId, currentUser);
    if (!branchId) {
      throw new AppError('Không xác định được chi nhánh xuất trả RMA.', 400, 'BRANCH_REQUIRED');
    }

    const cleanSerials = [...new Set(payload.serialNumbers.map((s) => s.trim().toUpperCase()).filter(Boolean))];
    const found = await Serial.find({
      serialNumber: { $in: cleanSerials },
      branchId,
      status: SERIAL_STATUS.DEFECTIVE
    })
      .populate('productId', 'name skus')
      .lean();

    if (found.length !== cleanSerials.length) {
      throw new AppError(
        'Một số mã Serial không thuộc chi nhánh này hoặc không ở trạng thái hàng lỗi (DEFECTIVE).',
        400,
        'INVALID_DEFECTIVE_SERIALS'
      );
    }

    const items = found.map((sn) => {
      const prod = sn.productId;
      const skuObj = prod?.skus?.find((s) => s._id.toString() === sn.productSkuId.toString());
      return {
        serialNumber: sn.serialNumber,
        productId: prod?._id || sn.productId,
        productSkuId: sn.productSkuId,
        sku: skuObj?.sku || '',
        productName: prod?.name || 'Thiết bị lỗi'
      };
    });

    await Serial.updateMany(
      { _id: { $in: found.map((f) => f._id) } },
      { $set: { status: SERIAL_STATUS.WARRANTY } }
    );

    const doc = await RmaOutbound.create({
      rmaCode: this.generateCode('RMA'),
      branchId,
      createdBy: {
        userId: currentUser.id,
        fullName: currentUser.fullName || 'Quản lý chi nhánh'
      },
      destinationType: payload.destinationType || 'HQ_CENTER',
      destinationName: payload.destinationName,
      trackingNumber: payload.trackingNumber || '',
      reason: payload.reason,
      items
    });

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.RMA_OUTBOUND_CREATE,
      target: {
        model: 'RmaOutbound',
        entityId: doc._id,
        code: doc.rmaCode,
        name: `Xuất lô RMA ${doc.rmaCode} (${items.length} máy)`
      },
      changes: {
        after: {
          serials: cleanSerials,
          destinationName: doc.destinationName
        }
      },
      context: {
        reason: doc.reason,
        notes: `Chuyển ${items.length} Serial DEFECTIVE -> WARRANTY tới ${doc.destinationName}`
      }
    });

    return doc;
  }
}

export default InventoryControlService;
