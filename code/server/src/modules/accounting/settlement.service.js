import crypto from 'crypto';
import mongoose from 'mongoose';
import { InterBranchSettlement, SETTLEMENT_STATUS, SETTLEMENT_TYPE } from './interBranchSettlement.model.js';
import { Branch } from '../branches/branch.model.js';
import { AppError } from '../../utils/appError.js';
import { USER_ROLES } from '../users/user.model.js';

export class SettlementService {
  /**
   * Tự động tạo bản ghi bù trừ nội bộ khi đơn hàng Online / Click & Collect hoàn tất
   */
  static async recordOrderSettlement(order) {
    if (!order || !order._id) return null;

    // Chỉ tạo đối soát khi đơn đã thanh toán hoặc hoàn tất
    if (!['PAID', 'COMPLETED'].includes(order.paymentStatus) && order.orderStatus !== 'COMPLETED') {
      return null;
    }

    // Nếu đơn POS tại quầy và do chính chi nhánh đó thu tiền mặt thì không cần đối soát liên chi nhánh
    if (order.orderType === 'POS_STORE') {
      return null;
    }

    // Xác định Trụ sở chính (HQ) là nơi giữ tiền thanh toán online
    const hqBranch = await Branch.findOne({ isHeadquarter: true }).lean();
    const sourceBranchId = hqBranch ? hqBranch._id : order.branchId;
    const fulfillingBranchId = order.branchId;

    if (!fulfillingBranchId) return null;

    // Nếu chi nhánh xuất hàng chính là Trụ sở chính thì không phát sinh bù trừ chéo
    if (sourceBranchId && sourceBranchId.toString() === fulfillingBranchId.toString()) {
      return null;
    }

    // Kiểm tra xem đã có bản ghi đối soát cho đơn này chưa
    const existing = await InterBranchSettlement.findOne({ orderId: order._id });
    if (existing) {
      if (existing.status === SETTLEMENT_STATUS.SETTLED) return existing;
      existing.orderAmount = Number(order.totalAmount) || 0;
      existing.cogsAmount = Math.round(existing.orderAmount * 0.85); // 85% giá vốn ước lượng
      existing.fulfillmentFee = Math.round(existing.orderAmount * 0.03); // 3% hoa hồng dịch vụ showroom
      existing.totalPayableToBranch = existing.cogsAmount + existing.fulfillmentFee;
      await existing.save();
      return existing;
    }

    const orderAmount = Number(order.totalAmount) || 0;
    const cogsAmount = Math.round(orderAmount * 0.85);
    const fulfillmentFee = Math.round(orderAmount * 0.03);
    const totalPayableToBranch = cogsAmount + fulfillmentFee;

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const settlementCode = `STL-${dateStr}-${randomSuffix}`;

    const settlement = await InterBranchSettlement.create({
      settlementCode,
      type: SETTLEMENT_TYPE.CLICK_AND_COLLECT_PAYOUT,
      orderId: order._id,
      orderCode: order.orderCode,
      sourceBranchId,
      fulfillingBranchId,
      orderAmount,
      cogsAmount,
      fulfillmentFee,
      totalPayableToBranch,
      status: SETTLEMENT_STATUS.PENDING_CLEARING
    });

    return settlement;
  }

  /**
   * Lấy danh sách các khoản bù trừ công nợ nội bộ
   */
  static async getSettlements(query = {}, currentUser) {
    const {
      branchId,
      status,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = query;

    const filter = {};

    // Phân quyền Scoping
    if (currentUser.role === USER_ROLES.BRANCH_MANAGER || currentUser.role === USER_ROLES.STAFF) {
      const userBranchId = currentUser.branchId;
      filter.$or = [
        { fulfillingBranchId: userBranchId },
        { sourceBranchId: userBranchId }
      ];
    } else if (currentUser.role === USER_ROLES.SUPER_ADMIN) {
      if (branchId && branchId !== 'ALL') {
        filter.$or = [
          { fulfillingBranchId: branchId },
          { sourceBranchId: branchId }
        ];
      }
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (type && type !== 'ALL') {
      filter.type = type;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [settlements, total, summaryAgg] = await Promise.all([
      InterBranchSettlement.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('sourceBranchId', 'name code address isHeadquarter')
        .populate('fulfillingBranchId', 'name code address')
        .populate('clearedById', 'fullName email')
        .lean(),
      InterBranchSettlement.countDocuments(filter),
      InterBranchSettlement.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalPendingPayable: {
              $sum: {
                $cond: [{ $eq: ['$status', SETTLEMENT_STATUS.PENDING_CLEARING] }, '$totalPayableToBranch', 0]
              }
            },
            totalSettled: {
              $sum: {
                $cond: [{ $eq: ['$status', SETTLEMENT_STATUS.SETTLED] }, '$totalPayableToBranch', 0]
              }
            },
            totalFulfillmentFees: {
              $sum: '$fulfillmentFee'
            }
          }
        }
      ])
    ]);

    const summary = summaryAgg[0] || {
      totalPendingPayable: 0,
      totalSettled: 0,
      totalFulfillmentFees: 0
    };

    return {
      settlements,
      summary,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    };
  }

  /**
   * Kế toán Trụ sở xác nhận thanh toán bù trừ tiền cho Chi nhánh
   */
  static async settlePayment(settlementId, payload, currentUser) {
    if (currentUser.role !== USER_ROLES.SUPER_ADMIN) {
      throw new AppError('Chỉ Kế toán Trụ sở chính (SUPER_ADMIN) mới có quyền duyệt thanh toán bù trừ.', 403, 'ACCESS_DENIED');
    }

    const settlement = await InterBranchSettlement.findById(settlementId);
    if (!settlement) {
      throw new AppError('Không tìm thấy phiếu đối soát bù trừ.', 404, 'SETTLEMENT_NOT_FOUND');
    }

    if (settlement.status === SETTLEMENT_STATUS.SETTLED) {
      throw new AppError('Khoản bù trừ này đã được thanh toán trước đó.', 400, 'ALREADY_SETTLED');
    }

    settlement.status = SETTLEMENT_STATUS.SETTLED;
    settlement.clearedAt = new Date();
    settlement.clearedById = currentUser.id;
    settlement.bankTransferRef = payload.bankTransferRef || '';
    if (payload.notes) settlement.notes = payload.notes;

    await settlement.save();
    return settlement;
  }
}
