import mongoose from 'mongoose';
import { Branch } from '../branches/branch.model.js';
import { Order, ORDER_STATUS } from '../orders/order.model.js';
import { PosShift, SHIFT_STATUS } from '../shifts/posShift.model.js';
import { BranchInventory } from '../inventory/inventory.model.js';
import { Serial, SERIAL_STATUS } from '../serials/serial.model.js';
import { TransferRequest, TRANSFER_REQUEST_STATUS } from '../inventory/transferRequest.model.js';
import { ApprovalRequest, APPROVAL_STATUS } from '../approvals/approval.model.js';
import { Product } from '../products/product.model.js';

const ACTIVE_REVENUE_STATUSES = [
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.PARTIALLY_RETURNED,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.READY_FOR_SHIPPING
];

const RETURN_OR_CANCEL_STATUSES = [
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.RETURNED,
  ORDER_STATUS.PARTIALLY_RETURNED
];

const SEVERITY_WEIGHT = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2
};

export class HqCommandService {
  static getVnDateBoundaries(now = new Date()) {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = Math.max(1, now.getDate());
    const expectedMonthProgress = dayOfMonth / daysInMonth;

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const deadStockCutoff = new Date(now);
    deadStockCutoff.setDate(deadStockCutoff.getDate() - 30);

    return {
      now,
      startOfToday,
      startOfMonth,
      expectedMonthProgress,
      sevenDaysAgo,
      fourteenDaysAgo,
      deadStockCutoff
    };
  }

