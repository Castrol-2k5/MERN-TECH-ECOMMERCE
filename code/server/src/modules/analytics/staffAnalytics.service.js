import mongoose from 'mongoose';
import { Order, ORDER_STATUS, ORDER_TYPES } from '../orders/order.model.js';
import { PosShift } from '../shifts/posShift.model.js';
import { WarrantyTicket } from '../warranty/warranty.model.js';
import { AppError } from '../../utils/appError.js';

const VALID_RANGES = new Set(['today', '7d', '30d']);

export class StaffAnalyticsService {
  /**
   * Chuẩn hóa khoảng thời gian lọc báo cáo cá nhân
   */
  static resolveDateRange(range = '7d') {
    const normalized = VALID_RANGES.has(range) ? range : '7d';
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setHours(0, 0, 0, 0);

    if (normalized === '7d') {
      startDate.setDate(startDate.getDate() - 6);
    } else if (normalized === '30d') {
      startDate.setDate(startDate.getDate() - 29);
    }

    return { range: normalized, startDate, endDate };
  }

  /**
   * Thống kê doanh số & giao dịch cá nhân nghiêm ngặt theo staffId === userId (UC-POS-14)
   */
  static async getMyPerformance(userId, rawRange = '7d') {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Không xác định được tài khoản nhân viên.', 401, 'UNAUTHORIZED');
    }

    const { range, startDate, endDate } = this.resolveDateRange(rawRange);
    const staffObjectId = new mongoose.Types.ObjectId(userId);

    const completedOrderMatch = {
      staffId: staffObjectId,
      orderStatus: { $in: [ORDER_STATUS.COMPLETED, ORDER_STATUS.PARTIALLY_RETURNED] },
      createdAt: { $gte: startDate, $lte: endDate }
    };

    const [kpiAgg, dailyChartAgg, categoryAgg, shiftCount, warrantyCount, recentOrders] = await Promise.all([
      Order.aggregate([
        { $match: completedOrderMatch },
        {
          $project: {
            orderType: 1,
            netRevenue: {
              $max: [0, { $subtract: ['$totalAmount', { $ifNull: ['$refundedAmount', 0] }] }]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$netRevenue' },
            completedOrders: { $sum: 1 },
            posOrdersCount: {
              $sum: { $cond: [{ $eq: ['$orderType', ORDER_TYPES.POS_STORE] }, 1, 0] }
            }
          }
        }
      ]),
      Order.aggregate([
        { $match: completedOrderMatch },
        {
          $project: {
            dayKey: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: 'Asia/Ho_Chi_Minh'
              }
            },
            label: {
              $dateToString: {
                format: '%d/%m',
                date: '$createdAt',
                timezone: 'Asia/Ho_Chi_Minh'
              }
            },
            netRevenue: {
              $max: [0, { $subtract: ['$totalAmount', { $ifNull: ['$refundedAmount', 0] }] }]
            }
          }
        },
        {
          $group: {
            _id: '$dayKey',
            day: { $first: '$label' },
            revenue: { $sum: '$netRevenue' },
            ordersCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $match: completedOrderMatch },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'productDoc'
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'productDoc.categoryId',
            foreignField: '_id',
            as: 'categoryDoc'
          }
        },
        {
          $project: {
            categoryName: {
              $ifNull: [{ $arrayElemAt: ['$categoryDoc.name', 0] }, 'Sản phẩm công nghệ']
            },
            itemRevenue: { $ifNull: ['$items.subtotal', 0] },
            itemQty: { $ifNull: ['$items.quantity', 1] }
          }
        },
        {
          $group: {
            _id: '$categoryName',
            revenue: { $sum: '$itemRevenue' },
            units: { $sum: '$itemQty' }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]),
      PosShift.countDocuments({
        cashierId: staffObjectId,
        openedAt: { $gte: startDate, $lte: endDate }
      }),
      WarrantyTicket.countDocuments({
        staffId: staffObjectId,
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      Order.find({
        staffId: staffObjectId,
        createdAt: { $gte: startDate, $lte: endDate }
      })
        .select('orderCode orderType orderStatus paymentMethod paymentStatus totalAmount refundedAmount customerInfo items.productName items.quantity createdAt')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
    ]);

    const kpiRaw = kpiAgg[0] || {
      totalRevenue: 0,
      completedOrders: 0,
      posOrdersCount: 0
    };
    const avgOrderValue =
      kpiRaw.completedOrders > 0 ? Math.round(kpiRaw.totalRevenue / kpiRaw.completedOrders) : 0;

    const totalCategoryRev = categoryAgg.reduce((sum, c) => sum + (c.revenue || 0), 0);
    const categoryBreakdown = categoryAgg.map((c) => ({
      name: c._id,
      revenue: c.revenue,
      units: c.units,
      percentage: totalCategoryRev > 0 ? Math.round((c.revenue / totalCategoryRev) * 100) : 0
    }));

    return {
      range,
      period: { startDate, endDate },
      kpis: {
        totalRevenue: kpiRaw.totalRevenue,
        completedOrders: kpiRaw.completedOrders,
        posOrdersCount: kpiRaw.posOrdersCount,
        avgOrderValue,
        shiftCount,
        warrantyCount
      },
      dailyChart: dailyChartAgg.map((d) => ({
        day: d.day,
        revenue: d.revenue,
        ordersCount: d.ordersCount
      })),
      categoryBreakdown,
      recentOrders
    };
  }
}

export default StaffAnalyticsService;
