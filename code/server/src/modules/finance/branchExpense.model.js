import mongoose from 'mongoose';

const { Schema } = mongoose;

export const EXPENSE_CATEGORIES = {
  RENT: 'RENT',
  UTILITIES: 'UTILITIES',
  PAYROLL: 'PAYROLL',
  MARKETING: 'MARKETING',
  MAINTENANCE: 'MAINTENANCE',
  OTHER: 'OTHER'
};

export const EXPENSE_STATUS = {
  PENDING_EXECUTIVE: 'PENDING_EXECUTIVE',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

const branchExpenseSchema = new Schema(
  {
    expenseCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Chi nhánh là bắt buộc']
    },
    monthKey: {
      type: String,
      required: [true, 'Tháng hạch toán (YYYY-MM) là bắt buộc'],
      trim: true
    },
    category: {
      type: String,
      enum: Object.values(EXPENSE_CATEGORIES),
      required: [true, 'Danh mục chi phí là bắt buộc']
    },
    amount: {
      type: Number,
      required: [true, 'Số tiền chi phí là bắt buộc'],
      min: [1000, 'Số tiền chi phí tối thiểu 1.000 ₫']
    },
    description: {
      type: String,
      required: [true, 'Mô tả chi phí là bắt buộc'],
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(EXPENSE_STATUS),
      default: EXPENSE_STATUS.APPROVED
    },
    createdBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      fullName: { type: String, required: true, trim: true },
      role: { type: String, required: true }
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
    }
  },
  {
    timestamps: true,
    collection: 'branch_expenses'
  }
);

branchExpenseSchema.index({ branchId: 1, monthKey: 1, status: 1 });

export const BranchExpense = mongoose.model('BranchExpense', branchExpenseSchema);
