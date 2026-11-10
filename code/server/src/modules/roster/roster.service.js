import mongoose from 'mongoose';
import {
  WorkSchedule,
  SHIFT_TIME_RULES,
  ATTENDANCE_STATUS,
  SWAP_STATUS
} from './workSchedule.model.js';
import { User, USER_ROLES } from '../users/user.model.js';
import { AppError } from '../../utils/appError.js';
import { AuditLogService } from '../audit/auditLog.service.js';
import { AUDIT_ACTIONS } from '../audit/auditLog.model.js';

export class RosterService {
  static getVnNowParts() {
    const now = new Date();
    const vnStr = now.toLocaleString('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const [datePart, timePart] = vnStr.split(', ');
    const [hh, mm] = (timePart || '00:00').split(':').map(Number);
    return {
      dateStr: datePart,
      minutesOfDay: (hh || 0) * 60 + (mm || 0),
      now
    };
  }

  static async assignShift(payload, currentUser) {
    const branchId =
      currentUser.role === USER_ROLES.SUPER_ADMIN
        ? payload.branchId || currentUser.branchId
        : currentUser.branchId;

    if (!branchId) {
      throw new AppError('Không xác định được chi nhánh xếp ca.', 400, 'BRANCH_REQUIRED');
    }

    const staff = await User.findById(payload.staffId).lean();
    if (!staff) {
      throw new AppError('Không tìm thấy nhân viên.', 404, 'USER_NOT_FOUND');
    }

    if (staff.branchId?.toString() !== branchId.toString()) {
      throw new AppError('Chỉ được xếp lịch cho nhân sự thuộc cùng chi nhánh.', 403, 'CROSS_BRANCH_FORBIDDEN');
    }

    const exists = await WorkSchedule.findOne({
      branchId,
      staffId: payload.staffId,
      dateStr: payload.dateStr,
      shiftType: payload.shiftType
    }).lean();

    if (exists) {
      throw new AppError('Nhân viên này đã được xếp vào ca làm việc này trong ngày.', 409, 'SHIFT_ALREADY_ASSIGNED');
    }

    const created = await WorkSchedule.create({
      branchId,
      staffId: payload.staffId,
      dateStr: payload.dateStr,
      shiftType: payload.shiftType,
      assignedById: currentUser.id
    });

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.ROSTER_ASSIGN,
      target: {
        model: 'WorkSchedule',
        entityId: created._id,
        code: `${payload.dateStr}-${payload.shiftType}`,
        name: `Xếp ca ${staff.fullName} (${payload.dateStr})`
      },
      changes: {
        after: { staffId: payload.staffId, dateStr: payload.dateStr, shiftType: payload.shiftType }
      }
    });

