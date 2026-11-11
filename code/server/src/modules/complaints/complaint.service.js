import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  Complaint,
  COMPLAINT_STATUS,
  COMPLAINT_SEVERITY,
  COMPLAINT_REQUEST_TYPES
} from './complaint.model.js';
import { Order } from '../orders/order.model.js';
import { OrderService } from '../orders/order.service.js';
import { Serial } from '../serials/serial.model.js';
import { Branch } from '../branches/branch.model.js';
import { WarrantyTicket, WARRANTY_STATUS } from '../warranty/warranty.model.js';
import { AppError } from '../../utils/appError.js';
import { User, USER_ROLES } from '../users/user.model.js';
import { AuditLogService } from '../audit/auditLog.service.js';
import { AUDIT_ACTIONS } from '../audit/auditLog.model.js';

export class ComplaintService {
  static generateCode() {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `CMP-${dateStr}-${rand}`;
  }

  static async createComplaint(payload, currentUser) {
    const branchId =
      currentUser.role === USER_ROLES.SUPER_ADMIN
        ? payload.branchId || currentUser.branchId
        : currentUser.branchId;

    if (!branchId) {
      throw new AppError('Không xác định được chi nhánh tiếp nhận khiếu nại.', 400, 'BRANCH_REQUIRED');
    }

    let orderDoc = null;
    if (payload.orderCode) {
      orderDoc = await Order.findOne({ orderCode: payload.orderCode.trim().toUpperCase() }).lean();
    }

    const complaint = await Complaint.create({
      complaintCode: this.generateCode(),
      branchId: orderDoc?.branchId || branchId,
      orderId: orderDoc?._id || null,
      orderCode: orderDoc?.orderCode || payload.orderCode?.toUpperCase() || '',
      customerId: orderDoc?.customerId || null,
      requestType: payload.requestType || COMPLAINT_REQUEST_TYPES.SERVICE_COMPLAINT,
      serialNumber: (payload.serialNumber || '').trim().toUpperCase(),
      customerInfo: {
        fullName: payload.customerName,
        phone: payload.customerPhone
      },
      severity: payload.severity,
      status: COMPLAINT_STATUS.OPEN,
      description: payload.description,
      reportedBy: {
        userId: currentUser.id,
        fullName: currentUser.fullName || 'Nhân sự TechOne'
      }
    });

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.COMPLAINT_CREATE,
      target: {
        model: 'Complaint',
        entityId: complaint._id,
        code: complaint.complaintCode,
        name: `Khiếu nại ${complaint.complaintCode} (${payload.customerPhone})`
      },
      changes: {
        after: { severity: complaint.severity, status: complaint.status }
      },
      context: {
        reason: payload.description
      }
    });

    return complaint;
  }

  static async getComplaints(query = {}, currentUser) {
    const filter = {};
    if (currentUser.role !== USER_ROLES.SUPER_ADMIN) {
      filter.branchId = currentUser.branchId;
    } else if (query.branchId && query.branchId !== 'ALL') {
      filter.branchId = query.branchId;
    }

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.severity && query.severity !== 'ALL') {
      filter.severity = query.severity;
    }

    return Complaint.find(filter)
      .populate('branchId', 'name branchCode')
      .populate('assignedManagerId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  static async updateComplaint(id, payload, currentUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã phiếu khiếu nại không hợp lệ.', 400, 'INVALID_ID');
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      throw new AppError('Không tìm thấy phiếu khiếu nại.', 404, 'COMPLAINT_NOT_FOUND');
    }

    if (
      currentUser.role !== USER_ROLES.SUPER_ADMIN &&
      complaint.branchId.toString() !== currentUser.branchId?.toString()
    ) {
      throw new AppError('Bạn không có quyền xử lý khiếu nại của chi nhánh khác.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
    }

    const oldStatus = complaint.status;
    complaint.status = payload.status;
    complaint.resolutionNote = payload.resolutionNote;
    complaint.compensationNote = payload.compensationNote || '';
    complaint.assignedManagerId = currentUser.id;
    if ([COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED].includes(payload.status)) {
      complaint.resolvedAt = new Date();
    }
    await complaint.save();

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.COMPLAINT_RESOLVE,
      target: {
        model: 'Complaint',
        entityId: complaint._id,
        code: complaint.complaintCode,
        name: `Xử lý khiếu nại ${complaint.complaintCode}`
      },
      changes: {
        before: { status: oldStatus },
        after: { status: complaint.status, resolutionNote: complaint.resolutionNote }
      },
      context: {
        reason: complaint.resolutionNote,
        notes: complaint.compensationNote || 'Cập nhật xử lý khiếu nại'
      }
    });

    return complaint;
  }

  /**
   * Danh sách phiếu bảo hành chi nhánh đang mở / chờ khách duyệt giá / quá hạn (UC-BM-08)
   */
  static async getWarrantyWatchlist(targetBranchId) {
    const filter = {
      status: { $ne: WARRANTY_STATUS.RETURNED }
    };
    if (targetBranchId) {
      filter.branchId = targetBranchId;
    }

    const tickets = await WarrantyTicket.find(filter)
      .populate('productId', 'name')
      .populate('branchId', 'name branchCode')
      .sort({ createdAt: 1 })
      .limit(30)
      .lean();

    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    return tickets.map((t) => ({
      ...t,
      needsAttention:
        t.status === WARRANTY_STATUS.QUOTATION_PENDING ||
        t.status === WARRANTY_STATUS.READY_FOR_PICKUP ||
        new Date(t.createdAt).getTime() <= threeDaysAgo
    }));
  }

  /**
   * Khách hàng gửi Yêu cầu Bảo hành / Đổi trả / Khiếu nại Trực tuyến từ Sổ bảo hành hoặc Chi tiết đơn
   */
  static async createCustomerRequest(payload, currentUser) {
    const userDoc = await User.findById(currentUser.id).select('fullName phone').lean();
    const userVariants = OrderService.buildPhoneVariants(userDoc?.phone);

    let orderDoc = null;
    if (payload.orderCode) {
      orderDoc = await Order.findOne({ orderCode: payload.orderCode.trim().toUpperCase() }).lean();
      if (!orderDoc) {
        throw new AppError('Không tìm thấy mã đơn hàng liên quan.', 404, 'ORDER_NOT_FOUND');
      }
    }

    let serialDoc = null;
    const cleanSerial = (payload.serialNumber || '').trim().toUpperCase();
    if (cleanSerial) {
      serialDoc = await Serial.findOne({ serialNumber: cleanSerial }).lean();
      if (!orderDoc && serialDoc?.orderId) {
        orderDoc = await Order.findById(serialDoc.orderId).lean();
      }
    }

    // Kiểm tra quyền sở hữu đơn nếu gắn theo mã đơn hàng
    if (orderDoc) {
      let isOwner = orderDoc.customerId && String(orderDoc.customerId) === String(currentUser.id);
      if (!isOwner && orderDoc.customerInfo?.phone) {
        const orderVariants = OrderService.buildPhoneVariants(orderDoc.customerInfo.phone);
        isOwner = userVariants.some((p) => orderVariants.includes(p));
      }
      if (!isOwner) {
        throw new AppError(
          'Bạn không có quyền gửi yêu cầu hậu mãi cho đơn hàng của người khác.',
          403,
          'FORBIDDEN_ORDER_ACCESS'
        );
      }
    }

    let targetBranchId = orderDoc?.branchId || serialDoc?.branchId || payload.branchId || null;
    if (!targetBranchId) {
      const fallbackBranch = await Branch.findOne({ isActive: true }).select('_id').lean();
      targetBranchId = fallbackBranch?._id || null;
    }
    if (!targetBranchId) {
      throw new AppError('Không xác định được chi nhánh tiếp nhận yêu cầu.', 400, 'BRANCH_REQUIRED');
    }

    const requestType = payload.requestType || COMPLAINT_REQUEST_TYPES.WARRANTY_REQUEST;
    const severity =
      requestType === COMPLAINT_REQUEST_TYPES.WARRANTY_REQUEST
        ? COMPLAINT_SEVERITY.NORMAL
        : COMPLAINT_SEVERITY.HIGH;

    const complaint = await Complaint.create({
      complaintCode: this.generateCode(),
      branchId: targetBranchId,
      orderId: orderDoc?._id || null,
      orderCode: orderDoc?.orderCode || payload.orderCode?.trim().toUpperCase() || '',
      customerId: currentUser.id,
      requestType,
      serialNumber: cleanSerial,
      customerInfo: {
        fullName: userDoc?.fullName || currentUser.fullName || 'Khách hàng TechOne',
        phone: userDoc?.phone || orderDoc?.customerInfo?.phone || 'Chưa cập nhật'
      },
      severity,
      status: COMPLAINT_STATUS.OPEN,
      description: payload.description,
      reportedBy: {
        userId: currentUser.id,
        fullName: userDoc?.fullName || currentUser.fullName || 'Khách hàng TechOne'
      }
    });

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.COMPLAINT_CREATE,
      target: {
        model: 'Complaint',
        entityId: complaint._id,
        code: complaint.complaintCode,
        name: `Yêu cầu khách hàng (${requestType}) ${complaint.complaintCode}`
      },
      changes: {
        after: { requestType, severity, status: complaint.status, serialNumber: cleanSerial }
      },
      context: {
        reason: payload.description
      }
    });

    return Complaint.findById(complaint._id)
      .populate('branchId', 'name branchCode address phone')
      .lean();
  }

  /**
   * Khách hàng xem danh sách Yêu cầu Bảo hành / Đổi trả / Khiếu nại đã gửi
   */
  static async getMyRequests(customerId) {
    const userDoc = await User.findById(customerId).select('phone').lean();
    const phoneVariants = OrderService.buildPhoneVariants(userDoc?.phone);

    const conditions = [{ customerId }];
    if (phoneVariants.length > 0) {
      conditions.push({ 'customerInfo.phone': { $in: phoneVariants } });
    }

    return Complaint.find(conditions.length > 1 ? { $or: conditions } : conditions[0])
      .populate('branchId', 'name branchCode address phone')
      .populate('assignedManagerId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }
}

export default ComplaintService;
