import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  ApprovalRequest,
  APPROVAL_TYPES,
  APPROVAL_LEVELS,
  APPROVAL_STATUS
} from './approval.model.js';
import { Order, ORDER_STATUS, ORDER_TYPES } from '../orders/order.model.js';
import { OrderReturnService } from '../orders/orderReturn.service.js';
import { OrderService } from '../orders/order.service.js';
import { PosShift, SHIFT_STATUS } from '../shifts/posShift.model.js';
import { PosShiftService } from '../shifts/posShift.service.js';
import { BranchExpense, EXPENSE_STATUS } from '../finance/branchExpense.model.js';
import { AppError } from '../../utils/appError.js';
import { USER_ROLES } from '../users/user.model.js';
import { AuditLogService } from '../audit/auditLog.service.js';
import { AUDIT_ACTIONS } from '../audit/auditLog.model.js';

export class ApprovalService {
  static generateRequestCode() {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `APR-${dateStr}-${rand}`;
  }

  /**
   * Nhân viên tạo yêu cầu phê duyệt đặc quyền gửi Quản lý chi nhánh (UC-BM-04)
   */
  static async createRequest(dto, currentUser) {
    const { type, targetId, reason, payload = {} } = dto;
    let branchId = currentUser.branchId;
    let targetModel = 'Order';
    let targetCode = '';
    let estimatedAmount = 0;
    let approvalLevel = APPROVAL_LEVELS.BRANCH_MANAGER;

    if (
      type === APPROVAL_TYPES.HIGH_VALUE_RETURN ||
      type === APPROVAL_TYPES.EXECUTIVE_HIGH_REFUND
    ) {
      const order = await Order.findById(targetId).lean();
      if (!order) {
        throw new AppError('Không tìm thấy đơn hàng cần hoàn trả.', 404, 'ORDER_NOT_FOUND');
      }
      if (
        currentUser.role !== USER_ROLES.SUPER_ADMIN &&
        currentUser.branchId &&
        order.branchId.toString() !== currentUser.branchId.toString()
      ) {
        throw new AppError('Bạn không thể gửi yêu cầu cho đơn của chi nhánh khác.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
      }
      if (![ORDER_STATUS.COMPLETED, ORDER_STATUS.PARTIALLY_RETURNED].includes(order.orderStatus)) {
        throw new AppError('Chỉ có thể gửi duyệt trả hàng cho đơn đã hoàn tất.', 400, 'INVALID_ORDER_STATUS');
      }

      const items = Array.isArray(payload.items) ? payload.items : [];
      if (items.length === 0) {
        throw new AppError('Danh sách sản phẩm hoàn trả không được để trống.', 400, 'EMPTY_RETURN_ITEMS');
      }
      for (const reqItem of items) {
        const orderItem = (order.items || []).find((it) =>
          reqItem.orderItemId
            ? it._id.toString() === reqItem.orderItemId.toString()
            : it.productSkuId.toString() === reqItem.productSkuId?.toString()
        );
        if (!orderItem) {
          throw new AppError('Sản phẩm hoàn trả không tồn tại trong đơn.', 404, 'ORDER_ITEM_NOT_FOUND');
        }
        estimatedAmount += Number(orderItem.unitPrice || 0) * Number(reqItem.quantity || 1);
      }
      branchId = order.branchId;
      targetModel = 'Order';
      targetCode = order.orderCode;
      if (type === APPROVAL_TYPES.EXECUTIVE_HIGH_REFUND) {
        approvalLevel = APPROVAL_LEVELS.EXECUTIVE;
      }
    } else if (type === APPROVAL_TYPES.EXECUTIVE_EXPENSE) {
      const expense = await BranchExpense.findById(targetId).lean();
      if (!expense) {
        throw new AppError('Không tìm thấy phiếu chi phí vận hành.', 404, 'EXPENSE_NOT_FOUND');
      }
      branchId = expense.branchId;
      targetModel = 'BranchExpense';
      targetCode = expense.expenseCode;
      estimatedAmount = Number(expense.amount || 0);
      approvalLevel = APPROVAL_LEVELS.EXECUTIVE;
    } else if (type === APPROVAL_TYPES.LARGE_CASH_OUT) {
      const shift = await PosShift.findById(targetId).lean();
      if (!shift) {
        throw new AppError('Không tìm thấy ca làm việc.', 404, 'SHIFT_NOT_FOUND');
      }
      if (shift.status !== SHIFT_STATUS.OPEN) {
        throw new AppError('Ca làm việc đã chốt, không thể gửi yêu cầu chi tiền.', 400, 'SHIFT_ALREADY_CLOSED');
      }
      if (
        currentUser.role !== USER_ROLES.SUPER_ADMIN &&
        currentUser.branchId &&
        shift.branchId.toString() !== currentUser.branchId.toString()
      ) {
        throw new AppError('Bạn không thể gửi yêu cầu chi tiền cho ca của chi nhánh khác.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
      }
      const amt = Number(payload.amount || 0);
      if (amt < 1000) {
        throw new AppError('Số tiền chi tối thiểu 1.000 ₫.', 400, 'INVALID_AMOUNT');
      }
      if (amt > Number(shift.expectedEndingBalance || 0)) {
        throw new AppError('Số dư lý thuyết trong két không đủ để lập phiếu chi này.', 400, 'INSUFFICIENT_DRAWER_CASH');
      }
      branchId = shift.branchId;
      targetModel = 'PosShift';
      targetCode = shift.shiftCode;
      estimatedAmount = amt;
    } else if (type === APPROVAL_TYPES.VOID_POS_ORDER) {
      const order = await Order.findById(targetId).lean();
      if (!order) {
        throw new AppError('Không tìm thấy hóa đơn POS cần hủy.', 404, 'ORDER_NOT_FOUND');
      }
      if (
        currentUser.role !== USER_ROLES.SUPER_ADMIN &&
        currentUser.branchId &&
        order.branchId.toString() !== currentUser.branchId.toString()
      ) {
        throw new AppError('Bạn không thể gửi yêu cầu hủy đơn của chi nhánh khác.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
      }
      if (order.orderType !== ORDER_TYPES.POS_STORE || order.orderStatus !== ORDER_STATUS.COMPLETED) {
        throw new AppError('Chỉ áp dụng yêu cầu hủy cho hóa đơn POS đang ở trạng thái COMPLETED.', 400, 'INVALID_ORDER_STATUS');
      }
      branchId = order.branchId;
      targetModel = 'Order';
      targetCode = order.orderCode;
      estimatedAmount = Number(order.totalAmount || 0);
    }

    const existingPending = await ApprovalRequest.findOne({
      targetId,
      type,
      status: APPROVAL_STATUS.PENDING
    }).lean();
    if (existingPending) {
      throw new AppError(
        `Đã có yêu cầu đang chờ duyệt (${existingPending.requestCode}) cho đối tượng này.`,
        409,
        'DUPLICATE_PENDING_APPROVAL'
      );
    }

    const doc = await ApprovalRequest.create({
      requestCode: this.generateRequestCode(),
      branchId,
      type,
      approvalLevel,
      status: APPROVAL_STATUS.PENDING,
      requestedBy: {
        userId: currentUser.id,
        fullName: currentUser.fullName || 'Nhân viên POS',
        role: currentUser.role
      },
      targetModel,
      targetId,
      targetCode,
      estimatedAmount,
      reason,
      payload
    });

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.APPROVAL_REQUEST_CREATE,
      target: {
        model: 'ApprovalRequest',
        entityId: doc._id,
        code: doc.requestCode,
        name: `${type} - ${targetCode}`
      },
      changes: {
        after: { status: APPROVAL_STATUS.PENDING, estimatedAmount }
      },
      context: {
        reason,
        notes: `Yêu cầu phê duyệt ${type} cho ${targetCode} (${estimatedAmount.toLocaleString('vi-VN')} ₫)`
      }
    });

    return doc;
  }

  /**
   * Danh sách yêu cầu phê duyệt (scoping: STAFF thấy yêu cầu của mình, BRANCH_MANAGER thấy toàn chi nhánh)
   */
  static async getRequests(query = {}, currentUser) {
    const filter = {};
    if (currentUser.role === USER_ROLES.STAFF) {
      filter.branchId = currentUser.branchId;
      filter['requestedBy.userId'] = currentUser.id;
    } else if (currentUser.role === USER_ROLES.BRANCH_MANAGER) {
      filter.branchId = currentUser.branchId;
    } else if (currentUser.role === USER_ROLES.SUPER_ADMIN && query.branchId && query.branchId !== 'ALL') {
      filter.branchId = query.branchId;
    }

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.type && query.type !== 'ALL') {
      filter.type = query.type;
    }
    if (query.approvalLevel && query.approvalLevel !== 'ALL') {
      filter.approvalLevel = query.approvalLevel;
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      ApprovalRequest.find(filter)
        .populate('branchId', 'name branchCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ApprovalRequest.countDocuments(filter)
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Polling nhẹ lấy số yêu cầu đang chờ duyệt (ApprovalAlertBell)
   */
  static async getAlerts(targetBranchId) {
    const filter = { status: APPROVAL_STATUS.PENDING };
    if (targetBranchId) {
      filter.branchId = targetBranchId;
    }

    const [pendingCount, alerts] = await Promise.all([
      ApprovalRequest.countDocuments(filter),
      ApprovalRequest.find(filter)
        .select('requestCode type targetCode estimatedAmount reason requestedBy branchId createdAt')
        .populate('branchId', 'name branchCode')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    return { pendingCount, alerts };
  }

  static assertReviewPermission(request, currentUser) {
    if (![USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN].includes(currentUser.role)) {
      throw new AppError('Chỉ Quản lý Chi nhánh hoặc Super Admin mới có quyền phê duyệt.', 403, 'FORBIDDEN');
    }
    if (
      request.approvalLevel === APPROVAL_LEVELS.EXECUTIVE &&
      currentUser.role !== USER_ROLES.SUPER_ADMIN
    ) {
      throw new AppError(
        'Yêu cầu Phê duyệt Tối cao (Executive) chỉ thuộc thẩm quyền của Quản lý tổng (SUPER_ADMIN).',
        403,
        'EXECUTIVE_APPROVAL_REQUIRED'
      );
    }
    if (
      currentUser.role === USER_ROLES.BRANCH_MANAGER &&
      request.branchId.toString() !== currentUser.branchId?.toString()
    ) {
      throw new AppError('Bạn không có quyền duyệt yêu cầu của chi nhánh khác.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
    }
    if (request.status !== APPROVAL_STATUS.PENDING) {
      throw new AppError(`Yêu cầu này đã được xử lý trước đó (${request.status}).`, 400, 'APPROVAL_ALREADY_REVIEWED');
    }
  }

  /**
   * Phê duyệt yêu cầu & Tự động thực thi nghiệp vụ đích
   */
  static async approveRequest(id, { reviewNote = '' } = {}, currentUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã yêu cầu phê duyệt không hợp lệ.', 400, 'INVALID_ID');
    }

    const request = await ApprovalRequest.findById(id);
    if (!request) {
      throw new AppError('Không tìm thấy yêu cầu phê duyệt.', 404, 'APPROVAL_NOT_FOUND');
    }

    this.assertReviewPermission(request, currentUser);

    let executionResult = null;

    if (
      request.type === APPROVAL_TYPES.HIGH_VALUE_RETURN ||
      request.type === APPROVAL_TYPES.EXECUTIVE_HIGH_REFUND
    ) {
      const res = await OrderReturnService.processReturn(
        request.targetId.toString(),
        {
          items: request.payload?.items || [],
          refundMethod: request.payload?.refundMethod || 'CASH',
          reason: request.reason
        },
        currentUser,
        { bypassApproval: true }
      );
      executionResult = {
        returnCode: res.returnRecord?.returnCode,
        refundAmount: res.returnRecord?.refundAmount,
        orderStatus: res.order?.orderStatus
      };
    } else if (request.type === APPROVAL_TYPES.LARGE_CASH_OUT) {
      const updatedShift = await PosShiftService.recordCashVoucher(
        request.targetId.toString(),
        {
          type: 'OUT',
          category: request.payload?.category || 'Chi phí vận hành quầy',
          amount: Number(request.payload?.amount || request.estimatedAmount),
          reason: request.reason
        },
        currentUser,
        { bypassApproval: true }
      );
      executionResult = {
        shiftCode: updatedShift.shiftCode,
        expectedEndingBalance: updatedShift.expectedEndingBalance
      };
    } else if (request.type === APPROVAL_TYPES.VOID_POS_ORDER) {
      const res = await OrderService.voidCompletedPosOrder(
        request.targetId.toString(),
        { reason: request.reason },
        currentUser,
        { bypassApproval: true }
      );
      executionResult = {
        orderCode: res.order?.orderCode,
        orderStatus: res.order?.orderStatus,
        shiftAdjusted: res.shiftAdjusted
      };
    } else if (request.type === APPROVAL_TYPES.EXECUTIVE_EXPENSE) {
      const expense = await BranchExpense.findByIdAndUpdate(
        request.targetId,
        {
          $set: {
            status: EXPENSE_STATUS.APPROVED,
            reviewedBy: {
              userId: currentUser.id,
              fullName: currentUser.fullName || 'Quản trị viên HQ'
            },
            reviewedAt: new Date(),
            reviewNote: reviewNote || 'Duyệt ngân sách tối cao'
          }
        },
        { new: true }
      ).lean();

      executionResult = {
        expenseCode: expense?.expenseCode,
        amount: expense?.amount,
        status: expense?.status
      };
    }

    request.status = APPROVAL_STATUS.APPROVED;
    request.reviewedBy = {
      userId: currentUser.id,
      fullName: currentUser.fullName || 'Quản lý chi nhánh'
    };
    request.reviewedAt = new Date();
    request.reviewNote = reviewNote;
    request.executionResult = executionResult;
    await request.save();

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.APPROVAL_REQUEST_APPROVE,
      target: {
        model: 'ApprovalRequest',
        entityId: request._id,
        code: request.requestCode,
        name: `Duyệt ${request.type} (${request.targetCode})`
      },
      changes: {
        before: { status: APPROVAL_STATUS.PENDING },
        after: { status: APPROVAL_STATUS.APPROVED, executionResult }
      },
      context: {
        reason: reviewNote || request.reason
      }
    });

    return request;
  }

  /**
   * Từ chối yêu cầu phê duyệt
   */
  static async rejectRequest(id, { reviewNote = '' } = {}, currentUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã yêu cầu phê duyệt không hợp lệ.', 400, 'INVALID_ID');
    }

    const request = await ApprovalRequest.findById(id);
    if (!request) {
      throw new AppError('Không tìm thấy yêu cầu phê duyệt.', 404, 'APPROVAL_NOT_FOUND');
    }

    this.assertReviewPermission(request, currentUser);

    request.status = APPROVAL_STATUS.REJECTED;
    request.reviewedBy = {
      userId: currentUser.id,
      fullName: currentUser.fullName || 'Quản lý chi nhánh'
    };
    request.reviewedAt = new Date();
    request.reviewNote = reviewNote || 'Quản lý chi nhánh từ chối phê duyệt';
    await request.save();

    if (request.type === APPROVAL_TYPES.EXECUTIVE_EXPENSE) {
      await BranchExpense.findByIdAndUpdate(request.targetId, {
        $set: {
          status: EXPENSE_STATUS.REJECTED,
          reviewedBy: {
            userId: currentUser.id,
            fullName: currentUser.fullName || 'Quản trị viên HQ'
          },
          reviewedAt: new Date(),
          reviewNote: request.reviewNote
        }
      });
    }

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.APPROVAL_REQUEST_REJECT,
      target: {
        model: 'ApprovalRequest',
        entityId: request._id,
        code: request.requestCode,
        name: `Từ chối ${request.type} (${request.targetCode})`
      },
      changes: {
        before: { status: APPROVAL_STATUS.PENDING },
        after: { status: APPROVAL_STATUS.REJECTED, reviewNote: request.reviewNote }
      },
      context: {
        reason: request.reviewNote
      }
    });

    return request;
  }
}

export default ApprovalService;
