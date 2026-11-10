import { AuditLog, AUDIT_ACTIONS, AUDIT_SEVERITY } from './auditLog.model.js';
import { AppError } from '../../utils/appError.js';

export class AuditLogService {
  /**
   * Tính toán độ lệch (Diff) giữa 2 trạng thái Before và After
   */
  static computeDiff(before, after) {
    if (!before && !after) return null;
    if (!before && after) return after;
    if (before && !after) return { removed: before };

    const diff = {};
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      const valBefore = before[key];
      const valAfter = after[key];

      if (JSON.stringify(valBefore) !== JSON.stringify(valAfter)) {
        diff[key] = {
          before: valBefore !== undefined ? valBefore : null,
          after: valAfter !== undefined ? valAfter : null
        };
      }
    }

    return Object.keys(diff).length > 0 ? diff : null;
  }

  /**
   * Tự động suy luận mức độ nghiêm trọng (Severity) dựa trên dữ liệu hành động
   */
  static inferSeverity(action, { changes, status, context }) {
    if (status === 'FAILURE') {
      return AUDIT_SEVERITY.CRITICAL;
    }

    switch (action) {
      case AUDIT_ACTIONS.STOCK_ADJUST: {
        const delta = Number(changes?.diff?.quantityPhysical || changes?.after?.quantityPhysical - changes?.before?.quantityPhysical || 0);
        return delta < 0 ? AUDIT_SEVERITY.WARNING : AUDIT_SEVERITY.INFO;
      }
      case AUDIT_ACTIONS.POS_SHIFT_CLOSE: {
        const disc = Number(changes?.after?.discrepancy || 0);
        return disc !== 0 ? AUDIT_SEVERITY.CRITICAL : AUDIT_SEVERITY.INFO;
      }
      case AUDIT_ACTIONS.POS_SHIFT_CASH_DROP: {
        return AUDIT_SEVERITY.WARNING;
      }
      case AUDIT_ACTIONS.POS_SHIFT_VOUCHER: {
        return changes?.after?.voucherType === 'OUT' ? AUDIT_SEVERITY.WARNING : AUDIT_SEVERITY.INFO;
      }
      case AUDIT_ACTIONS.USER_ROLE_CHANGE: {
        if (changes?.after?.role === 'SUPER_ADMIN') {
          return AUDIT_SEVERITY.CRITICAL;
        }
        return AUDIT_SEVERITY.WARNING;
      }
      case AUDIT_ACTIONS.USER_STATUS_TOGGLE: {
        return AUDIT_SEVERITY.WARNING;
      }
      case AUDIT_ACTIONS.TRANSFER_RECEIVE: {
        if (context?.hasDiscrepancy) {
          return AUDIT_SEVERITY.WARNING;
        }
        return AUDIT_SEVERITY.INFO;
      }
      case AUDIT_ACTIONS.AUTH_LOGIN_FAILED: {
        return AUDIT_SEVERITY.WARNING;
      }
      default:
        return AUDIT_SEVERITY.INFO;
    }
  }

  /**
   * Ghi một bản ghi nhật ký kiểm toán (Audit Log)
   * Non-blocking: có thể gọi không cần await hoặc await nếu muốn bảo đảm hoàn tất
   */
  static async record({
    actor = {},
    action,
    severity,
    target = {},
    changes = {},
    context = {},
    status = 'SUCCESS',
    errorMessage = null
  }) {
    const executeWrite = async () => {
      try {
        const before = changes?.before || null;
        const after = changes?.after || null;
        const diff = changes?.diff || AuditLogService.computeDiff(before, after);

        const determinedSeverity =
          severity || AuditLogService.inferSeverity(action, { changes: { before, after, diff }, status, context });

        await AuditLog.create({
          actor: {
            userId: actor.id || actor._id || actor.userId || null,
            fullName: actor.fullName || actor.name || 'Hệ thống / Vãng lai',
            email: actor.email || '',
            role: actor.role || 'SYSTEM',
            branchId: actor.branchId || null,
            branchCode: actor.branchCode || ''
          },
          action,
          severity: determinedSeverity,
          target: {
            model: target.model || 'Unknown',
            entityId: target.entityId || target.id || target._id || null,
            code: target.code || '',
            name: target.name || ''
          },
          changes: {
            before,
            after,
            diff
          },
          context: {
            ipAddress: context.ipAddress || context.ip || '127.0.0.1',
            userAgent: context.userAgent || '',
            reason: context.reason || '',
            notes: context.notes || ''
          },
          status,
          errorMessage,
          timestamp: new Date()
        });
      } catch (err) {
        console.error('[AuditLogService] Lỗi khi ghi Audit Log ngầm:', err.message);
      }
    };

    return executeWrite();
  }

  /**
   * Lấy danh sách audit logs theo bộ lọc phân trang (Chỉ Super Admin)
   */
  static async getLogs({
    page = 1,
    limit = 20,
    action,
    severity,
    branchId,
    userId,
    targetModel,
    search,
    startDate,
    endDate
  } = {}) {
    const filter = {};

    if (action) filter.action = action;
    if (severity) filter.severity = severity;
    if (branchId) filter['actor.branchId'] = branchId;
    if (userId) filter['actor.userId'] = userId;
    if (targetModel) filter['target.model'] = targetModel;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { 'actor.fullName': { $regex: q, $options: 'i' } },
        { 'actor.email': { $regex: q, $options: 'i' } },
        { 'target.code': { $regex: q, $options: 'i' } },
        { 'target.name': { $regex: q, $options: 'i' } },
        { 'context.reason': { $regex: q, $options: 'i' } },
        { 'context.notes': { $regex: q, $options: 'i' } },
        { 'context.ipAddress': { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    return {
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1
      }
    };
  }

  /**
   * Lấy chi tiết một bản ghi Audit
   */
  static async getLogById(id) {
    const log = await AuditLog.findById(id).lean();
    if (!log) {
      throw new AppError('Không tìm thấy bản ghi nhật ký kiểm toán.', 404, 'AUDIT_LOG_NOT_FOUND');
    }
    return log;
  }

  /**
   * Lấy toàn bộ lịch sử (Timeline) của một đối tượng cụ thể (e.g. Serial, Order, User)
   */
  static async getEntityTimeline(model, entityId) {
    const idVariants = [entityId, String(entityId)];
    try {
      const mongoose = await import('mongoose');
      if (mongoose.default.Types.ObjectId.isValid(entityId)) {
        idVariants.push(new mongoose.default.Types.ObjectId(entityId));
      }
    } catch {
      // ignore
    }

    const logs = await AuditLog.find({
      'target.model': model,
      'target.entityId': { $in: idVariants }
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    return logs;
  }

  /**
   * Thống kê KPI kiểm toán trong ngày/tuần
   */
  static async getStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalToday, criticalToday, stockAdjustmentsToday, shiftDiscrepanciesToday] = await Promise.all([
      AuditLog.countDocuments({ timestamp: { $gte: startOfToday } }),
      AuditLog.countDocuments({
        timestamp: { $gte: startOfToday },
        severity: AUDIT_SEVERITY.CRITICAL
      }),
      AuditLog.countDocuments({
        timestamp: { $gte: startOfToday },
        action: AUDIT_ACTIONS.STOCK_ADJUST
      }),
      AuditLog.countDocuments({
        timestamp: { $gte: startOfToday },
        action: AUDIT_ACTIONS.POS_SHIFT_CLOSE,
        'changes.after.discrepancy': { $ne: 0 }
      })
    ]);

    return {
      totalToday,
      criticalToday,
      stockAdjustmentsToday,
      shiftDiscrepanciesToday
    };
  }
}

export default AuditLogService;
