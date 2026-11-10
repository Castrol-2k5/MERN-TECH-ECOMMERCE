import mongoose from 'mongoose';

const { Schema } = mongoose;

export const AUDIT_ACTIONS = {
  // Kho & Serial
  STOCK_ADJUST: 'STOCK_ADJUST',
  TRANSFER_CREATE: 'TRANSFER_CREATE',
  TRANSFER_RECEIVE: 'TRANSFER_RECEIVE',
  TRANSFER_CANCEL: 'TRANSFER_CANCEL',
  STOCKTAKE_COMPLETE: 'STOCKTAKE_COMPLETE',
  TRANSFER_REQUEST_CREATE: 'TRANSFER_REQUEST_CREATE',
  TRANSFER_REQUEST_APPROVE: 'TRANSFER_REQUEST_APPROVE',
  RMA_OUTBOUND_CREATE: 'RMA_OUTBOUND_CREATE',

  // Ca & Tiền mặt
  POS_SHIFT_OPEN: 'POS_SHIFT_OPEN',
  POS_SHIFT_CASH_DROP: 'POS_SHIFT_CASH_DROP',
  POS_SHIFT_VOUCHER: 'POS_SHIFT_VOUCHER',
  POS_SHIFT_CLOSE: 'POS_SHIFT_CLOSE',
  POS_SHIFT_DISCREPANCY_RESOLVE: 'POS_SHIFT_DISCREPANCY_RESOLVE',

  // Phê duyệt đặc quyền (UC-BM-04)
  APPROVAL_REQUEST_CREATE: 'APPROVAL_REQUEST_CREATE',
  APPROVAL_REQUEST_APPROVE: 'APPROVAL_REQUEST_APPROVE',
  APPROVAL_REQUEST_REJECT: 'APPROVAL_REQUEST_REJECT',

  // Đơn hàng & Bán lẻ
  ORDER_POS_CHECKOUT: 'ORDER_POS_CHECKOUT',
  ORDER_CANCEL: 'ORDER_CANCEL',
  ORDER_VOID: 'ORDER_VOID',
  ORDER_DISPATCH: 'ORDER_DISPATCH',
  ORDER_COMPLETE: 'ORDER_COMPLETE',
  ORDER_RETURN: 'ORDER_RETURN',

  // Kế toán & Bù trừ công nợ
  SETTLEMENT_PAYMENT: 'SETTLEMENT_PAYMENT',

  // Quản trị người dùng & Phân quyền
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
  USER_STATUS_TOGGLE: 'USER_STATUS_TOGGLE',

  // Khiếu nại & Chăm sóc khách hàng (UC-BM-08)
  COMPLAINT_CREATE: 'COMPLAINT_CREATE',
  COMPLAINT_RESOLVE: 'COMPLAINT_RESOLVE',

  // Lịch ca & Chấm công (UC-BM-09)
  ROSTER_ASSIGN: 'ROSTER_ASSIGN',
  ROSTER_SWAP_REVIEW: 'ROSTER_SWAP_REVIEW',

  // Bảo mật & Xác thực
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED'
};

export const AUDIT_SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL'
};

const auditLogSchema = new Schema(
  {
    actor: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      fullName: {
        type: String,
        trim: true,
        default: 'Hệ thống / Khách vãng lai'
      },
      email: {
        type: String,
        trim: true,
        default: ''
      },
      role: {
        type: String,
        default: 'SYSTEM'
      },
      branchId: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        default: null
      },
      branchCode: {
        type: String,
        default: ''
      }
    },
    action: {
      type: String,
      required: [true, 'Hành động kiểm toán (action) là bắt buộc'],
      enum: Object.values(AUDIT_ACTIONS)
    },
    severity: {
      type: String,
      enum: Object.values(AUDIT_SEVERITY),
      default: AUDIT_SEVERITY.INFO
    },
    target: {
      model: {
        type: String,
        required: [true, 'Đối tượng tác động (model) là bắt buộc']
      },
      entityId: {
        type: Schema.Types.Mixed,
        default: null
      },
      code: {
        type: String,
        default: ''
      },
      name: {
        type: String,
        default: ''
      }
    },
    changes: {
      before: {
        type: Schema.Types.Mixed,
        default: null
      },
      after: {
        type: Schema.Types.Mixed,
        default: null
      },
      diff: {
        type: Schema.Types.Mixed,
        default: null
      }
    },
    context: {
      ipAddress: {
        type: String,
        default: '127.0.0.1'
      },
      userAgent: {
        type: String,
        default: ''
      },
      reason: {
        type: String,
        trim: true,
        default: ''
      },
      notes: {
        type: String,
        trim: true,
        default: ''
      }
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      default: 'SUCCESS'
    },
    errorMessage: {
      type: String,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound Indexes phục vụ truy vấn tốc độ cao
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ 'actor.branchId': 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ 'target.model': 1, 'target.entityId': 1, timestamp: -1 });
auditLogSchema.index({ 'actor.userId': 1, timestamp: -1 });

// Khóa bất biến (Tamper-proof): Chặn mọi thao tác sửa hoặc xóa nhật ký
auditLogSchema.pre('updateOne', function (next) {
  next(new Error('Sổ nhật ký kiểm toán (AuditLog) là bất biến, nghiêm cấm chỉnh sửa dữ liệu.'));
});

auditLogSchema.pre('updateMany', function (next) {
  next(new Error('Sổ nhật ký kiểm toán (AuditLog) là bất biến, nghiêm cấm chỉnh sửa dữ liệu.'));
});

auditLogSchema.pre('findOneAndUpdate', function (next) {
  next(new Error('Sổ nhật ký kiểm toán (AuditLog) là bất biến, nghiêm cấm chỉnh sửa dữ liệu.'));
});

auditLogSchema.pre('deleteOne', function (next) {
  next(new Error('Sổ nhật ký kiểm toán (AuditLog) là bất biến, nghiêm cấm xóa dữ liệu.'));
});

auditLogSchema.pre('deleteMany', function (next) {
  next(new Error('Sổ nhật ký kiểm toán (AuditLog) là bất biến, nghiêm cấm xóa dữ liệu.'));
});

auditLogSchema.pre('findOneAndDelete', function (next) {
  next(new Error('Sổ nhật ký kiểm toán (AuditLog) là bất biến, nghiêm cấm xóa dữ liệu.'));
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
