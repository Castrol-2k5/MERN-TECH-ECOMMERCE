import mongoose from 'mongoose';
import { Branch } from '../branches/branch.model.js';
import { BranchInventory } from '../inventory/inventory.model.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { Product } from '../products/product.model.js';
import { Serial, SERIAL_STATUS } from '../serials/serial.model.js';
import { Order, ORDER_STATUS } from '../orders/order.model.js';
import { AuditLogService } from '../audit/auditLog.service.js';
import { AUDIT_ACTIONS } from '../audit/auditLog.model.js';
import { AppError } from '../../utils/appError.js';

export class SupplyChainService {
  static async resolveDefaultHqBranch() {
    const hq = await Branch.findOne({
      isActive: true,
      $or: [{ isHeadquarter: true }, { isWarehouse: true }, { branchCode: 'BR-HQ' }]
    })
      .sort({ isHeadquarter: -1, createdAt: 1 })
      .lean();
    return hq || null;
  }

  /**
   * Lấy bảng cấu hình định mức tồn kho Min/Max theo chi nhánh & SKU
   */
  static async getThresholds(query = {}) {
    const filter = {};
    if (query.branchId && query.branchId !== 'ALL' && mongoose.Types.ObjectId.isValid(query.branchId)) {
      filter.branchId = new mongoose.Types.ObjectId(query.branchId);
    }

    const rows = await BranchInventory.find(filter)
      .populate('branchId', 'branchCode name isHeadquarter isWarehouse isActive')
      .populate('productId', 'name brand isSerialManaged isActive skus')
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    const search = String(query.search || '').trim().toLowerCase();

    const items = [];
    for (const row of rows) {
      const br = row.branchId;
      const prod = row.productId;
      if (!br || !prod || br.isActive === false || prod.isActive === false) continue;

      const skuObj = (prod.skus || []).find((s) => String(s._id) === String(row.productSkuId));
      if (!skuObj) continue;

      if (
        search &&
        !prod.name.toLowerCase().includes(search) &&
        !skuObj.sku.toLowerCase().includes(search) &&
        !br.branchCode.toLowerCase().includes(search)
      ) {
        continue;
      }

      items.push({
        _id: row._id,
        branchId: br._id,
        branchCode: br.branchCode,
        branchName: br.name,
        isHeadquarter: Boolean(br.isHeadquarter || br.branchCode === 'BR-HQ'),
        productId: prod._id,
        productName: prod.name,
        productSkuId: skuObj._id,
        sku: skuObj.sku,
        quantity: Number(row.quantity || 0),
        minStock: Number(row.minStock || 0),
        maxStock: Number(row.maxStock || 0)
      });
    }

    return { items, total: items.length };
  }

