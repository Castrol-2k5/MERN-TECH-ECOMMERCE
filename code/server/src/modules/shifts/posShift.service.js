import crypto from 'crypto';
import mongoose from 'mongoose';
import { PosShift, SHIFT_STATUS } from './posShift.model.js';
import { Branch } from '../branches/branch.model.js';
import { AppError } from '../../utils/appError.js';
import { USER_ROLES } from '../users/user.model.js';
import { AuditLogService } from '../audit/auditLog.service.js';
import { AUDIT_ACTIONS } from '../audit/auditLog.model.js';

export class PosShiftService {
  /**
   * Mở ca thu ngân mới
   */
  static async openShift(payload, currentUser) {
    const branchId = payload.branchId || currentUser.branchId;

    if (!branchId) {
      throw new AppError(
        'Không tìm thấy chi nhánh công tác của thu ngân. Vui lòng chọn chi nhánh.',
        400,
        'BRANCH_REQUIRED'
      );
    }

    const branch = await Branch.findById(branchId).lean();
    if (!branch || !branch.isActive) {
      throw new AppError('Chi nhánh không tồn tại hoặc đã tạm dừng hoạt động.', 404, 'BRANCH_NOT_FOUND');
    }

    // Kiểm tra xem thu ngân đã có ca nào đang mở hay chưa
    const existingShift = await PosShift.findOne({
      cashierId: currentUser.id,
      status: SHIFT_STATUS.OPEN
    });

    if (existingShift) {
      return existingShift;
    }

    const openingBalance = Number(payload.openingBalance) || 0;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const shiftCode = `SHF-${dateStr}-${randomSuffix}`;

    const shift = await PosShift.create({
      shiftCode,
      branchId,
      cashierId: currentUser.id,
      openedAt: now,
      status: SHIFT_STATUS.OPEN,
      openingBalance,
      expectedEndingBalance: openingBalance,
      cashSales: 0,
      cashRefunds: 0,
      cashDrops: [],
      totalOrdersCount: 0
    });

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.POS_SHIFT_OPEN,
      target: {
        model: 'PosShift',
        entityId: shift._id,
        code: shift.shiftCode,
        name: `Ca thu ngân ${shift.shiftCode}`
      },
      changes: {
        after: {
          openingBalance,
          status: SHIFT_STATUS.OPEN
        }
      },
      context: {
        notes: `Mở ca tại chi nhánh ${branch.branchCode || branch.name}`
      }
    });

    return shift;
  }

  /**
   * Lấy ca hiện tại của thu ngân hoặc chi nhánh
   */
  static async getCurrentShift(currentUser, query = {}) {
    const branchId = query.branchId || currentUser.branchId;

    // Tìm ca mở của chính thu ngân này trước
    let currentShift = await PosShift.findOne({
      cashierId: currentUser.id,
      status: SHIFT_STATUS.OPEN
    })
      .populate('branchId', 'name code address phone')
      .populate('cashierId', 'fullName email phone role');

    // Nếu không thấy và user là quản lý/super admin, tìm ca mở mới nhất của chi nhánh
    if (!currentShift && branchId && [USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN].includes(currentUser.role)) {
      currentShift = await PosShift.findOne({
        branchId,
        status: SHIFT_STATUS.OPEN
      })
        .sort({ createdAt: -1 })
        .populate('branchId', 'name code address phone')
        .populate('cashierId', 'fullName email phone role');
    }

    return currentShift;
  }

  /**
   * Tự động ghi nhận giao dịch tiền mặt vào ca đang mở (dùng nội bộ khi tạo đơn POS)
   */
  static async recordCashSale(branchId, cashierId, amount) {
    if (!amount || amount <= 0) return null;

    // Tìm ca đang mở của cashier
    let shift = await PosShift.findOne({
      cashierId,
      status: SHIFT_STATUS.OPEN
    });

    // Nếu không tìm thấy ca theo cashier, tìm ca mở bất kỳ tại chi nhánh
    if (!shift && branchId) {
      shift = await PosShift.findOne({
        branchId,
        status: SHIFT_STATUS.OPEN
      }).sort({ createdAt: -1 });
    }

    if (!shift) return null;

    shift.cashSales = (shift.cashSales || 0) + Number(amount);
    shift.totalOrdersCount = (shift.totalOrdersCount || 0) + 1;

    const totalDrops = (shift.cashDrops || []).reduce((s, d) => s + (Number(d.amount) || 0), 0);
    shift.expectedEndingBalance =
      Number(shift.openingBalance || 0) +
      Number(shift.cashSales || 0) -
      Number(shift.cashRefunds || 0) -
      totalDrops;

    await shift.save();
    return shift;
  }

  /**
   * Ghi nhận rút tiền mặt nộp két sắt giữa ca (Cash Drop)
   */
  static async recordCashDrop(shiftId, payload, currentUser) {
    const shift = await PosShift.findById(shiftId);
    if (!shift) {
      throw new AppError('Không tìm thấy ca làm việc.', 404, 'SHIFT_NOT_FOUND');
    }

    if (shift.status !== SHIFT_STATUS.OPEN) {
      throw new AppError('Ca làm việc này đã được chốt, không thể thực hiện rút tiền.', 400, 'SHIFT_ALREADY_CLOSED');
    }

    const dropAmount = Number(payload.amount);
    if (dropAmount <= 0) {
      throw new AppError('Số tiền rút phải lớn hơn 0.', 400, 'INVALID_AMOUNT');
    }

    shift.cashDrops.push({
      amount: dropAmount,
      reason: payload.reason || 'Nộp két sắt an toàn giữa ca',
      performedAt: new Date(),
      performedById: currentUser.id
    });

    const totalDrops = (shift.cashDrops || []).reduce((s, d) => s + (Number(d.amount) || 0), 0);
    shift.expectedEndingBalance =
      Number(shift.openingBalance || 0) +
      Number(shift.cashSales || 0) -
      Number(shift.cashRefunds || 0) -
      totalDrops;

    await shift.save();

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.POS_SHIFT_CASH_DROP,
      target: {
        model: 'PosShift',
        entityId: shift._id,
        code: shift.shiftCode,
        name: `Ca thu ngân ${shift.shiftCode}`
      },
      changes: {
        before: { expectedEndingBalance: shift.expectedEndingBalance + dropAmount },
        after: { expectedEndingBalance: shift.expectedEndingBalance, dropAmount },
        diff: { dropAmount: -dropAmount }
      },
      context: {
        reason: payload.reason || 'Nộp két sắt an toàn giữa ca'
      }
    });

    return shift;
  }

  /**
   * Chốt ca thu ngân (Kiểm đếm két tiền và lưu biên bản)
   */
  static async closeShift(shiftId, payload, currentUser) {
    const shift = await PosShift.findById(shiftId);
    if (!shift) {
      throw new AppError('Không tìm thấy ca làm việc cần chốt.', 404, 'SHIFT_NOT_FOUND');
    }

    if (shift.status !== SHIFT_STATUS.OPEN) {
      throw new AppError('Ca làm việc này đã được chốt trước đó.', 400, 'SHIFT_ALREADY_CLOSED');
    }

    // Chỉ chính thu ngân mở ca, hoặc quản lý chi nhánh / Super Admin mới được chốt ca
    const isOwner = shift.cashierId.toString() === currentUser.id.toString();
    const isManager =
      currentUser.role === USER_ROLES.SUPER_ADMIN ||
      (currentUser.role === USER_ROLES.BRANCH_MANAGER &&
        currentUser.branchId?.toString() === shift.branchId.toString());

    if (!isOwner && !isManager) {
      throw new AppError('Bạn không có quyền chốt ca làm việc của người khác.', 403, 'ACCESS_DENIED');
    }

    const actualEndingBalance = Number(payload.actualEndingBalance) || 0;
    const totalDrops = (shift.cashDrops || []).reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const expected =
      Number(shift.openingBalance || 0) +
      Number(shift.cashSales || 0) -
      Number(shift.cashRefunds || 0) -
      totalDrops;

    shift.expectedEndingBalance = expected;
    shift.actualEndingBalance = actualEndingBalance;
    shift.discrepancy = actualEndingBalance - expected;
    shift.discrepancyNote = payload.discrepancyNote || '';
    shift.denominations = Array.isArray(payload.denominations) ? payload.denominations : [];
    shift.status = SHIFT_STATUS.CLOSED;
    shift.closedAt = new Date();

    if (isManager) {
      shift.approvedById = currentUser.id;
    }

    await shift.save();

    AuditLogService.record({
      actor: currentUser,
      action: AUDIT_ACTIONS.POS_SHIFT_CLOSE,
      target: {
        model: 'PosShift',
        entityId: shift._id,
        code: shift.shiftCode,
        name: `Ca thu ngân ${shift.shiftCode}`
      },
      changes: {
        before: { status: SHIFT_STATUS.OPEN },
        after: {
          status: SHIFT_STATUS.CLOSED,
          expectedEndingBalance: expected,
          actualEndingBalance,
          discrepancy: shift.discrepancy
        },
        diff: { discrepancy: shift.discrepancy }
      },
      context: {
        notes: shift.discrepancy !== 0
          ? `Chốt ca lệch ${shift.discrepancy.toLocaleString('vi-VN')} đ: ${shift.discrepancyNote || 'Không có giải trình'}`
          : 'Chốt ca cân đối két tiền thành công'
      }
    });

    return shift;
  }

  /**
   * Lấy lịch sử ca làm việc phục vụ báo cáo đối soát két tiền
   */
  static async getShiftHistory(query = {}, currentUser) {
    const {
      branchId,
      status,
      startDate,
      endDate,
      cashierId,
      page = 1,
      limit = 20
    } = query;

    const filter = {};

    // Phân quyền Scoping
    if (currentUser.role === USER_ROLES.STAFF) {
      filter.cashierId = currentUser.id;
    } else if (currentUser.role === USER_ROLES.BRANCH_MANAGER) {
      filter.branchId = currentUser.branchId;
      if (cashierId) filter.cashierId = cashierId;
    } else if (currentUser.role === USER_ROLES.SUPER_ADMIN) {
      if (branchId && branchId !== 'ALL') filter.branchId = branchId;
      if (cashierId) filter.cashierId = cashierId;
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.openedAt = {};
      if (startDate) filter.openedAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.openedAt.$lte = end;
      }
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [shifts, total] = await Promise.all([
      PosShift.find(filter)
        .sort({ openedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('branchId', 'name code address')
        .populate('cashierId', 'fullName email phone')
        .populate('approvedById', 'fullName email')
        .lean(),
      PosShift.countDocuments(filter)
    ]);

    return {
      shifts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    };
  }
}