    return WorkSchedule.findById(created._id)
      .populate('staffId', 'fullName email phone role')
      .populate('swapRequest.targetStaffId', 'fullName')
      .lean();
  }

  static async getWeeklyRoster(query = {}, currentUser) {
    const filter = {};
    if (currentUser.role === USER_ROLES.SUPER_ADMIN && query.branchId && query.branchId !== 'ALL') {
      filter.branchId = query.branchId;
    } else if (currentUser.branchId) {
      filter.branchId = currentUser.branchId;
    }

    if (query.startDate && query.endDate) {
      filter.dateStr = { $gte: query.startDate, $lte: query.endDate };
    }

    return WorkSchedule.find(filter)
      .populate('staffId', 'fullName email phone role')
      .populate('swapRequest.targetStaffId', 'fullName')
      .sort({ dateStr: 1, shiftType: 1 })
      .lean();
  }

  static async removeShift(id, currentUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã lịch ca không hợp lệ.', 400, 'INVALID_ID');
    }

    const doc = await WorkSchedule.findById(id);
    if (!doc) {
      throw new AppError('Không tìm thấy lịch ca.', 404, 'SCHEDULE_NOT_FOUND');
    }

    if (
      currentUser.role !== USER_ROLES.SUPER_ADMIN &&
      doc.branchId.toString() !== currentUser.branchId?.toString()
    ) {
      throw new AppError('Bạn không có quyền xóa ca của chi nhánh khác.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
    }

    if (doc.attendanceStatus !== ATTENDANCE_STATUS.SCHEDULED) {
      throw new AppError('Chỉ có thể xóa ca chưa chấm công.', 400, 'CANNOT_DELETE_ATTENDED_SHIFT');
    }

    await doc.deleteOne();
    return { deleted: true, id };
  }

  static async checkInShift(id, currentUser) {
    const doc = await WorkSchedule.findById(id);
    if (!doc) {
      throw new AppError('Không tìm thấy ca làm việc.', 404, 'SCHEDULE_NOT_FOUND');
    }

    const isOwner = doc.staffId.toString() === currentUser.id.toString();
    const isManager =
      currentUser.role === USER_ROLES.SUPER_ADMIN ||
      (currentUser.role === USER_ROLES.BRANCH_MANAGER &&
        doc.branchId.toString() === currentUser.branchId?.toString());

    if (!isOwner && !isManager) {
      throw new AppError('Bạn không thể Check-in hộ lịch ca của người khác.', 403, 'ACCESS_DENIED');
    }

    if (doc.attendanceStatus !== ATTENDANCE_STATUS.SCHEDULED) {
      throw new AppError('Ca này đã được Check-in trước đó.', 400, 'ALREADY_CHECKED_IN');
    }

    const { dateStr: todayStr, minutesOfDay, now } = this.getVnNowParts();
    const rule = SHIFT_TIME_RULES[doc.shiftType];
    const isLate =
      doc.dateStr === todayStr && rule && minutesOfDay > rule.startMinutes + 10;

    doc.actualCheckInAt = now;
    doc.attendanceStatus = isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.CHECKED_IN;
    await doc.save();

    return WorkSchedule.findById(doc._id)
      .populate('staffId', 'fullName email phone role')
      .populate('swapRequest.targetStaffId', 'fullName')
      .lean();
  }

  static async checkOutShift(id, currentUser) {
    const doc = await WorkSchedule.findById(id);
    if (!doc) {
      throw new AppError('Không tìm thấy ca làm việc.', 404, 'SCHEDULE_NOT_FOUND');
    }

    const isOwner = doc.staffId.toString() === currentUser.id.toString();
    const isManager =
      currentUser.role === USER_ROLES.SUPER_ADMIN ||
      (currentUser.role === USER_ROLES.BRANCH_MANAGER &&
        doc.branchId.toString() === currentUser.branchId?.toString());

    if (!isOwner && !isManager) {
      throw new AppError('Bạn không thể Check-out hộ lịch ca của người khác.', 403, 'ACCESS_DENIED');
    }

    if (![ATTENDANCE_STATUS.CHECKED_IN, ATTENDANCE_STATUS.LATE].includes(doc.attendanceStatus)) {
      throw new AppError('Cần Check-in trước khi Check-out kết ca.', 400, 'NOT_CHECKED_IN');
    }

    doc.actualCheckOutAt = new Date();
    doc.attendanceStatus = ATTENDANCE_STATUS.COMPLETED;
    await doc.save();

    return WorkSchedule.findById(doc._id)
      .populate('staffId', 'fullName email phone role')
      .populate('swapRequest.targetStaffId', 'fullName')
      .lean();
  }

  static async requestSwap(id, payload, currentUser) {
    const doc = await WorkSchedule.findById(id);
    if (!doc) {
      throw new AppError('Không tìm thấy ca làm việc.', 404, 'SCHEDULE_NOT_FOUND');
    }

    if (doc.staffId.toString() !== currentUser.id.toString()) {
      throw new AppError('Bạn chỉ có thể xin đổi ca của chính mình.', 403, 'ACCESS_DENIED');
    }

    if (doc.attendanceStatus !== ATTENDANCE_STATUS.SCHEDULED) {
      throw new AppError('Không thể xin đổi ca đã chấm công.', 400, 'CANNOT_SWAP_ATTENDED_SHIFT');
    }

    doc.swapRequest = {
      status: SWAP_STATUS.PENDING,
      requestedNote: payload.requestedNote,
      targetStaffId: payload.targetStaffId || null,
      reviewedById: null,
      reviewNote: ''
    };
    await doc.save();

    return WorkSchedule.findById(doc._id)
      .populate('staffId', 'fullName email phone role')
      .populate('swapRequest.targetStaffId', 'fullName')
      .lean();
  }

  static async reviewSwap(id, payload, currentUser) {
    const doc = await WorkSchedule.findById(id);
    if (!doc) {
      throw new AppError('Không tìm thấy ca làm việc.', 404, 'SCHEDULE_NOT_FOUND');
    }

    if (
      currentUser.role !== USER_ROLES.SUPER_ADMIN &&
      doc.branchId.toString() !== currentUser.branchId?.toString()
    ) {
      throw new AppError('Bạn không có quyền duyệt đổi ca của chi nhánh khác.', 403, 'CROSS_BRANCH_ACCESS_DENIED');
    }

    if (doc.swapRequest?.status !== SWAP_STATUS.PENDING) {
      throw new AppError('Ca này không có yêu cầu đổi ca đang chờ duyệt.', 400, 'NO_PENDING_SWAP');
    }

    doc.swapRequest.status = payload.decision;
    doc.swapRequest.reviewedById = currentUser.id;
    doc.swapRequest.reviewNote = payload.reviewNote || '';

    if (payload.decision === 'APPROVED' && doc.swapRequest.targetStaffId) {
      const conflict = await WorkSchedule.findOne({
        branchId: doc.branchId,
        staffId: doc.swapRequest.targetStaffId,
        dateStr: doc.dateStr,
        shiftType: doc.shiftType,
        _id: { $ne: doc._id }
      }).lean();

      if (conflict) {
        throw new AppError('Nhân viên nhận ca thay thế đã có lịch trùng khung giờ này.', 409, 'TARGET_STAFF_CONFLICT');
      }
      doc.staffId = doc.swapRequest.targetStaffId;
    }

    await doc.save();

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.ROSTER_SWAP_REVIEW,
      target: {
        model: 'WorkSchedule',
        entityId: doc._id,
        code: `${doc.dateStr}-${doc.shiftType}`,
        name: `Duyệt đổi ca (${payload.decision})`
      },
      context: {
        reason: payload.reviewNote || doc.swapRequest.requestedNote
      }
    });

    return WorkSchedule.findById(doc._id)
      .populate('staffId', 'fullName email phone role')
      .populate('swapRequest.targetStaffId', 'fullName')
      .lean();
  }
}

export default RosterService;
