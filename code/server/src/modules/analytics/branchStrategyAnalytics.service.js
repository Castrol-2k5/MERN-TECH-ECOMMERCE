import mongoose from 'mongoose';
import { Order, ORDER_STATUS, ORDER_TYPES } from '../orders/order.model.js';
import { BranchInventory } from '../inventory/inventory.model.js';
import { Serial, SERIAL_STATUS } from '../serials/serial.model.js';
import { AppError } from '../../utils/appError.js';

const ACTIVE_REVENUE_STATUSES = [
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.PARTIALLY_RETURNED,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.READY_FOR_SHIPPING
];

export class BranchStrategyAnalyticsService {
  /**
   * Dashboard Chiến lược Chi nhánh (UC-BM-07):
   * - Omnichannel breakdown (POS vs B2C)
   * - Peak Hours (08h-22h)
   * - Sales Velocity & Days of Supply
   * - Aging Stock (> 30 ngày)
   */
  static async getBranchStrategy(targetBranchId = null, rawDays = 30) {
    const days = Math.max(1, Math.min(90, Number(rawDays) || 30));
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const agingCutoff = new Date(now);
    agingCutoff.setDate(agingCutoff.getDate() - 30);

    let branchFilter = {};
    if (targetBranchId) {
      if (!mongoose.Types.ObjectId.isValid(targetBranchId)) {
        throw new AppError('Mã chi nhánh không hợp lệ.', 400, 'INVALID_BRANCH_ID');
      }
      branchFilter = { branchId: new mongoose.Types.ObjectId(targetBranchId) };
    }

    const orderMatch = {
      ...branchFilter,
      createdAt: { $gte: startDate, $lte: now },
      orderStatus: { $in: ACTIVE_REVENUE_STATUSES }
    };

    const completedMatch = {
      ...branchFilter,
      createdAt: { $gte: startDate, $lte: now },
      orderStatus: { $in: [ORDER_STATUS.COMPLETED, ORDER_STATUS.PARTIALLY_RETURNED] }
    };

    const [channelAgg, hourlyAgg, velocityAgg, inventories, agedSerialsAgg] = await Promise.all([
      Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: '$orderType',
            revenue: {
              $sum: { $max: [0, { $subtract: ['$totalAmount', { $ifNull: ['$refundedAmount', 0] }] }] }
            },
            ordersCount: { $sum: 1 }
          }
        }
      ]),
      Order.aggregate([
        { $match: orderMatch },
        {
          $project: {
            hour: { $hour: { date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } },
            orderType: 1,
            netRevenue: {
              $max: [0, { $subtract: ['$totalAmount', { $ifNull: ['$refundedAmount', 0] }] }]
            }
          }
        },
        {
          $group: {
            _id: '$hour',
            posOrders: {
              $sum: { $cond: [{ $eq: ['$orderType', ORDER_TYPES.POS_STORE] }, 1, 0] }
            },
            onlineOrders: {
              $sum: { $cond: [{ $eq: ['$orderType', ORDER_TYPES.B2C_ONLINE] }, 1, 0] }
            },
            totalOrders: { $sum: 1 },
            revenue: { $sum: '$netRevenue' }
          }
        }
      ]),
      Order.aggregate([
        { $match: completedMatch },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productSkuId',
            productName: { $first: '$items.productName' },
            sku: { $first: '$items.sku' },
            unitsSold: { $sum: { $ifNull: ['$items.quantity', 1] } },
            revenue: { $sum: { $ifNull: ['$items.subtotal', 0] } }
          }
        },
        { $sort: { unitsSold: -1, revenue: -1 } },
        { $limit: 12 }
      ]),
      BranchInventory.find({ ...branchFilter, quantity: { $gt: 0 } })
        .populate('productId', 'name skus isSerialManaged')
        .lean(),
      Serial.aggregate([
        {
          $match: {
            ...branchFilter,
            status: SERIAL_STATUS.IN_STOCK,
            createdAt: { $lte: agingCutoff }
          }
        },
        {
          $group: {
            _id: '$productSkuId',
            agedSerialCount: { $sum: 1 },
            oldestCreatedAt: { $min: '$createdAt' },
            sampleSerials: { $push: '$serialNumber' }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'skus._id',
            as: 'productDocs'
          }
        },
        { $sort: { oldestCreatedAt: 1 } },
        { $limit: 15 }
      ])
    ]);

    // 1. Omnichannel breakdown
    const posBucket = channelAgg.find((c) => c._id === ORDER_TYPES.POS_STORE) || { revenue: 0, ordersCount: 0 };
    const onlineBucket = channelAgg.find((c) => c._id === ORDER_TYPES.B2C_ONLINE) || { revenue: 0, ordersCount: 0 };
    const totalRevenue = posBucket.revenue + onlineBucket.revenue;
    const posSharePercent = totalRevenue > 0 ? Math.round((posBucket.revenue / totalRevenue) * 100) : 0;
    const onlineSharePercent = totalRevenue > 0 ? 100 - posSharePercent : 0;

    // 2. Peak Hours (08h - 22h)
    const hourMap = new Map(hourlyAgg.map((h) => [h._id, h]));
    const peakHours = [];
    for (let h = 8; h <= 22; h += 1) {
      const bucket = hourMap.get(h) || { posOrders: 0, onlineOrders: 0, totalOrders: 0, revenue: 0 };
      peakHours.push({
        hour: h,
        hourLabel: `${String(h).padStart(2, '0')}:00`,
        posOrders: bucket.posOrders,
        onlineOrders: bucket.onlineOrders,
        totalOrders: bucket.totalOrders,
        revenue: bucket.revenue
      });
    }
    const peakHourSlot = peakHours.reduce(
      (best, cur) => (cur.totalOrders > best.totalOrders ? cur : best),
      peakHours[0]
    );

    // 3. Sales Velocity
    const stockBySkuMap = new Map();
    for (const inv of inventories) {
      const key = inv.productSkuId.toString();
      stockBySkuMap.set(key, (stockBySkuMap.get(key) || 0) + Number(inv.quantity || 0));
    }

    const soldSkuSet = new Set(velocityAgg.map((v) => v._id?.toString()).filter(Boolean));
    const salesVelocity = velocityAgg.map((v) => {
      const skuKey = v._id?.toString();
      const currentStock = stockBySkuMap.get(skuKey) || 0;
      const dailyVelocity = Number((v.unitsSold / days).toFixed(2));
      const daysOfSupply = dailyVelocity > 0 ? Math.round(currentStock / dailyVelocity) : null;
      return {
        productSkuId: skuKey,
        productName: v.productName,
        sku: v.sku,
        unitsSold: v.unitsSold,
        revenue: v.revenue,
        currentStock,
        dailyVelocity,
        daysOfSupply,
        restockAlert: currentStock <= 2 || (daysOfSupply !== null && daysOfSupply <= 7)
      };
    });

    // 4. Aging Stock (> 30 ngày) — ưu tiên Serial cũ + fallback non-serial inventory cập nhật > 30 ngày và chưa bán
    const agingStock = agedSerialsAgg.map((ag) => {
      const prod = ag.productDocs?.[0];
      const skuObj = prod?.skus?.find((s) => s._id.toString() === ag._id.toString());
      const ageDays = Math.floor((now.getTime() - new Date(ag.oldestCreatedAt).getTime()) / (24 * 60 * 60 * 1000));
      return {
        productSkuId: ag._id.toString(),
        productName: prod?.name || 'Sản phẩm lưu kho lâu',
        sku: skuObj?.sku || 'SKU',
        agedQuantity: ag.agedSerialCount,
        ageDays,
        oldestDate: ag.oldestCreatedAt,
        sampleSerials: (ag.sampleSerials || []).slice(0, 3)
      };
    });

    const agingSkuIds = new Set(agingStock.map((a) => a.productSkuId));
    for (const inv of inventories) {
      const skuKey = inv.productSkuId.toString();
      if (agingSkuIds.has(skuKey) || soldSkuSet.has(skuKey)) continue;
      if (new Date(inv.updatedAt) <= agingCutoff) {
        const prod = inv.productId;
        const skuObj = prod?.skus?.find((s) => s._id.toString() === skuKey);
        const ageDays = Math.floor((now.getTime() - new Date(inv.updatedAt).getTime()) / (24 * 60 * 60 * 1000));
        agingStock.push({
          productSkuId: skuKey,
          productName: prod?.name || 'Phụ kiện / Sản phẩm',
          sku: skuObj?.sku || 'SKU',
          agedQuantity: inv.quantity,
          ageDays,
          oldestDate: inv.updatedAt,
          sampleSerials: []
        });
      }
    }

    agingStock.sort((a, b) => b.ageDays - a.ageDays);

    return {
      days,
      omnichannel: {
        totalRevenue,
        posRevenue: posBucket.revenue,
        onlineRevenue: onlineBucket.revenue,
        posOrders: posBucket.ordersCount,
        onlineOrders: onlineBucket.ordersCount,
        posSharePercent,
        onlineSharePercent
      },
      peakHourSlot: peakHourSlot && peakHourSlot.totalOrders > 0 ? peakHourSlot : null,
      peakHours,
      salesVelocity,
      agingStock: agingStock.slice(0, 15)
    };
  }
}

export default BranchStrategyAnalyticsService;