  /**
   * HQ Command Center — Báo động đỏ toàn chuỗi (UC-HQ-03)
   */
  static async getCommandCenter() {
    const {
      now,
      startOfToday,
      startOfMonth,
      expectedMonthProgress,
      sevenDaysAgo,
      fourteenDaysAgo,
      deadStockCutoff
    } = this.getVnDateBoundaries();

    const branches = await Branch.find({ isActive: true }).sort({ isHeadquarter: -1, createdAt: 1 }).lean();
    const branchMap = new Map(branches.map((b) => [b._id.toString(), b]));
    const hqBranchIds = branches
      .filter((b) => b.isHeadquarter || b.isWarehouse || b.branchCode === 'BR-HQ')
      .map((b) => b._id);

    const [
      todayAgg,
      mtdByBranchAgg,
      stats7dByBranchAgg,
      unresolvedShifts,
      lowStockDocs,
      recentSkuSalesAgg,
      deadStockAgg,
      transferRequestsToHq,
      pendingApprovals
    ] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfToday, $lte: now },
            orderStatus: { $in: ACTIVE_REVENUE_STATUSES }
          }
        },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: { $max: [0, { $subtract: ['$totalAmount', { $ifNull: ['$refundedAmount', 0] }] }] }
            },
            ordersCount: { $sum: 1 }
          }
        }
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth, $lte: now },
            orderStatus: { $in: ACTIVE_REVENUE_STATUSES }
          }
        },
        {
          $group: {
            _id: '$branchId',
            mtdRevenue: {
              $sum: { $max: [0, { $subtract: ['$totalAmount', { $ifNull: ['$refundedAmount', 0] }] }] }
            },
            mtdOrders: { $sum: 1 }
          }
        }
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo, $lte: now }
          }
        },
        {
          $group: {
            _id: '$branchId',
            totalOrders: { $sum: 1 },
            abnormalOrders: {
              $sum: { $cond: [{ $in: ['$orderStatus', RETURN_OR_CANCEL_STATUSES] }, 1, 0] }
            }
          }
        }
      ]),
      PosShift.find({
        status: SHIFT_STATUS.CLOSED,
        discrepancy: { $ne: 0 },
        'discrepancyResolution.status': { $ne: 'RESOLVED' }
      })
        .select('shiftCode branchId discrepancy closedAt')
        .sort({ closedAt: -1 })
        .limit(20)
        .lean(),
      BranchInventory.find({
        $or: [
          { minStock: { $gt: 0 }, $expr: { $lt: ['$quantity', '$minStock'] } },
          { quantity: { $lte: 2 } }
        ]
      })
        .populate('productId', 'name isActive skus')
        .limit(100)
        .lean(),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: fourteenDaysAgo, $lte: now },
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
      Serial.aggregate([
        {
          $match: {
            status: SERIAL_STATUS.IN_STOCK,
            createdAt: { $lte: deadStockCutoff }
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
            oldestAt: { $min: '$createdAt' }
          }
        },
        { $sort: { agedCount: -1 } },
        { $limit: 15 }
      ]),
      TransferRequest.countDocuments({
        status: TRANSFER_REQUEST_STATUS.PENDING,
        ...(hqBranchIds.length > 0 ? { sourceBranchId: { $in: hqBranchIds } } : {})
      }),
      ApprovalRequest.countDocuments({ status: APPROVAL_STATUS.PENDING })
    ]);

    const mtdMap = new Map(mtdByBranchAgg.map((r) => [String(r._id), r]));
    const stats7dMap = new Map(stats7dByBranchAgg.map((r) => [String(r._id), r]));
    const recentSalesMap = new Map(
      recentSkuSalesAgg.map((r) => [`${r._id.branchId}:${r._id.productSkuId}`, r.soldQty])
    );

    const deadStockProductIds = Array.from(
      new Set(deadStockAgg.map((d) => d._id.productId).filter(Boolean).map((id) => new mongoose.Types.ObjectId(id)))
    );
    const deadProducts = deadStockProductIds.length
      ? await Product.find({ _id: { $in: deadStockProductIds } }).select('name skus').lean()
      : [];
    const productMap = new Map(deadProducts.map((p) => [p._id.toString(), p]));

    const alerts = [];

    // 1. Cảnh báo Gian lận / Tỷ lệ hoàn hủy cao (>= 15% trong 7 ngày với tối thiểu 3 đơn)
    for (const row of stats7dByBranchAgg) {
      if (!row._id || row.totalOrders < 3) continue;
      const abnormalPct = Math.round((row.abnormalOrders / row.totalOrders) * 100);
      if (abnormalPct >= 15) {
        const br = branchMap.get(String(row._id));
        if (!br) continue;
        alerts.push({
          id: `fraud-return-${br._id}`,
          category: 'FRAUD_RETURN',
          severity: abnormalPct >= 30 ? 'CRITICAL' : 'WARNING',
          title: `Tỷ lệ hủy/hoàn đơn cao tại ${br.name}`,
          description: `${row.abnormalOrders}/${row.totalOrders} đơn trong 7 ngày qua bị hủy hoặc hoàn trả (${abnormalPct}%). Cần rà soát dấu hiệu bất thường.`,
          branchId: br._id,
          branchCode: br.branchCode,
          branchName: br.name,
          metricLabel: `${abnormalPct}% hoàn/hủy`,
          actionPath: '/portal/branch/orders',
          actionLabel: 'Kiểm tra đơn'
        });
      }
    }

    // 2. Cảnh báo Lệch két thu ngân chưa giải trình
    const shiftDiscrepancyByBranch = new Map();
    for (const shift of unresolvedShifts) {
      const bKey = String(shift.branchId);
      const curr = shiftDiscrepancyByBranch.get(bKey) || { count: 0, totalAbsVariance: 0, latestCode: shift.shiftCode };
      curr.count += 1;
      curr.totalAbsVariance += Math.abs(Number(shift.discrepancy || 0));
      shiftDiscrepancyByBranch.set(bKey, curr);
    }

    for (const [bId, info] of shiftDiscrepancyByBranch.entries()) {
      const br = branchMap.get(bId);
      if (!br) continue;
      alerts.push({
        id: `cash-discrepancy-${bId}`,
        category: 'CASH_DISCREPANCY',
        severity: info.totalAbsVariance >= 500000 ? 'CRITICAL' : 'WARNING',
        title: `${info.count} ca thu ngân lệch tiền chưa xử lý (${br.branchCode})`,
        description: `Tổng chênh lệch chưa lập biên bản giải trình là ${info.totalAbsVariance.toLocaleString('vi-VN')} ₫ (Ca gần nhất: ${info.latestCode}).`,
        branchId: br._id,
        branchCode: br.branchCode,
        branchName: br.name,
        metricLabel: `${info.totalAbsVariance.toLocaleString('vi-VN')} ₫`,
        actionPath: '/portal/shifts',
        actionLabel: 'Xem két ca'
      });
    }

    // 3. Cảnh báo Cháy hàng (dưới minStock hoặc hàng bán chạy tồn <= 2)
    let lowStockAlertCount = 0;
    for (const inv of lowStockDocs) {
      if (lowStockAlertCount >= 12) break;
      const br = branchMap.get(String(inv.branchId));
      const prod = inv.productId;
      if (!br || !prod || prod.isActive === false) continue;

      const minThreshold = Number(inv.minStock || 0);
      const sold14d = recentSalesMap.get(`${inv.branchId}:${inv.productSkuId}`) || 0;
      const isUnderConfiguredMin = minThreshold > 0 && inv.quantity < minThreshold;
      const isHotLowStock = minThreshold === 0 && inv.quantity <= 2 && sold14d > 0;

      if (!isUnderConfiguredMin && !isHotLowStock) continue;

      const skuObj = (prod.skus || []).find((s) => String(s._id) === String(inv.productSkuId));
      const skuCode = skuObj?.sku || 'SKU';
      const isHqBranch = Boolean(br.isHeadquarter || br.isWarehouse || br.branchCode === 'BR-HQ');

      alerts.push({
        id: `low-stock-${inv.branchId}-${inv.productSkuId}`,
        category: 'LOW_STOCK',
        severity: inv.quantity === 0 || isHqBranch ? 'CRITICAL' : 'WARNING',
        title: `${isHqBranch ? 'Kho tổng sắp hết' : 'Thiếu hàng tại'} ${br.branchCode}: ${skuCode}`,
        description: `${prod.name} chỉ còn ${inv.quantity} máy (định mức tối thiểu: ${minThreshold > 0 ? minThreshold : 3}, đã bán ${sold14d} trong 14 ngày).`,
        branchId: br._id,
        branchCode: br.branchCode,
        branchName: br.name,
        metricLabel: `Còn ${inv.quantity}`,
        actionPath: '/portal/branch/transfers',
        actionLabel: isHqBranch ? 'Nhập kho HQ' : 'Điều hàng ngay'
      });
      lowStockAlertCount += 1;
    }

    // 4. Cảnh báo Tồn kho đóng băng > 30 ngày
    for (const dead of deadStockAgg.slice(0, 8)) {
      const br = branchMap.get(String(dead._id.branchId));
      const prod = productMap.get(String(dead._id.productId));
      if (!br || !prod) continue;
      const skuObj = (prod.skus || []).find((s) => String(s._id) === String(dead._id.productSkuId));
      alerts.push({
        id: `dead-stock-${dead._id.branchId}-${dead._id.productSkuId}`,
        category: 'DEAD_STOCK',
        severity: dead.agedCount >= 5 ? 'WARNING' : 'INFO',
        title: `Hàng tồn > 30 ngày tại ${br.branchCode}: ${skuObj?.sku || prod.name}`,
        description: `Có ${dead.agedCount} máy Serial nằm kho quá 30 ngày chưa tiêu thụ. Cân nhắc luân chuyển sang chi nhánh khác.`,
        branchId: br._id,
        branchCode: br.branchCode,
        branchName: br.name,
        metricLabel: `${dead.agedCount} máy >30d`,
        actionPath: '/portal/branch/transfers',
        actionLabel: 'Điều chuyển'
      });
    }

    // 5. Cảnh báo Hụt chỉ tiêu doanh thu tháng
    const branchSnapshot = branches.map((br) => {
      const idStr = br._id.toString();
      const mtdRev = Number(mtdMap.get(idStr)?.mtdRevenue || 0);
      const mtdOrders = Number(mtdMap.get(idStr)?.mtdOrders || 0);
      const target = Number(br.monthlyRevenueTarget || 0);
      const targetPct = target > 0 ? Math.round((mtdRev / target) * 100) : null;
      const s7 = stats7dMap.get(idStr);
      const returnRate7d = s7 && s7.totalOrders > 0 ? Math.round((s7.abnormalOrders / s7.totalOrders) * 100) : 0;
      const unresolvedCount = shiftDiscrepancyByBranch.get(idStr)?.count || 0;

      if (
        !br.isHeadquarter &&
        target > 0 &&
        expectedMonthProgress >= 0.25 &&
        mtdRev < target * expectedMonthProgress * 0.5
      ) {
        alerts.push({
          id: `target-miss-${idStr}`,
          category: 'TARGET_MISS',
          severity: 'WARNING',
          title: `Chi nhánh ${br.branchCode} chậm tiến độ doanh số tháng`,
          description: `Mới đạt ${mtdRev.toLocaleString('vi-VN')} ₫ / ${target.toLocaleString('vi-VN')} ₫ (${targetPct}%) trong khi đã qua ${Math.round(expectedMonthProgress * 100)}% tháng.`,
          branchId: br._id,
          branchCode: br.branchCode,
          branchName: br.name,
          metricLabel: `${targetPct}% target`,
          actionPath: '/portal/admin/analytics',
          actionLabel: 'Xem BI'
        });
      }

      return {
        _id: br._id,
        branchCode: br.branchCode,
        name: br.name,
        region: br.region || 'KHAC',
        isHeadquarter: Boolean(br.isHeadquarter || br.branchCode === 'BR-HQ'),
        isWarehouse: Boolean(br.isWarehouse),
        monthlyRevenueTarget: target,
        mtdRevenue: mtdRev,
        mtdOrders,
        mtdProgressPct: targetPct,
        orders7d: s7?.totalOrders || 0,
        returnRate7d,
        unresolvedShifts: unresolvedCount
      };
    });

    // 6. Hàng đợi chờ HQ xử lý
    if (transferRequestsToHq > 0) {
      alerts.push({
        id: 'queue-transfer-requests-hq',
        category: 'PENDING_QUEUE',
        severity: 'INFO',
        title: `${transferRequestsToHq} yêu cầu xin cấp hàng gửi Kho HQ đang chờ duyệt`,
        description: 'Các chi nhánh bán lẻ đang chờ Kho Tổng phê duyệt và xuất điều chuyển bổ sung tồn kho.',
        branchId: null,
        branchCode: 'BR-HQ',
        branchName: 'Kho Tổng HQ',
        metricLabel: `${transferRequestsToHq} phiếu`,
        actionPath: '/portal/branch/stocktaking',
        actionLabel: 'Duyệt cấp hàng'
      });
    }

    if (pendingApprovals > 0) {
      alerts.push({
        id: 'queue-approvals-chain',
        category: 'PENDING_QUEUE',
        severity: 'WARNING',
        title: `${pendingApprovals} yêu cầu phê duyệt đặc quyền đang chờ xử lý`,
        description: 'Bao gồm hoàn trả giá trị cao, chi quỹ lớn hoặc hủy hóa đơn POS cần cấp quản lý kiểm tra.',
        branchId: null,
        branchCode: 'ALL',
        branchName: 'Toàn chuỗi',
        metricLabel: `${pendingApprovals} yêu cầu`,
        actionPath: '/portal/manager/approvals',
        actionLabel: 'Mở danh sách duyệt'
      });
    }

    alerts.sort((a, b) => (SEVERITY_WEIGHT[a.severity] ?? 9) - (SEVERITY_WEIGHT[b.severity] ?? 9));

    const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
    const warningCount = alerts.filter((a) => a.severity === 'WARNING').length;
    const infoCount = alerts.filter((a) => a.severity === 'INFO').length;
    const mtdRevenue = branchSnapshot.reduce((sum, b) => sum + b.mtdRevenue, 0);

    return {
      generatedAt: now.toISOString(),
      summary: {
        totalAlerts: alerts.length,
        criticalCount,
        warningCount,
        infoCount,
        activeBranchesCount: branches.length,
        retailBranchesCount: branches.filter((b) => !b.isHeadquarter && b.branchCode !== 'BR-HQ').length,
        todayRevenue: Number(todayAgg[0]?.revenue || 0),
        todayOrdersCount: Number(todayAgg[0]?.ordersCount || 0),
        mtdRevenue,
        pendingHqActions: transferRequestsToHq + pendingApprovals + unresolvedShifts.length
      },
      pendingQueues: {
        transferRequestsToHq,
        pendingApprovals,
        unresolvedDiscrepancies: unresolvedShifts.length
      },
      alerts,
      branchSnapshot
    };
  }
}
