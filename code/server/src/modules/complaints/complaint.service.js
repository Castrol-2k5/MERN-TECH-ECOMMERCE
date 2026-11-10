import crypto from 'crypto';
import mongoose from 'mongoose';
import { Complaint, COMPLAINT_STATUS } from './complaint.model.js';
import { Order } from '../orders/order.model.js';
import { WarrantyTicket, WARRANTY_STATUS } from '../warranty/warranty.model.js';
import { AppError } from '../../utils/appError.js';
import { USER_ROLES } from '../users/user.model.js';
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
}

export default ComplaintService;
