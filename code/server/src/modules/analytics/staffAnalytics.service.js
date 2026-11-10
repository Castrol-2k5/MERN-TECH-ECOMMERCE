import mongoose from 'mongoose';
import { Order, ORDER_STATUS, ORDER_TYPES } from '../orders/order.model.js';
import { PosShift } from '../shifts/posShift.model.js';
import { WarrantyTicket } from '../warranty/warranty.model.js';
import { User, USER_ROLES } from '../users/user.model.js';
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

  /**
   * Bảng xếp hạng KPI hiệu suất nhân sự theo chi nhánh (UC-BM-02)
   */
  static async getBranchStaffKpi(targetBranchId = null, rawRange = '7d') {
    const { range, startDate, endDate } = this.resolveDateRange(rawRange);

    const staffFilter = {
      role: { $in: [USER_ROLES.STAFF, USER_ROLES.BRANCH_MANAGER] }
    };
    if (targetBranchId) {
      if (!mongoose.Types.ObjectId.isValid(targetBranchId)) {
        throw new AppError('Mã chi nhánh không hợp lệ.', 400, 'INVALID_BRANCH_ID');
      }
      staffFilter.branchId = new mongoose.Types.ObjectId(targetBranchId);
    }

    const staffList = await User.find(staffFilter)
      .select('fullName email phone role isActive branchId')
      .populate('branchId', 'name branchCode')
      .lean();

    if (!staffList.length) {
      return {
        range,
        period: { startDate, endDate },
        summary: {
          totalTeamRevenue: 0,
          totalTeamOrders: 0,
          activeStaffCount: 0,
          topPerformer: null
        },
        ranking: []
      };
    }

    const staffIds = staffList.map((u) => u._id);

    const [orderStatsAgg, shiftStatsAgg, warrantyStatsAgg] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            staffId: { $in: staffIds },
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: {
              $in: [
                ORDER_STATUS.COMPLETED,
                ORDER_STATUS.PARTIALLY_RETURNED,
                ORDER_STATUS.RETURNED
              ]
            }
          }
        },
        {
          $project: {
            staffId: 1,
            orderType: 1,
            orderStatus: 1,
            netRevenue: {
              $cond: [
                { $in: ['$orderStatus', [ORDER_STATUS.COMPLETED, ORDER_STATUS.PARTIALLY_RETURNED]] },
                { $max: [0, { $subtract: ['$totalAmount', { $ifNull: ['$refundedAmount', 0] }] }] },
                0
              ]
            }
          }
        },
        {
          $group: {
            _id: '$staffId',
            netRevenue: { $sum: '$netRevenue' },
            completedOrders: {
              $sum: {
                $cond: [
                  { $in: ['$orderStatus', [ORDER_STATUS.COMPLETED, ORDER_STATUS.PARTIALLY_RETURNED]] },
                  1,
                  0
                ]
              }
            },
            posOrdersCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$orderType', ORDER_TYPES.POS_STORE] },
                      { $in: ['$orderStatus', [ORDER_STATUS.COMPLETED, ORDER_STATUS.PARTIALLY_RETURNED]] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            returnedOrdersCount: {
              $sum: {
                $cond: [
                  { $in: ['$orderStatus', [ORDER_STATUS.PARTIALLY_RETURNED, ORDER_STATUS.RETURNED]] },
                  1,
                  0
                ]
              }
            },
            totalHandledOrders: { $sum: 1 }
          }
        }
      ]),
      PosShift.aggregate([
        {
          $match: {
            cashierId: { $in: staffIds },
            openedAt: { $gte: startDate, $lte: endDate }
          }
        },
        { $group: { _id: '$cashierId', shiftCount: { $sum: 1 } } }
      ]),
      WarrantyTicket.aggregate([
        {
          $match: {
            staffId: { $in: staffIds },
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        { $group: { _id: '$staffId', warrantyCount: { $sum: 1 } } }
      ])
    ]);

    const orderMap = new Map(orderStatsAgg.map((o) => [o._id.toString(), o]));
    const shiftMap = new Map(shiftStatsAgg.map((s) => [s._id.toString(), s.shiftCount]));
    const warrantyMap = new Map(warrantyStatsAgg.map((w) => [w._id.toString(), w.warrantyCount]));

    const ranking = staffList
      .map((member) => {
        const key = member._id.toString();
        const oStat = orderMap.get(key) || {
          netRevenue: 0,
          completedOrders: 0,
          posOrdersCount: 0,
          returnedOrdersCount: 0,
          totalHandledOrders: 0
        };
        const avgOrderValue =
          oStat.completedOrders > 0 ? Math.round(oStat.netRevenue / oStat.completedOrders) : 0;
        const returnRate =
          oStat.totalHandledOrders > 0
            ? Number(((oStat.returnedOrdersCount / oStat.totalHandledOrders) * 100).toFixed(1))
            : 0;

        return {
          staffId: member._id,
          fullName: member.fullName,
          email: member.email,
          phone: member.phone,
          role: member.role,
          isActive: member.isActive,
          branchName: member.branchId?.name || 'Chi nhánh',
          netRevenue: oStat.netRevenue,
          completedOrders: oStat.completedOrders,
          posOrdersCount: oStat.posOrdersCount,
          returnedOrdersCount: oStat.returnedOrdersCount,
          avgOrderValue,
          returnRate,
          shiftCount: shiftMap.get(key) || 0,
          warrantyCount: warrantyMap.get(key) || 0
        };
      })
      .sort((a, b) => b.netRevenue - a.netRevenue || b.completedOrders - a.completedOrders)
      .map((row, index) => ({ ...row, rank: index + 1 }));

    const totalTeamRevenue = ranking.reduce((sum, r) => sum + r.netRevenue, 0);
    const totalTeamOrders = ranking.reduce((sum, r) => sum + r.completedOrders, 0);
    const activeStaffCount = staffList.filter((s) => s.isActive).length;

    return {
      range,
      period: { startDate, endDate },
      summary: {
        totalTeamRevenue,
        totalTeamOrders,
        activeStaffCount,
        totalStaffCount: staffList.length,
        topPerformer: ranking[0] || null
      },
      ranking
    };
  }
}

export default StaffAnalyticsService;