  /**
   * Cập nhật định mức tồn kho Min/Max (UC-HQ-06)
   */
  static async updateThresholds(dto, currentUser) {
    const bulkOps = dto.items.map((item) => ({
      updateOne: {
        filter: {
          branchId: new mongoose.Types.ObjectId(item.branchId),
          productSkuId: new mongoose.Types.ObjectId(item.productSkuId)
        },
        update: {
          $set: {
            minStock: item.minStock,
            maxStock: item.maxStock
          },
          $setOnInsert: {
            productId: new mongoose.Types.ObjectId(item.productId),
            quantity: 0
          }
        },
        upsert: true
      }
    }));

    const result = await BranchInventory.bulkWrite(bulkOps);

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.INVENTORY_THRESHOLD_UPDATE,
      target: {
        model: 'BranchInventory',
        code: 'MIN_MAX_THRESHOLDS',
        name: `Cập nhật ${dto.items.length} định mức tồn kho`
      },
      changes: {
        after: dto.items.slice(0, 10)
      },
      context: {
        notes: `Cập nhật định mức Min/Max cho ${dto.items.length} bản ghi tồn kho`
      }
    });

    return {
      updatedCount: (result.modifiedCount || 0) + (result.upsertedCount || 0) + (result.matchedCount || 0),
      itemsCount: dto.items.length
    };
  }

  /**
   * Sinh danh sách đề xuất bơm hàng tự động từ Kho HQ về Chi nhánh dưới ngưỡng Min (UC-HQ-06)
   */
  static async getReplenishmentSuggestions() {
    const hqBranch = await this.resolveDefaultHqBranch();
    if (!hqBranch) {
      return { hqBranch: null, suggestions: [], total: 0 };
    }

    const [lowBranchInvs, hqInvs] = await Promise.all([
      BranchInventory.find({
        branchId: { $ne: hqBranch._id },
        minStock: { $gt: 0 },
        $expr: { $lt: ['$quantity', '$minStock'] }
      })
        .populate('branchId', 'branchCode name isHeadquarter isActive')
        .populate('productId', 'name brand isSerialManaged isActive skus')
        .lean(),
      BranchInventory.find({
        branchId: hqBranch._id,
        quantity: { $gt: 0 }
      }).lean()
    ]);

    const hqStockMap = new Map(hqInvs.map((inv) => [String(inv.productSkuId), Number(inv.quantity || 0)]));

    const suggestions = [];
    for (const inv of lowBranchInvs) {
      const br = inv.branchId;
      const prod = inv.productId;
      if (!br || !prod || br.isActive === false || prod.isActive === false || br.isHeadquarter) continue;

      const skuObj = (prod.skus || []).find((s) => String(s._id) === String(inv.productSkuId));
      if (!skuObj) continue;

      const hqAvailable = hqStockMap.get(String(inv.productSkuId)) || 0;
      const neededQty =
        Number(inv.maxStock || 0) > Number(inv.quantity || 0)
          ? Number(inv.maxStock) - Number(inv.quantity)
          : Number(inv.minStock) - Number(inv.quantity);

      const recommendedQty = hqAvailable > 0 ? Math.min(neededQty, hqAvailable) : 0;

      suggestions.push({
        sourceBranchId: hqBranch._id,
        sourceBranchCode: hqBranch.branchCode,
        destinationBranchId: br._id,
        destinationBranchCode: br.branchCode,
        destinationBranchName: br.name,
        productId: prod._id,
        productName: prod.name,
        productSkuId: skuObj._id,
        sku: skuObj.sku,
        isSerialManaged: prod.isSerialManaged !== false,
        currentStock: Number(inv.quantity || 0),
        minStock: Number(inv.minStock || 0),
        maxStock: Number(inv.maxStock || 0),
        neededQty,
        hqAvailable,
        recommendedQty,
        canFulfillFromHq: recommendedQty > 0
      });
    }

    suggestions.sort((a, b) => Number(b.canFulfillFromHq) - Number(a.canFulfillFromHq) || a.currentStock - b.currentStock);

    return {
      hqBranch: {
        _id: hqBranch._id,
        branchCode: hqBranch.branchCode,
        name: hqBranch.name
      },
      suggestions,
      total: suggestions.length
    };
  }

  /**
   * Helper dùng chung: bốc Serial FIFO tại nguồn (nếu chưa truyền) và tạo lệnh StockTransfer
   */
  static async pickSerialsAndCreateTransfer(
    { sourceBranchId, destinationBranchId, productId, productSkuId, quantity, serialNumbers = [], notes },
    currentUser,
    insufficientCode = 'INSUFFICIENT_SOURCE_SERIALS'
  ) {
    if (sourceBranchId.toString() === destinationBranchId.toString()) {
      throw new AppError('Chi nhánh nguồn và chi nhánh nhận phải khác nhau.', 400, 'SAME_BRANCH_TRANSFER');
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
      throw new AppError('Không tìm thấy sản phẩm.', 404, 'PRODUCT_NOT_FOUND');
    }

    let pickedSerials = Array.isArray(serialNumbers)
      ? serialNumbers.map((s) => s.trim().toUpperCase()).filter(Boolean)
      : [];

    if (product.isSerialManaged !== false && pickedSerials.length === 0) {
      const fifoSerials = await Serial.find({
        branchId: sourceBranchId,
        productSkuId,
        status: SERIAL_STATUS.IN_STOCK
      })
        .sort({ createdAt: 1 })
        .limit(quantity)
        .select('serialNumber')
        .lean();

      if (fifoSerials.length < quantity) {
        throw new AppError(
          `Kho nguồn chỉ còn ${fifoSerials.length} máy Serial khả dụng cho yêu cầu điều chuyển ${quantity} máy.`,
          400,
          insufficientCode
        );
      }
      pickedSerials = fifoSerials.map((s) => s.serialNumber);
    }

    return InventoryService.createTransfer(
      {
        sourceBranchId,
        destinationBranchId,
        items: [
          {
            productId,
            productSkuId,
            quantity,
            serialNumbers: pickedSerials
          }
        ],
        notes
      },
      currentUser
    );
  }

  /**
   * 1-Click Duyệt & Xuất chuyển kho từ Kho HQ về Chi nhánh
   */
  static async executeAutoReplenishment(dto, currentUser) {
    let sourceBranchId = dto.sourceBranchId;
    if (!sourceBranchId) {
      const hq = await this.resolveDefaultHqBranch();
      if (!hq) {
        throw new AppError('Không tìm thấy Kho Tổng HQ đang hoạt động.', 404, 'WAREHOUSE_NOT_FOUND');
      }
      sourceBranchId = hq._id.toString();
    }

    return this.pickSerialsAndCreateTransfer(
      {
        sourceBranchId,
        destinationBranchId: dto.destinationBranchId,
        productId: dto.productId,
        productSkuId: dto.productSkuId,
        quantity: dto.quantity,
        serialNumbers: dto.serialNumbers,
        notes: dto.notes || 'HQ Auto-Replenishment theo định mức Min/Max'
      },
      currentUser,
      'INSUFFICIENT_HQ_SERIALS'
    );
  }

  /**
   * Phát hiện Hàng tồn chậm > 30 ngày & Ghép cặp luân chuyển chéo giữa chi nhánh thừa và thiếu (UC-HQ-07)
   */
  static async getDeadStockBalancingSuggestions(rawAgedDays = 30) {
    const agedDays = Math.max(1, Math.min(365, Number(rawAgedDays) || 30));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - agedDays);

    const salesWindowStart = new Date();
    salesWindowStart.setDate(salesWindowStart.getDate() - 30);

    const [branches, agedSerialsAgg, salesAgg, allInvs] = await Promise.all([
      Branch.find({ isActive: true }).lean(),
      Serial.aggregate([
        {
          $match: {
            status: SERIAL_STATUS.IN_STOCK,
            createdAt: { $lte: cutoff }
          }
        },
        {
          $group: {
            _id: {
              branchId: '$branchId',
              productId: '$productId',
              productSkuId: '$productSkuId'
            },
            agedCount: { $sum: 1 },
            oldestAt: { $min: '$createdAt' },
            serialNumbers: { $push: '$serialNumber' }
          }
        }
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: salesWindowStart },
            orderStatus: { $in: [ORDER_STATUS.COMPLETED, ORDER_STATUS.PARTIALLY_RETURNED] }
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: {
              branchId: '$branchId',
              productSkuId: '$items.productSkuId'
            },
            soldQty: { $sum: '$items.quantity' }
          }
        }
      ]),
      BranchInventory.find().lean()
    ]);

    const branchMap = new Map(branches.map((b) => [b._id.toString(), b]));
    const retailBranches = branches.filter((b) => !b.isHeadquarter && b.branchCode !== 'BR-HQ');
    const salesMap = new Map(salesAgg.map((s) => [`${s._id.branchId}:${s._id.productSkuId}`, Number(s.soldQty || 0)]));
    const invMap = new Map(allInvs.map((inv) => [`${inv.branchId}:${inv.productSkuId}`, inv]));

    const productIds = Array.from(new Set(agedSerialsAgg.map((a) => a._id.productId).filter(Boolean)));
    const products = productIds.length
      ? await Product.find({ _id: { $in: productIds }, isActive: true }).select('name skus isSerialManaged').lean()
      : [];
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const suggestions = [];

    for (const aged of agedSerialsAgg) {
      const sourceBranch = branchMap.get(String(aged._id.branchId));
      const prod = productMap.get(String(aged._id.productId));
      if (!sourceBranch || sourceBranch.isHeadquarter || sourceBranch.branchCode === 'BR-HQ' || !prod) {
        continue;
      }

      const skuObj = (prod.skus || []).find((s) => String(s._id) === String(aged._id.productSkuId));
      if (!skuObj) continue;

      const salesAtSource30d = salesMap.get(`${sourceBranch._id}:${skuObj._id}`) || 0;
      if (salesAtSource30d > 1) continue; // Đang có lực bán ở nguồn -> không coi là đóng băng

      // Tìm chi nhánh nhận đang cần hàng (thiếu dưới Min hoặc bán chạy >= 2 máy / 30d & tồn thấp)
      let bestTarget = null;
      let bestScore = -1;

      for (const candidate of retailBranches) {
        if (candidate._id.toString() === sourceBranch._id.toString()) continue;
        const candInv = invMap.get(`${candidate._id}:${skuObj._id}`);
        const candQty = Number(candInv?.quantity || 0);
        const candMin = Number(candInv?.minStock || 0);
        const candSales = salesMap.get(`${candidate._id}:${skuObj._id}`) || 0;

        const isShortage = candMin > 0 && candQty < candMin;
        const isHighDemand = candSales >= 2 && candQty <= 3;

        if (!isShortage && !isHighDemand) continue;

        const needAmount = isShortage
          ? Math.max(1, (Number(candInv?.maxStock || 0) || candMin) - candQty)
          : Math.max(1, Math.min(aged.agedCount, candSales - candQty || 1));

        const score = (isShortage ? 100 : 0) + candSales * 10 - candQty;
        if (score > bestScore) {
          bestScore = score;
          bestTarget = {
            branch: candidate,
            destQty: candQty,
            destMinStock: candMin,
            candSales,
            needAmount
          };
        }
      }

      if (!bestTarget) continue;

      const recommendedQty = Math.min(aged.agedCount, bestTarget.needAmount);
      suggestions.push({
        sourceBranchId: sourceBranch._id,
        sourceBranchCode: sourceBranch.branchCode,
        sourceBranchName: sourceBranch.name,
        destinationBranchId: bestTarget.branch._id,
        destinationBranchCode: bestTarget.branch.branchCode,
        destinationBranchName: bestTarget.branch.name,
        productId: prod._id,
        productName: prod.name,
        productSkuId: skuObj._id,
        sku: skuObj.sku,
        agedCount: aged.agedCount,
        oldestAt: aged.oldestAt,
        salesAtSource30d,
        salesAtTarget30d: bestTarget.candSales,
        destQty: bestTarget.destQty,
        destMinStock: bestTarget.destMinStock,
        recommendedQty,
        sampleAgedSerials: (aged.serialNumbers || []).slice(0, recommendedQty)
      });
    }

    return {
      agedDays,
      suggestions,
      total: suggestions.length
    };
  }

  /**
   * Thực thi luân chuyển hàng tồn chậm giữa chi nhánh thừa và thiếu (UC-HQ-07)
   */
  static async executeDeadStockRebalance(dto, currentUser) {
    const transfer = await this.pickSerialsAndCreateTransfer(
      {
        sourceBranchId: dto.sourceBranchId,
        destinationBranchId: dto.destinationBranchId,
        productId: dto.productId,
        productSkuId: dto.productSkuId,
        quantity: dto.quantity,
        serialNumbers: dto.serialNumbers,
        notes: dto.notes || 'HQ Luân chuyển giải phóng hàng tồn kho chậm'
      },
      currentUser,
      'INSUFFICIENT_SOURCE_SERIALS'
    );

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.DEAD_STOCK_REBALANCE,
      target: {
        model: 'StockTransfer',
        entityId: transfer._id,
        code: transfer.transferCode,
        name: `Rebalance ${dto.quantity} máy`
      },
      changes: {
        after: {
          sourceBranchId: dto.sourceBranchId,
          destinationBranchId: dto.destinationBranchId,
          productSkuId: dto.productSkuId,
          quantity: dto.quantity
        }
      },
      context: {
        notes: dto.notes || `Luân chuyển hàng tồn chậm tạo phiếu ${transfer.transferCode}`
      }
    });

    return transfer;
  }
}
