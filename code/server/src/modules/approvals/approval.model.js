import mongoose from 'mongoose';

const { Schema } = mongoose;

export const APPROVAL_THRESHOLDS = {
  HIGH_VALUE_RETURN_VND: 5000000,
  LARGE_CASH_OUT_VND: 1000000
};

export const APPROVAL_TYPES = {
  HIGH_VALUE_RETURN: 'HIGH_VALUE_RETURN',
  LARGE_CASH_OUT: 'LARGE_CASH_OUT',
  VOID_POS_ORDER: 'VOID_POS_ORDER'
};

export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

const approvalRequestSchema = new Schema(
  {
    requestCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Chi nhánh (branchId) là bắt buộc']
    },
    type: {
      type: String,
      enum: Object.values(APPROVAL_TYPES),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(APPROVAL_STATUS),
      default: APPROVAL_STATUS.PENDING
    },
    requestedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      fullName: { type: String, required: true, trim: true },
      role: { type: String, required: true }
    },
    targetModel: {
      type: String,
      enum: ['Order', 'PosShift'],
      required: true
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    targetCode: {
      type: String,
      required: true,
      trim: true
    },
    estimatedAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    reason: {
      type: String,
      required: [true, 'Lý do yêu cầu phê duyệt là bắt buộc'],
      trim: true
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {}
    },
    reviewedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      fullName: { type: String, default: '' }
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewNote: {
      type: String,
      trim: true,
      default: ''
    },
    executionResult: {
      type: Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'approval_requests'
  }
);

approvalRequestSchema.index({ branchId: 1, status: 1, createdAt: -1 });
approvalRequestSchema.index({ 'requestedBy.userId': 1, createdAt: -1 });
approvalRequestSchema.index({ targetId: 1, type: 1, status: 1 });

export const ApprovalRequest = mongoose.model('ApprovalRequest', approvalRequestSchema);
