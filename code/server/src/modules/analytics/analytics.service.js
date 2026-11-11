import mongoose from 'mongoose';
import { Order, ORDER_STATUS } from '../orders/order.model.js';
import { Branch } from '../branches/branch.model.js';
import { Product } from '../products/product.model.js';

const ACTIVE_REVENUE_STATUSES = [
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.PARTIALLY_RETURNED,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.READY_FOR_SHIPPING
];

const RETURN_OR_CANCEL_STATUSES = [
  ORDER_STATUS.RETURNED,
  ORDER_STATUS.PARTIALLY_RETURNED,
  ORDER_STATUS.CANCELLED
];

export class AnalyticsService {
  static formatCompactVnd(amount = 0) {
    const num = Number(amount) || 0;
    if (num === 0) return '0 ₫';
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 1000000000) {
      return sign + (abs / 1000000000).toFixed(2).replace('.', ',') + ' tỷ';
    }
    if (abs >= 1000000) {
      return sign + (abs / 1000000).toFixed(2).replace('.', ',') + ' triệu';
    }
    return num.toLocaleString('vi-VN') + ' ₫';
  }

  static formatGrowthPct(current = 0, previous = 0) {
    const curr = Number(current || 0);
    const prev = Number(previous || 0);
    if (prev <= 0) {
      return curr > 0 ? '+100,0%' : '0,0%';
    }
    const pct = ((curr - prev) / prev) * 100;
    const rounded = (Math.round(pct * 10) / 10).toFixed(1).replace('.', ',');
    return `${pct > 0 ? '+' : ''}${rounded}%`;
  }

  static formatRatePct(numerator = 0, denominator = 0) {
    if (!denominator || denominator <= 0) return '0,0%';
    const pct = (Number(numerator || 0) / Number(denominator)) * 100;
    return (Math.round(pct * 10) / 10).toFixed(1).replace('.', ',') + '%';
  }

  static resolveComparisonPeriods(startDate, endDate) {
    const now = new Date();
    const currEnd = endDate ? new Date(endDate) : new Date(now);
    currEnd.setHours(23, 59, 59, 999);

    const currStart = startDate ? new Date(startDate) : new Date(currEnd);
    if (!startDate) {
      currStart.setDate(currStart.getDate() - 29);
    }
    currStart.setHours(0, 0, 0, 0);

    const spanMs = Math.max(24 * 60 * 60 * 1000, currEnd.getTime() - currStart.getTime() + 1);
    const prevEnd = new Date(currStart.getTime() - 1);
    const prevStart = new Date(currStart.getTime() - spanMs);

    return { currStart, currEnd, prevStart, prevEnd };
  }

  /**
   * Tổng quan phân tích kinh doanh (KPIs, Doanh thu theo ngày, Kênh bán hàng, Store Ranking thật, Top sản phẩm)
   */
  static async getOverview({ branchId, startDate, endDate } = {}) {
    const matchFilter = {};

    if (branchId && branchId !== 'ALL') {
      matchFilter.branchId = new mongoose.Types.ObjectId(branchId);
    }

    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) {
        matchFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.createdAt.$lte = end;
      }
    }

    const { currStart, currEnd, prevStart, prevEnd } = this.resolveComparisonPeriods(
      startDate,
      endDate
    );

    const revenueFilter = {
      ...matchFilter,
      orderStatus: { $in: ACTIVE_REVENUE_STATUSES }
    };

    const currentWindowRevenueFilter = {
      ...(branchId && branchId !== 'ALL' ? { branchId: new mongoose.Types.ObjectId(branchId) } : {}),
      createdAt: { $gte: currStart, $lte: currEnd },
      orderStatus: { $in: ACTIVE_REVENUE_STATUSES }
    };

    const previousWindowRevenueFilter = {
      ...(branchId && branchId !== 'ALL' ? { branchId: new mongoose.Types.ObjectId(branchId) } : {}),
      createdAt: { $gte: prevStart, $lte: prevEnd },
      orderStatus: { $in: ACTIVE_REVENUE_STATUSES }
    };

    const [
      kpiAggregation,
      currWindowAgg,
      prevWindowAgg,
      revenueOverTime,
      channelAggregation,
      branchSalesAgg,
      branchOrderHealthAgg,
      prevBranchAgg,
      branchOrderItems,
      allBranches,
      allProducts,
      topProductsAgg
    ] = await Promise.all([
      Order.aggregate([
        { $match: revenueFilter },
        {
          $project: {
            netRevenue: {
              $max: [0, { $subtract: ['$totalAmount', { $ifNull: ['$refundedAmount', 0] }] }]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$netRevenue' },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: '$netRevenue' }
          }
        }
      ]),
      Order.aggregate([
        { $match: currentWindowRevenueFilter },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: { $max: [0, { $subtract: ['$totalAmount', { $ifNull: ['$refundedAmount', 0] }] }] }
            }
          }
        }
      ]),
      Order.aggregate([
        { $match: previousWindowRevenueFilter },
        {
          $group: {
            _id: '$branchId',
            revenue: {
              $sum: { $max: [0, { $subtract: ['$totalAmount', { $ifNull: ['$refundedAmount', 0] }] }] }
            }
          }
        }
      ]),
      Order.aggregate([
        { $match: revenueFilter },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: '%d/%m', date: '$createdAt' } },
              orderType: '$orderType'
            },
            revenue: {
              $sum: { $max: [0, { $subtract: ['$totalAmount', { $ifNull: ['$refundedAmount', 0] }] }] }
            }
          }
        },
        {
          $group: {
            _id: '$_id.day',
            online: {
              $sum: {
                $cond: [{ $eq: ['$_id.orderType', 'B2C_ONLINE'] }, '$revenue', 0]
              }
            },
            pos: {
              $sum: {
                $cond: [{ $eq: ['$_id.orderType', 'POS_STORE'] }, '$revenue', 0]
              }
            },
            total: { $sum: '$revenue' }
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            day: '$_id',
            online: { $round: [{ $divide: ['$online', 1000000] }, 1] },
            pos: { $round: [{ $divide: ['$pos', 1000000] }, 1] },
            total: { $round: [{ $divide: ['$total', 1000000] }, 1] }
          }
        }
      ]),
      Order.aggregate([
        { $match: revenueFilter },
        {
          $group: {
            _id: '$orderType',
            revenue: {
              $sum: { $max: [0, { $subtract: ['$totalAmount', { $ifNull: ['$refundedAmount', 0] }] }] }
            },
            count: { $sum: 1 }
          }
        }
      ]),
      Order.aggregate([
        { $match: revenueFilter },
        {
          $group: {
            _id: '$branchId',
            revenue: {
              $sum: { $max: [0, { $subtract: ['$totalAmount', { $ifNull: ['$refundedAmount', 0] }] }] }
            },
            orders: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } }
      ]),
      Order.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$branchId',
            totalAllOrders: { $sum: 1 },
            returnedOrCancelled: {
              $sum: { $cond: [{ $in: ['$orderStatus', RETURN_OR_CANCEL_STATUSES] }, 1, 0] }
            }
          }
        }
      ]),
      Order.aggregate([
        { $match: currentWindowRevenueFilter },
        {
          $group: {
            _id: '$branchId',
            revenue: {
              $sum: { $max: [0, { $subtract: ['$totalAmount', { $ifNull: ['$refundedAmount', 0] }] }] }
            }
          }
        }
      ]),
      Order.find(revenueFilter).select('branchId items totalAmount refundedAmount').lean(),
      Branch.find().lean(),
      Product.find().select('skus._id skus.costPrice').lean(),
      Order.aggregate([
        { $match: revenueFilter },
        { $unwind: '$items' },
        {
          $group: {
            _id: {
              sku: '$items.sku',
              productName: '$items.productName'
            },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ])
    ]);

    const totalRevenue = kpiAggregation[0]?.totalRevenue || 0;
    const totalOrders = kpiAggregation[0]?.totalOrders || 0;
    const avgOrderValue = Math.round(kpiAggregation[0]?.avgOrderValue || 0);

    const currChainWindowRev = currWindowAgg[0]?.revenue || 0;
    const prevChainWindowRev = prevWindowAgg.reduce((sum, r) => sum + Number(r.revenue || 0), 0);
    const overallGrowth = this.formatGrowthPct(currChainWindowRev, prevChainWindowRev);

    const onlineRev = channelAggregation.find((c) => c._id === 'B2C_ONLINE')?.revenue || 0;
    const posRev = channelAggregation.find((c) => c._id === 'POS_STORE')?.revenue || 0;
    const sumRev = onlineRev + posRev || 1;

    const channelData = [
      {
        name: 'B2C Web Online',
        value: Math.round((onlineRev / sumRev) * 100) || 0,
        revenue: AnalyticsService.formatCompactVnd(onlineRev),
        color: '#2563EB'
      },
      {
        name: 'Web POS Quầy',
        value: Math.round((posRev / sumRev) * 100) || 0,
        revenue: AnalyticsService.formatCompactVnd(posRev),
        color: '#06B6D4'
      }
    ];

    const branchMap = new Map(allBranches.map((b) => [b._id.toString(), b]));
    const healthMap = new Map(branchOrderHealthAgg.map((h) => [String(h._id), h]));
    const prevBranchMap = new Map(prevWindowAgg.map((r) => [String(r._id), Number(r.revenue || 0)]));
    const currWindowBranchMap = new Map(prevBranchAgg.map((r) => [String(r._id), Number(r.revenue || 0)]));

    const skuCostMap = new Map();
    for (const p of allProducts) {
      for (const s of p.skus || []) {
        skuCostMap.set(String(s._id), Number(s.costPrice || 0));
      }
    }

    const branchCogsMap = new Map();
    for (const ord of branchOrderItems) {
      const bKey = String(ord.branchId);
      let cogs = 0;
      for (const it of ord.items || []) {
        const keptQty = Math.max(0, Number(it.quantity || 0) - Number(it.returnedQuantity || 0));
        const unitCost =
          Number(it.costPrice || 0) > 0
            ? Number(it.costPrice)
            : skuCostMap.get(String(it.productSkuId)) || 0;
        cogs += keptQty * unitCost;
      }
      branchCogsMap.set(bKey, (branchCogsMap.get(bKey) || 0) + cogs);
    }

    const maxBranchRev = branchSalesAgg[0]?.revenue || 1;
    const colors = ['bg-blue-600', 'bg-cyan-400', 'bg-purple-500', 'bg-emerald-500'];

    const branchSales = branchSalesAgg.slice(0, 5).map((b, idx) => {
      const br = branchMap.get(b._id?.toString());
      return {
        name: br?.name || 'Chi nhánh ' + (idx + 1),
        revenue: AnalyticsService.formatCompactVnd(b.revenue),
        percentage: Math.round((b.revenue / maxBranchRev) * 100),
        color: colors[idx % colors.length]
      };
    });

    const branchPerformance = branchSalesAgg.map((b, idx) => {
      const bKey = b._id?.toString();
      const br = branchMap.get(bKey);
      const health = healthMap.get(bKey);
      const currRevForGrowth = currWindowBranchMap.get(bKey) ?? b.revenue;
      const prevRevForGrowth = prevBranchMap.get(bKey) || 0;
      const cogs = branchCogsMap.get(bKey) || 0;
      const grossProfit = Math.max(0, b.revenue - cogs);
      const target = Number(br?.monthlyRevenueTarget || 0);

      return {
        rank: String(idx + 1).padStart(2, '0'),
        branchId: b._id,
        branchCode: br?.branchCode || '',
        branch: br?.name || 'Chi nhánh ' + (idx + 1),
        revenueRaw: b.revenue,
        revenue: AnalyticsService.formatCompactVnd(b.revenue),
        orders: b.orders.toLocaleString('vi-VN'),
        aov: AnalyticsService.formatCompactVnd(Math.round(b.revenue / (b.orders || 1))),
        returnRate: this.formatRatePct(health?.returnedOrCancelled || 0, health?.totalAllOrders || 0),
        growth: this.formatGrowthPct(currRevForGrowth, prevRevForGrowth),
        grossMarginPct: b.revenue > 0 ? this.formatRatePct(grossProfit, b.revenue) : '0,0%',
        targetAmount: target > 0 ? AnalyticsService.formatCompactVnd(target) : '--',
        targetAchievementPct: target > 0 ? this.formatRatePct(b.revenue, target) : '--'
      };
    });

    const rankColors = ['text-amber-400', 'text-slate-300', 'text-amber-600', 'text-blue-400', 'text-cyan-400'];

    const topProducts = topProductsAgg.map((p, idx) => ({
      rank: idx + 1,
      name: p._id.productName,
      sku: p._id.sku,
      quantity: `${p.quantity} chiếc`,
      revenue: AnalyticsService.formatCompactVnd(p.revenue),
      color: rankColors[idx % rankColors.length]
    }));

    return {
      kpis: {
        totalRevenue: AnalyticsService.formatCompactVnd(totalRevenue),
        totalOrders: totalOrders.toLocaleString('vi-VN'),
        avgOrderValue: AnalyticsService.formatCompactVnd(avgOrderValue),
        growth: overallGrowth
      },
      revenueOverTime,
      channelData,
      branchSales,
      branchPerformance,
      topProducts
    };
  }
}
